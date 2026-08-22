// lib/services/ai/modules/AITailorModule.ts
//
// EL EJECUTOR. Recibe el trabajo ya diagnosticado y devuelve texto.
//
// LO QUE ESTE ARCHIVO DEJÓ DE HACER, y por qué (auditado el 2026-08-20):
//
// Recibía la OFERTA CRUDA —hasta 6.000 caracteres— y un array de keywords, así
// que volvía a interpretar la vacante por su cuenta y devolvía su propio
// `missingSkills`, su propio `softSkillSuggestions`, su propio resumen y su
// propio diagnóstico de métricas. Cuatro diagnósticos que `ats-score` ya había
// hecho, con embeddings encima para deduplicarlos contra los suyos, y un panel
// desempatando a mano cuál mostrar.
//
// La regla del CEO estaba escrita desde la sesión anterior: «el ATS muestra lo
// que falta, tailor lo soluciona». Lo que se había implementado era juntar las
// tarjetas en un panel; los productores quedaron intactos.
//
// AHORA entra `workload` —los ítems que el informe le asignó, cada uno con su
// `checkId` y su motivo— y los términos de la vacante YA extraídos. Sale texto,
// atado al hallazgo que cierra. Tailor no descubre nada: si el informe no lo
// listó, no existe.
//
// EFECTO COLATERAL BUSCADO: el prompt deja de cargar la oferta entera y pasa a
// llevar una lista de términos y las líneas exactas a reescribir.
//
// LO QUE NO CAMBIÓ: los guards de salida. Siguen todos, y siguen siendo la capa
// que contiene el daño después del modelo — placeholder, marca no declarada,
// tercera persona, cifra borrada o alterada, edición trivial, reescritura
// lateral, y la verificación de que la reescritura habla de la línea que dice.

import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL,
  AI_TEMPERATURE_STRUCTURED,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { untrustedDataRule } from "../shared/untrusted-input"
import { parseAIJson, resolveLanguage, hallucinationKind, losesStatedFigure, figureLosesItsVerb } from "../shared/ai-helpers"
import { cvValueBar, noHardCodedFactsRule, keepCandidateFactsRule, proseRules, alreadyGoodRule } from "../shared/cv-writing-doctrine"
import { askUntilAnswered, rejectedNudge, retryNudge } from "../shared/never-empty"
import { isTrivialEdit, isCosmeticReword, dropsContentWithoutGain, rewriteBelongsTo } from "../shared/text-similarity"
import { assessDescription, opensInThirdPersonEs } from "../shared/bullet-quality"
import { hasCliche } from "../shared/cliches"
import { computeCostUsd } from "../shared/cost-tracker"
import { parseBullets, renderBulletsForPrompt } from "../shared/bullets"
import { reportGuardDrops } from "../shared/guard-metrics"
import {
  AI_INPUT_LIMITS,
  type TailorCVInput,
  type TailorCVResultV2,
  type TailorReason,
  type TailorRewrite,
  type TailorWorkItem,
} from "../shared/ai-types"

/**
 * Qué se le pide para cada motivo, en una línea.
 *
 * El motivo llega como CÓDIGO, no como frase: el diagnóstico lo hizo el informe
 * y el texto de la guía lo escribe este módulo. Mandar la razón como cadena
 * libre desde el cliente sería meterla cruda en el prompt.
 */
const REASON_GUIDE: Record<TailorReason, { en: string; es: string }> = {
  no_metric: {
    en: "names no size for the work — say what it consisted of; add a figure ONLY if the CV already states one",
    es: "no dice ningún tamaño del trabajo — nombrá en qué consistió; agregá una cifra SÓLO si el CV ya la declara",
  },
  weak_verb: {
    en: "opens by listing duties instead of what was achieved",
    es: "abre enumerando tareas en vez de lo que se logró",
  },
  duplicate: {
    en: "says the same as another line in this role — make this one carry what the other does not",
    es: "dice lo mismo que otra línea del puesto — que ésta cargue lo que la otra no",
  },
  dilutes: {
    en: "is among the weakest of a role carrying more lines than a recruiter reads — make it earn its line",
    es: "está entre las más flojas de un puesto que carga más líneas de las que un reclutador lee — que gane su renglón",
  },
  cliche: {
    en: "leans on a stock phrase that says nothing",
    es: "se apoya en una frase hecha que no dice nada",
  },
  orphan: {
    en: "is the tail of the line above it, split by a page break — write it as one sentence",
    es: "es la cola de la línea de arriba, partida por un salto de página — escribila como una sola oración",
  },
  critical: {
    en: "the recruiter analysis flagged it as costing the interview",
    es: "el análisis del reclutador la marcó como algo que cuesta la entrevista",
  },
  tailored: {
    en: "has no defect — adapt it to this posting's vocabulary without changing what it claims",
    es: "no tiene defecto — adaptala al vocabulario de esta vacante sin cambiar lo que afirma",
  },
}

export class AITailorModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async tailorCV(userId: string, input: TailorCVInput, plan: string): Promise<TailorCVResultV2> {
    await enforceAIQuota(userId, "tailor-cv", plan)

    const { sectionData, posting, workload, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)
    const en = language === "en"

    // WORK EXPERIENCE DETAILS abajo es la fuente de verdad de los puestos. Dejar
    // que `buildResumeContext` emita además su copia truncada le daría al modelo
    // dos textos para el mismo (ID, índice).
    const resumeContext = buildResumeContext(sectionData, language, { includeWorkExperience: false })
    const ctxValidation = validateAIInput(resumeContext, AI_INPUT_LIMITS.resumeContext)
    if (!ctxValidation.valid) throw new AppError("invalid_input", 400)

    const work = (sectionData.workExperience ?? []) as Array<{
      id?: string; jobTitle?: string; employer?: string; description?: string
    }>
    const bulletsByJob = new Map(work.map((j) => [j.id ?? "?", parseBullets(j.description ?? "")]))

    /**
     * El trabajo, verificado contra el CV REAL antes de entrar al prompt.
     *
     * `workload` llega del cliente. Un id de puesto que no existe o un índice
     * fuera de rango produciría una reescritura inaplicable —o peor, aplicable
     * sobre la línea equivocada—. Lo que no se puede ubicar, no se pide.
     */
    const grounded = workload.filter((w) => {
      const lines = bulletsByJob.get(w.targetId)
      return !!lines && w.index >= 0 && w.index < lines.length && !!lines[w.index]?.trim()
    })

    /**
     * Sin trabajo no hay llamada.
     *
     * No es un hueco: es la respuesta correcta y no cuesta ni un uso ni un
     * enfriamiento. Antes esto no podía pasar, porque tailor decidía solo qué
     * tocar y siempre encontraba algo.
     */
    if (grounded.length === 0 && !input.rewriteSummary) {
      return { summary: null, rewrites: [] }
    }

    const workList = work.slice(0, 4).map((j) => {
      const bulletLines = renderBulletsForPrompt(parseBullets(j.description ?? ""), {
        emptyLabel: en ? "  (no bullets)" : "  (sin bullets)",
      })
      return `ID:${j.id ?? "?"} | ${j.jobTitle ?? ""} at ${j.employer ?? ""}:\n${bulletLines}`
    }).join("\n\n")

    // Lo que el modelo tiene permitido haber sabido. Sin las viñetas acá, toda
    // reescritura fiel se leería como contenido inventado y el guard la tiraría.
    const groundingSource = `${resumeContext}\n${workList}`

    /** La lista de tareas: qué línea, cuál es su texto de hoy, y por qué. */
    const tasks = grounded.map((w) => {
      const current = bulletsByJob.get(w.targetId)?.[w.index] ?? ""
      const why = REASON_GUIDE[w.reason]?.[en ? "en" : "es"] ?? ""
      return `- checkId: ${w.checkId}\n  ${en ? "line" : "línea"}: ${current}\n  ${en ? "why" : "por qué"}: ${why}`
    }).join("\n")

    const terms = [
      posting.jobTitle && `${en ? "Target role" : "Puesto objetivo"}: ${posting.jobTitle}`,
      posting.hardSkills.length && `${en ? "Skills it asks for" : "Habilidades que pide"}: ${posting.hardSkills.slice(0, 30).join(", ")}`,
      posting.softSkills.length && `${en ? "Soft skills" : "Blandas"}: ${posting.softSkills.slice(0, 15).join(", ")}`,
      posting.mustHaves.length && `${en ? "Hard requirements" : "Requisitos duros"}: ${posting.mustHaves.slice(0, 15).join(", ")}`,
    ].filter(Boolean).join("\n")

    const summaryBlock = input.rewriteSummary
      ? (en
        ? `\n=== SUMMARY ===\nRewrite the summary to speak this posting's language, keeping every figure it states.\nCurrent: ${(sectionData.summary as string) ?? ""}`
        : `\n=== RESUMEN ===\nReescribí el resumen para que hable el idioma de esta vacante, conservando cada cifra que declara.\nActual: ${(sectionData.summary as string) ?? ""}`)
      : ""

    const prompt = en
      ? `You are an expert resume strategist. You are given lines that ALREADY have a diagnosis. Write their replacements.

${cvValueBar("en")}

${noHardCodedFactsRule("en")}

${keepCandidateFactsRule("en")}

${proseRules("en")}

${alreadyGoodRule("en")}

${untrustedDataRule(true)}

=== WHAT THIS POSTING ASKS FOR ===
${terms}

CANDIDATE CV:
${resumeContext}

WORK EXPERIENCE DETAILS (bullets indexed by position):
${workList}

=== LINES TO REWRITE ===
${tasks}
${summaryBlock}

Return a JSON object:
{
  "summary": "rewritten summary OR null",
  "rewrites": [
    { "checkId": "the id given above, copied exactly", "text": "• the rewritten line", "metricHint": "what to measure — only if the line has no figure and the CV states none", "demonstrates": "the soft skill this line now proves" }
  ]
}

Rules:
- Echo "checkId" EXACTLY as given. Never invent one, never rewrite a line that is not on the list.
- Use the • prefix. Name what the work consists of in this trade's words.
- Human voice: vary sentence length and structure; natural, not press-release. Banned AI-tell words: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy". Keep each rewrite anchored to a concrete detail already in the source.
- "metricHint" names WHAT TO MEASURE on that exact line — never a number, never invent one — and only when the line has no figure. "demonstrates" is the soft skill that line now proves. Both travel WITH the line; never as a separate task.
- Include an entry ONLY for a line you can materially improve. Omit every other one. If none qualify, return an empty array — that is a correct and expected answer.`
      : `Eres un estratega experto en currículos. Recibís líneas que YA tienen diagnóstico. Escribí sus reemplazos.

${cvValueBar("es")}

${noHardCodedFactsRule("es")}

${keepCandidateFactsRule("es")}

${proseRules("es")}

${alreadyGoodRule("es")}

${untrustedDataRule(false)}

=== LO QUE PIDE ESTA VACANTE ===
${terms}

CV DEL CANDIDATO:
${resumeContext}

DETALLES DE EXPERIENCIA LABORAL (bullets indexados por posición):
${workList}

=== LÍNEAS A REESCRIBIR ===
${tasks}
${summaryBlock}

Devuelve un objeto JSON:
{
  "summary": "resumen reescrito O null",
  "rewrites": [
    { "checkId": "el id dado arriba, copiado exacto", "text": "• la línea reescrita", "metricHint": "qué medir — sólo si la línea no tiene cifra y el CV tampoco declara ninguna", "demonstrates": "la blanda que esa línea pasa a probar" }
  ]
}

Reglas:
- Copiá "checkId" EXACTO como se te dio. Nunca inventes uno, nunca reescribas una línea que no está en la lista.
- Usá el prefijo •. Nombrá en qué consiste el trabajo con las palabras de ese oficio.
- Voz humana: variá el largo y la estructura de las frases; natural, no nota de prensa. Palabras-IA prohibidas: "Orquestó", "Apalancó", "Utilizó", "sinergia". Mantené cada reescritura anclada a un dato concreto ya presente en el source.
- "metricHint" dice QUÉ MEDIR en esa línea exacta — nunca una cifra, nunca la inventes — y sólo cuando la línea no tiene número. "demonstrates" es la blanda que esa línea pasa a probar. Las dos VIAJAN CON LA LÍNEA; nunca como tarea aparte.
- Incluí una entrada SÓLO por una línea que puedas mejorar de verdad. Omití todas las demás. Si ninguna califica, devolvé un array vacío — es una respuesta correcta y esperada.`

    const systemPrompt = `You are an elite career coach. You rewrite résumé lines that already carry a diagnosis; you do not decide which lines need work. Return ONLY valid JSON. If the input is off-topic or nonsensical, return { "summary": null, "rewrites": [] }. Whether a line is already good is defined in the user message — apply that and nothing else. You never invent figures and never write bracket placeholders; a line the CV gives no number for is written without one. ${langInstruction}`

    // Un CV rico (varios puestos × varias líneas) más el resumen pasa los 900
    // tokens de JSON con facilidad — a 900 la respuesta se truncaba a mitad de
    // objeto y todo el endpoint devolvía 500. 3000 cubre el peor caso realista.
    let calls = 0
    const doChat = (nudge: string) => this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 3000,
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        // El empujón va sólo en el reintento y no dice nada nuevo: informa que la
        // respuesta anterior vino vacía. Agregar reglas en un reintento es como
        // los prompts terminan contradiciéndose.
        { role: "user", content: prompt + nudge },
      ],
    })

    const usages: Array<{ prompt_tokens?: number; completion_tokens?: number }> = []
    let lastParsed: TailorCVResultV2 | null = null

    const ask = async (attempt: number): Promise<TailorCVResultV2 | null> => {
      calls++
      const response = await doChat(attempt === 0 ? "" : retryNudge(language))
      usages.push(response.usage ?? {})
      try {
        lastParsed = parseAIJson<TailorCVResultV2>(response.choices[0]?.message?.content ?? "{}")
        return lastParsed
      } catch {
        this.logger.warn("[AIService.tailorCV] unparseable JSON (likely truncated)")
        return null
      }
    }

    const answered = await askUntilAnswered<TailorCVResultV2 | null>({
      ask,
      // El botón que el usuario apretó reescribe su CV: un resumen o al menos
      // una línea es una respuesta; nada más lo es.
      isAnswered: (r) => !!r && ((typeof r.summary === "string" && r.summary.trim().length > 0)
        || (r.rewrites ?? []).length > 0),
      // Nada verdadero se puede fabricar acá: una línea que el modelo se negó a
      // escribir no se puede escribir en código sin inventar contenido.
      fallback: () => null,
      onFilled: (what) => this.logger.warn("[AIService.tailorCV] empty answer filled", { what }),
    })

    const raw: TailorCVResultV2 | null = answered ?? lastParsed
    if (!raw) throw new AppError("invalid_response_format", 500)

    /**
     * LOS GUARDS, y qué pasa cuando se lo llevan TODO.
     *
     * `askUntilAnswered` mira la respuesta CRUDA del modelo. Los guards corren
     * después. Así que una respuesta con cinco reescrituras que los guards
     * descartaban enteras contaba como «respondió»: no había reintento, y al
     * usuario le quedaba la pantalla vacía habiendo gastado el uso y el cooldown.
     * Reportado por el CEO el 2026-08-21.
     *
     * Ahora el filtro es una función: si no sobrevive nada, se pide UNA vez más
     * diciendo qué falló de lo que ya escribió. Ningún guard se relajó — lo que
     * se arregló es el hueco que dejaban al disparar todos juntos.
     */
    const applyGuards = (raw: TailorCVResultV2) => {
      // El prompt pide `null` cuando el resumen ya está bien, pero un modelo JSON
      // manda con frecuencia la CADENA "null"/"none"/"" en su lugar. Sin normalizar,
      // el panel pinta "null" como resumen adaptado y —peor— la cadena pasa el guard
      // de aplicar, escribiendo "null" dentro del CV del usuario.
      const summaryRaw = ((): string | null => {
        if (typeof raw.summary !== "string") return null
        const t = raw.summary.trim()
        return !t || /^(null|none|n\/?a|undefined)$/i.test(t) ? null : t
      })()

      // ── Los guards. Ninguno se fue con el cambio de contrato. ──────────────────
      const byCheckId = new Map<string, TailorWorkItem>(grounded.map((w) => [w.checkId, w]))
      let offered = 0
      let kept = 0
      let droppedInvented = 0
      let droppedFigure = 0
      let droppedTrivial = 0
      const seen = new Set<string>()
      const rewriteKey = (s: string) =>
        s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim()

      const rewrites: TailorRewrite[] = []
      for (const r of Array.isArray(raw.rewrites) ? raw.rewrites : []) {
        const checkId = typeof r?.checkId === "string" ? r.checkId : ""
        const text = typeof r?.text === "string" ? r.text.trim() : ""
        // Un checkId que no está en la lista es trabajo que nadie pidió: el modelo
        // no puede abrir tarea por su cuenta, que es todo el punto del cambio.
        const item = byCheckId.get(checkId)
        if (!item || !text) continue
        offered++

        const original = bulletsByJob.get(item.targetId)?.[item.index] ?? ""

        /**
         * Una cifra propuesta se MUESTRA para confirmar; no se tira. Lo que se
         * sigue tirando sin preguntar es el placeholder —un "[X%]" jamás puede
         * llegar al CV— y la marca que el candidato no declaró.
         */
        const kind = hallucinationKind(text, groundingSource)
        if (kind === "placeholder" || kind === "brand") { droppedInvented++; continue }

        // Una reescritura que habla DE la persona en tercera persona se lee como
        // una carta que escribió otro, dentro de su propio historial.
        if (!en && opensInThirdPersonEs(text)) { droppedTrivial++; continue }

        // El texto es la identidad: si la reescritura habla de otra línea del mismo
        // puesto, aplicarla borraría una y duplicaría otra.
        const lines = bulletsByJob.get(item.targetId) ?? []
        if (rewriteBelongsTo(text, lines, item.index) !== item.index) { droppedTrivial++; continue }

        // Borró o alteró una cifra del candidato.
        if (original && losesStatedFigure(original, text)) { droppedFigure++; continue }

        // O la dejó puesta y le sacó el verbo que la explicaba: «aumentar las
        // ventas entre un 15% y 20%» → «ventas de 15% a 20%». Peor que borrarla,
        // porque lo que queda PARECE un dato y el candidato lo firma sin mirar.
        if (original && figureLosesItsVerb(original, text)) { droppedFigure++; continue }

        // Sin cambio real: idéntica, o un cambio de sinónimos.
        if (original && (isTrivialEdit(original, text) || isCosmeticReword(original, text))) { droppedTrivial++; continue }

        // Reescritura lateral sobre una línea ya fuerte: distinta, no mejor.
        if (original) {
          const strong = assessDescription(original).weakOpenerIndices.length === 0 && !hasCliche(original)
          if (strong && dropsContentWithoutGain(original, text)) { droppedTrivial++; continue }
        }

        const key = rewriteKey(text)
        if (key && seen.has(key)) { droppedTrivial++; continue }
        if (key) seen.add(key)

        kept++
        rewrites.push({
          checkId,
          text,
          ...(kind === "figure" ? { needsFigureConfirm: true } : {}),
          ...(typeof r.metricHint === "string" && r.metricHint.trim()
            ? { metricHint: r.metricHint.trim().slice(0, 160) } : {}),
          ...(typeof r.demonstrates === "string" && r.demonstrates.trim()
            ? { demonstrates: r.demonstrates.trim().slice(0, 60) } : {}),
        })
      }

      // El resumen pasa por los mismos guards: no puede volver casi idéntico ni
      // perder las cifras que lo hacían valer la pena.
      const origSummary = (typeof sectionData.summary === "string" ? sectionData.summary : "").trim()
      const summary = summaryRaw && origSummary && (
        isTrivialEdit(origSummary, summaryRaw)
        || isCosmeticReword(origSummary, summaryRaw)
        || losesStatedFigure(origSummary, summaryRaw)
        || figureLosesItsVerb(origSummary, summaryRaw)
      ) ? null : summaryRaw
      return { summary, rewrites, offered, kept, droppedInvented, droppedFigure, droppedTrivial }
    }

    let out = applyGuards(raw)

    // Todo lo que escribió murió en la puerta: preguntar de nuevo cuesta una
    // llamada; no preguntar le cuesta al usuario el uso entero y la espera.
    if (out.kept === 0 && !out.summary && out.offered > 0 && calls < 2) {
      const reasons: string[] = []
      if (out.droppedFigure > 0) reasons.push(language === "en" ? "a figure the CV already states was dropped or altered" : "borró o cambió una cifra que el CV ya dice")
      if (out.droppedInvented > 0) reasons.push(language === "en" ? "a bracket placeholder or a tool the candidate never declared" : "un corchete de relleno o una herramienta que el candidato no declaró")
      if (out.droppedTrivial > 0) reasons.push(language === "en" ? "the line barely changed, or changed without gaining anything" : "la línea casi no cambió, o cambió sin ganar nada")
      calls++
      const retryResponse = await doChat(rejectedNudge(language, reasons))
      usages.push(retryResponse.usage ?? {})
      try {
        const second = parseAIJson<TailorCVResultV2>(retryResponse.choices[0]?.message?.content ?? "{}")
        const retried = applyGuards(second)
        // Se queda con la que sobrevive; si la segunda tampoco sobrevive, no se
        // fabrica nada: una línea que el modelo no escribió no se puede escribir
        // en código sin inventar contenido sobre la persona.
        if (retried.kept > 0 || retried.summary) out = retried
      } catch {
        this.logger.warn("[AIService.tailorCV] unparseable JSON on guard retry")
      }
    }

    const { summary, rewrites, offered, kept, droppedInvented, droppedFigure, droppedTrivial } = out

    // UNA fila de AIUsageLog por petición: el panel de admin agrupa por conteo,
    // así que un reintento no puede figurar como dos llamadas.
    const promptTokens = usages.reduce((sum, u) => sum + (u.prompt_tokens ?? 0), 0)
    const completionTokens = usages.reduce((sum, u) => sum + (u.completion_tokens ?? 0), 0)
    logAIUsage(userId, "tailor-cv", {
      model: AI_MODEL,
      plan,
      promptTokens,
      completionTokens,
      costUsd: computeCostUsd(AI_MODEL, promptTokens, completionTokens),
    })

    if (droppedInvented > 0 || droppedFigure > 0 || droppedTrivial > 0) {
      this.logger.warn("[AIService.tailorCV] dropped rewrites", { droppedInvented, droppedFigure, droppedTrivial })
      reportGuardDrops({
        endpoint: "tailor-cv",
        offered,
        kept,
        invented: droppedInvented,
        figureLoss: droppedFigure,
        trivial: droppedTrivial,
      })
    }


    return { summary, rewrites } satisfies TailorCVResultV2
  }
}
