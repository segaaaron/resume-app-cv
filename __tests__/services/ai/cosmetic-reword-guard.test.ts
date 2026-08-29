import { describe, it, expect, vi, beforeEach } from "vitest"

// Cosmetic-reword guard now applies to improve-bullet and tailor-cv (was Review-only).
// These pairs pass isTrivialEdit (sim < 0.90) but are pure synonym swaps the user
// complained about — they must be dropped, not sold as improvements.
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/ai-client", () => ({
  AI_MODEL: "gpt-x",
  AI_MODEL_PROSE: "gpt-prose",
  AI_TEMPERATURE_STRUCTURED: 0.3,
  buildResumeContext: () => "",
  logAIUsage: vi.fn(),
}))
vi.mock("@/lib/ai-safety", () => ({ validateAIInput: () => ({ valid: true }) }))

import { AIBulletModule } from "@/lib/services/ai/modules/AIBulletModule"

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

function chatReturning(obj: unknown) {
  return vi.fn(async () => ({ choices: [{ message: { content: JSON.stringify(obj) } }], usage: { prompt_tokens: 5, completion_tokens: 5 } }))
}

describe("cosmetic-reword guard — improve-bullet", () => {
  beforeEach(() => vi.clearAllMocks())

  it("drops a synonym-only bullet rewrite (enhance→improve)", async () => {
    // Opens with a duty phrase, so it is genuinely improvable and DOES reach the
    // model — which is the only way this guard can be exercised. (A bullet with
    // no formal defect is answered before the call now: `already_optimized` when
    // it states a result, `needs_your_input` when it does not.)
    const chat = chatReturning({
      status: "improved",
      improvements: [{ index: 0, text: "• Responsible for improving app performance by 20%." }],
    })
    const mod = new AIBulletModule({ chat } as never, logger as never)
    const res = await mod.improveBullet("u1", { text: "• Responsible for enhancing app performance by 20%.", language: "en" }, "PRO")
    expect(res.status).toBe("already_optimized")
    expect(res.improvements).toHaveLength(0)
  })

  it("keeps a bullet that adds a real, grounded detail", async () => {
    const chat = chatReturning({
      status: "improved",
      improvements: [{ index: 0, text: "• Migrated the payments module to reduce checkout latency." }],
    })
    const mod = new AIBulletModule({ chat } as never, logger as never)
    const res = await mod.improveBullet("u1", { text: "• Worked on the payments module and checkout latency.", language: "en" }, "PRO")
    expect(res.status).toBe("improved")
    expect(res.improvements).toHaveLength(1)
  })
})

