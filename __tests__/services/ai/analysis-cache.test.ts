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
  // Derived from the CV, like the real one: a fixed string would make an edited
  // resume hash identical and hide the very behaviour under test.
  buildResumeContext: vi.fn((sectionData: Record<string, unknown>) => JSON.stringify(sectionData)),
}))
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() }, auditLog: { create: vi.fn() } } }))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: vi.fn().mockReturnValue({ valid: true }) }))
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))

function completion(content: string): ChatCompletion {
  return {
    id: "t", object: "chat.completion", created: 0, model: "gpt-4o-mini",
    choices: [{ index: 0, message: { role: "assistant", content, refusal: null }, finish_reason: "stop", logprobs: null }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  } as ChatCompletion
}

const SECTIONS = {
  summary: "iOS Developer with 7 years building apps in Swift and SwiftUI for teams across Latin America.",
  workExperience: [{ id: "job-1", jobTitle: "iOS Developer", employer: "Acme", description: "• Built the payments module\n• Reduced crashes by 30%" }],
  skills: [{ name: "Swift" }],
}
const JD = "Looking for a senior iOS engineer with Swift, SwiftUI and REST API experience to lead mobile delivery."

/**
 * Re-running the analysis over an UNCHANGED resume must return the same findings.
 *
 * The score half was already pinned — the posting's keywords are cached for this
 * exact reason — but the written half was not, and that is the half the user
 * reads. Pressing Analyze twice produced a different set of critical fixes each
 * time, so the report could not be worked through: "I fixed that" was
 * indistinguishable from "it stopped mentioning it".
 */
describe("recruiter analysis — same resume in, same answer out", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }; vi.clearAllMocks() })

  /**
   * Answers by WHAT is asked, not by call order: the second run extracts the
   * posting again, so an order-based mock would hand it the analysis payload.
   * The analysis answer changes after the first, making a second model call
   * visible in the result itself.
   */
  function twoFacedClient(): IAIClient {
    const analysis = (issue: string) => JSON.stringify({
      verdict: "Solid", passRisk: "medium",
      criticalFixes: [{ issue, why: "because", fix: "do this", severity: "high", action: { kind: "manual" } }],
      strengths: ["Swift"],
    })
    const extraction = JSON.stringify({
      hardSkills: ["Swift", "SwiftUI"], softSkills: ["communication"],
      jobTitle: "iOS Developer", mustHaves: ["Swift"], summary: "Strong fit", label: "ok",
    })
    let analysisCalls = 0
    const chat = vi.fn().mockImplementation((params: { messages: Array<{ content: string }> }) => {
      const prompt = params.messages.map((m) => m.content).join("\n")
      const isAnalysis = /senior technical recruiter|reclutador t[eé]cnico/i.test(prompt)
      if (!isAnalysis) return Promise.resolve(completion(extraction))
      analysisCalls += 1
      return Promise.resolve(completion(analysis(analysisCalls === 1 ? "FIRST ANSWER" : "SECOND ANSWER")))
    })
    return { chat, embed: vi.fn().mockResolvedValue([]) } as IAIClient
  }

  it("returns the identical analysis when nothing changed", async () => {
    const client = twoFacedClient()
    const service = new AIService(client, logger)

    const first = await service.atsScore("u1", { jobDescription: JD, sectionData: SECTIONS, language: "en" }, "PRO")
    const second = await service.atsScore("u1", { jobDescription: JD, sectionData: SECTIONS, language: "en" }, "PRO")

    // Had the model been asked again it would have said "SECOND ANSWER".
    expect(first.analysis?.criticalFixes?.[0]?.issue).toBe("FIRST ANSWER")
    expect(second.analysis?.criticalFixes?.[0]?.issue).toBe("FIRST ANSWER")
  })

  it("reads the resume again once it actually changes", async () => {
    const client = twoFacedClient()
    const service = new AIService(client, logger)

    await service.atsScore("u1", { jobDescription: JD, sectionData: SECTIONS, language: "en" }, "PRO")
    const edited = {
      ...SECTIONS,
      workExperience: [{ ...SECTIONS.workExperience[0], description: "• Built the payments module\n• Reduced crashes by 30%\n• Shipped offline mode to 12k users" }],
    }
    const after = await service.atsScore("u1", { jobDescription: JD, sectionData: edited, language: "en" }, "PRO")

    expect(after.analysis?.criticalFixes?.[0]?.issue).toBe("SECOND ANSWER")
  })
})
