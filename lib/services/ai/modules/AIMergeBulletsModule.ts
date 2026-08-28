// lib/services/ai/modules/AIMergeBulletsModule.ts
//
// Writes the single bullet that replaces two thin ones.
//
// The panel could already delete a weak line and rewrite a line, and neither
// covers the ordinary case: two lines about the same work, written on different
// days, each saying half of it. Deleting one loses content the candidate earned;
// rewriting either one cannot reach across to the other. A role with six thin
// lines reads worse than the same role with four solid ones, because a recruiter
// skims and every half-claim spends a slot.
//
// WHICH two is decided in code (lib/ats/merge-candidates.ts), never here. A model
// asked "which of these should be merged" always finds a pair, the same way a
// model asked to improve a bullet always finds another variant — that is the
// stopping problem this codebase has already paid for twice. The algorithm decides
// IF; this only decides HOW it reads.

import { AI_MODEL_PROSE, logAIUsage } from "@/lib/ai-client"
import { computeCostUsd } from "../shared/cost-tracker"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { resolveLanguage, parseAIJson } from "../shared/ai-helpers"
import { cvValueBar, noHardCodedFactsRule, keepCandidateFactsRule } from "../shared/cv-writing-doctrine"
import { parseBullets } from "../shared/bullets"
import { clicheBanList } from "../shared/cliches"
import { reportGuardDrops } from "../shared/guard-metrics"
import { cleanGeneratedText } from "../shared/clean-output"
import { readChat } from "@/lib/services/ai/shared/chat-result"
import { strictJsonFormat } from "@/lib/services/ai/shared/strict-schema"
import { MergeBulletShape } from "@/lib/services/ai/shared/ai-types"
import { runWriteGate, type GateRule } from "@/lib/ats/write-gate"

export interface MergeBulletsInput {
  targetId: string
  /** The two bullet indexes to fuse, as the deterministic pass found them. */
  indexes: [number, number]
  sectionData: Record<string, unknown>
  language?: "es" | "en"
  /**
   * Los términos que ESTA vacante pide, del informe.
   *
   * ── EL HUECO (pase de QA, 2026-08-22) ────────────────────────────────────
   *
   * Fusionar es la ÚNICA operación del panel que borra texto del CV: entran dos
   * líneas y sale una. Y este input no tenía siquiera un campo para la oferta,
   * así que el modelo unía sin saber qué palabras no puede soltar. Las duras
   * pesan .45 —más que cualquier otra cosa del informe— y una fusión que se come
   * «Swift» cuesta más puntos de los que la fusión puede devolver.
   *
   * Es el MISMO hueco que la auditoría pasada encontró en improve-bullet e
   * improve-summary. Se arreglaron los dos y nadie miró al tercero, que encima
   * es el único que borra.
   *
   * Falla abierto: sin vacante el guard no corre y el comportamiento es el viejo.
   */
  postingTerms?: string[]
}

export type MergeBulletsResult =
  | { status: "ok"; text: string }
  | { status: "not_mergeable" }

interface WorkRow {
  id?: string
  jobTitle?: string
  description?: string
}

/**
 * Lo que una fusión tiene que cumplir. El orden lo decide el motor.
 *
 * `keeps_content` es la regla propia de este escritor: verifica que sobreviva
 * cada palabra de LAS DOS líneas, no de una. Es más fuerte que `figure_intact`
 * —cubre las palabras además de los números— pero las dos se declaran porque
 * una cifra que cambia de verbo no es una palabra perdida.
 */
const MERGE_RULES: readonly GateRule[] = [
  "only_declared_facts",
  "figure_policy",
  "figure_intact",
  "keeps_content",
  "keeps_terms",
]

export class AIMergeBulletsModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async mergeBullets(userId: string, input: MergeBulletsInput, plan: string): Promise<MergeBulletsResult> {
    await enforceAIQuota(userId, "merge-bullets", plan)

    const { targetId, indexes, sectionData, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const work = ((sectionData.workExperience ?? []) as WorkRow[]).filter((j) => j.id)
    const job = work.find((j) => j.id === targetId)
    if (!job) throw new AppError("invalid_input", 400)

    const bullets = parseBullets(job.description ?? "")
    const [i, j2] = indexes
    // Stale indexes: the description may have been edited between the analysis and
    // the button. Merging the wrong two lines is worse than doing nothing.
    if (i === j2 || !bullets[i]?.trim() || !bullets[j2]?.trim()) return { status: "not_mergeable" }

    const a = bullets[i].trim()
    const b = bullets[j2].trim()

    // Reglas ESTÁTICAS primero y los datos al final, a propósito: OpenAI cachea el
    // prefijo común de la petición, así que todo lo que va antes de la primera línea
    // variable se cobra al precio de caché en la segunda llamada en adelante. Con los
    // bullets arriba, ese prefijo era de cero.
    const prompt = language === "en"
      ? `Fuse the two résumé bullets below —both from the same role— into ONE line.

${cvValueBar("en")}

${noHardCodedFactsRule("en", { allowProposedFigure: false })}

${keepCandidateFactsRule("en")}

WHAT A MERGE IS, and this is the part that goes wrong:
- A merge is NOT the two sentences joined by "and". "Picked orders from the pick list and packed them onto pallets" is two lines with a conjunction between them: it is longer than either, says nothing neither said, and buys the candidate one line of space and no more. Measured: three of four merges came back exactly like that.
- A merge names ONE action and folds the other in as HOW or WITH WHAT it was done. "Managed the clinic's appointment book, confirming each patient's slot by phone the day before" is one claim; "Managed the book and confirmed the slots" is two. The test is not length — two lines that share no wording cannot get much shorter without losing a fact, and keeping the facts wins. The test is whether a reader meets ONE claim or two.
- Do not open with a verb that upgrades the work into something the candidate never described. "Built the order fulfilment workflow" is a claim about designing a system; picking and packing is not. Use the verb their own line used.

RULES:
- One sentence, verb-first in the past tense. No pronouns. No bullet marker.
- Do not use: ${clicheBanList("en")}
- If the two lines describe genuinely different work and forcing them together would distort either one, return {"status": "not_mergeable"}. That is a correct and expected answer, not a failure.

Respond ONLY with valid JSON (no markdown):
{"status": "ok", "text": "<the merged sentence>"} or {"status": "not_mergeable"}

BULLET A: ${a}
BULLET B: ${b}`
      : `Fusiona los dos bullets de currículum de abajo —ambos del mismo puesto— en UNA sola línea.

${cvValueBar("es")}

${noHardCodedFactsRule("es", { allowProposedFigure: false })}

${keepCandidateFactsRule("es")}

QUÉ ES UNA FUSIÓN, y esta es la parte que sale mal:
- Una fusión NO son las dos oraciones unidas con "y". "Gestioné la agenda y confirmé los turnos por teléfono" son dos líneas con una conjunción en el medio: queda más larga que cualquiera de las dos, no dice nada que ninguna dijera, y le compra al candidato un renglón de espacio y nada más. Medido: tres de cada cuatro fusiones volvieron exactamente así.
- Una fusión nombra UNA acción y mete la otra adentro como el CÓMO o el CON QUÉ. "Gestioné la agenda médica del consultorio confirmando cada turno por teléfono el día anterior" es una sola afirmación; "Gestioné la agenda y confirmé los turnos" son dos. La prueba no es el largo — dos líneas que no comparten palabras no pueden acortarse mucho sin perder un dato, y conservar los datos gana. La prueba es si quien lee se encuentra con UNA afirmación o con dos.
- No abras con un verbo que ascienda el trabajo a algo que el candidato nunca dijo. "Construí el flujo de preparación de pedidos" afirma haber diseñado un sistema; preparar y embalar pedidos no lo es. Usá el verbo que usó su propia línea.

REGLAS:
- Una sola frase, con el verbo primero y en pasado. Sin pronombres. Sin viñeta.
- No uses: ${clicheBanList("es")}
- Si las dos líneas describen trabajos genuinamente distintos y forzarlas distorsionaría alguna, devuelve {"status": "not_mergeable"}. Es una respuesta correcta y esperada, no un fallo.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"status": "ok", "text": "<la frase fusionada>"} o {"status": "not_mergeable"}

BULLET A: ${a}
BULLET B: ${b}`

    const system = language === "en"
      ? `You are an elite résumé editor. You fuse two bullets from the same role into one line that keeps every fact and adds none. Returning {"status": "not_mergeable"} is a correct answer when the two lines are about different work. ${langInstruction}`
      : `Eres un editor de currículums de élite. Fusionas dos bullets del mismo puesto en una línea que conserva todos los datos y no quema nada. Devolver {"status": "not_mergeable"} es una respuesta correcta cuando las dos líneas tratan de trabajos distintos. ${langInstruction}`

    let text: string
    let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined
    const callOnce = (note = "") => this.aiClient.chat({
      model: AI_MODEL_PROSE,
      messages: [
        { role: "system", content: system },
        { role: "user", content: note ? `${prompt}\n\n${note}` : prompt },
      ],
      // One sentence; the cap covers the reasoning budget of the GPT-5 family.
      max_tokens: 1200,
      response_format: strictJsonFormat("merge_bullets", MergeBulletShape),
    })
    try {
      // A network blip on a one-sentence call used to become a red 500 on a
      // feature the user reached by choosing to tidy two lines. One retry first:
      // it is the cheapest call in the product, and the alternative is an error
      // for something that was working a second ago.
      let completion
      try {
        completion = await callOnce()
      } catch (first) {
        this.logger.warn("[AIService.mergeBullets] first call failed, retrying once", {
          targetId, error: (first as Error).message,
        })
        completion = await callOnce()
      }
      // Este endpoint era el único que llamaba al modelo sin registrar lo que gastaba: su
      // columna en el panel de costos estaba en cero mientras la factura decía otra cosa.
      //
      // FUERA del try de la llamada, a propósito: adentro, un fallo al ESCRIBIR el
      // registro caía en el catch de abajo y devolvía `ai_error` — la medición tumbando
      // la función que mide, sobre una respuesta del modelo que ya estaba bien.
      usage = completion.usage
      const leido = readChat(completion)
      // Una fusión cortada por el techo llegaba como JSON roto y salía por el
      // mismo `not_mergeable` que se usa cuando las dos líneas de verdad no se
      // pueden unir. Son cosas distintas: una es un techo corto —arreglable—,
      // la otra es un juicio sobre el texto del usuario.
      if (leido.truncated) {
        this.logger.warn("[AIService.mergeBullets] output truncated by token ceiling", { targetId })
      }
      if (leido.refusal) {
        this.logger.warn("[AIService.mergeBullets] model refused", { targetId, refusal: leido.refusal.slice(0, 120) })
      }
      text = leido.text
    } catch (err) {
      // Twice down. The user asked to merge two of their own lines; leaving them
      // exactly as they are is harmless, and a red error on an optional tidy-up
      // is not. Same degradation this module already applies to an unreadable
      // answer — one behaviour for "we could not do it", not two.
      this.logger.error("[AIService.mergeBullets] model call failed twice", { targetId }, err instanceof Error ? err : new Error(String(err)))
      return { status: "not_mergeable" }
    }

    /**
     * ONE row for this endpoint, first attempt plus any retry — the convention the
     * summary and the cover letter already follow.
     *
     * It is not only about tokens. The admin panel groups AIUsageLog with
     * `_count: { id: true }`, so a second row would report two merge calls for one
     * button press: the cost column would stay right while the calls column
     * quietly doubled. Billed from a `finally` so every exit path below — and
     * there are six — pays exactly once, including the ones that discard the
     * answer. A discarded answer still cost money.
     */
    const usages: Array<{ prompt_tokens?: number; completion_tokens?: number }> = [usage ?? {}]
    const bill = () => {
      const promptTokens = usages.reduce((n, u) => n + (u.prompt_tokens ?? 0), 0)
      const completionTokens = usages.reduce((n, u) => n + (u.completion_tokens ?? 0), 0)
      logAIUsage(userId, "merge-bullets", {
        model: AI_MODEL_PROSE,
        plan,
        promptTokens,
        completionTokens,
        costUsd: computeCostUsd(AI_MODEL_PROSE, promptTokens, completionTokens),
      })
    }
    try {

    // Contrato de salida JSON. `not_mergeable` es una respuesta legítima del modelo,
    // no un error: las dos líneas pueden tratar de trabajos distintos.
    // Una respuesta ilegible degrada a "no se puede fusionar", NO a un 500: el usuario
    // pidió unir dos líneas y quedarse como estaba es inocuo — un error rojo por una
    // mejora opcional no lo es. Mismo criterio que el resto de rechazos de este módulo.
    let parsed: { status?: unknown; text?: unknown }
    try {
      parsed = parseAIJson<{ status?: unknown; text?: unknown }>(text || "{}")
    } catch {
      this.logger.warn("[AIService.mergeBullets] respuesta ilegible del modelo — descartada", { targetId })
      return { status: "not_mergeable" }
    }
    if (parsed.status === "not_mergeable") return { status: "not_mergeable" }
    text = typeof parsed.text === "string" ? parsed.text.trim() : ""
    if (!text) return { status: "not_mergeable" }

    // Strip a bullet marker or wrapping quotes the model may add back.
    text = text.replace(/^\s*[•·▪‣*\-–—]\s*/, "").replace(/^["'“”]|["'“”]$/g, "").trim()

    /**
     * LA FUSIÓN DECLARA SU LISTA; EL MOTOR LA CORRE.
     *
     * Estas cinco preguntas —¿quemó un dato?, ¿la cifra sobrevivió?, ¿sobrevivió
     * cada palabra de LAS DOS líneas?, ¿soltó un término de la vacante?— eran
     * cinco `if` escritos a mano acá, que es como se llega a que un escritor
     * corra cuatro chequeos y su hermano tres. `figurePolicy: "drop"` es la
     * postura de este endpoint desde siempre: la fusión no puede proponer una
     * cifra, porque no nace de un relato nuevo del candidato.
     *
     * El chequeo de largo se queda a mano: no es una regla del motor, es
     * aritmética sobre estas dos líneas en particular.
     */
    const veredicto = runWriteGate({
      text,
      source: `${a}\n${b}`,
      mergedFrom: [a, b],
      postingTerms: input.postingTerms ?? [],
      figurePolicy: "drop",
      language,
    }, MERGE_RULES)

    if (!veredicto.ok && veredicto.rule === "only_declared_facts") {
      this.logger.warn("[AIService.mergeBullets] merged bullet introduced ungrounded content — discarded", { targetId })
      return { status: "not_mergeable" }
    }
    if (!veredicto.ok && veredicto.rule === "figure_policy") {
      this.logger.warn("[AIService.mergeBullets] merged bullet introduced a figure — discarded", { targetId })
      return { status: "not_mergeable" }
    }

    // A merge that is shorter than the longer of the two inputs has dropped
    // content rather than combined it.
    if (text.length < Math.max(a.length, b.length)) return { status: "not_mergeable" }

    if (!veredicto.ok && veredicto.rule === "figure_intact") {
      this.logger.warn("[AIService.mergeBullets] merged bullet dropped a stated figure — discarded", { targetId })
      reportGuardDrops({ endpoint: "merge-bullets", offered: 1, kept: 0, hardCoded: 0, figureLoss: 1, trivial: 0, termLoss: 0, weak: 0 })
      return { status: "not_mergeable" }
    }

    // El motor ya dijo QUÉ se perdió: el reintento lo nombra en vez de recontarlo.
    const perdioTermino = !veredicto.ok && veredicto.rule === "keeps_terms"
    const dropped = !veredicto.ok && (veredicto.rule === "keeps_content" || perdioTermino)
      ? (veredicto.dropped ?? [])
      : []
    if (dropped.length > 0) {
      /**
       * ONE retry, saying exactly what went missing.
       *
       * A discarded merge is not free: the user spent a use and a cooldown to be
       * told their two lines stay as they were. Measured, the loss is usually a
       * single word the fusion swallowed ("los TURNOS por teléfono" → "por
       * teléfono"), which a second pass fixes — this is the "bad roll, not a bad
       * prompt" case the never-empty rule exists for.
       *
       * The note REPORTS the miss, it does not add a rule: keeping every word is
       * already in the prompt, and a retry that introduces new instructions is
       * how a prompt ends up arguing with itself.
       */
      const missed = dropped.slice(0, 6).join(", ")
      const note = language === "en"
        ? `Your last answer dropped these words from the two lines: ${missed}. They are facts the candidate wrote. Write the merge again with every one of them in it.`
        : `Tu respuesta anterior perdió estas palabras de las dos líneas: ${missed}. Son datos que escribió el candidato. Escribí la fusión de nuevo con todas ellas adentro.`
      const second = await this.retryMerge(note, callOnce, usages, a, b, targetId, input.postingTerms ?? [], language)
      if (second) return { status: "ok", text: (await cleanGeneratedText([second], language, sectionData))[0] ?? second }
      this.logger.warn("[AIService.mergeBullets] merged bullet dropped content twice — discarded", { targetId, dropped: dropped.slice(0, 5) })
      // Y al panel de admin, no sólo a la consola del contenedor: una fusión
      // descartada le costó al usuario un uso y un cooldown para que sus dos
      // líneas se queden como estaban.
      reportGuardDrops({
        endpoint: "merge-bullets",
        offered: 1,
        kept: 0,
        hardCoded: 0,
        figureLoss: 0,
        trivial: perdioTermino ? 0 : 1,
        termLoss: perdioTermino ? 1 : 0,
        weak: 0,
      })
      return { status: "not_mergeable" }
    }

    // Our text, so our typos: the shared cleaner runs on everything generated.
    const [cleaned] = await cleanGeneratedText([text], language, sectionData)
    return { status: "ok", text: cleaned ?? text }
    } finally {
      bill()
    }
  }

  /**
   * The second and final attempt. Returns the merged sentence, or null when it
   * fails any of the same checks — never a third call: a prompt that loses
   * content twice on the same pair is not going to keep it on the third try, and
   * leaving the candidate's two lines exactly as they are is harmless.
   */
  private async retryMerge(
    note: string,
    call: (note?: string) => ReturnType<IAIClient["chat"]>,
    usages: Array<{ prompt_tokens?: number; completion_tokens?: number }>,
    a: string,
    b: string,
    targetId: string,
    postingTerms: readonly string[],
    language: string,
  ): Promise<string | null> {
    try {
      const completion = await call(note)
      // Recorded, never billed here: the caller adds it to the single row.
      usages.push(completion.usage ?? {})
      const segunda = readChat(completion)
      if (segunda.truncated) {
        this.logger.warn("[AIService.mergeBullets] retry truncated by token ceiling", { targetId })
      }
      const parsed = parseAIJson<{ status?: unknown; text?: unknown }>(segunda.text || "{}")
      if (parsed.status === "not_mergeable") return null
      let out = typeof parsed.text === "string" ? parsed.text.trim() : ""
      if (!out) return null
      out = out.replace(/^\s*[•·▪‣*\-–—]\s*/, "").replace(/^["\u2018\u2019\u201c\u201d']|["\u2018\u2019\u201c\u201d']$/g, "").trim()
      // La segunda respuesta pasa por EL MISMO motor y LA MISMA lista que la
      // primera. Escrita a mano, esta copia ya se había desincronizado una vez:
      // la de arriba corría cinco chequeos y ésta cuatro más el largo, y un
      // hermano con un chequeo de menos es exactamente cómo se cuela lo que el
      // otro rechaza.
      if (!runWriteGate({
        text: out,
        source: `${a}\n${b}`,
        mergedFrom: [a, b],
        postingTerms,
        figurePolicy: "drop",
        language,
      }, MERGE_RULES).ok) return null
      if (out.length < Math.max(a.length, b.length)) return null
      this.logger.info("[AIService.mergeBullets] second attempt kept every word", { targetId })
      return out
    } catch {
      return null
    }
  }
}
