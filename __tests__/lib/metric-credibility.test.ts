import { describe, it, expect } from "vitest"
import { assessMetricCredibility, findDegreeInSkills, hasVerifiableLink } from "@/lib/ats/metric-credibility"

/**
 * This check was deferred twice on purpose. The obvious version — judge whether a
 * number is impressive — needs context nobody has: fifty users is nothing for a
 * delivery app and is the whole market for a hospital's internal tool. So it never
 * judges a figure. It judges the PATTERN, and these are the pairs that prove the
 * difference, across industries and both languages.
 */
describe("assessMetricCredibility — the pattern, never the line", () => {
  it("flags a CV where every figure is a percentage nobody can check", () => {
    const r = assessMetricCredibility([
      "Improved app functionality and user satisfaction by 5%",
      "Increased efficiency by 15%",
      "Reduced project timelines by 50%",
      "Reduced technical debt by 8%",
      "Improved user engagement by 30%",
    ])
    expect(r.saturated).toBe(true)
    expect(r.anchored).toBe(0)
  })

  // The same shape in Spanish, outside tech.
  it("flags it in Spanish too", () => {
    expect(assessMetricCredibility([
      "Mejoró la satisfacción del paciente en un 20%",
      "Redujo los tiempos de espera en un 30%",
      "Aumentó la adherencia al tratamiento en un 15%",
      "Mejoró la coordinación del turno en un 25%",
    ]).saturated).toBe(true)
  })

  // A figure the candidate can defend in an interview.
  it.each([
    ["before and after", "Cut crash rate from 2.1% to 0.4% across the fleet"],
    ["a unit", "Cut checkout latency from 800ms to 120ms"],
    ["money", "Recovered $42,000 in unbilled consumables"],
    ["a count of real things", "Trained 30 nurses on the new triage protocol"],
    ["Spanish count", "Coordinó la instalación eléctrica de 15 viviendas"],
  ])("does not flag a CV anchored by %s", (_n, line) => {
    const r = assessMetricCredibility([line, line, line, line, line])
    expect(r.saturated).toBe(false)
    expect(r.anchored).toBeGreaterThan(0)
  })

  it("stays silent on a CV with too few figures to show a pattern", () => {
    expect(assessMetricCredibility(["Improved retention by 10%", "Handled the support queue"]).saturated).toBe(false)
  })

  it("stays silent on a CV that mixes honest deltas with anchored figures", () => {
    expect(assessMetricCredibility([
      "Improved retention by 10%",
      "Reduced churn by 5%",
      "Trained 30 nurses on the new triage protocol",
      "Recovered $42,000 in unbilled consumables",
    ]).saturated).toBe(false)
  })

  it("stays silent on a CV with no figures at all", () => {
    expect(assessMetricCredibility(["Handled customer inquiries daily", "Kept the ward stocked"]).saturated).toBe(false)
  })
})

/**
 * Checked per CV, never against a list of degree names: the only reliable evidence
 * that a string is this candidate's qualification is that it appears in their own
 * education. Any list of professions would be wrong in some country.
 */
describe("findDegreeInSkills", () => {
  it("catches the degree sitting in the skills list", () => {
    expect(findDegreeInSkills(["Swift", "Systems engineer", "Git"], [{ degree: "Systems engineer" }])).toEqual(["Systems engineer"])
  })

  it("works in Spanish, and on the field of study", () => {
    expect(findDegreeInSkills(["Excel", "Contaduría Pública"], [{ fieldOfStudy: "Contaduría Pública" }])).toEqual(["Contaduría Pública"])
  })

  it("leaves a real skill alone even when it sounds academic", () => {
    expect(findDegreeInSkills(["Financial analysis", "Nursing care"], [{ degree: "Nursing" }])).toEqual([])
  })

  it("says nothing when there is no education to compare against", () => {
    expect(findDegreeInSkills(["Systems engineer"], [])).toEqual([])
  })
})

describe("hasVerifiableLink", () => {
  it.each([
    ["a portfolio URL", { personalDetails: { website: "https://miguel.dev" } }],
    ["a profile in a nested field", { personalDetails: { linkedin: "linkedin.com/in/someone" } }],
    ["a link inside a bullet", { workExperience: [{ description: "• Shipped the app, live at example.app" }] }],
  ])("finds %s", (_n, cv) => {
    expect(hasVerifiableLink(cv)).toBe(true)
  })

  it("reports a CV with nothing checkable from outside", () => {
    expect(hasVerifiableLink({
      personalDetails: { firstName: "Ana", email: "ana@example.com" },
      workExperience: [{ description: "• Atendió a 30 pacientes por turno" }],
    })).toBe(true) // an email IS a domain — still checkable
    expect(hasVerifiableLink({
      personalDetails: { firstName: "Ana", phone: "+591 76944986" },
      workExperience: [{ description: "• Atendió a 30 pacientes por turno" }],
    })).toBe(false)
  })
})
