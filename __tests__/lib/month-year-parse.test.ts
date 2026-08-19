import { describe, it, expect } from "vitest"
import { parse, isRecognised, display } from "@/components/editor/MonthYearField"

/**
 * The date field's reader, tested against the shapes that are ACTUALLY in the
 * database — checked on 2026-08-19 against real résumés, which carry three:
 *
 *   "05/2010"  the canonical shape (`lib/ats/normalize-dates.ts` says so)
 *   "2010-09"  what the old pickers wrote, so most stored dates look like this
 *   "2015"     a bare year, typed by hand, and perfectly legitimate on a CV
 *
 * A reader that only knows the first would blank the second and flag the third
 * red, which is the whole reason this file exists.
 *
 * The three readers are exported from the component precisely so this can test
 * them as functions instead of through a rendered field.
 */
describe("MonthYearField — reading what is already stored", () => {
  it("reads the canonical MM/YYYY", () => {
    expect(parse("05/2010")).toEqual({ mm: "05", yyyy: 2010 })
    expect(display("05/2010")).toBe("05/2010")
  })

  it("reads the YYYY-MM the old pickers wrote, and shows it canonical", () => {
    expect(parse("2010-09")).toEqual({ mm: "09", yyyy: 2010 })
    expect(display("2010-09")).toBe("09/2010")
  })

  it("reads a bare year and keeps it exactly as typed", () => {
    // The picker anchors on 2015; the text is not rewritten behind the user.
    expect(parse("2015")).toEqual({ mm: null, yyyy: 2015 })
    expect(display("2015")).toBe("2015")
  })

  it("does not call an existing date an error", () => {
    for (const v of ["05/2010", "2010-09", "2015", "2023"]) {
      expect(isRecognised(v)).toBe(true)
    }
  })

  it("still rejects what it genuinely cannot read", () => {
    for (const v of ["mayo 2010", "13/2010", "05/1810", "abc", "2010-13"]) {
      expect(isRecognised(v)).toBe(false)
    }
  })
})
