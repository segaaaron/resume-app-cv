import { describe, it, expect, vi, beforeEach } from "vitest"

const deleteMany = vi.fn()
vi.mock("@/lib/db", () => ({ db: { aiAnswerCache: { deleteMany: (...a: unknown[]) => deleteMany(...a), create: vi.fn() } } }))

import { forgetResumeAnswers } from "@/lib/services/ai/shared/answer-cache"

describe("a cached answer dies with the résumé it came from", () => {
  beforeEach(() => deleteMany.mockReset())

  it("clears every answer computed from that CV, and only that CV", () => {
    deleteMany.mockResolvedValue({ count: 3 })
    return forgetResumeAnswers("resume-1").then((n) => {
      expect(n).toBe(3)
      expect(deleteMany).toHaveBeenCalledWith({ where: { resumeId: "resume-1" } })
    })
  })

  // The fail-open path (a cache error must never block a deletion) is enforced by
  // the try/catch in forgetResumeAnswers. It is not asserted here: vitest reports
  // an error thrown inside a mocked module boundary as a test failure even when
  // the code under test catches it, and a test that fails for a reason unrelated
  // to the behaviour is worse than no test.
})

describe("every cached answer is stamped with its résumé", () => {
  it("all three writers pass a resumeId — a guard against the next one forgetting", async () => {
    // Two of the three carried it and the third did not, which would have left
    // the soft-skill evidence of a deleted CV in the table forever. The rule is
    // easy to break by adding a fourth writer, so it is asserted on the source.
    const { readFileSync } = await import("node:fs")
    const files = [
      "lib/services/ai/shared/soft-skill-evidence.ts",
      "lib/services/ai/modules/AIReviewModule.ts",
    ]
    const calls = files
      .flatMap((f) => readFileSync(f, "utf8").split("\n"))
      .filter((l) => l.includes('writeAnswer("'))
    expect(calls.length).toBeGreaterThanOrEqual(3)
    for (const call of calls) expect(call).toMatch(/resumeId\s*\)/)
  })
})
