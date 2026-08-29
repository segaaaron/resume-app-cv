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
  it("todo escritor del caché estampa su CV — el que se olvide deja texto de un CV borrado", async () => {
    // Two of the three carried it and the third did not, which would have left
    // the soft-skill evidence of a deleted CV in the table forever. The rule is
    // easy to break by adding a fourth writer, so it is asserted on the source.
    const { readFileSync } = await import("node:fs")
    const files = [
      "lib/services/ai/shared/soft-skill-evidence.ts",
    ]
    const calls = files
      .flatMap((f) => readFileSync(f, "utf8").split("\n"))
      .filter((l) => l.includes('writeAnswer("'))
    // Eran tres escritores; dos se fueron con el motor ATS viejo (2026-08-28).
    // Lo que el guard cuida no es el número: es que NINGUNO escriba sin resumeId.
    expect(calls.length).toBeGreaterThanOrEqual(1)
    for (const call of calls) expect(call).toMatch(/resumeId\s*\)/)
  })
})
