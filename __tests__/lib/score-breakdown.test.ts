import { describe, it, expect } from "vitest"
import { computeScoreBreakdown } from "@/lib/ats/score-breakdown"
import { SCORE_WEIGHTS } from "@/lib/ats/scoring-config"

/**
 * The properties that make the score auditable.
 *
 * A number nobody can question reads as invented — and for the weights, partly
 * is. What we can guarantee is that the arithmetic is visible and adds up: the
 * rows the panel shows must sum to the headline, and the "path to your target"
 * must land exactly on 100, because both come from this one function.
 */
describe("computeScoreBreakdown — the arithmetic the user is shown", () => {
  it("adds up: the rows sum to the headline score", () => {
    const b = computeScoreBreakdown({ hardSkills: 80, mustHaves: 50, title: 100, softSkills: 25, sections: 100 })
    const summed = b.categories.reduce((acc, c) => acc + c.points, 0)
    // Rounding is done once on the total, so rows may differ by a point at most.
    expect(Math.abs(summed - b.score)).toBeLessThanOrEqual(1)
  })

  it("closing every gap lands on 100, so the plan cannot contradict the number", () => {
    const b = computeScoreBreakdown({ hardSkills: 40, mustHaves: 0, title: 60, softSkills: 100, sections: 50 })
    const recoverable = b.categories.reduce((acc, c) => acc + c.recoverable, 0)
    expect(Math.abs(b.score + recoverable - 100)).toBeLessThanOrEqual(1)
  })

  it("never charges for a category the posting did not ask about", () => {
    // A job listing no soft skills must not cost the candidate the soft-skill
    // weight. The remaining weights renormalize over what is left.
    const b = computeScoreBreakdown({ hardSkills: 100, mustHaves: 100, title: 100, softSkills: null, sections: 100 })
    expect(b.score).toBe(100)
    expect(b.skipped).toContain("softSkills")
    expect(b.categories.some((c) => c.category === "softSkills")).toBe(false)
  })

  it("renormalizes the shares of what remains to a full 1", () => {
    const b = computeScoreBreakdown({ hardSkills: 50, sections: 50 })
    const shares = b.categories.reduce((acc, c) => acc + c.share, 0)
    expect(shares).toBeCloseTo(1, 5)
    // Hard skills outweigh sections, and that ordering survives renormalization.
    const hard = b.categories.find((c) => c.category === "hardSkills")!
    const sections = b.categories.find((c) => c.category === "sections")!
    expect(hard.share).toBeGreaterThan(sections.share)
  })

  it("reports zero, not a crash, when the posting yielded nothing measurable", () => {
    expect(computeScoreBreakdown({})).toEqual({ score: 0, categories: [], skipped: Object.keys(SCORE_WEIGHTS) })
  })

  it("carries the basis of each weight, so the user can judge the number", () => {
    // The honest half: we say which figures are measured and which are ours.
    const b = computeScoreBreakdown({ hardSkills: 70, sections: 90 })
    expect(b.categories.find((c) => c.category === "hardSkills")!.basis).toBe("chosen")
    expect(b.categories.find((c) => c.category === "sections")!.basis).toBe("convention")
  })

  it("a perfect CV scores 100 and a blank one scores 0", () => {
    expect(computeScoreBreakdown({ hardSkills: 100, mustHaves: 100, title: 100, softSkills: 100, sections: 100 }).score).toBe(100)
    expect(computeScoreBreakdown({ hardSkills: 0, mustHaves: 0, title: 0, softSkills: 0, sections: 0 }).score).toBe(0)
  })
})
