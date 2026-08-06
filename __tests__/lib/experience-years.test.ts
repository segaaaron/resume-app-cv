import { describe, it, expect } from "vitest"
import { requiredYears, cvExperienceYears, dropSatisfiedYearRequirements } from "@/lib/ats/experience-years"

const NOW = new Date("2026-08-06T00:00:00Z")

describe("requiredYears", () => {
  it("reads the number a requirement asks for, both languages", () => {
    expect(requiredYears("5+ years of experience as an iOS developer")).toBe(5)
    expect(requiredYears("Al menos 3 años de experiencia en Swift")).toBe(3)
    expect(requiredYears("7 yrs building mobile apps")).toBe(7)
  })

  it("takes the lower bound of a range — that is the bar to clear", () => {
    expect(requiredYears("3-5 years of experience")).toBe(3)
  })

  it("returns null when the requirement is not about years", () => {
    expect(requiredYears("Proficiency in Swift")).toBeNull()
    expect(requiredYears("Bachelor's degree in Computer Science")).toBeNull()
  })
})

describe("cvExperienceYears", () => {
  it("spans earliest start to latest end, without double-counting overlaps", () => {
    const years = cvExperienceYears({
      workExperience: [
        { startDate: "2015", endDate: "2016" },
        { startDate: "2017", endDate: "2020" },
        { startDate: "2021", endDate: "2022" },
        { startDate: "2023", endDate: "2026" },
      ],
    }, NOW)
    expect(years).toBe(11)
  })

  it("counts an open-ended role through today", () => {
    expect(cvExperienceYears({ workExperience: [{ startDate: "2020" }] }, NOW)).toBe(6)
  })

  it("also reads a claim stated in the summary", () => {
    const years = cvExperienceYears({ summary: "Desarrollador iOS con más de 7 años de experiencia." }, NOW)
    expect(years).toBe(7)
  })

  it("is zero on a CV with no dates and no claim", () => {
    expect(cvExperienceYears({}, NOW)).toBe(0)
  })
})

describe("dropSatisfiedYearRequirements", () => {
  // The exact false alarm reported: CV states 7 years, report demanded 5.
  it("drops a years requirement the CV already clears", () => {
    const out = dropSatisfiedYearRequirements(
      ["5+ years of experience as an iOS developer", "Proficiency in Swift"],
      { summary: "Desarrollador iOS con más de 7 años de experiencia." },
      NOW,
    )
    expect(out).toEqual(["Proficiency in Swift"])
  })

  it("keeps a requirement asking for more years than the CV shows", () => {
    const out = dropSatisfiedYearRequirements(
      ["10+ years of experience"],
      { workExperience: [{ startDate: "2023", endDate: "2026" }] },
      NOW,
    )
    expect(out).toEqual(["10+ years of experience"])
  })

  it("never touches requirements that are not about years", () => {
    const reqs = ["Core Data experience including offline functionality", "Working knowledge of Objective-C"]
    expect(dropSatisfiedYearRequirements(reqs, { summary: "20 años de experiencia" }, NOW)).toEqual(reqs)
  })

  it("leaves everything alone when the CV shows no experience at all", () => {
    const reqs = ["3 years of experience"]
    expect(dropSatisfiedYearRequirements(reqs, {}, NOW)).toEqual(reqs)
  })
})
