import { describe, it, expect } from "vitest"
import { assessSummary } from "@/lib/services/ai/shared/summary-quality"

/**
 * The rule the ATS panel now applies before drawing "Rewrite the summary".
 *
 * The analyst has no memory: each run reads the CV fresh, and a model asked to
 * improve prose always finds another variant — so it kept asking the user to
 * rewrite the summary they had just rewritten, every single run. These are the
 * signals that decide when there is genuinely nothing left to repair.
 */
describe("assessSummary — when a summary rewrite is still worth offering", () => {
  const REWRITTEN =
    "iOS Developer with 7+ years of experience shipping user-facing iOS apps in Swift, SwiftUI, and UIKit. Led architecture work, unit and UI testing, REST API integration, and production debugging to improve reliability by 15%."

  it("stops asking once the summary has been fixed", () => {
    // The exact shape a user ends up with after applying our own rewrite: strong
    // opener, a real figure, no clichés, no pronouns. Offering the button again
    // is what made the report feel like it never finished.
    expect(assessSummary(REWRITTEN, true).alreadyGood).toBe(true)
  })

  it("still offers it on a summary that opens weakly", () => {
    const weak = "I am a passionate developer looking for new opportunities where I can grow and contribute to a great team every day."
    const q = assessSummary(weak, true)
    expect(q.alreadyGood).toBe(false)
    expect(q.issues).toContain("pronouns")
  })

  it("accepts a product name that is lowercase by design as a strong opener", () => {
    // iOS, iPadOS, macOS, eBay: the leading letter is lowercase ON PURPOSE, and a
    // first-letter test marked every "iOS Developer…" summary weak forever — the
    // only "fix" would be misspelling the platform.
    for (const opener of ["iOS Developer", "macOS engineer", "eBay seller", "iPadOS specialist"]) {
      const text = `${opener} with 7 years of experience shipping user-facing apps in Swift, SwiftUI and UIKit, focused on architecture, testing and production debugging.`
      expect(assessSummary(text, false).issues).not.toContain("weak_opener")
    }
  })

  it("still calls a genuinely weak opener weak", () => {
    const text = "responsible for various tasks across the mobile team, working on different projects and helping wherever needed throughout the year."
    expect(assessSummary(text, false).issues).toContain("weak_opener")
  })

  it("still offers it on a summary too short to be read", () => {
    expect(assessSummary("iOS Developer.", false).alreadyGood).toBe(false)
  })

  it("does not demand a figure the CV never provided", () => {
    // The rule that stops us pushing the model into inventing numbers: a summary
    // with no metric is fine when the CV itself states none.
    const noNumbers =
      "iOS Developer with seven years of experience shipping user-facing apps in Swift, SwiftUI and UIKit, focused on architecture, testing and production debugging."
    expect(assessSummary(noNumbers, false).issues).not.toContain("missing_metric")
    expect(assessSummary(noNumbers, true).issues).toContain("missing_metric")
  })
})
