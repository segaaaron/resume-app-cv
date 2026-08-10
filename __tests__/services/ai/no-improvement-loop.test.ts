import { describe, it, expect, vi, beforeEach } from "vitest"
import { AIService } from "@/lib/services/ai/AIService"
import type { IAIClient, ChatCompletion } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-4o-mini", AI_MODEL_PROSE: "gpt-4o-mini",
  AI_TEMPERATURE: 0.4, AI_TEMPERATURE_CREATIVE: 0.7, AI_TEMPERATURE_PRECISE: 0.1,
  AI_TEMPERATURE_STRUCTURED: 0.3, AI_TEMPERATURE_GENERATIVE: 0.6,
  checkRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementRateLimit: vi.fn().mockResolvedValue(true),
  checkAndIncrementAIQuota: vi.fn().mockResolvedValue({ allowed: true }),
  recordRateLimitUsage: vi.fn(), logAIUsage: vi.fn(),
  buildResumeContext: vi.fn().mockReturnValue("Name: Test"),
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

/**
 * One rule across every "improve" surface: content that has no fixable defect
 * must NOT reach the model.
 *
 * A model asked to improve text always returns another variant — it will not
 * volunteer "leave it alone". So the user improved something, waited out the
 * cooldown, pressed again and got a rewrite of our own output, forever. The
 * decision to stop belongs to code, and these tests prove no call is made.
 */
describe("no improvement loop — strong content never reaches the model", () => {
  let logger: ILogger
  let client: IAIClient
  let calls: () => number

  beforeEach(() => {
    logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const chat = vi.fn().mockResolvedValue(completion("{}"))
    client = { chat, embed: vi.fn().mockResolvedValue([]) }
    calls = () => chat.mock.calls.length
  })

  const STRONG_BULLETS = [
    "• Led the migration to SwiftUI across 4 apps, cutting crash rate 30%.",
    "• Reduced build times from 12 to 4 minutes by parallelising CI jobs.",
  ].join("\n")

  const STRONG_SUMMARY =
    "Senior iOS engineer with seven years building consumer apps, leading the SwiftUI migration " +
    "across four products and cutting crash rates by 30% while mentoring a team of five developers."

  it("improve-bullet: refuses without calling the model", async () => {
    const r = await new AIService(client, logger).improveBullet("u1", { text: STRONG_BULLETS }, "PRO")
    expect(r.status).toBe("already_optimized")
    expect(calls()).toBe(0)
  })

  it("improve-summary: refuses without calling the model", async () => {
    const r = await new AIService(client, logger).improveSummary("u1", { summary: STRONG_SUMMARY, sectionData: {} }, "PRO")
    expect(r.status).toBe("already_optimized")
    expect(calls()).toBe(0)
  })

  it("improve-bullet still calls the model when there IS a defect", async () => {
    const weak = "• Responsible for the payments module."
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      status: "improved",
      // No invented figure: the anti-hallucination guard drops a rewrite that
      // states a number the original never had, and it would mask what this
      // test is actually checking (that the call happens at all).
      improvements: [{ index: 0, text: "• Rebuilt the payments module and its release pipeline." }],
    })))
    const c: IAIClient = { chat, embed: vi.fn() }
    const r = await new AIService(c, logger).improveBullet("u1", { text: weak }, "PRO")
    expect(chat.mock.calls.length).toBeGreaterThan(0)
    expect(r.status).not.toBe("already_optimized")
  })

  // NOTE: an earlier version of this file asserted that a focus always reaches
  // the model. That was the bug, not the contract: the ATS panel sends a focus
  // on every rewrite press, so "always honour it" meant a bullet it had just
  // rewritten went straight back. The two tests at the end state the real rule —
  // a focus is honoured while the defect it names is still there.

  it("tailor-cv: refuses when the CV misses nothing and every bullet is clean", async () => {
    // Tailoring is about a POSTING, so "well written" alone is not the bar —
    // the ATS pass must also report no missing keyword for this posting.
    const r = await new AIService(client, logger).tailorCV("u1", {
      sectionData: { workExperience: [{ id: "w1", description: STRONG_BULLETS }] },
      jobDescription: "We need a senior iOS engineer with SwiftUI and CI experience. ".repeat(3),
      atsMissingKeywords: [],
    }, "PRO")
    expect(r.experiences).toEqual([])
    expect(r.summary).toBeNull()
    expect(calls()).toBe(0)
  })

  it("tailor-cv still runs when the posting asks for something the CV lacks", async () => {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      summary: null, experiences: [], missingSkills: ["Kubernetes"],
    })))
    const c: IAIClient = { chat, embed: vi.fn() }
    await new AIService(c, logger).tailorCV("u1", {
      sectionData: { workExperience: [{ id: "w1", description: STRONG_BULLETS }] },
      jobDescription: "We need a senior iOS engineer with Kubernetes experience. ".repeat(3),
      atsMissingKeywords: ["Kubernetes"],
    }, "PRO")
    expect(chat.mock.calls.length).toBeGreaterThan(0)
  })

  it("a focus does NOT bypass the gate when the defect is already fixed", async () => {
    // The exact loop the user hit: the ATS panel sends a focus on EVERY rewrite
    // press, so honouring it blindly meant a just-rewritten bullet went straight
    // back to the model. A focus is a claim about the text, and it is verified.
    const r = await new AIService(client, logger).improveBullet(
      "u1",
      { text: STRONG_BULLETS, focus: ["weak_verb", "metric"] },
      "PRO",
    )
    expect(r.status).toBe("already_optimized")
    expect(calls()).toBe(0)
  })

  it("a focus IS honoured while the defect is real", async () => {
    const chat = vi.fn().mockResolvedValue(completion(JSON.stringify({
      status: "improved",
      improvements: [{ index: 0, text: "• Rebuilt the payments module and its release pipeline." }],
    })))
    const c: IAIClient = { chat, embed: vi.fn() }
    await new AIService(c, logger).improveBullet(
      "u1",
      { text: "• Responsible for the payments module.", focus: ["weak_verb"] },
      "PRO",
    )
    expect(chat.mock.calls.length).toBeGreaterThan(0)
  })

  it("a missing metric alone never reopens the model — we do not invent figures", async () => {
    const noMetric = "• Migrated the authentication layer to OAuth 2.0 with the platform team."
    const r = await new AIService(client, logger).improveBullet("u1", { text: noMetric, focus: ["metric"] }, "PRO")
    expect(r.status).toBe("already_optimized")
    expect(calls()).toBe(0)
  })
})
