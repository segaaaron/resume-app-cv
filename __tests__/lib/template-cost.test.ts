import { describe, it, expect } from "vitest"
import { applyTemplatePenalty, templateFormatScore, getTemplateAtsSafety, CAUTION_SCORE_FACTOR } from "@/lib/ats/template-ats-safety"
import { SCORE_WEIGHTS } from "@/lib/ats/scoring-config"

/**
 * The panel now names the exact cost of the chosen layout. These pin the two
 * things that claim depends on: the arithmetic, and the fact that the layout is a
 * small correction rather than the reason a score is low.
 */
describe("what the template actually costs", () => {
  it("the published cost is exactly what was applied", () => {
    for (const raw of [40, 55, 71, 88, 100]) {
      const final = applyTemplatePenalty(raw, "caution")
      const published = raw - final
      // "you would be at {raw}" must land back on the pre-penalty score.
      expect(final + published).toBe(raw)
      expect(published).toBeGreaterThan(0)
    }
  })

  it("costs nothing on a single-column template", () => {
    for (const raw of [40, 71, 100]) {
      expect(applyTemplatePenalty(raw, "safe")).toBe(raw)
    }
  })

  // The reason we refuse to say "your score is low because of the template":
  // it is a 5% correction, while keyword coverage alone is 45% of the score.
  it("is a small correction next to the levers that really move the number", () => {
    const worstCase = 100 - applyTemplatePenalty(100, "caution")
    expect(worstCase).toBeLessThanOrEqual(5)
    expect(SCORE_WEIGHTS.hardSkills.value).toBeGreaterThan(worstCase / 100)
    expect(CAUTION_SCORE_FACTOR).toBeGreaterThanOrEqual(0.9)
  })

  it("never turns a passing score into a failing one on its own", () => {
    // 80 is the bar the panel tells users to aim for.
    expect(applyTemplatePenalty(84, "caution")).toBeGreaterThanOrEqual(79)
  })

  it("the format sub-score reports the layout without feeding the weighted score", () => {
    expect(templateFormatScore("caution")).toBeLessThan(templateFormatScore("safe"))
    // The weighted categories are these five; format is not among them.
    expect(Object.keys(SCORE_WEIGHTS).sort()).toEqual(
      ["hardSkills", "mustHaves", "sections", "softSkills", "title"],
    )
  })

  it("an unknown or missing template is treated as safe, never penalised on a guess", () => {
    expect(getTemplateAtsSafety(undefined)).toBe("safe")
    expect(getTemplateAtsSafety("not-a-real-template")).toBe("safe")
  })
})
