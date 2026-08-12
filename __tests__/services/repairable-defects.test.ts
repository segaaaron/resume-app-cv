import { describe, it, expect } from "vitest"
import { defectStillPresent, repairableDefects } from "@/lib/services/ai/shared/repairable-defects"

/**
 * The contract this file exists to hold: the panel may only draw "Rewrite this
 * bullet" for defects the endpoint agrees are repairable. They used to answer
 * separately — the panel counted a missing figure, the endpoint refused to invent
 * one — so the button was guaranteed to come back "already well written".
 */
describe("repairableDefects — what a rewrite can actually fix", () => {
  const WEAK = "Responsible for maintaining the iOS application and fixing bugs"
  const STRONG_NO_NUMBER =
    "Coordinated with cross-functional teams in an Agile environment to deliver iOS features on schedule"
  const STRONG_WITH_NUMBER =
    "Reduced crash rate by 30% by refactoring the networking layer across 4 modules"

  it("offers the rewrite when the opener is a duty phrase", () => {
    expect(repairableDefects(WEAK)).toContain("weak_verb")
  })

  it("offers NOTHING when the only shortcoming is a missing figure", () => {
    // The exact case from production: a well-formed bullet the panel flagged and
    // the endpoint then declared fine. Only the candidate knows the number, so a
    // rewrite cannot supply it and the button must not be drawn.
    expect(repairableDefects(STRONG_NO_NUMBER)).toEqual([])
  })

  it("offers nothing on a bullet that is already strong", () => {
    expect(repairableDefects(STRONG_WITH_NUMBER)).toEqual([])
  })

  it("never treats a missing metric as repairable, whoever asks", () => {
    expect(defectStillPresent("metric", STRONG_NO_NUMBER)).toBe(false)
    expect(defectStillPresent("metric", WEAK)).toBe(false)
  })

  it("treats an unknown focus as no evidence at all", () => {
    expect(defectStillPresent("something_invented", WEAK)).toBe(false)
  })

  it("agrees with itself: everything it offers, it also confirms", () => {
    // The property that keeps the two callers in step — whatever the panel is
    // allowed to send as focus must survive the endpoint's verification.
    for (const text of [WEAK, STRONG_NO_NUMBER, STRONG_WITH_NUMBER]) {
      for (const d of repairableDefects(text)) {
        expect(defectStillPresent(d, text)).toBe(true)
      }
    }
  })
})
