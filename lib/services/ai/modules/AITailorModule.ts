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
  AI_MODEL_PROSE,
  AI_TEMPERATURE_STRUCTURED,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { untrustedDataRule } from "../shared/untrusted-input"
import { parseAIJson, resolveLanguage, figureDegraded } from "../shared/ai-helpers"
import { cvValueBar, noHardCodedFactsRule, keepCandidateFactsRule, proseRules, alreadyGoodRule } from "../shared/cv-writing-doctrine"
import { askUntilAnswered, rejectedNudge, retryNudge } from "../shared/never-empty"
import { isTrivialEdit, isCosmeticReword } from "../shared/text-similarity"
import { floorNudge, type FloorMiss } from "@/lib/ats/output-floor"
import { runWriteGate, type GateRule } from "@/lib/ats/write-gate"
import { computeCostUsd, type ChatUsageLike } from "../shared/cost-tracker"
import { parseBullets, renderBulletsForPrompt } from "../shared/bullets"
import { reportGuardDrops } from "../shared/guard-metrics"
import { readChat, truncatedNudge } from "../shared/chat-result"
import { strictJsonFormat } from "@/lib/services/ai/shared/strict-schema"
import { TailorResultShape } from "@/lib/services/ai/shared/ai-types"
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
  /**
   * ── POR QUÉ HIZO FALTA SU PROPIO MOTIVO (2026-08-22) ──────────────────────
   *
   * La voz pasiva entró como chequeo nuevo, y `reasonOf` —que traduce el id del
   * hallazgo al motivo que viaja al modelo— no la conocía: caía al `return`
   * final y el ejecutor recibía la línea etiquetada «no dice ningún tamaño del
   * trabajo». Le pedíamos una cifra a una línea cuyo defecto era que borraba al
   * autor.
   *
   * Es exactamente lo que el CEO viene señalando toda la sesión: un chequeo que
   * corre por su cuenta sin decirle al ejecutor qué encontró. El panel señala, el
   * ejecutor arregla — y sólo puede arreglar lo que el panel le nombra bien.
   */
  passive: {
    en: "is written in the passive voice — the work shows and the person who did it disappears. Rewrite it in the first person, active, with the verb the work deserves",
    es: "está escrita en voz pasiva — el trabajo aparece y quien lo hizo desaparece. Reescribila en primera persona, activa, con el verbo que le corresponde",
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

/**
 * LO QUE ESTE ESCRITOR DECLARA. Es su definición, no una línea perdida dentro de
 * una función de doscientas líneas: un escritor nuevo que se olvide una regla se
 * ve acá.
 */
const TAILOR_RULES: readonly GateRule[] = [
  "nothing_burned",
  "figure_policy",
  "person",
  "belongs_to_line",
  "figure_intact",
  "adds_value",
  "keeps_terms",
  "no_lateral_loss",
  "output_floor",
]

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

    /**
     * TODOS LOS PUESTOS QUE TIENEN TRABAJO ASIGNADO, no los primeros cuatro.
     *
     * ── EL DEFECTO, MEDIDO ─────────────────────────────────────────────────
     *
     * Esto era `work.slice(0, 4)`, y el comentario de abajo ya advertía el
     * riesgo: sin la viñeta en el grounding, una reescritura FIEL se lee como
     * dato quemado y el guard la tira. Eso es exactamente lo que pasaba en
     * cualquier CV de más de cuatro puestos:
     *
     *   el CV tiene 5 puestos · la lista de tareas cubre los 5 (sale del
     *   informe, que no recorta) · el grounding sólo llevaba 4 · el modelo
     *   reescribe bien la viñeta del quinto conservando su cifra · el guard
     *   compara contra un grounding que no la contiene → «figure» → descartada.
     *
     * La cifra era del candidato. El guard no tenía cómo saberlo.
     *
     * Ahora entran los puestos QUE TIENEN TRABAJO —que es lo que el modelo
     * necesita leer— más el resto hasta un tope, para que el contexto siga
     * acotado sin cortar justo lo que se le pidió tocar.
     */
    const conTrabajo = new Set(grounded.map((w) => w.targetId))
    const relevantes = [
      ...work.filter((j) => conTrabajo.has(j.id ?? "")),
      ...work.filter((j) => !conTrabajo.has(j.id ?? "")),
    ].slice(0, Math.max(4, conTrabajo.size))
    const workList = relevantes.map((j) => {
      const bulletLines = renderBulletsForPrompt(parseBullets(j.description ?? ""), {
        emptyLabel: en ? "  (no bullets)" : "  (sin bullets)",
      })
      return `ID:${j.id ?? "?"} | ${j.jobTitle ?? ""} at ${j.employer ?? ""}:\n${bulletLines}`
    }).join("\n\n")

    // Lo que el modelo tiene permitido haber sabido. Sin las viñetas acá, toda
    // reescritura fiel se leería como contenido quemado y el guard la tiraría.
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
- Echo "checkId" EXACTLY as given. Never make one up, never rewrite a line that is not on the list.
- Use the • prefix. Name what the work consists of in this trade's words.
- Human voice: vary sentence length and structure; natural, not press-release. Keep each rewrite anchored to a concrete detail already in the source.
- "metricHint" names WHAT TO MEASURE on that exact line — never a number, never hard-code one — and only when the line has no figure. "demonstrates" is the soft skill that line now proves. Both travel WITH the line; never as a separate task.
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
- Copiá "checkId" EXACTO como se te dio. Nunca uses uno que no esté en la lista, nunca reescribas una línea que no está en la lista.
- Usá el prefijo •. Nombrá en qué consiste el trabajo con las palabras de ese oficio.
- Voz humana: variá el largo y la estructura de las frases; natural, no nota de prensa. Mantené cada reescritura anclada a un dato concreto ya presente en el source.
- "metricHint" dice QUÉ MEDIR en esa línea exacta — nunca una cifra, nunca la quemes — y sólo cuando la línea no tiene número. "demonstrates" es la blanda que esa línea pasa a probar. Las dos VIAJAN CON LA LÍNEA; nunca como tarea aparte.
- Incluí una entrada SÓLO por una línea que puedas mejorar de verdad. Omití todas las demás. Si ninguna califica, devolvé un array vacío — es una respuesta correcta y esperada.`

    const systemPrompt = `You are an elite career coach. You rewrite résumé lines that already carry a diagnosis; you do not decide which lines need work. Return ONLY valid JSON. If the input is off-topic or nonsensical, return { "summary": null, "rewrites": [] }. Whether a line is already good is defined in the user message — apply that and nothing else. You never hard-code figures and never write bracket placeholders; a line the CV gives no number for is written without one. ${langInstruction}`

    /**
     * EL MODELO Y EL PRESUPUESTO — las dos razones por las que salían básicas.
     *
     * ── EL MODELO (reportado por el CEO: «bullets muy básicos») ─────────────
     *
     * El proyecto tiene dos: `AI_MODEL` para EXTRAER datos y `AI_MODEL_PROSE`
     * para ESCRIBIR prosa. La viñeta, el resumen, la fusión, la habilidad y la
     * carta usan el de prosa. Este módulo —que reescribe puestos enteros del CV,
     * el que más texto escribe de los seis— se había quedado con el de
     * extracción. Reescribir la experiencia de alguien no es una extracción.
     *
     * ── EL PRESUPUESTO ─────────────────────────────────────────────────────
     *
     * 3000 tokens era un techo GLOBAL para todas las líneas de todos los puestos
     * pedidos a la vez. Con muchas líneas le tocan unas pocas decenas de palabras
     * a cada una, y el modelo escribe telegráfico para que entren todas: la misma
     * trampa que ya se midió en la crítica del reclutador, donde subir de 3000 a
     * 4500 fue la diferencia entre consejo superficial y consejo útil.
     *
     * Ahora el techo se calcula POR LÍNEA PEDIDA sobre un piso, para que una
     * línea de cuatro renglones con volumen, herramienta y efecto quepa sin
     * competir contra sus hermanas.
     */
    const lineasPedidas = grounded.length
    const maxTokens = Math.min(8000, 900 + 260 * Math.max(1, lineasPedidas) + (input.rewriteSummary ? 400 : 0))
    let calls = 0
    const doChat = (nudge: string) => this.aiClient.chat({
      model: AI_MODEL_PROSE,
      max_tokens: maxTokens,
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: strictJsonFormat("tailor_cv", TailorResultShape),
      messages: [
        { role: "system", content: systemPrompt },
        // El empujón va sólo en el reintento y no dice nada nuevo: informa que la
        // respuesta anterior vino vacía. Agregar reglas en un reintento es como
        // los prompts terminan contradiciéndose.
        { role: "user", content: prompt + nudge },
      ],
    })

    const usages: ChatUsageLike[] = []
    let lastParsed: TailorCVResultV2 | null = null

    /**
     * F0.5 — «probablemente truncado» deja de ser una suposición del log.
     *
     * La API lo dice (`finish_reason`), y el arreglo es distinto: si se cortó,
     * repetir el mismo pedido lo vuelve a cortar en el mismo sitio; hay que
     * pedir MENOS. Y si el modelo se negó, no hay reintento que lo cambie.
     */
    let ultimaLectura = { truncated: false, refusal: null as string | null }
    const ask = async (attempt: number): Promise<TailorCVResultV2 | null> => {
      calls++
      const nudgeBase = attempt === 0 ? "" : retryNudge(language)
      const response = await doChat(nudgeBase + (ultimaLectura.truncated ? truncatedNudge(language) : ""))
      usages.push(response.usage ?? {})
      const leido = readChat(response)
      ultimaLectura = { truncated: leido.truncated, refusal: leido.refusal }
      if (leido.refusal) {
        this.logger.warn("[AIService.tailorCV] the model refused", { refusal: leido.refusal.slice(0, 160) })
        return null
      }
      try {
        lastParsed = parseAIJson<TailorCVResultV2>(leido.text || "{}")
        return lastParsed
      } catch {
        this.logger.warn("[AIService.tailorCV] unusable JSON", { truncated: leido.truncated })
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
      // escribir no se puede escribir en código sin quemar contenido.
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
      let droppedHardCoded = 0
      /** Reescrituras descartadas por dejar afuera un término de la vacante. */
      let droppedTerm = 0
      let droppedFigure = 0
      let droppedTrivial = 0
      let droppedWeak = 0
      const weakMisses: FloorMiss[] = []
      const seen = new Set<string>()
      const rewriteKey = (s: string) =>
        s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim()

      const rewrites: TailorRewrite[] = []
      for (const r of Array.isArray(raw.rewrites) ? raw.rewrites : []) {
        const checkId = typeof r?.checkId === "string" ? r.checkId : ""
        let text = typeof r?.text === "string" ? r.text.trim() : ""
        // Un checkId que no está en la lista es trabajo que nadie pidió: el modelo
        // no puede abrir tarea por su cuenta, que es todo el punto del cambio.
        const item = byCheckId.get(checkId)
        if (!item || !text) continue
        offered++

        const original = bulletsByJob.get(item.targetId)?.[item.index] ?? ""

        /**
         * EL MOTOR — este escritor DECLARA su lista, no la escribe a mano.
         *
         * El orden es el que este módulo ya corría, y se conserva a propósito: la
         * mudanza no puede cambiar lo que el usuario ve, así que si mañana una
         * salida difiere sabremos que fue el motor y no un reordenamiento.
         *
         * `figure_policy: "confirm"` es la POSTURA A: este texto nace de un
         * relato del candidato, así que la cifra propuesta viaja con el chip
         * «confirmá la cifra» en vez de descartarse. Lo que sí se descarta sin
         * preguntar es el placeholder y la marca que él no declaró.
         */
        const veredicto = runWriteGate({
          text,
          original,
          source: groundingSource,
          postingTerms: [...posting.hardSkills, ...posting.softSkills],
          figurePolicy: "confirm",
          lines: bulletsByJob.get(item.targetId) ?? [],
          index: item.index,
          language,
        }, TAILOR_RULES)

        if (!veredicto.ok) {
          switch (veredicto.rule) {
            case "nothing_burned": droppedHardCoded++; break
            case "figure_intact": droppedFigure++; break
            case "keeps_terms": droppedTerm++; break
            case "output_floor": droppedWeak++; weakMisses.push(...(veredicto.misses ?? [])); break
            default: droppedTrivial++
          }
          continue
        }
        text = veredicto.text

        const key = rewriteKey(text)
        if (key && seen.has(key)) { droppedTrivial++; continue }
        if (key) seen.add(key)

        kept++
        rewrites.push({
          checkId,
          text,
          ...(veredicto.needsFigureConfirm ? { needsFigureConfirm: true } : {}),
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
        || figureDegraded(origSummary, summaryRaw)
      ) ? null : summaryRaw
      return { summary, rewrites, offered, kept, droppedHardCoded, droppedFigure, droppedTrivial, droppedTerm, droppedWeak, weakMisses }
    }

    let out = applyGuards(raw)

    // Todo lo que escribió murió en la puerta: preguntar de nuevo cuesta una
    // llamada; no preguntar le cuesta al usuario el uso entero y la espera.
    if (out.kept === 0 && !out.summary && out.offered > 0 && calls < 2) {
      const reasons: string[] = []
      if (out.droppedFigure > 0) reasons.push(language === "en" ? "a figure the CV already states was dropped or altered" : "borró o cambió una cifra que el CV ya dice")
      if (out.droppedHardCoded > 0) reasons.push(language === "en" ? "a bracket placeholder or a tool the candidate never declared" : "un corchete de relleno o una herramienta que el candidato no declaró")
      if (out.droppedTrivial > 0) reasons.push(language === "en" ? "the line barely changed, or changed without gaining anything" : "la línea casi no cambió, o cambió sin ganar nada")
      // El motivo sale del propio piso: le decimos QUÉ falló de lo que escribió,
      // no una frase genérica. Un reintento mudo es otra moneda al aire.
      if (out.droppedWeak > 0 && out.weakMisses.length > 0) reasons.push(floorNudge([...new Set(out.weakMisses)], language))
      // El motivo más caro se le dice con nombre: no es «mejorala otra vez», es
      // «conservá las palabras de la oferta que la línea ya decía».
      if (out.droppedTerm > 0) {
        reasons.push(language === "en"
          ? "the rewrite dropped a term the posting asks for that the original line already had — keep those words"
          : "la reescritura dejó afuera un término que la vacante pide y que la línea original ya decía — conservá esas palabras")
      }
      calls++
      const retryResponse = await doChat(rejectedNudge(language, reasons))
      usages.push(retryResponse.usage ?? {})
      try {
        // La primera llamada ya distinguía truncado de inválido; el reintento
        // seguía leyendo crudo, así que un segundo intento cortado por el techo
        // volvía a caer en el catch de abajo como si el modelo no hubiera
        // escrito nada. Es el mismo módulo contándose dos historias distintas.
        const leidoRetry = readChat(retryResponse)
        if (leidoRetry.truncated) {
          this.logger.warn("[AIService.tailorCV] retry truncated by token ceiling", { lineasPedidas })
        }
        const second = parseAIJson<TailorCVResultV2>(leidoRetry.text || "{}")
        const retried = applyGuards(second)
        // Se queda con la que sobrevive; si la segunda tampoco sobrevive, no se
        // fabrica nada: una línea que el modelo no escribió no se puede escribir
        // en código sin quemar contenido sobre la persona.
        if (retried.kept > 0 || retried.summary) out = retried
      } catch {
        this.logger.warn("[AIService.tailorCV] unparseable JSON on guard retry")
      }
    }

    const { summary, rewrites, offered, kept, droppedHardCoded, droppedFigure, droppedTrivial, droppedTerm, droppedWeak } = out

    // UNA fila de AIUsageLog por petición: el panel de admin agrupa por conteo,
    // así que un reintento no puede figurar como dos llamadas.
    const promptTokens = usages.reduce((sum, u) => sum + (u.prompt_tokens ?? 0), 0)
    const completionTokens = usages.reduce((sum, u) => sum + (u.completion_tokens ?? 0), 0)
    // Los tokens del prompt YA VISTO se cobran ~90% más baratos en la familia 5.4,
    // y hasta hoy se sumaban al precio completo: el panel sobre-reportaba.
    const cachedTokens = usages.reduce((sum, u) => sum + (u.prompt_tokens_details?.cached_tokens ?? 0), 0)
    logAIUsage(userId, "tailor-cv", {
      model: AI_MODEL_PROSE,
      plan,
      promptTokens,
      completionTokens,
      costUsd: computeCostUsd(AI_MODEL_PROSE, promptTokens, completionTokens, cachedTokens),
    })

    if (droppedHardCoded > 0 || droppedFigure > 0 || droppedTrivial > 0 || droppedTerm > 0) {
      this.logger.warn("[AIService.tailorCV] dropped rewrites", { droppedHardCoded, droppedFigure, droppedTrivial, droppedTerm, droppedWeak })
      reportGuardDrops({
        endpoint: "tailor-cv",
        offered,
        kept,
        hardCoded: droppedHardCoded,
        figureLoss: droppedFigure,
        trivial: droppedTrivial,
        termLoss: droppedTerm,
        weak: droppedWeak,
      })
    }


    return { summary, rewrites } satisfies TailorCVResultV2
  }
}
