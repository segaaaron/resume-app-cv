import { describe, it, expect, vi, beforeEach } from "vitest"
import { AIService } from "@/lib/services/ai/AIService"
import { MAX_PREVIEW_CHARS } from "@/lib/services/ai/shared/ai-types"
import type { IAIClient, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

/**
 * One bad item must not take the whole review down with it.
 *
 * REPORTED: a CV whose panel listed five things wrong and offered no button for
 * any of them. Measured live over six rounds, the model returned three to seven
 * usable rewrites EVERY time — and three of those rounds delivered zero. The
 * cause was ours: one `safeParse` over the whole response, and on any failure a
 * fallback that returned the review with every suggestion stripped.
 *
 * Two things failed it routinely. A `preview` for a six-bullet role runs past
 * the character cap by simply being faithful — and the cap said 1000 while the
 * prompt asked for 1200, so the schema rejected what the prompt requested. And
 * `improvements` was `.max(5)`, so a sixth item invalidated the other five.
 *
 * The same lesson the fill-profile schema already records: a strict rule in the
 * wrong place does not reject the bad part, it rejects everything.
 */
vi.mock("@/lib/ai-client", async (orig) => {
  const actual = await orig<typeof import("@/lib/ai-client")>()
  return {
    ...actual,
    AI_MODEL: "gpt-5.4-nano", AI_MODEL_PROSE: "gpt-5.4-mini",
    checkRateLimit: vi.fn().mockResolvedValue(true),
    checkAndIncrementRateLimit: vi.fn().mockResolvedValue(true),
    checkAndIncrementAIQuota: vi.fn().mockResolvedValue({ allowed: true }),
    recordRateLimitUsage: vi.fn(), logAIUsage: vi.fn(),
  }
})
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() }, auditLog: { create: vi.fn() } } }))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: vi.fn().mockReturnValue({ valid: true }) }))
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({
  enforceAIQuota: vi.fn().mockResolvedValue(undefined),
  refundDailyQuota: vi.fn().mockResolvedValue(undefined),
}))

function completion(content: string): ChatCompletion {
  return {
    id: "t", object: "chat.completion", created: 0, model: "gpt-5.4-mini",
    choices: [{ index: 0, message: { role: "assistant", content, refusal: null }, finish_reason: "stop", logprobs: null }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  } as ChatCompletion
}

const SECTIONS = {
  summary: "QA automatization con suites automatizadas.",
  workExperience: [{
    id: "patito", jobTitle: "Quality automatization", employer: "Patito SA",
    description: [
      "• Participé en la automatización de QA para nuevos features, definiendo alcance y criterios de prueba.",
      "• Elaboré matrices de test para productos de apps, cubriendo funcionalidades y trazabilidad.",
      "• Diseñé y ejecuté pruebas a medida dentro de la app, con validaciones por componente.",
    ].join("\n"),
  }],
  skills: [{ name: "Selenium" }],
}

const good = (n: number) => ({
  text: `mejora ${n}`,
  suggestion: {
    field: "workExperience.description", type: "replace", targetId: "patito",
    reason: "nombra el trabajo",
    preview: [
      `• Definí alcance y criterios de prueba para nuevos features antes del ciclo de desarrollo, versión ${n}.`,
      "• Elaboré matrices de test cubriendo funcionalidades, criterios de aceptación y trazabilidad a requisitos.",
      "• Diseñé y ejecuté pruebas a medida en la app, con validaciones por componente y flujo de negocio.",
    ].join("\n"),
  },
})

describe("a malformed review item is dropped, never the whole review", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }; vi.clearAllMocks() })

  const run = (payload: object) => {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify(payload)))
    return new AIService({ chat, embed: vi.fn() } as IAIClient, logger)
      .reviewCV("u1", { sectionData: SECTIONS, language: "es" }, "PRO")
  }

  it("keeps the good suggestions when one preview is oversized", async () => {
    const r = await run({
      summary: "Revisión", answer: "", strengths: [],
      improvements: [
        { text: "gigante", suggestion: { field: "summary", type: "replace", reason: "x", preview: "a".repeat(MAX_PREVIEW_CHARS + 1) } },
        good(1), good(2),
      ],
    })
    const withButton = r.improvements.filter((i) => i.suggestion?.preview)
    expect(withButton).toHaveLength(2)
    // The oversized one survives as advice — the text named a real problem.
    expect(r.improvements.map((i) => i.text)).toContain("gigante")
  })

  it("keeps the first five when the model returns six", async () => {
    const r = await run({
      summary: "Revisión", answer: "", strengths: [],
      improvements: [good(1), good(2), good(3), good(4), good(5), good(6)],
    })
    expect(r.improvements).toHaveLength(5)
    expect(r.improvements.every((i) => !!i.suggestion?.preview)).toBe(true)
  })

  /**
   * A six-bullet role rewritten faithfully is longer than the old 1000-character
   * cap by simply existing. The cap now matches what a description actually is.
   */
  it("accepts a preview the length of a real description", async () => {
    // Six bullets at the length the reported CV actually carries.
    const sixBullets = Array.from({ length: 6 }, (_, i) =>
      `• Ejecuté la línea ${i} de pruebas automatizadas con Selenium sobre la aplicación web, cubriendo escenarios funcionales y de regresión, criterios de aceptación, datos de prueba y trazabilidad a los requisitos del producto.`).join("\n")
    expect(sixBullets.length).toBeGreaterThan(1000)
    expect(sixBullets.length).toBeLessThanOrEqual(MAX_PREVIEW_CHARS)
  })
})
