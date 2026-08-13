import { describe, it, expect } from "vitest"
import { normalizeTerm, termPresent } from "@/lib/ats/vocabulary"

// The rule the panel applies to a tailored rewrite before offering it. Extracted
// here as the same expression, so the behaviour that stops the loop is pinned by
// a test rather than by a comment.
function addsPostingTerm(rewrite: string, current: string, postingTerms: string[]): boolean {
  if (postingTerms.length === 0) return true
  const cur = normalizeTerm(current)
  const next = normalizeTerm(rewrite)
  return postingTerms.some((kw) => termPresent(kw, next) && !termPresent(kw, cur))
}

describe("a tailored rewrite is offered only while it still adds something", () => {
  const posting = ["SwiftUI", "unit testing", "Combine"]

  it("offers it when the posting asks for a word the line does not say", () => {
    expect(addsPostingTerm(
      "Built onboarding screens in SwiftUI used by 45k people",
      "Built onboarding screens used by 45k people",
      posting,
    )).toBe(true)
  })

  it("stops offering it once the word is in the line — this is what ends the loop", () => {
    // Tailor re-runs on every analysis and always produces another phrasing. A
    // variant that adds nothing kept coming back forever, labelled "for this
    // posting", on a line the user had already accepted.
    const current = "Built onboarding screens in SwiftUI used by 45k people"
    const variant = "Developed onboarding screens with SwiftUI, reaching 45k people"
    expect(addsPostingTerm(variant, current, posting)).toBe(false)
  })

  it("works the same outside tech", () => {
    const jd = ["triage", "electronic health records"]
    expect(addsPostingTerm("Handled triage for up to 30 patients per shift", "Handled up to 30 patients per shift", jd)).toBe(true)
    expect(addsPostingTerm("Managed triage for 30 patients each shift", "Handled triage for up to 30 patients per shift", jd)).toBe(false)
  })
})
