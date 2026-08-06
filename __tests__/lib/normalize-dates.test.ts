import { describe, it, expect } from "vitest"
import { toMachineDate, normalizeDates } from "@/lib/ats/normalize-dates"

describe("toMachineDate", () => {
  it("reads month-name dates in both languages", () => {
    expect(toMachineDate("May 2022")).toBe("05/2022")
    expect(toMachineDate("Mayo 2022")).toBe("05/2022")
    expect(toMachineDate("sept. 2019")).toBe("09/2019")
    expect(toMachineDate("enero de 2020")).toBe("01/2020")
  })

  it("normalizes numeric shapes", () => {
    expect(toMachineDate("6/2023")).toBe("06/2023")
    expect(toMachineDate("2023-06")).toBe("06/2023")
  })

  it("leaves a bare year alone — inventing a month invents tenure", () => {
    expect(toMachineDate("2015")).toBeNull()
  })

  it("leaves 'Present' and already-canonical dates alone", () => {
    expect(toMachineDate("Present")).toBeNull()
    expect(toMachineDate("Actualidad")).toBeNull()
    expect(toMachineDate("06/2023")).toBeNull()
  })

  it("refuses anything it cannot read with certainty", () => {
    expect(toMachineDate("summer of '19")).toBeNull()
    expect(toMachineDate("13/2023")).toBeNull()
    expect(toMachineDate("")).toBeNull()
  })
})

describe("normalizeDates", () => {
  it("rewrites what it can and reports how much changed", () => {
    const { rows, changed } = normalizeDates([
      { startDate: "May 2022", endDate: "Present" },
      { startDate: "2015", endDate: "2016" },
      { startDate: "3/2020", endDate: "2021-11" },
    ])
    expect(changed).toBe(3)
    expect(rows[0]).toEqual({ startDate: "05/2022", endDate: "Present" })
    expect(rows[1]).toEqual({ startDate: "2015", endDate: "2016" })
    expect(rows[2]).toEqual({ startDate: "03/2020", endDate: "11/2021" })
  })

  it("returns the original rows untouched when nothing is normalizable", () => {
    const rows = [{ startDate: "2015", endDate: "2016" }]
    expect(normalizeDates(rows)).toEqual({ rows, changed: 0 })
  })
})
