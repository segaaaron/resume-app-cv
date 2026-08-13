import { describe, it, expect } from "vitest"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { computeCredibility, credibilityVerdict } from "@/lib/ats/credibility"

/**
 * PARITY. The product read a real résumé by hand once — as a recruiter, not as a
 * keyword matcher — and produced a list of defects the panel could not see. This
 * file is the contract that it can see them now, and that it does the same for a
 * résumé from a completely different profession.
 *
 * Every expectation below corresponds to something a person actually said about a
 * document, not to a rule someone imagined.
 */
const iosCV = {
  summary:
    "iOS Developer with 7+ years of experience shipping native Swift apps used by real users, with strong UIKit, SwiftUI, async/await, API integration.",
  skills: [{ name: "Swift" }, { name: "Objective-C" }, { name: "Systems engineer" }, { name: "Git" }],
  education: [{ degree: "Systems engineer", school: "Catolica University" }],
  workExperience: [
    {
      id: "1", jobTitle: "iOS Developer", startDate: "2015", endDate: "2016",
      description: [
        "• Optimized data synchronization between iOS apps and backend services, enhancing performance by 3%",
        "• Developed responsive Swift UI from UI/UX designs in collaboration with designers and product owners, improving user engagement among 50 users",
        "• Developed responsive Swift UI from UI/UX designs in collaboration with designers and product owners, translating design requirements into a user-facing experience",
        "• Managed third-party dependencies and ensured compatibility across multiple iOS versions",
        "• Developed modular and reusable components to accelerate new feature development",
        "• Reduced crash rates and improved app stability through debugging, resulting in a more reliable experience",
        "• Implemented Agile methodologies, reducing project timelines by 50%",
      ].join("\n"),
    },
    {
      // Verbatim from the second page of the real document. Kept faithful rather
      // than trimmed: the saturation check is about a PATTERN, and a fixture with
      // eight lines cannot show one. Shortening the sample and then lowering the
      // threshold until it passed would be fitting the rule to the test.
      id: "2", jobTitle: "iOS Developer", startDate: "2023", endDate: "2026",
      description: [
        "• Implemented TCA architecture and design patterns, enhancing modularity by 10%",
        "• Developed hybrid mobile applications using Ionic and React Native, improving user experience by 10%",
        "• Created web applications with Angular and TypeScript, increasing efficiency by 15%",
        "• Ensured smooth application updates and compatibility, enhancing user satisfaction and retention by 10%",
        "• Designed user-friendly interfaces across mobile and web platforms, contributing to an increase in user engagement by 30%",
        "• Implemented Core Data for efficient local data storage, improving app functionality by 5%",
        "• Established accessibility standards to improve app usability, increasing user satisfaction ratings by 5%",
        "• Improved maintainability and scalability, leading to a reduction in technical debt by 8%",
      ].join("\n"),
    },
  ],
}

describe("parity: the iOS résumé that was read by hand", () => {
  const checks = analyzeWriting(iosCV)
  const cred = computeCredibility(checks)

  it("sees the roles listed oldest first", () => {
    expect(checks.chronology?.kind).toBe("reverse_order")
  })

  it("sees the summary claiming fewer years than the dates span", () => {
    expect(checks.yearsClaim).toEqual({ claimed: 7, actual: 11 })
  })

  it("sees the same achievement written twice", () => {
    expect(checks.nearDuplicates.length + checks.duplicateBullets.length).toBeGreaterThan(0)
  })

  it("sees the degree sitting in the skills list", () => {
    expect(checks.degreeInSkills).toContain("Systems engineer")
  })

  it("sees that every figure is a percentage nobody can check", () => {
    expect(checks.metrics.saturated).toBe(true)
  })

  it("sees a role carrying more lines than a recruiter reads", () => {
    expect(checks.bulletBalance.some((b) => b.kind === "too_many")).toBe(true)
  })

  it("sees that nothing in it can be verified from outside", () => {
    expect(checks.hasLink).toBe(false)
  })

  // The whole point: the keyword score is fine and the document is not.
  it("scores credibility far below a healthy keyword score, and says so", () => {
    expect(cred.score).toBeLessThan(60)
    expect(credibilityVerdict(76, cred.score).kind).toBe("keywords_ahead")
  })

  it("ranks a reason to disbelieve above a reason to frown", () => {
    expect(cred.findings[0].band).toBe("trust")
  })
})

/**
 * The same reading, on a profession with no code, no percentages culture and a
 * different language. If the checks only worked on the CV that produced them, this
 * is where it shows.
 */
const nurseCV = {
  summary: "Enfermera con 12 años de experiencia en sala de emergencias y cuidados intensivos.",
  skills: [{ name: "Atención al paciente" }, { name: "Signos vitales" }],
  education: [{ degree: "Licenciatura en Enfermería" }],
  personalDetails: { website: "https://linkedin.com/in/ana" },
  workExperience: [
    {
      id: "1", jobTitle: "Enfermera jefe", startDate: "2019", currentlyWorking: true,
      description: [
        "• Coordinó un equipo de 12 enfermeras en el turno noche",
        "• Redujo el tiempo de triaje de 18 a 7 minutos por paciente",
      ].join("\n"),
    },
    { id: "2", jobTitle: "Enfermera", startDate: "2014", endDate: "2019", description: "• Atendió un promedio de 80 pacientes por semana en urgencias" },
  ],
}

describe("parity: a nurse's résumé, written correctly", () => {
  const checks = analyzeWriting(nurseCV)
  const cred = computeCredibility(checks)

  it("finds nothing to distrust in a well-ordered, honest CV", () => {
    expect(checks.chronology).toBeNull()
    expect(checks.futureDates).toHaveLength(0)
    expect(checks.yearsClaim).toBeNull()
    expect(checks.nearDuplicates).toHaveLength(0)
    expect(checks.degreeInSkills).toHaveLength(0)
    expect(checks.metrics.saturated).toBe(false)
  })

  it("leaves the score alone and stays quiet about the gap", () => {
    expect(cred.score).toBe(100)
    expect(credibilityVerdict(74, cred.score).kind).toBe("credibility_ahead")
    expect(credibilityVerdict(95, cred.score).kind).toBe("aligned")
  })
})
