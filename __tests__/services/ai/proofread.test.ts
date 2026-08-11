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

const CV = ["iOS Developer with more then 7 years of experience building interfaces across UIKit and SwiftUI."]

/**
 * A dictionary cannot see "more then" — both are words. This pass reads the
 * sentences instead. Its whole safety model is that a correction must point at
 * text the CV really contains: a proofreader that "fixes" a line the user never
 * wrote is worse than none, and a model asked for corrections always finds some.
 */
describe("proofread", () => {
  let logger: ILogger
  beforeEach(() => { logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } })

  it("returns the grammar error a dictionary cannot catch", async () => {
    const out = await svc(JSON.stringify({ corrections: [
      { wrong: "more then", correct: "more than", why: "comparative" },
    ] }), logger).proofread("u1", CV, "en", "PRO")
    expect(out).toEqual([{ wrong: "more then", correct: "more than", why: "comparative" }])
  })

  it("drops a correction whose text is not in the CV", async () => {
    const out = await svc(JSON.stringify({ corrections: [
      { wrong: "managed a team of 40", correct: "led a team of 40", why: "stronger verb" },
    ] }), logger).proofread("u1", CV, "en", "PRO")
    expect(out).toEqual([])
  })

  it("drops a whole-sentence 'correction' — that is a rewrite, not proofreading", async () => {
    const long = "iOS Developer with more then 7 years of experience building interfaces"
    const out = await svc(JSON.stringify({ corrections: [
      { wrong: long, correct: "Senior iOS Engineer, 7 years", why: "punchier" },
    ] }), logger).proofread("u1", CV, "en", "PRO")
    expect(out).toEqual([])
  })

  it("drops a no-op correction", async () => {
    const out = await svc(JSON.stringify({ corrections: [
      { wrong: "UIKit", correct: "UIKit", why: "" },
    ] }), logger).proofread("u1", CV, "en", "PRO")
    expect(out).toEqual([])
  })

  it("returns nothing on malformed JSON instead of throwing", async () => {
    const out = await svc("not json at all", logger).proofread("u1", CV, "en", "PRO")
    expect(out).toEqual([])
  })

  it("numbers the lines and shows the model the JSON it must return", async () => {
    // The prompt is example-first by design: the version made of prohibitions
    // ("NEVER rewrite for style") steered weakly, so the model proposed style
    // edits that the filters then deleted — output we paid to generate and threw
    // away. Numbering exists so grounding is a lookup, not a search.
    const client = { chat: vi.fn().mockResolvedValue(completion('{"corrections":[]}')), embed: vi.fn() } as IAIClient
    await new AIService(client, logger).proofread("u1", ["Built APIs and architecture", ...CV], "en", "PRO")
    const prompt = (client.chat as ReturnType<typeof vi.fn>).mock.calls[0][0].messages[1].content as string
    expect(prompt).toContain("[1] Built APIs and architecture")
    expect(prompt).toContain("[2] iOS Developer with more then")
    expect(prompt).toContain('"line":1')
    // The counter-example from production, shown as a rejection rather than a rule.
    expect(prompt).toContain("increased sprint completion")
  })

  it("drops a correction attributed to the wrong line", async () => {
    // It exists in the CV, but not where the model said it was — so the model was
    // not reading the text it claimed to read, and a lucky substring match
    // elsewhere is not grounding.
    const out = await svc(JSON.stringify({ corrections: [
      { line: 1, wrong: "more then", correct: "more than", why: "comparative" },
    ] }), logger).proofread("u1", ["Built APIs and architecture", ...CV], "en", "PRO")
    expect(out).toEqual([])
  })

  it("keeps it when the line is right", async () => {
    const out = await svc(JSON.stringify({ corrections: [
      { line: 2, wrong: "more then", correct: "more than", why: "comparative" },
    ] }), logger).proofread("u1", ["Built APIs and architecture", ...CV], "en", "PRO")
    expect(out).toEqual([{ wrong: "more then", correct: "more than", why: "comparative" }])
  })

  it("skips the call on a CV too short to judge", async () => {
    const client = { chat: vi.fn(), embed: vi.fn() } as IAIClient
    const out = await new AIService(client, logger).proofread("u1", ["Hi"], "en", "PRO")
    expect(out).toEqual([])
    expect(client.chat).not.toHaveBeenCalled()
  })
})
