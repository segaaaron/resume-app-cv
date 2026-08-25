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
const WITH_CERTS = {
  certifications: [{ id: "c1", name: "CCNA" }],
  languages: [{ id: "l1", name: "Inglés", level: "b2" }],
}

const COMPLETE = {
  ...WITH_CERTS,
  personalDetails: { firstName: "Alfredo", lastName: "Sandoval", email: "a@b.com", jobTitle: "Analista de Riesgo" },
  summary: "Administrador de empresas con más de diez años en banca, especializado en el análisis de riesgo de carteras de clientes privados y en la evaluación crediticia.",
  workExperience: [FULL_JOB],
  education: [{ id: "e1", degree: "Administración de Empresas", institution: "UMSA" }],
  skills: [{ id: "s1", name: "Análisis de Riesgo" }],
}

const kinds = (sd: Record<string, unknown>) => computeProfileGaps(sd).map((g) => g.kind)

describe("computeProfileGaps", () => {
  it("has nothing left to ask but the two 'anything more?' questions", () => {
    // A CV passing every check still owes two: one role is 60% of the
    // work-experience score and two is 100%, and one bullet is below the three
    // to five that read best. The panel drops each once the person says "that's
    // all" — the engine cannot know that on its own.
    expect(kinds(COMPLETE).sort()).toEqual(["moreBullets", "moreExperience"])
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
    // The dates come first; the role also has room for another bullet, which is
    // a lower-value question and sorts below.
    expect(gaps[0]).toMatchObject({ kind: "jobDates", jobId: "w1", subject: "Banco Mercantil", fill: "direct" })
  })

  // "How long did you work AT Telecommunications Engineer" is not a sentence.
  // The question has to know whether it is naming a company or a role.
  it("flags when the subject is the role because no employer is known", () => {
    const withEmployer = computeProfileGaps({
      ...COMPLETE,
      workExperience: [{ ...FULL_JOB, startDate: "", endDate: "" }],
    })
    expect(withEmployer[0]).toMatchObject({ kind: "jobDates", subject: "Banco Mercantil", subjectIsRole: false })

    const withoutEmployer = computeProfileGaps({
      ...COMPLETE,
      workExperience: [{ ...FULL_JOB, employer: "", startDate: "", endDate: "" }],
    })
    expect(withoutEmployer[0]).toMatchObject({ kind: "jobDates", subject: "Analista de Riesgo", subjectIsRole: true })
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

  it("offers to build the CV when it carries a job title and nothing else", () => {
    // The role is already known, so opening with "where did you work?" wastes
    // the one thing that could have written the whole draft.
    const gaps = kinds({ personalDetails: { firstName: "Ana", email: "a@b.com", jobTitle: "Administradora" } })
    expect(gaps[0]).toBe("jobTitle")
  })

  it("asks what you do first — everything else keys off the role", () => {
    // Sorted purely by weight, "where did you work" came before "what do you
    // do", which reads as an interrogation instead of a conversation.
    expect(kinds({})[0]).toBe("jobTitle")
  })

  it("orders the middle by how much the answer improves the CV", () => {
    const gaps = computeProfileGaps({ personalDetails: { firstName: "Ana", email: "a@b.com" } })
    const weights = gaps.filter((g) => g.kind !== "summary" && g.kind !== "jobTitle").map((g) => g.weight)
    expect(weights).toEqual([...weights].sort((a, b) => b - a))
  })

  it("asks about certifications only once there is a role to key them off", () => {
    // Examples for "Ingeniero de Telecomunicaciones" are useful; examples for
    // nobody in particular are noise.
    expect(kinds({})).not.toContain("certifications")
    expect(kinds({ ...COMPLETE, certifications: [] })).toContain("certifications")
  })

  /**
   * One role is where the wizard used to stop — and then announce the CV was
   * complete. The product's own completeness model scores work experience at
   * 60% with a single role and 100% from two.
   */
  describe("more than one job", () => {
    it("offers to add another once the roles on file are finished", () => {
      expect(kinds(COMPLETE)).toContain("moreExperience")
    })

    it("does not offer it while the current role is still missing something", () => {
      const halfDone = { ...COMPLETE, workExperience: [{ ...FULL_JOB, description: "" }] }
      expect(kinds(halfDone)).not.toContain("moreExperience")
    })

    it("stops offering past five roles, where a résumé starts sprawling", () => {
      const five = Array.from({ length: 5 }, (_, i) => ({ ...FULL_JOB, id: `w${i}` }))
      expect(kinds({ ...COMPLETE, workExperience: five })).not.toContain("moreExperience")
    })
  })

  /**
   * The ceiling is not this file's opinion: it comes from `roleBudget`, the one
   * owner of "does another line fit". An assistant pushing past a limit its own
   * analyser penalises makes both look untrustworthy.
   *
   * ── UPDATED (CEO, 2026-08-25) ────────────────────────────────────────────
   *
   * The ceiling is not a single global number any more: it depends on how old
   * the role is (6 on the current one, 4 on the previous, 3 on the old ones),
   * which is the same band the report already used to say "this role carries too
   * many lines". With the flat 6, a role from 2015 was offered a sixth bullet
   * while the report asked it to come down to three — two of our own features
   * pulling opposite ways, which is exactly what was reported.
   */
  describe("more bullets, up to the limit the rest of the product enforces", () => {
    const withBullets = (n: number, job = FULL_JOB) => ({
      ...COMPLETE,
      workExperience: [{ ...job, description: Array.from({ length: n }, (_, i) => `• Línea ${i + 1}`).join("\n") }],
    })
    /** FULL_JOB ended in 2015: an old role, where a recruiter reads two or three. */
    const CURRENT_JOB = { ...FULL_JOB, endDate: "", currentlyWorking: true }

    it("offers another line while there is room", () => {
      expect(kinds(withBullets(1))).toContain("moreBullets")
      expect(kinds(withBullets(2))).toContain("moreBullets")
      expect(kinds(withBullets(5, CURRENT_JOB))).toContain("moreBullets")
    })

    it("stops at the ceiling that role's age admits", () => {
      // El puesto viejo: tres es su techo, así que con tres ya no se ofrece.
      expect(kinds(withBullets(3))).not.toContain("moreBullets")
      expect(kinds(withBullets(4))).not.toContain("moreBullets")
      expect(kinds(withBullets(6, CURRENT_JOB))).not.toContain("moreBullets")
      expect(kinds(withBullets(7, CURRENT_JOB))).not.toContain("moreBullets")
    })

    it("does not offer it on a role with no bullets — that one gets asked outright", () => {
      const empty = { ...COMPLETE, workExperience: [{ ...FULL_JOB, description: "" }] }
      expect(kinds(empty)).toContain("jobBullets")
      expect(kinds(empty)).not.toContain("moreBullets")
    })
  })

  it("asks which languages you speak — nobody can guess that for you", () => {
    expect(kinds({ ...COMPLETE, languages: [] })).toContain("languages")
    expect(kinds(COMPLETE)).not.toContain("languages")
  })

  it("only charges the model for writing, never for asking", () => {
    const aiKinds = computeProfileGaps({}).filter((g) => g.fill === "ai").map((g) => g.kind)
    // Dates, employers, degrees and skills are typed in by the user as-is. The
    // role is the exception: answering it seeds the summary and the skills too.
    expect(aiKinds).toEqual(["jobTitle", "summary"])
  })
})
