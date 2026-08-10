import { describe, it, expect } from "vitest"
import { atsDate, atsPeriod } from "@/components/resume/templates/ats/dates"

/**
 * The ATS-safe templates must hand a parser one date shape: MM/YYYY. Workday,
 * Taleo, iCIMS and Lever derive tenure from these strings, so "May 2022" next to
 * "2015" is two formats to reconcile.
 *
 * The hard line: a bare year stays a bare year. Printing "01/2015" over "2015"
 * would invent a month, and inventing tenure on someone's CV is worse than a
 * mixed format.
 */
describe("ATS template dates", () => {
  it("normalizes every readable shape to MM/YYYY", () => {
    expect(atsDate("May 2022")).toBe("05/2022")
    expect(atsDate("mayo 2022")).toBe("05/2022")
    expect(atsDate("2022-05")).toBe("05/2022")
    expect(atsDate("5/2022")).toBe("05/2022")
  })

  it("NEVER invents a month for a bare year", () => {
    expect(atsDate("2015")).toBe("2015")
    expect(atsDate("2026")).toBe("2026")
  })

  it("leaves anything it cannot read exactly as typed", () => {
    expect(atsDate("verano 2019")).toBe("verano 2019")
    expect(atsDate("")).toBe("")
  })

  it("builds a consistent range", () => {
    expect(atsPeriod("May 2022", "enero 2024", false, "Present")).toBe("05/2022 — 01/2024")
    expect(atsPeriod("2015", "2016", false, "Present")).toBe("2015 — 2016")
  })

  it("uses the caller's wording for an ongoing role", () => {
    expect(atsPeriod("March 2023", "", true, "Present")).toBe("03/2023 — Present")
    expect(atsPeriod("marzo 2023", "", true, "Presente")).toBe("03/2023 — Presente")
  })

  it("mixed input comes out consistent — the whole point", () => {
    // A CV that wrote one role as "2015" and the next as "May 2022" rendered
    // both shapes side by side; now every readable field lands on MM/YYYY.
    expect(atsPeriod("May 2022", "2024-01", false, "Present")).toBe("05/2022 — 01/2024")
  })

  it("handles a missing end date without a dangling separator", () => {
    expect(atsPeriod("May 2022", "", false, "Present")).toBe("05/2022")
    expect(atsPeriod("", "", false, "Present")).toBe("")
  })

  it("respects a custom separator", () => {
    expect(atsPeriod("May 2022", "June 2023", false, "Present", "–")).toBe("05/2022 – 06/2023")
  })
})
