import { describe, it, expect } from "vitest"
import { parseCvDate, findEmploymentGaps, GAP_THRESHOLD_MONTHS } from "@/lib/services/ai/shared/employment-gaps"

// Fixed clock: the trailing-gap check compares against "now", and a test that
// drifts with the calendar is worse than no test.
const NOW = new Date("2024-06-15T00:00:00Z")

describe("parseCvDate", () => {
  it("reads the editor's YYYY-MM", () => {
    expect(parseCvDate("2021-03")).toEqual({ index: 2021 * 12 + 2, yearOnly: false })
  })

  it("reads the PDF parser's bare year", () => {
    expect(parseCvDate("2021")).toEqual({ index: 2021 * 12, yearOnly: true })
  })

  it("reads fill-profile's MM/YYYY", () => {
    expect(parseCvDate("03/2021")).toEqual({ index: 2021 * 12 + 2, yearOnly: false })
  })

  it("returns null for anything it cannot read", () => {
    expect(parseCvDate("")).toBeNull()
    expect(parseCvDate(undefined)).toBeNull()
    expect(parseCvDate("Present")).toBeNull()
    expect(parseCvDate("marzo 2021")).toBeNull()
    expect(parseCvDate("2021-13")).toBeNull()   // month out of range
    expect(parseCvDate("13/2021")).toBeNull()
  })
})

describe("findEmploymentGaps", () => {
  it("finds a gap longer than six months", () => {
    const gaps = findEmploymentGaps([
      { employer: "Alpha", startDate: "2018-01", endDate: "2020-01" },
      { employer: "Beta", startDate: "2021-01", endDate: "2024-01" },
    ], NOW)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({ months: 11, afterEmployer: "Alpha", beforeEmployer: "Beta" })
  })

  it("ignores a gap at the threshold's edge", () => {
    // Jan 2020 end, Aug 2020 start = 6 whole months out of work (Feb-Jul).
    const six = findEmploymentGaps([
      { employer: "A", startDate: "2018-01", endDate: "2020-01" },
      { employer: "B", startDate: "2020-08", endDate: "2024-01" },
    ], NOW)
    expect(six[0].months).toBe(GAP_THRESHOLD_MONTHS)

    // One month less is below the threshold and must stay quiet.
    const five = findEmploymentGaps([
      { employer: "A", startDate: "2018-01", endDate: "2020-01" },
      { employer: "B", startDate: "2020-07", endDate: "2024-01" },
    ], NOW)
    expect(five).toEqual([])
  })

  it("says nothing about back-to-back jobs", () => {
    expect(findEmploymentGaps([
      { employer: "A", startDate: "2018-01", endDate: "2020-01" },
      { employer: "B", startDate: "2020-02", endDate: "2024-01" },
    ], NOW)).toEqual([])
  })

  it("says nothing about overlapping jobs", () => {
    expect(findEmploymentGaps([
      { employer: "A", startDate: "2018-01", endDate: "2022-01" },
      { employer: "B", startDate: "2020-01", endDate: "2024-01" },
    ], NOW)).toEqual([])
  })

  it("does not report a gap hidden inside a longer overlapping job", () => {
    // The long job covers the whole span; the short one sits inside it.
    expect(findEmploymentGaps([
      { employer: "Long", startDate: "2018-01", endDate: "2024-01" },
      { employer: "Short", startDate: "2019-01", endDate: "2019-06" },
    ], NOW)).toEqual([])
  })

  it("finds a trailing gap up to today", () => {
    const gaps = findEmploymentGaps([
      { employer: "Alpha", startDate: "2018-01", endDate: "2023-01" },
    ], NOW)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({ afterEmployer: "Alpha", beforeEmployer: "" })
    expect(gaps[0].months).toBe(16)   // Feb 2023 → May 2024
  })

  it("reports no trailing gap while the candidate is still employed", () => {
    expect(findEmploymentGaps([
      { employer: "Alpha", startDate: "2018-01", endDate: "", currentlyWorking: true },
    ], NOW)).toEqual([])
  })

  it("handles jobs listed out of order", () => {
    const gaps = findEmploymentGaps([
      { employer: "Beta", startDate: "2021-01", endDate: "2024-01" },
      { employer: "Alpha", startDate: "2018-01", endDate: "2020-01" },
    ], NOW)
    expect(gaps).toHaveLength(1)
    expect(gaps[0].afterEmployer).toBe("Alpha")
  })

  // Year-only dates are ambiguous by up to eleven months. Reading them the way
  // that makes the gap smallest means we only ever report a gap we can prove.
  it("reads year-only dates the way that makes the gap smallest", () => {
    // "2020" → "2021" could be a 12-month gap or none at all. Assume Dec 2020
    // to Jan 2021: no gap.
    expect(findEmploymentGaps([
      { employer: "A", startDate: "2018", endDate: "2020" },
      { employer: "B", startDate: "2021", endDate: "2024" },
    ], NOW)).toEqual([])
  })

  it("still reports a year-only gap too big to explain away", () => {
    const gaps = findEmploymentGaps([
      { employer: "A", startDate: "2015", endDate: "2018" },
      { employer: "B", startDate: "2021", endDate: "2024-01" },
    ], NOW)
    expect(gaps).toHaveLength(1)
    expect(gaps[0].months).toBe(24)   // Jan 2019 → Dec 2020
  })

  it("skips a job whose dates it cannot read rather than guessing", () => {
    expect(findEmploymentGaps([
      { employer: "A", startDate: "", endDate: "" },
      { employer: "B", startDate: "hace unos años", endDate: "Present" },
    ], NOW)).toEqual([])
  })

  it("returns nothing for an empty CV", () => {
    expect(findEmploymentGaps([], NOW)).toEqual([])
  })

  it("finds several gaps", () => {
    const gaps = findEmploymentGaps([
      { employer: "A", startDate: "2014-01", endDate: "2016-01" },
      { employer: "B", startDate: "2017-06", endDate: "2019-01" },
      { employer: "C", startDate: "2021-01", endDate: "2024-01" },
    ], NOW)
    expect(gaps).toHaveLength(2)
    expect(gaps.map((g) => g.months)).toEqual([16, 23])
  })
})
