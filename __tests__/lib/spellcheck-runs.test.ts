import { describe, it, expect } from "vitest"
import {
  shouldAutoRun,
  stillPresent,
  mergeFindings,
  dedupeFindings,
  type Finding,
  type AutoRunState,
  verdictFor,
} from "@/lib/ats/spellcheck-runs"

const f = (typed: string, correct = "x"): Finding => ({ typed, suggestions: [correct] })

const state = (over: Partial<AutoRunState> = {}): AutoRunState => ({
  pending: 0,
  joined: "text b",
  lastChecked: "text a",
  now: 1_000_000,
  lastRunAt: 0,
  minIntervalMs: 90_000,
  ...over,
})

describe("shouldAutoRun — the list belongs to the user while rows are left", () => {
  it("refuses to run while the user still has findings on screen", () => {
    // The bug: fixing four of eight rewrote the CV four times, each rewrite
    // rescheduled the automatic pass, and it landed mid-session and replaced the
    // list — pagination reset, rows renumbered.
    expect(shouldAutoRun("auto", state({ pending: 4 }))).toBe(false)
  })

  it("runs once the list is empty", () => {
    expect(shouldAutoRun("auto", state({ pending: 0 }))).toBe(true)
  })

  it("skips an unchanged CV", () => {
    expect(shouldAutoRun("auto", state({ joined: "same", lastChecked: "same" }))).toBe(false)
  })

  it("holds the floor between two automatic runs", () => {
    expect(shouldAutoRun("auto", state({ now: 50_000, lastRunAt: 0 }))).toBe(false)
    expect(shouldAutoRun("auto", state({ now: 90_000, lastRunAt: 0 }))).toBe(true)
  })

  it("never throttles a manual press — the user asking means now", () => {
    const blocked = state({ pending: 7, joined: "same", lastChecked: "same", now: 0, lastRunAt: 0 })
    expect(shouldAutoRun("manual", blocked)).toBe(true)
  })

  it("never throttles the verify run — it is what earns the clean verdict", () => {
    const blocked = state({ joined: "same", lastChecked: "same", now: 0, lastRunAt: 0 })
    expect(shouldAutoRun("verify", blocked)).toBe(true)
  })
})

describe("stillPresent — skipping the grammar pass is not discarding it", () => {
  const grammar = [f("more then", "more than"), f("increase in", "increased in")]

  it("keeps a grammar finding whose words are still in the CV", () => {
    // The false "no known mistakes": an automatic run does not pay for the model,
    // so its findings used to vanish from the list even though the CV still had
    // them, leaving a shorter list that read as finished.
    const kept = stillPresent(grammar, "More then 7 years and an increase in revenue")
    expect(kept.map((i) => i.typed)).toEqual(["more then", "increase in"])
  })

  it("drops one the user actually corrected", () => {
    const kept = stillPresent(grammar, "More than 7 years and an increase in revenue")
    expect(kept.map((i) => i.typed)).toEqual(["increase in"])
  })

  it("matches a phrase across the newlines used to join the CV", () => {
    expect(stillPresent([f("y optimizando")], "Diseñando y\noptimizando pipelines")).toHaveLength(1)
  })
})

describe("verdictFor — an empty list is not a clean CV", () => {
  it("never calls a CV clean on the strength of the dictionary alone", () => {
    // The four ways the grammar pass does not happen — PRO gate (403), spent
    // quota (429), failed call, and an automatic run declining to pay for a model
    // call — all arrive here as grammarKnown=false. Every one of them used to
    // print "No known mistakes" over prose that still read "more then 7 years".
    expect(verdictFor([], false)).toBe("spelling-only")
  })

  it("calls it clean when a grammar pass stands behind the result", () => {
    expect(verdictFor([], true)).toBe("clean")
  })

  it("reports the findings when there are any, checked or not", () => {
    expect(verdictFor([f("desarollo")], false)).toBe("issues")
    expect(verdictFor([f("desarollo")], true)).toBe("issues")
  })
})

describe("mergeFindings / dedupeFindings", () => {
  it("lets the dictionary win a tie — it is exact where the model judges", () => {
    const merged = mergeFindings([f("analisis", "análisis")], [f("Analisis", "analices")])
    expect(merged).toHaveLength(1)
    expect(merged[0].suggestions[0]).toBe("análisis")
  })

  it("keeps grammar findings the dictionary cannot see", () => {
    const merged = mergeFindings([f("desarollo")], [f("more then")])
    expect(merged.map((i) => i.typed)).toEqual(["desarollo", "more then"])
  })

  it("collapses the same word reported twice", () => {
    expect(dedupeFindings([f("managment"), f("Managment")])).toHaveLength(1)
  })
})
