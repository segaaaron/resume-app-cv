import { describe, it, expect } from "vitest"
import {
  groundedLineIndex,
  isInPlaceCorrection,
  rejectOverlapping,
} from "@/lib/services/ai/shared/proofread-guards"

// Every string below was returned by the model in production and shown to a user.

describe("isInPlaceCorrection — a proofreader fixes one word", () => {
  it("rejects a rewrite that keeps the word count", () => {
    // The one that got through: three words in, three words out, so the old
    // word-count check passed it — while it deleted "in" and invented
    // "completion", text the candidate never wrote.
    expect(isInPlaceCorrection("increased in sprint", "increased sprint completion")).toBe(false)
  })

  it("accepts the single-word slips that are the whole point", () => {
    expect(isInPlaceCorrection("more then", "more than")).toBe(true)
    expect(isInPlaceCorrection("an increased in", "an increase in")).toBe(true)
    expect(isInPlaceCorrection("resulting in in", "resulting in a")).toBe(true)
    expect(isInPlaceCorrection("and optimized user", "and optimizing user")).toBe(true)
    expect(isInPlaceCorrection("APIs and architecture", "APIs and architectural")).toBe(true)
  })

  it("still allows respacing the same letters", () => {
    expect(isInPlaceCorrection("Swift UI", "SwiftUI")).toBe(true)
    expect(isInPlaceCorrection("alot", "a lot")).toBe(true)
  })

  it("rejects added or deleted text", () => {
    expect(isInPlaceCorrection("with", "with CocoaPods.")).toBe(false)
    expect(isInPlaceCorrection("lunch box", "launch")).toBe(false)
  })

  it("rejects a rewrite of every word", () => {
    expect(isInPlaceCorrection("with different teams", "with a team")).toBe(false)
  })
})

describe("groundedLineIndex — the model has to point, not guess", () => {
  const units = ["Built APIs and architecture", "Delivered more then 7 releases", "Led more then one team"]

  it("accepts a correction that is on the line it named", () => {
    expect(groundedLineIndex("more then", units, 2)).toBe(1)
  })

  it("rejects one that is not on the line it named, even if it exists elsewhere", () => {
    // The point of asking for a line: a model that misread the text should not
    // land a lucky match somewhere else in the CV. If it cannot say where the
    // error is, it was not reading the text it claims to have read.
    expect(groundedLineIndex("more then", units, 1)).toBe(-1)
  })

  it("rejects a line number outside the text", () => {
    expect(groundedLineIndex("more then", units, 9)).toBe(-1)
    expect(groundedLineIndex("more then", units, 0)).toBe(-1)
  })

  it("falls back to a search when no line is given", () => {
    expect(groundedLineIndex("more then", units)).toBe(1)
    expect(groundedLineIndex("never written", units)).toBe(-1)
  })
})

describe("rejectOverlapping — one error, not two descriptions of it", () => {
  const units = ["Delivered an increased in sprint completion across squads"]

  it("keeps the first claim and drops the one sharing its words", () => {
    // Both were returned for the same six characters. Applying either rewrites
    // the text the other points at, so the second Fix could only ever report
    // "that word is no longer in your CV".
    const kept = rejectOverlapping(
      [{ wrong: "an increased in" }, { wrong: "increased in sprint" }],
      units,
    )
    expect(kept.map((c) => c.wrong)).toEqual(["an increased in"])
  })

  it("keeps findings that sit in different places", () => {
    const kept = rejectOverlapping(
      [{ wrong: "an increased in" }, { wrong: "across squads" }],
      units,
    )
    expect(kept).toHaveLength(2)
  })

  it("drops a finding that is in no unit at all", () => {
    expect(rejectOverlapping([{ wrong: "never written here" }], units)).toHaveLength(0)
  })

  it("collapses the same slip repeated across bullets into one row", () => {
    // Deliberate, and it matches what Fix does: applySpellingFix replaces the
    // word in every prose field of the CV, so two rows for one misspelling would
    // be two buttons doing the same edit, the second reporting nothing to do.
    const two = ["more then five years", "more then five years"]
    const kept = rejectOverlapping([{ wrong: "more then" }, { wrong: "more then" }], two)
    expect(kept).toHaveLength(1)
  })

  it("claims spans per unit, so a finding is not blocked by another bullet", () => {
    const units = ["more then five years", "resulting in in delays"]
    const kept = rejectOverlapping([{ wrong: "more then" }, { wrong: "resulting in in" }], units)
    expect(kept.map((c) => c.wrong)).toEqual(["more then", "resulting in in"])
  })
})
