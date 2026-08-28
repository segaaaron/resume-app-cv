import { describe, it, expect } from "vitest"
import { isPlausibleSkill, nonSkillTermsFrom } from "@/lib/skills/skill-validation"

const CV = {
  personalDetails: { firstName: "Miguel", lastName: "Saravia", city: "Cochabamba", country: "Bolivia", jobTitle: "iOS Developer" },
  workExperience: [{ employer: "Xiobit", city: "Cochabamba", jobTitle: "iOS Developer" }],
  education: [{ institution: "Universidad Mayor", city: "Cochabamba" }],
}

describe("isPlausibleSkill", () => {
  it("accepts what the dictionary knows", () => {
    for (const s of ["Swift", "SwiftUI", "GraphQL", "Kubernetes", "Objective-C", "XCTest"]) {
      expect(isPlausibleSkill(s, CV), s).toBe(true)
    }
  })

  it("accepts real skills the dictionary does NOT know", () => {
    // Measured: the dictionary answers false for every one of these. Requiring
    // it would block real skills, which is worse than the noise it prevents.
    for (const s of ["Crash Reporting", "unit testing", "code review", "memory management", "Firebase Analytics"]) {
      expect(isPlausibleSkill(s, CV), s).toBe(true)
    }
  })

  it("rejects the candidate's own name, employer, city and job title", () => {
    // Per-CV: no list of non-skills contains "Xiobit", but it is this
    // candidate's employer, and an employer in Skills is noise.
    for (const s of ["Miguel", "Saravia", "Xiobit", "Cochabamba", "Bolivia", "iOS Developer", "Universidad Mayor"]) {
      expect(isPlausibleSkill(s, CV), s).toBe(false)
    }
  })

  it("rejects a sentence the model returned as a skill", () => {
    // Straight from a real suggestion: "ADD 'Crash Reporting' and/or the
    // specific analytics/crash tools you have used".
    expect(isPlausibleSkill("the specific analytics tools you have used", CV)).toBe(false)
    expect(isPlausibleSkill("teamwork and collaboration skills", CV)).toBe(false)
    expect(isPlausibleSkill("experience with modern iOS frameworks", CV)).toBe(false)
  })

  it("rejects numbers, empty strings and punctuation", () => {
    expect(isPlausibleSkill("2015", CV)).toBe(false)
    expect(isPlausibleSkill("   ", CV)).toBe(false)
    expect(isPlausibleSkill("---", CV)).toBe(false)
  })

  it("keeps a known skill that collides with a company name", () => {
    // "Oracle" and "Docker" are companies AND skills — the dictionary check runs
    // first on purpose, so a real skill is never lost to the per-CV filter.
    const cv = { ...CV, workExperience: [{ employer: "Oracle", city: "Lima", jobTitle: "Dev" }] }
    expect(isPlausibleSkill("Oracle", cv)).toBe(true)
  })

  it("strips quotes and trailing punctuation before judging", () => {
    expect(isPlausibleSkill('"Swift"', CV)).toBe(true)
    expect(isPlausibleSkill("GraphQL.", CV)).toBe(true)
  })

  it("collects the CV's own proper nouns", () => {
    const terms = nonSkillTermsFrom(CV)
    expect(terms.has("xiobit")).toBe(true)
    expect(terms.has("cochabamba")).toBe(true)
    expect(terms.has("miguel saravia")).toBe(true)
  })

  it("accepts compound skills whose connector sits INSIDE", () => {
    // The first version banned these words anywhere and rejected 10 of 17 real
    // skills — nearly every Spanish compound carries "de".
    for (const s of [
      "Gestión de proyectos", "Análisis de datos", "Desarrollo de software",
      "Bases de datos", "Atención al cliente", "Diseño de interfaces",
      "Internet of Things", "Point of Sale", "Software as a Service",
      "Quality of Service", "Voice of Customer",
    ]) {
      expect(isPlausibleSkill(s, CV), s).toBe(true)
    }
  })

  it("rejects a connector at either END — that is prose, not a compound", () => {
    expect(isPlausibleSkill("of the tools", CV)).toBe(false)
    expect(isPlausibleSkill("de datos y", CV)).toBe(false)
    expect(isPlausibleSkill("with Swift", CV)).toBe(false)
  })

  it("rejects hedges that dress a skill as a sentence", () => {
    expect(isPlausibleSkill("knowledge of Swift", CV)).toBe(false)
    expect(isPlausibleSkill("proficiency in unit testing", CV)).toBe(false)
    expect(isPlausibleSkill("habilidades de comunicación", CV)).toBe(false)
  })

  it("keeps symbol-bearing skill names", () => {
    expect(isPlausibleSkill("C++", CV)).toBe(true)
    expect(isPlausibleSkill("C#", CV)).toBe(true)
    expect(isPlausibleSkill("Node.js", CV)).toBe(true)
  })
})
