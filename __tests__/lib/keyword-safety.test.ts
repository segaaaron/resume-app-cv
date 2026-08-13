import { describe, it, expect } from "vitest"
import { postingTermsLost, isKeywordSafe } from "@/lib/ats/keyword-safety"

describe("a rewrite must never cost you the match", () => {
  // Reported with the number on screen: applying suggested rewrites moved the
  // score 80 → 79. Each one was a better sentence; one of them dropped a word the
  // posting searches for, and nothing in the product was asking that question.
  it("names the term a better-sounding rewrite would drop", () => {
    const terms = ["Core Data", "SwiftUI", "authentication"]
    const current = "Implemented Core Data for local storage and offline capabilities"
    const smoother = "Improved local storage and offline capabilities for a smoother experience"
    expect(postingTermsLost(current, smoother, terms)).toEqual(["Core Data"])
    expect(isKeywordSafe(current, smoother, terms)).toBe(false)
  })

  it("welcomes a rewrite that adds and keeps", () => {
    const terms = ["triage", "electronic health records"]
    const current = "Coordinated triage for up to 30 patients per shift"
    const better = "Coordinated triage for up to 30 patients per shift, logging each case in electronic health records"
    expect(isKeywordSafe(current, better, terms)).toBe(true)
  })

  it("says nothing when there is nothing to compare", () => {
    expect(postingTermsLost("", "anything", ["swift"])).toEqual([])
    expect(postingTermsLost("current", "next", [])).toEqual([])
  })

  it("does not confuse a word inside another word", () => {
    // "Java" must not be found inside "JavaScript" — losing that distinction would
    // block honest rewrites and let dishonest ones through.
    expect(postingTermsLost("Built services in Java", "Built services in JavaScript", ["Java"])).toEqual(["Java"])
  })
})
