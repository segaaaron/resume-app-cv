import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/ai-client", () => ({ AI_MODEL_PROSE: "test-model" }))
vi.mock("@/lib/services/ai/shared/quota-enforcer", () => ({ enforceAIQuota: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/services/ai/shared/clean-output", () => ({
  cleanGeneratedText: vi.fn(async (texts: string[]) => texts),
}))

import { AIMergeBulletsModule } from "@/lib/services/ai/modules/AIMergeBulletsModule"

const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

const A = "Built the checkout screen in SwiftUI"
const B = "Improved checkout screen loading behaviour with Combine"
const sectionData = {
  workExperience: [{ id: "job1", jobTitle: "iOS Developer", description: `• ${A}\n• ${B}` }],
}

function moduleReturning(text: string) {
  const aiClient = {
    chat: vi.fn().mockResolvedValue({ choices: [{ message: { content: text } }] }),
    embed: vi.fn(),
  }
  return { mod: new AIMergeBulletsModule(aiClient, logger as never), aiClient }
}

beforeEach(() => vi.clearAllMocks())

describe("mergeBullets", () => {
  it("returns the merged line", async () => {
    const merged = "Built and tuned the checkout screen in SwiftUI, improving loading behaviour with Combine"
    const { mod } = moduleReturning(merged)
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res).toEqual({ status: "ok", text: merged })
  })

  it("accepts an honest refusal instead of forcing two unrelated lines together", async () => {
    const { mod } = moduleReturning("NOT_MERGEABLE")
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
  })

  // The promise a merge makes: nothing the candidate wrote is lost.
  it("rejects a merge shorter than the longer source line — that dropped content", async () => {
    const { mod } = moduleReturning("Built the checkout screen")
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
  })

  it("rejects a merge that invented a figure nobody wrote", async () => {
    const { mod } = moduleReturning(
      "Built and tuned the checkout screen in SwiftUI with Combine, cutting load time by 45% for 30000 users",
    )
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
  })

  it("strips a bullet marker the model adds back", async () => {
    const merged = "Built and tuned the checkout screen in SwiftUI, improving loading behaviour with Combine"
    const { mod } = moduleReturning(`• ${merged}`)
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 1], sectionData }, "PRO")
    expect(res).toEqual({ status: "ok", text: merged })
  })

  // Stale indexes: the description can be edited between the analysis and the click.
  it("refuses when an index is out of range", async () => {
    const { mod, aiClient } = moduleReturning("anything")
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [0, 9], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
    expect(aiClient.chat).not.toHaveBeenCalled()
  })

  it("refuses to merge a line with itself", async () => {
    const { mod, aiClient } = moduleReturning("anything")
    const res = await mod.mergeBullets("u1", { targetId: "job1", indexes: [1, 1], sectionData }, "PRO")
    expect(res.status).toBe("not_mergeable")
    expect(aiClient.chat).not.toHaveBeenCalled()
  })

  it("rejects a role that is not in the CV", async () => {
    const { mod } = moduleReturning("anything")
    await expect(
      mod.mergeBullets("u1", { targetId: "ghost", indexes: [0, 1], sectionData }, "PRO"),
    ).rejects.toThrow()
  })
})
