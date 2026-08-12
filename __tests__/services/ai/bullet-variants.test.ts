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
  buildResumeContext: vi.fn().mockReturnValue(""),
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
const svc = (content: string, logger: ILogger) =>
  new AIService({ chat: vi.fn().mockResolvedValue(completion(content)), embed: vi.fn() } as IAIClient, logger)

const WEAK = "Responsible for maintaining the checkout service and fixing production bugs in Swift"

/**
 * A single rewrite leaves the user a yes/no: dislike it and the only way forward
 * is to ask again, which is the loop this panel kept producing. Several angles
 * turn that into a choice that ends.
 *
 * The line that does not move: an alternative is applied with one click, so it
 * faces the same guards as the main rewrite. A second option is worth nothing if
 * it can smuggle in a number the candidate never gave us.
 */
describe("improve-bullet — a choice, not another round", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }; vi.clearAllMocks() })

  it("returns the alternatives the model offered, with their angle and reason", async () => {
    const out = await svc(JSON.stringify({ status: "improved", improvements: [{
      index: 0,
      text: "Maintained the checkout service in Swift and resolved production bugs",
      why: "opens with an action verb instead of a duty phrase",
      alternatives: [
        { text: "Stabilised checkout in Swift, cutting recurring production defects", angle: "business", why: "leads with the outcome" },
        { text: "Owned checkout reliability in Swift across the mobile team", angle: "leadership", why: "shows ownership" },
      ],
    }] }), logger).improveBullet("u1", { text: WEAK, language: "en", focus: ["weak_verb"] }, "PRO")

    const first = out.improvements[0]
    expect(first.why).toBe("opens with an action verb instead of a duty phrase")
    expect(first.alternatives).toHaveLength(2)
    expect(first.alternatives?.map((a) => a.angle)).toEqual(["business", "leadership"])
  })

  it("drops an alternative that invents a figure the CV never stated", async () => {
    // The whole reason a second option is safe: it must clear the same gauntlet.
    const out = await svc(JSON.stringify({ status: "improved", improvements: [{
      index: 0,
      text: "Maintained the checkout service in Swift and resolved production bugs",
      alternatives: [
        { text: "Cut checkout defects by 47% across 12k daily orders", angle: "business", why: "quantified" },
        { text: "Owned checkout reliability in Swift across the mobile team", angle: "leadership", why: "shows ownership" },
      ],
    }] }), logger).improveBullet("u1", { text: WEAK, language: "en", focus: ["weak_verb"] }, "PRO")

    const alts = out.improvements[0].alternatives ?? []
    expect(alts.every((a) => !/47%|12k/.test(a.text))).toBe(true)
    expect(alts).toHaveLength(1)
  })

  it("keeps working when the model returns no alternatives at all", async () => {
    // Older responses, and any run where no honest second angle exists.
    const out = await svc(JSON.stringify({ status: "improved", improvements: [
      { index: 0, text: "Maintained the checkout service in Swift and resolved production bugs" },
    ] }), logger).improveBullet("u1", { text: WEAK, language: "en", focus: ["weak_verb"] }, "PRO")

    expect(out.improvements[0].text).toContain("checkout service")
    expect(out.improvements[0].alternatives).toBeUndefined()
  })

  it("asks for variants only on a single bullet, never on a whole role", async () => {
    const many = [
      "Responsible for maintaining the checkout service in Swift",
      "Worked on the payments module and its tests",
      "Helped with release coordination across teams",
    ].join("\n")
    const client = { chat: vi.fn().mockResolvedValue(completion('{"status":"improved","improvements":[]}')), embed: vi.fn() } as IAIClient
    await new AIService(client, logger).improveBullet("u1", { text: many, language: "en" }, "PRO")

    const prompt = (client.chat as ReturnType<typeof vi.fn>).mock.calls[0][0].messages[1].content as string
    expect(prompt).not.toContain("GIVE THE CANDIDATE A CHOICE")
  })
})
