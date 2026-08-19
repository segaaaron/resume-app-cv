import { describe, it, expect, vi, beforeEach } from "vitest"
import { AIService } from "@/lib/services/ai/AIService"
import type { IAIClient, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-4o-mini", AI_MODEL_PROSE: "gpt-4o-mini",
  AI_TEMPERATURE: 0.4, AI_TEMPERATURE_CREATIVE: 0.7, AI_TEMPERATURE_PRECISE: 0.1,
  AI_TEMPERATURE_STRUCTURED: 0.3, AI_TEMPERATURE_GENERATIVE: 0.6, AI_TEMPERATURE_EXACT: 0,
  checkRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementAIQuota: vi.fn().mockResolvedValue({ allowed: true }),
  recordRateLimitUsage: vi.fn(), logAIUsage: vi.fn(),
  buildResumeContext: vi.fn((sectionData: Record<string, unknown>) => JSON.stringify(sectionData)),
}))
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() }, auditLog: { create: vi.fn() } } }))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: vi.fn().mockReturnValue({ valid: true }) }))
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({
  enforceAIQuota: vi.fn().mockResolvedValue(undefined),
  refundDailyQuota: vi.fn().mockResolvedValue(undefined),
}))

function completion(content: string): ChatCompletion {
  return {
    id: "t", object: "chat.completion", created: 0, model: "gpt-4o-mini",
    choices: [{ index: 0, message: { role: "assistant", content, refusal: null }, finish_reason: "stop", logprobs: null }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  } as ChatCompletion
}

const SECTIONS = {
  summary: "Welder.",
  workExperience: [{ id: "job-1", jobTitle: "Welder", employer: "Taller Cruz", description: "• Soldé piezas.\n• Armé estructuras." }],
  skills: [{ name: "Soldadura" }],
}
const JD = "Structural welder for civil works: blueprint reading, bevelling, MIG and TIG on structural steel, visual weld inspection."

/**
 * A finding whose replacement text is empty must not carry an Apply button.
 *
 * Measured against the live API on the thinnest résumé in the eval set: three of
 * four critical fixes came back with `fix` holding only an instruction ("Rewrite
 * the line to name the process you handled"). `splitFixText` correctly moves the
 * instruction to `needsFromYou` — and left `fix` as the empty string, with a
 * `rewrite_bullet` action still attached. The panel then drew "Apply this text"
 * over a blank string: pressing it either does nothing or wipes the line it
 * points at, and either way the user spent a use to be handed a broken button.
 *
 * `groundFixAction` cannot catch this: it checks that the TARGET exists, and here
 * the job and the index are both fine. What is missing is the text.
 */
function clientReturning(analysisJson: string): IAIClient {
  const extraction = JSON.stringify({
    hardSkills: ["MIG", "TIG"], softSkills: [], jobTitle: "Welder",
    mustHaves: ["MIG"], summary: "fit", label: "ok",
  })
  const chat = vi.fn().mockImplementation((params: { messages: Array<{ content: string }> }) => {
    const prompt = params.messages.map((m) => m.content).join("\n")
    const isAnalysis = /senior technical recruiter|reclutador t[eé]cnico/i.test(prompt)
    return Promise.resolve(completion(isAnalysis ? analysisJson : extraction))
  })
  return { chat, embed: vi.fn().mockResolvedValue([]) } as IAIClient
}

describe("a fix with no replacement text never gets an Apply button", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }; vi.clearAllMocks() })

  it("degrades a rewrite_bullet whose fix is instruction-only to manual", async () => {
    const analysis = JSON.stringify({
      verdict: "Thin", passRisk: "high",
      criticalFixes: [{
        issue: "• Soldé piezas.",
        why: "Says nothing a recruiter can weigh",
        // Instruction-only: after the split, the pasteable half is empty.
        fix: "Rewrite the line to name the real process you handled and the steel thickness.",
        severity: "high",
        action: { kind: "rewrite_bullet", targetId: "job-1", index: 0 },
      }],
      strengths: ["Welding"],
    })
    const r = await new AIService(clientReturning(analysis), logger)
      .atsScore("u1", { jobDescription: JD, sectionData: SECTIONS, language: "en" }, "PRO")

    const fix = r.analysis?.criticalFixes?.[0]
    expect(fix, "the finding must survive as advice").toBeDefined()
    expect(fix?.action?.kind).toBe("manual")
    // The advice is not lost — it moved to the field the panel shows and never applies.
    expect(fix?.needsFromYou ?? "").toMatch(/name the real process/i)
  })

  it("keeps the Apply button when there IS replacement text", async () => {
    const analysis = JSON.stringify({
      verdict: "Thin", passRisk: "high",
      criticalFixes: [{
        issue: "• Soldé piezas.",
        why: "Says nothing a recruiter can weigh",
        fix: "Welded structural steel joints to drawing, checking the bead and setting amperage to plate thickness.",
        severity: "high",
        action: { kind: "rewrite_bullet", targetId: "job-1", index: 0 },
      }],
      strengths: ["Welding"],
    })
    const r = await new AIService(clientReturning(analysis), logger)
      .atsScore("u1", { jobDescription: JD, sectionData: SECTIONS, language: "en" }, "PRO")

    expect(r.analysis?.criticalFixes?.[0]?.action?.kind).toBe("rewrite_bullet")
  })

  /**
   * The filter above must not read "empty fix" as "nothing to do". `fix` is
   * `z.string().catch("")`, and `add_skill` writes from `action.value`, never
   * from `fix` — so a finding with an empty `fix` and a working button is a
   * finding the user can act on. Caught in review of this very change.
   */
  it("keeps an actionable finding whose fix text is empty", async () => {
    const analysis = JSON.stringify({
      verdict: "Thin", passRisk: "high",
      criticalFixes: [{
        issue: "MIG welding is demonstrated but never listed",
        why: "The parser matches the skills section",
        fix: "",
        severity: "high",
        action: { kind: "add_skill", value: "MIG" },
      }],
      strengths: ["Welding"],
    })
    const r = await new AIService(clientReturning(analysis), logger)
      .atsScore("u1", { jobDescription: JD, sectionData: SECTIONS, language: "en" }, "PRO")

    expect(r.analysis?.criticalFixes?.[0]?.action?.kind).toBe("add_skill")
  })

  it("drops a finding that offers neither text nor a request", async () => {
    const analysis = JSON.stringify({
      verdict: "Thin", passRisk: "high",
      criticalFixes: [
        { issue: "• Armé estructuras.", why: "vague", fix: "   ", severity: "medium", action: { kind: "manual" } },
        { issue: "• Soldé piezas.", why: "vague", fix: "Welded structural steel joints to drawing.", severity: "high", action: { kind: "manual" } },
      ],
      strengths: ["Welding"],
    })
    const r = await new AIService(clientReturning(analysis), logger)
      .atsScore("u1", { jobDescription: JD, sectionData: SECTIONS, language: "en" }, "PRO")

    const issues = (r.analysis?.criticalFixes ?? []).map((f) => f.issue)
    expect(issues).not.toContain("• Armé estructuras.")
    expect(issues).toContain("• Soldé piezas.")
  })
})
