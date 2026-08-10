import { describe, it, expect } from "vitest"
import { actionableBulletIndices, isDescriptionOptimized, assessImprovability } from "@/lib/services/ai/shared/bullet-quality"

/**
 * The improvement loop is a STOPPING problem, not a UI one.
 *
 * Asked to improve text, a model always returns another variant — "leave it
 * alone" is the answer it will not volunteer. So the decision to stop is made
 * here, in code, before the call. Industry write-ups of this exact failure land
 * on the same rule: score first, then decide programmatically.
 */
describe("when there is nothing left to improve", () => {
  const STRONG = [
    "• Led the migration to SwiftUI across 4 apps, cutting crash rate 30%.",
    "• Reduced build times from 12 to 4 minutes by parallelising CI jobs.",
  ].join("\n")

  it("refuses to re-improve bullets that have no fixable defect", () => {
    expect(actionableBulletIndices(STRONG)).toEqual([])
    expect(isDescriptionOptimized(STRONG)).toBe(true)
  })

  it("still flags a weak opener", () => {
    const weak = "• Responsible for the payments module and its releases."
    expect(actionableBulletIndices(weak).length).toBe(1)
    expect(isDescriptionOptimized(weak)).toBe(false)
  })

  it("still flags a cliché", () => {
    const cliche = "• Team player with a results-driven mindset who thinks outside the box."
    expect(isDescriptionOptimized(cliche)).toBe(false)
  })

  it("still flags a bullet too thin to say anything", () => {
    expect(isDescriptionOptimized("• Fixed bugs")).toBe(false)
  })

  it("still flags a paragraph pretending to be a bullet", () => {
    const wall = "• " + "delivered features and coordinated with stakeholders ".repeat(9)
    expect(isDescriptionOptimized(wall)).toBe(false)
  })

  it("does NOT treat a missing figure as fixable", () => {
    // We refuse to invent numbers, so "no metric" is not something a rewrite can
    // repair — counting it kept the button alive forever on good bullets.
    const noMetric = "• Migrated the authentication layer to OAuth 2.0 with the platform team."
    expect(actionableBulletIndices(noMetric)).toEqual([])
  })

  it("says nothing to improve about an empty description", () => {
    // No bullets is not "optimized" — there is simply nothing there.
    expect(isDescriptionOptimized("")).toBe(false)
  })

  it("is field-agnostic: a strong nursing bullet is left alone too", () => {
    const nursing = "• Coordiné el triaje de 40 pacientes por turno, reduciendo el tiempo de espera 25%."
    expect(actionableBulletIndices(nursing)).toEqual([])
  })

  it("tells apart 'already good' from 'only you can finish this'", () => {
    // Measured across fields: 8 of 12 genuinely weak bullets carry NO formal
    // defect — they are well written and simply never say what they achieved.
    // Answering "already optimized" there is false; rewriting means inventing
    // the result. The third state is the honest one.
    expect(assessImprovability("• Handled customer inquiries and processed refunds daily")).toBe("needs_input")
    expect(assessImprovability("• Enseñé matemáticas a estudiantes de secundaria durante el año escolar")).toBe("needs_input")
    expect(assessImprovability("• Redacté contratos y revisé documentación legal de la empresa")).toBe("needs_input")
  })

  it("calls a bullet optimized only when it states an outcome", () => {
    expect(assessImprovability("• Led the SwiftUI migration across 4 apps, cutting crash rate 30%.")).toBe("optimized")
    expect(assessImprovability("• Reduje el tiempo de espera en emergencias 25% reorganizando el triaje")).toBe("optimized")
  })

  it("still routes a formal defect to the AI", () => {
    expect(assessImprovability("• Responsible for the payments module.")).toBe("improvable")
    expect(assessImprovability("• Team player with a results-driven mindset.")).toBe("improvable")
  })

  it("an empty description asks for input rather than claiming perfection", () => {
    expect(assessImprovability("")).toBe("needs_input")
  })
})
