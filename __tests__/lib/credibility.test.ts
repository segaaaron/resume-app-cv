import { describe, it, expect } from "vitest"
import { computeCredibility, credibilityVerdict } from "@/lib/ats/credibility"
import type { WritingChecks } from "@/lib/ats/writing-checks"

const clean: WritingChecks = {
  clicheBullets: [],
  weakVerbBullets: [],
  duplicateBullets: [],
  dateInconsistency: null,
  bulletBalance: [],
  mergeCandidates: [],
  chronology: null,
  futureDates: [],
  yearsClaim: null,
  nearDuplicates: [],
  orphanFragments: [],
  bulletRanking: [],
  incompleteEducation: [],
  metrics: { quantified: 0, bareDelta: 0, anchored: 0, total: 0, saturated: false },
  degreeInSkills: [],
  hasLink: true,
}
const with_ = (p: Partial<WritingChecks>): WritingChecks => ({ ...clean, ...p })

describe("the second number", () => {
  it("is 100 for a résumé with nothing to distrust", () => {
    expect(computeCredibility(clean)).toEqual({ score: 100, findings: [] })
  })

  it("costs the most for the things that end an application", () => {
    const backwards = computeCredibility(with_({ chronology: { kind: "reverse_order", firstShown: "A", mostRecent: "B" } }))
    const untidy = computeCredibility(with_({ dateInconsistency: { formats: ["MM/YYYY", "YYYY"] } }))
    expect(backwards.score).toBeLessThan(untidy.score)
  })

  /**
   * The ranking axis is what the reader CONCLUDES, not the arithmetic: a reason to
   * disbelieve outranks a reason to frown however the points land.
   */
  it("ranks a reason to disbelieve above a pile of small untidiness", () => {
    const r = computeCredibility(with_({
      yearsClaim: { claimed: 15, actual: 8 },
      bulletBalance: [
        { targetId: "a", jobTitle: "A", count: 9, kind: "too_many" },
        { targetId: "b", jobTitle: "B", count: 11, kind: "too_many" },
        { targetId: "c", jobTitle: "C", count: 12, kind: "too_many" },
        { targetId: "d", jobTitle: "D", count: 10, kind: "too_many" },
      ],
      dateInconsistency: { formats: ["MM/YYYY", "YYYY"] },
    }))
    expect(r.findings[0].key).toBe("years_contradiction")
    expect(r.findings[0].band).toBe("trust")
  })

  it("treats exact copies and rewrites as one problem to the reader", () => {
    const dup = { targetId: "j", jobTitle: "Enfermera", index: 1, text: "x".repeat(40), duplicateOfJobTitle: "Enfermera" }
    const near = { targetId: "j", jobTitle: "Enfermera", index: 2, text: "y".repeat(40), otherIndex: 0, otherText: "z".repeat(40) }
    const r = computeCredibility(with_({ duplicateBullets: [dup], nearDuplicates: [near] }))
    expect(r.findings.filter((f) => f.key === "duplicates")).toHaveLength(1)
    expect(r.findings[0].count).toBe(2)
  })

  it("caps repetition so one long CV cannot drive the number to the floor alone", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      targetId: "j", jobTitle: "Contadora", index: i, text: "x".repeat(40), duplicateOfJobTitle: "Contadora",
    }))
    const r = computeCredibility(with_({ duplicateBullets: many }))
    expect(r.findings[0].cost).toBeLessThanOrEqual(24)
  })

  // A résumé with every defect still describes real work. Zero would say something
  // we do not mean.
  it("never falls below the floor", () => {
    const r = computeCredibility(with_({
      chronology: { kind: "reverse_order", firstShown: "A", mostRecent: "B" },
      futureDates: [{ targetId: "a", jobTitle: "A", value: "2030" }],
      yearsClaim: { claimed: 20, actual: 3 },
      duplicateBullets: Array.from({ length: 10 }, (_, i) => ({ targetId: "j", jobTitle: "x", index: i, text: "x".repeat(40), duplicateOfJobTitle: "x" })),
      clicheBullets: Array.from({ length: 10 }, (_, i) => ({ targetId: "j", jobTitle: "x", index: i, text: "x".repeat(40), cliches: ["team player"] })),
      bulletBalance: [{ targetId: "a", jobTitle: "A", count: 12, kind: "too_many" }],
      dateInconsistency: { formats: ["MM/YYYY", "YYYY"] },
    }))
    expect(r.score).toBe(20)
  })
})

describe("credibilityVerdict — the sentence the panel exists to say", () => {
  it("names the gap when keywords are ahead of trust", () => {
    expect(credibilityVerdict(76, 58)).toEqual({ kind: "keywords_ahead", gap: 18 })
  })

  it("names the reverse case too", () => {
    expect(credibilityVerdict(40, 95).kind).toBe("credibility_ahead")
  })

  // Contrasting two numbers that agree is noise, not a finding.
  it("stays quiet when the two agree", () => {
    expect(credibilityVerdict(80, 78).kind).toBe("aligned")
    expect(credibilityVerdict(60, 65).kind).toBe("aligned")
  })
})
