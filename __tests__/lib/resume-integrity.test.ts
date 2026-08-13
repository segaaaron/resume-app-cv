import { describe, it, expect } from "vitest"
import { checkChronology, checkFutureDates, checkYearsClaim, findNearDuplicateBullets, findIncompleteEducation } from "@/lib/ats/resume-integrity"

/**
 * Every case below was found by reading a real CV the way a hiring manager does,
 * and every one of them was invisible to this product at the time. A keyword
 * matcher cannot see any of it; a recruiter sees all of it in seven seconds.
 */
const REAL_ROLES = [
  { id: "1", jobTitle: "iOS Developer", startDate: "2015", endDate: "2016" },
  { id: "2", jobTitle: "iOS Developer & Web Developer", startDate: "2017", endDate: "2020" },
  { id: "3", jobTitle: "iOS Developer", startDate: "2021", endDate: "2022" },
  { id: "4", jobTitle: "iOS Developer", startDate: "2022", endDate: "2023" },
  { id: "5", jobTitle: "IOS Developer", startDate: "2023", endDate: "2026" },
]

describe("checkChronology", () => {
  it("catches a CV listed oldest-first", () => {
    const issue = checkChronology(REAL_ROLES)
    expect(issue?.kind).toBe("reverse_order")
    expect(issue?.firstShown).toContain("iOS Developer")
  })

  it("says nothing when the newest role is already on top", () => {
    expect(checkChronology([...REAL_ROLES].reverse())).toBeNull()
  })

  it("says nothing for a single role", () => {
    expect(checkChronology([REAL_ROLES[0]])).toBeNull()
  })

  it("treats an ongoing role as the most recent", () => {
    const roles = [{ id: "a", jobTitle: "Now", startDate: "2024", currentlyWorking: true }, { id: "b", jobTitle: "Old", startDate: "2015", endDate: "2016" }]
    expect(checkChronology(roles)).toBeNull()
  })

  // Two jobs held around the same time is not a mistake.
  it("does not flag roles from the same period", () => {
    expect(checkChronology([
      { id: "a", jobTitle: "A", startDate: "2021", endDate: "2022" },
      { id: "b", jobTitle: "B", startDate: "2021", endDate: "2022" },
    ])).toBeNull()
  })

  it("ignores roles with no dates rather than guessing", () => {
    expect(checkChronology([{ id: "a", jobTitle: "A" }, { id: "b", jobTitle: "B" }])).toBeNull()
  })
})

describe("checkFutureDates", () => {
  it("catches an end year that has not happened", () => {
    const out = checkFutureDates(REAL_ROLES, 2026)
    expect(out).toHaveLength(0) // 2026 is the current year — not future
    expect(checkFutureDates(REAL_ROLES, 2024)).toHaveLength(1)
  })

  it("never flags an ongoing role", () => {
    expect(checkFutureDates([{ id: "a", jobTitle: "A", startDate: "2023", endDate: "2030", currentlyWorking: true }], 2026)).toHaveLength(0)
  })

  it("ignores a role with no end date", () => {
    expect(checkFutureDates([{ id: "a", jobTitle: "A", startDate: "2023" }], 2026)).toHaveLength(0)
  })
})

describe("checkYearsClaim", () => {
  // The real one: "7+ years" over dates spanning 2015–2026.
  it("catches a summary that claims fewer years than the dates span", () => {
    const issue = checkYearsClaim("iOS Developer with 7+ years of experience shipping native Swift apps", REAL_ROLES, 2026)
    expect(issue).toEqual({ claimed: 7, actual: 11 })
  })

  it("accepts a claim within rounding distance", () => {
    expect(checkYearsClaim("9 years of experience", REAL_ROLES, 2026)).toBeNull()
  })

  it("says nothing when the summary claims no number", () => {
    expect(checkYearsClaim("iOS Developer focused on performance", REAL_ROLES, 2026)).toBeNull()
  })

  it("works in Spanish", () => {
    expect(checkYearsClaim("Desarrollador iOS con 3 años de experiencia", REAL_ROLES, 2026)?.actual).toBe(11)
  })

  it("counts the span, not the sum — overlapping roles must not double-count", () => {
    const overlapping = [
      { id: "a", jobTitle: "A", startDate: "2020", endDate: "2024" },
      { id: "b", jobTitle: "B", startDate: "2020", endDate: "2024" },
    ]
    expect(checkYearsClaim("8 years of experience", overlapping, 2026)).toEqual({ claimed: 8, actual: 4 })
  })
})

describe("findNearDuplicateBullets", () => {
  // Verbatim from the CV: not identical, unmistakably one thing said twice.
  it("catches the same achievement rewritten", () => {
    const out = findNearDuplicateBullets([{
      id: "j1",
      jobTitle: "iOS Developer",
      bullets: [
        "Wrote comprehensive unit tests and coordinated with backend engineers to validate RESTful API integration, keeping iOS releases reliable",
        "Coordinated unit and UI testing with backend engineers to validate RESTful API integration and keep iOS releases reliable",
      ],
    }])
    expect(out).toHaveLength(1)
  })

  // Two bullets about related work SHOULD look alike. Flagging those would send
  // the user deleting real content.
  it("leaves genuinely different achievements alone", () => {
    const out = findNearDuplicateBullets([{
      id: "j1",
      jobTitle: "iOS Developer",
      bullets: [
        "Cut checkout latency from 800ms to 120ms by caching the pricing call",
        "Migrated the payments module from UIKit to SwiftUI across three screens",
      ],
    }])
    expect(out).toHaveLength(0)
  })

  // The hardest negative measured (0.585): same sentence shape, different
  // architecture. Two real jobs, not one written twice.
  it("does not confuse two different technologies for one duplicate", () => {
    const out = findNearDuplicateBullets([{
      id: "j1",
      jobTitle: "iOS Developer",
      bullets: [
        "Implemented VIPER architecture and design patterns to enhance code maintainability and facilitate feature development.",
        "Implemented TCA architecture and design patterns, enhancing code modularity and maintainability while leading code review sessions",
      ],
    }])
    expect(out).toHaveLength(0)
  })

  it("catches the SwiftUI bullet written twice with different endings", () => {
    const out = findNearDuplicateBullets([{
      id: "j1",
      jobTitle: "iOS Developer",
      bullets: [
        "Developed responsive Swift UI from UI/UX designs in collaboration with designers and product owners, improving user engagement among 50 users.",
        "Developed responsive Swift UI from UI/UX designs in collaboration with designers and product owners, translating design requirements into a user-facing experience that aligned with product goals",
      ],
    }])
    expect(out).toHaveLength(1)
  })

  it("leaves exact copies to the exact-match check", () => {
    const line = "Reduced crash rates through debugging and refactoring of legacy code"
    expect(findNearDuplicateBullets([{ id: "j1", jobTitle: "x", bullets: [line, line] }])).toHaveLength(0)
  })

  it("never pairs bullets across two roles", () => {
    const line = "Implemented Core Data for efficient local data storage and offline capabilities"
    const out = findNearDuplicateBullets([
      { id: "a", jobTitle: "A", bullets: [line] },
      { id: "b", jobTitle: "B", bullets: [line + " enhancing user experience"] },
    ])
    expect(out).toHaveLength(0)
  })
})

/**
 * Reported from the panel: "Education: at Catolica University" — a school with no
 * degree and no dates. The analyst happened to notice it once; this notices it
 * every time, in every language, with no model involved.
 */
describe("findIncompleteEducation", () => {
  it("catches a school with no degree and no dates", () => {
    const out = findIncompleteEducation([{ school: "Catolica University" }])
    expect(out).toEqual([{ index: 0, school: "Catolica University", missingDegree: true, missingDates: true }])
  })

  it("catches a degree with no dates, and dates with no degree", () => {
    expect(findIncompleteEducation([{ school: "X", degree: "Ingeniería de Sistemas" }])[0].missingDates).toBe(true)
    expect(findIncompleteEducation([{ school: "X", startDate: "2010", endDate: "2015" }])[0].missingDegree).toBe(true)
  })

  it("says nothing about a complete entry", () => {
    expect(findIncompleteEducation([{ school: "X", degree: "Licenciatura en Enfermería", startDate: "2014", endDate: "2019" }])).toEqual([])
  })

  it("accepts fieldOfStudy in place of degree, and an ongoing course in place of dates", () => {
    expect(findIncompleteEducation([{ school: "X", fieldOfStudy: "Contaduría", startDate: "2020", currentlyStudying: true }])).toEqual([])
  })

  // An empty row is something the user has not filled in yet, not something they
  // got wrong — telling them off for it would be noise on every new résumé.
  it("ignores an entry with no school at all", () => {
    expect(findIncompleteEducation([{ degree: "" }, {}])).toEqual([])
  })

  it("reads the institution field too", () => {
    expect(findIncompleteEducation([{ institution: "Universidad Mayor" }])[0].school).toBe("Universidad Mayor")
  })
})
