import { describe, it, expect, vi, beforeEach } from "vitest"

// Isolate from quota/db/cost. buildResumeContext → "" so grounding for the guard
// comes only from company/jobTitle/userPrompt passed in the input.
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL_PROSE: "gpt-prose",
  AI_TEMPERATURE_STRUCTURED: 0.3,
  buildResumeContext: () => "",
  logAIUsage: vi.fn(),
}))
vi.mock("@/lib/db", () => ({ db: { resume: { findFirst: vi.fn() } } }))

import { AICoverLetterModule } from "@/lib/services/ai/modules/AICoverLetterModule"

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

function reply(body: string) {
  return { choices: [{ message: { content: JSON.stringify({ body }) } }], usage: { prompt_tokens: 10, completion_tokens: 10 } }
}

/** chat() returns queued responses in order; repeats the last once drained. */
function queuedClient(bodies: string[]) {
  let i = 0
  const chat = vi.fn(async () => reply(bodies[Math.min(i++, bodies.length - 1)]))
  return { client: { chat } as never, chat }
}

const input = (over: Record<string, unknown> = {}) => ({
  company: "Acme",
  jobTitle: "Engineer",
  tone: "balanced",
  language: "en" as const,
  ...over,
})

describe("generateCoverLetter — anti-invention guard", () => {
  beforeEach(() => vi.clearAllMocks())

  it("ships a clean draft as-is, one call", async () => {
    const { client, chat } = queuedClient(["I would bring focus and steady delivery to your team.\n\nHappy to walk you through my work."])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(res.body).toContain("<p>")
    expect(res.body).toContain("focus and steady delivery")
    expect(chat).toHaveBeenCalledTimes(1)
  })

  it("retries when the first draft invents a metric, then ships the clean retry", async () => {
    const dirty = "At my last role I increased revenue by 40% in one quarter.\n\nGlad to share details."
    const clean = "At my last role I led the checkout rebuild and mentored two engineers.\n\nGlad to share details."
    const { client, chat } = queuedClient([dirty, clean])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(chat).toHaveBeenCalledTimes(2)
    expect(res.body).toContain("checkout rebuild")
    expect(res.body).not.toContain("40%")
  })

  it("retries when the first draft invents a stand-in employer name", async () => {
    const dirty = "At XYZ Corp I built the mobile app end to end.\n\nGlad to talk."
    const clean = "I built a mobile app end to end and shipped it to production.\n\nGlad to talk."
    const { client, chat } = queuedClient([dirty, clean])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(chat).toHaveBeenCalledTimes(2)
    expect(res.body).not.toContain("XYZ Corp")
  })

  it("does not flag a real employer that happens to be named 'ABC' (present in the profile)", async () => {
    const clean = "At ABC I owned the payments service and cut incident volume.\n\nGlad to talk."
    const { client, chat } = queuedClient([clean])
    // userPrompt carries the real employer name → in grounding → not a placeholder.
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input({ userPrompt: "I worked at ABC as a backend engineer." }), "PRO")
    expect(chat).toHaveBeenCalledTimes(1)
    expect(res.body).toContain("ABC")
  })

  it("ships best-effort (never empty) when both drafts still invent", async () => {
    const dirty1 = "I boosted sales by 50% at my previous company.\n\nThanks."
    const dirty2 = "I boosted sales by 30% at my previous company.\n\nThanks."
    const { client, chat } = queuedClient([dirty1, dirty2])
    const mod = new AICoverLetterModule(client, logger as never)
    const res = await mod.generateCoverLetter("u1", input(), "PRO")
    expect(chat).toHaveBeenCalledTimes(2)
    // returns the retry draft rather than nothing
    expect(res.body).toContain("30%")
  })
})
