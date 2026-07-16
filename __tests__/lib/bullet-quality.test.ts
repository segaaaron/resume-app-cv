import { describe, it, expect } from "vitest"
import { assessDescription } from "@/lib/services/ai/shared/bullet-quality"

describe("assessDescription", () => {
  it("returns an empty assessment for an empty description", () => {
    const r = assessDescription("")
    expect(r.bullets).toEqual([])
    expect(r.quantificationRatio).toBe(0)   // not NaN
    expect(r.missingMetricIndices).toEqual([])
  })

  it("indexes bullets by their real position", () => {
    const r = assessDescription("• Alpha\n• Beta\n• Gamma")
    expect(r.bullets.map((b) => b.index)).toEqual([0, 1, 2])
  })

  it("finds the figures a bullet states", () => {
    const r = assessDescription([
      "• Cut crash rate 20% by refactoring the sync layer",
      "• Rebuilt the billing service on a modular architecture",
      "• Mentored 5 engineers through the migration",
    ].join("\n"))
    expect(r.bullets.map((b) => b.hasMetric)).toEqual([true, false, true])
    expect(r.quantificationRatio).toBeCloseTo(2 / 3)
    expect(r.missingMetricIndices).toEqual([1])
  })

  it("reports a fully quantified description", () => {
    const r = assessDescription("• Cut costs 30%\n• Grew revenue 2x")
    expect(r.quantificationRatio).toBe(1)
    expect(r.missingMetricIndices).toEqual([])
  })

  it("reports a description with no figures at all", () => {
    const r = assessDescription("• Built the app\n• Fixed the bugs")
    expect(r.quantificationRatio).toBe(0)
    expect(r.missingMetricIndices).toEqual([0, 1])
  })

  it("does not count a bracket placeholder as a figure", () => {
    // These were banned everywhere; if one survives from an old CV it must not
    // certify the bullet as quantified.
    const r = assessDescription("• Improved engagement among [N users]")
    expect(r.bullets[0].hasMetric).toBe(false)
  })

  it("spots duty openers in both languages", () => {
    const r = assessDescription([
      "• Responsible for the payment module",
      "• Cut crash rate 20% by refactoring",
      "• Encargado de las pruebas del equipo",
    ].join("\n"))
    expect(r.weakOpenerIndices).toEqual([0, 2])
  })

  it("does not flag a duty word that appears mid-sentence", () => {
    const r = assessDescription("• Owned the release process and helped with onboarding")
    expect(r.weakOpenerIndices).toEqual([])
  })

  it("reads bullets whatever marker they carry", () => {
    const r = assessDescription("- Cut costs 30%\n* Grew revenue 2x\nShipped 3 releases")
    expect(r.bullets).toHaveLength(3)
    expect(r.quantificationRatio).toBe(1)
  })

  it("counts a metric the hallucination check ignores", () => {
    // "5 engineers" is a real figure but is NOT in METRIC_REGEX, which stays
    // narrow on purpose. This is what ANY_METRIC_REGEX exists for.
    expect(assessDescription("• Mentored 5 engineers").bullets[0].hasMetric).toBe(true)
    expect(assessDescription("• Shipped 3 releases").bullets[0].hasMetric).toBe(true)
    expect(assessDescription("• Worked across 4 countries").bullets[0].hasMetric).toBe(true)
  })
})
