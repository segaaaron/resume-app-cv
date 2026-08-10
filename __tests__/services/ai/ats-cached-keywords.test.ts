import { describe, it, expect, vi, beforeEach } from "vitest"
import { AIService } from "@/lib/services/ai/AIService"
import type { IAIClient, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-4o-mini",
  AI_MODEL_PROSE: "gpt-4o-mini",
  AI_TEMPERATURE: 0.4,
  AI_TEMPERATURE_CREATIVE: 0.7,
  AI_TEMPERATURE_PRECISE: 0.1,
  AI_TEMPERATURE_STRUCTURED: 0.3,
  AI_TEMPERATURE_GENERATIVE: 0.6,
  checkRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementAIQuota: vi.fn().mockResolvedValue({ allowed: true }),
  recordRateLimitUsage: vi.fn(),
  logAIUsage: vi.fn(),
  buildResumeContext: vi.fn().mockReturnValue("Name: Test\nTarget Role: iOS Developer"),
}))
vi.mock("@/lib/db", () => ({
  db: {
    resume: { findFirst: vi.fn().mockResolvedValue(null) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}))
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({
  enforceAIQuota: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: vi.fn().mockReturnValue({ valid: true }) }))

function completion(content: string): ChatCompletion {
  return {
    id: "t", object: "chat.completion", created: 0, model: "gpt-4o-mini",
    choices: [{ index: 0, message: { role: "assistant", content, refusal: null }, finish_reason: "stop", logprobs: null }],
    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
  } as ChatCompletion
}

const EXTRACTION = JSON.stringify({
  jobTitle: "iOS Developer",
  hardSkills: ["Swift", "SwiftUI"],
  softSkills: ["mentoring"],
  mustHaves: ["5+ years"],
  summary: "Strong fit for this posting.",
})

const SECTION_DATA = {
  summary: "iOS Developer with Swift and SwiftUI experience.",
  workExperience: [{ id: "w1", jobTitle: "iOS Developer", employer: "Acme", description: "Built apps with Swift" }],
  skills: [{ id: "s1", name: "Swift", level: "intermediate" }],
  education: [{ id: "e1", institution: "Uni", degree: "CS" }],
}

/**
 * The score exists to answer "did my edit help?". It could not, because the
 * keywords were re-sampled every run: the engine is deterministic but the model
 * reading the posting is not, and `temperature` is dropped for reasoning models.
 * Reusing the keywords for an unchanged posting is what makes two runs
 * comparable — and it must actually skip the call, not just look like it.
 */
describe("ats-score — cached keywords", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } })

  it("does NOT call the model for extraction when keywords are supplied", async () => {
    const aiClient: IAIClient = {
      // Any call that DOES happen is the recruiter analysis, which returns prose.
      chat: vi.fn().mockResolvedValue(completion('{"verdict":"ok","criticalFixes":[],"strengths":[]}')),
      embed: vi.fn().mockResolvedValue([]),
    }
    const service = new AIService(aiClient, logger)
    await service.atsScore("u1", {
      jobDescription: "We need an iOS Developer with Swift and SwiftUI. ".repeat(3),
      sectionData: SECTION_DATA,
      cachedKeywords: {
        hardSkills: ["Swift", "SwiftUI"], softSkills: ["mentoring"],
        jobTitle: "iOS Developer", mustHaves: ["5+ years"], summary: "Strong fit for this posting.",
      },
    }, "PRO")

    const prompts = (aiClient.chat as ReturnType<typeof vi.fn>).mock.calls
      .map((c) => JSON.stringify(c[0]))
    // The extractor is the call that asks for hardSkills/mustHaves as JSON.
    expect(prompts.some((p) => p.includes("mustHaves"))).toBe(false)
  })

  it("produces the same score twice for the same cached keywords", async () => {
    const make = () => new AIService({
      chat: vi.fn().mockResolvedValue(completion('{"verdict":"ok","criticalFixes":[],"strengths":[]}')),
      embed: vi.fn().mockResolvedValue([]),
    } as IAIClient, logger)

    const input = {
      jobDescription: "We need an iOS Developer with Swift and SwiftUI. ".repeat(3),
      sectionData: SECTION_DATA,
      cachedKeywords: {
        hardSkills: ["Swift", "SwiftUI"], softSkills: ["mentoring"],
        jobTitle: "iOS Developer", mustHaves: ["5+ years"], summary: "Strong fit.",
      },
    }
    const a = await make().atsScore("u1", input, "PRO")
    const b = await make().atsScore("u1", input, "PRO")
    expect(b.score).toBe(a.score)
    expect(b.missingKeywords).toEqual(a.missingKeywords)
    // The cached sentence survives — it used to fall back to the generic one.
    expect(b.summary).toBe(a.summary)
    expect(a.summary).toContain("Strong fit")
  })

  it("still calls the extractor when no keywords are cached", async () => {
    const aiClient: IAIClient = {
      chat: vi.fn()
        .mockResolvedValueOnce(completion(EXTRACTION))
        .mockResolvedValue(completion('{"verdict":"ok","criticalFixes":[],"strengths":[]}')),
      embed: vi.fn().mockResolvedValue([]),
    }
    const service = new AIService(aiClient, logger)
    const r = await service.atsScore("u1", {
      jobDescription: "We need an iOS Developer with Swift and SwiftUI. ".repeat(3),
      sectionData: SECTION_DATA,
    }, "PRO")
    expect((aiClient.chat as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0)
    expect(r.extractedKeywords.hardSkills).toContain("Swift")
  })
})
