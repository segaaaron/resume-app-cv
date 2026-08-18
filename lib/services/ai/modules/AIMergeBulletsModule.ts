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
import { resolveLanguage, detectHallucination, parseAIJson } from "../shared/ai-helpers"
import { parseBullets } from "../shared/bullets"
import { clicheBanList } from "../shared/cliches"
import { cleanGeneratedText } from "../shared/clean-output"

export interface MergeBulletsInput {
  targetId: string
  /** The two bullet indexes to fuse, as the deterministic pass found them. */
  indexes: [number, number]
  sectionData: Record<string, unknown>
  language?: "es" | "en"
}

export type MergeBulletsResult =
  | { status: "ok"; text: string }
  | { status: "not_mergeable" }

interface WorkRow {
  id?: string
  jobTitle?: string
  description?: string
}

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

RULES:
- Keep every fact, tool, technology and figure that appears in either line. Losing one is a failure.
- One sentence, verb-first in the past tense (Built, Integrated, Automated, Migrated, Implemented). No pronouns. No bullet marker.
- Do NOT invent a metric, a scale, an outcome or a technology that is not already in the two lines. Never write a bracket placeholder such as [X%] or [N users].
- Do not use: ${clicheBanList("en")}
- If the two lines describe genuinely different work and forcing them together would distort either one, return {"status": "not_mergeable"}. That is a correct and expected answer, not a failure.

Respond ONLY with valid JSON (no markdown):
{"status": "ok", "text": "<the merged sentence>"} or {"status": "not_mergeable"}

BULLET A: ${a}
BULLET B: ${b}`
      : `Fusiona los dos bullets de currículum de abajo —ambos del mismo puesto— en UNA sola línea.

REGLAS:
- Conserva todos los datos, herramientas, tecnologías y cifras que aparezcan en cualquiera de las dos líneas. Perder uno es un fallo.
- Una sola frase, con el verbo primero y en pasado (Desarrollé, Integré, Automaticé, Migré, Implementé). Sin pronombres. Sin viñeta.
- NO inventes métricas, escalas, resultados ni tecnologías que no estén ya en las dos líneas. Nunca escribas un placeholder entre corchetes como [X%] o [N usuarios].
- No uses: ${clicheBanList("es")}
- Si las dos líneas describen trabajos genuinamente distintos y forzarlas distorsionaría alguna, devuelve {"status": "not_mergeable"}. Es una respuesta correcta y esperada, no un fallo.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"status": "ok", "text": "<la frase fusionada>"} o {"status": "not_mergeable"}

BULLET A: ${a}
BULLET B: ${b}`

    const system = language === "en"
      ? `You are an elite résumé editor. You fuse two bullets from the same role into one line that keeps every fact and invents nothing. Returning {"status": "not_mergeable"} is a correct answer when the two lines are about different work. ${langInstruction}`
      : `Eres un editor de currículums de élite. Fusionas dos bullets del mismo puesto en una línea que conserva todos los datos y no inventa nada. Devolver {"status": "not_mergeable"} es una respuesta correcta cuando las dos líneas tratan de trabajos distintos. ${langInstruction}`

    let text: string
    let usage: { prompt_tokens?: number; completion_tokens?: number } | undefined
    try {
      const completion = await this.aiClient.chat({
        model: AI_MODEL_PROSE,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        // One sentence; the cap covers the reasoning budget of the GPT-5 family.
        max_tokens: 1200,
        response_format: { type: "json_object" },
      })
      // Este endpoint era el único que llamaba al modelo sin registrar lo que gastaba: su
      // columna en el panel de costos estaba en cero mientras la factura decía otra cosa.
      //
      // FUERA del try de la llamada, a propósito: adentro, un fallo al ESCRIBIR el
      // registro caía en el catch de abajo y devolvía `ai_error` — la medición tumbando
      // la función que mide, sobre una respuesta del modelo que ya estaba bien.
      usage = completion.usage
      text = (completion.choices[0]?.message?.content ?? "").trim()
    } catch (err) {
      this.logger.error("[AIService.mergeBullets] model call failed", { targetId }, err instanceof Error ? err : new Error(String(err)))
      throw new AppError("ai_error", 500)
    }

    logAIUsage(userId, "merge-bullets", {
      model: AI_MODEL_PROSE,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL_PROSE, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
    })

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
     * The merge is a promise: nothing the candidate wrote is lost, and nothing
     * they did not write appears. Checked against BOTH source lines together —
     * anything in the result that is grounded in neither is invented.
     */
    if (detectHallucination(text, `${a}\n${b}`)) {
      this.logger.warn("[AIService.mergeBullets] merged bullet introduced ungrounded content — discarded", { targetId })
      return { status: "not_mergeable" }
    }

    // A merge that is shorter than the longer of the two inputs has dropped
    // content rather than combined it.
    if (text.length < Math.max(a.length, b.length)) return { status: "not_mergeable" }

    // Our text, so our typos: the shared cleaner runs on everything generated.
    const [cleaned] = await cleanGeneratedText([text], language, sectionData)
    return { status: "ok", text: cleaned ?? text }
  }
}
