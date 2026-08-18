import { describe, it, expect } from "vitest"
import { computeProfileGaps } from "@/lib/ats/profile-gaps"

const FULL_JOB = {
  id: "w1",
  jobTitle: "Analista de Riesgo",
  employer: "Banco Mercantil",
  startDate: "05/2010",
  endDate: "10/2015",
  description: "• Evalué carteras de clientes privados con criterios de riesgo",
}

/** A CV that passes every check, so each test can remove exactly one thing. */
const COMPLETE = {
  personalDetails: { firstName: "Alfredo", lastName: "Sandoval", email: "a@b.com", jobTitle: "Analista de Riesgo" },
  summary: "Administrador de empresas con más de diez años en banca, especializado en el análisis de riesgo de carteras de clientes privados y en la evaluación crediticia.",
  workExperience: [FULL_JOB],
  education: [{ id: "e1", degree: "Administración de Empresas", institution: "UMSA" }],
  skills: [{ id: "s1", name: "Análisis de Riesgo" }],
}

const kinds = (sd: Record<string, unknown>) => computeProfileGaps(sd).map((g) => g.kind)

describe("computeProfileGaps", () => {
  it("asks nothing when the CV already covers every check", () => {
    expect(computeProfileGaps(COMPLETE)).toEqual([])
  })

  it("asks for everything on an empty CV", () => {
    const gaps = kinds({})
    expect(gaps).toContain("jobTitle")
    expect(gaps).toContain("workExperience")
    expect(gaps).toContain("education")
    expect(gaps).toContain("skills")
    expect(gaps).toContain("summary")
  })

  it("puts the summary last, always", () => {
    // Written first it has nothing to work from — that is how the old assistant
    // produced a generic paragraph out of an empty profile.
    const gaps = kinds({})
    expect(gaps[gaps.length - 1]).toBe("summary")
  })

  it("asks about the role that is missing dates, and names it", () => {
    const gaps = computeProfileGaps({
      ...COMPLETE,
      workExperience: [{ ...FULL_JOB, startDate: "", endDate: "" }],
    })
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({ kind: "jobDates", jobId: "w1", subject: "Banco Mercantil", fill: "direct" })
  })

  it("asks what the user did in a role with no description, and routes it to the model", () => {
    const gaps = computeProfileGaps({
      ...COMPLETE,
      workExperience: [{ ...FULL_JOB, description: "" }],
    })
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({ kind: "jobBullets", jobId: "w1", fill: "ai" })
  })

  it("does not ask a current job for an end date", () => {
    const gaps = kinds({
      ...COMPLETE,
      workExperience: [{ ...FULL_JOB, endDate: "", currentlyWorking: true }],
    })
    expect(gaps).not.toContain("jobDates")
  })

  // The user this product fails hardest today: no jobs at all. An empty work
  // history is a fact about them, not an error, and the questions have to stay
  // answerable — asking "since when did you work at ___" of someone with no ___
  // is how an assistant makes a person feel worse about their CV.
  it("asks a first-jobber for the role itself, never for dates of a job that does not exist", () => {
    const gaps = kinds({
      personalDetails: { firstName: "Ana", email: "a@b.com" },
      education: [{ id: "e1", degree: "Contaduría", institution: "UMSA" }],
      skills: [{ id: "s1", name: "Excel" }],
    })
    expect(gaps).toContain("workExperience")
    expect(gaps).not.toContain("jobDates")
    expect(gaps).not.toContain("jobBullets")
    expect(gaps).not.toContain("education")
  })

  it("orders by how much the answer improves the CV", () => {
    const gaps = computeProfileGaps({ personalDetails: { firstName: "Ana", email: "a@b.com" } })
    const weights = gaps.filter((g) => g.kind !== "summary").map((g) => g.weight)
    expect(weights).toEqual([...weights].sort((a, b) => b - a))
  })

  it("only charges the model for writing, never for asking", () => {
    const aiKinds = computeProfileGaps({}).filter((g) => g.fill === "ai").map((g) => g.kind)
    // Dates, employers, degrees and skills are typed in by the user as-is.
    expect(aiKinds).toEqual(["summary"])
  })
})
