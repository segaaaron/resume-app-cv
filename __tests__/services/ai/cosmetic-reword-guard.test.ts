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
import { AITailorModule } from "@/lib/services/ai/modules/AITailorModule"

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

describe("cosmetic-reword guard — tailor-cv", () => {
  beforeEach(() => vi.clearAllMocks())

  it("drops a cosmetic summary and a cosmetic bullet reword", async () => {
    const sectionData = {
      summary: "Enhanced app performance and user experience across releases.",
      workExperience: [{ id: "w1", jobTitle: "iOS Dev", employer: "Acme", description: "• Integrated RESTful APIs to enhance iOS app functionality." }],
      skills: [],
    }
    const chat = chatReturning({
      summary: "Improved app performance and user experience across releases.",
      rewrites: [{ checkId: "c1", text: "• Integrated RESTful APIs to improve iOS app functionality." }],
    })
    const mod = new AITailorModule({ chat } as never, logger as never)
    const res = await mod.tailorCV("u1", {
      sectionData,
      language: "en",
      posting: { jobTitle: "iOS Developer", hardSkills: ["Swift", "REST APIs"], softSkills: [], mustHaves: [] },
      workload: [{ checkId: "c1", targetId: "w1", index: 0, reason: "weak_verb" }],
      rewriteSummary: true,
    }, "PRO")
    expect(res.summary).toBeNull()
    expect(res.rewrites).toHaveLength(0)
  })
})
