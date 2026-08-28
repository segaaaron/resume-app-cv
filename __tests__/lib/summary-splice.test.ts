import { describe, it, expect } from "vitest"
import { spliceSummary } from "@/lib/ats/panel-actions"

const REAL = "iOS Developer with more than 7 years of experience building sophisticated user interfaces across UIKit and SwiftUI. Led the integration of RESTful APIs and architecture work with MVVM, VIPER, and TCA to deliver scalable iOS solutions. Improved software quality through unit and UI testing, helping reduce production bugs by 15% and supporting cleaner, more maintainable releases."

describe("spliceSummary", () => {
  it("keeps the rest of the paragraph when the fix rewrites one sentence", () => {
    // The reported regression: applying this replaced 56 words with 24 and took
    // "7 years", "UIKit", "SwiftUI" and a 15% figure with it.
    const fix = "Integrated RESTful APIs and architecture work with MVVM, VIPER, and TCA to deliver scalable iOS solutions that improved maintainability and supported faster feature delivery."
    const out = spliceSummary(REAL, fix)!
    for (const kept of ["7 years", "UIKit", "SwiftUI", "15%", "unit and UI testing"]) {
      expect(out).toContain(kept)
    }
    expect(out).toContain("improved maintainability")
    expect(out).not.toContain("Led the integration of RESTful APIs")
  })

  it("replaces the whole field when the rewrite is a whole summary", () => {
    const full = "Registered nurse with 9 years in emergency care, triaging up to 30 patients per shift and training 6 new hires on the handover protocol, with a 15% drop in medication errors across two wards this year."
    expect(spliceSummary("Nurse with experience in emergency care and patient handling in a busy ward.", full)).toBe(full)
  })

  it("refuses a fragment it cannot place, instead of overwriting", () => {
    // Nothing in common with any sentence: placing it would be a guess, and
    // replacing the paragraph is exactly how the content was lost.
    expect(spliceSummary(REAL, "Certified welder with TIG and MIG experience.")).toBeNull()
  })

  it("works on a one-sentence summary and on an empty one", () => {
    expect(spliceSummary("", "Anything")).toBe("Anything")
    expect(spliceSummary("Short summary about retail work.", "A better summary about retail work.")).toBe(
      "A better summary about retail work.",
    )
  })
})
