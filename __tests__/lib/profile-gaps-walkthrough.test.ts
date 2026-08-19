import { describe, it, expect } from "vitest"
import { computeProfileGaps, type ProfileGapKind } from "@/lib/ats/profile-gaps"

/**
 * The whole interview, walked start to finish.
 *
 * Every other test here checks one gap in isolation. This one answers the
 * questions in the order the wizard asks them and proves the list actually
 * empties — that there is no question which, once answered, re-appears, and no
 * pair of rules that keeps the user in a loop. A wizard that never ends is worse
 * than one that never starts, and it is invisible to per-rule tests.
 */

type CV = Record<string, unknown>

/** Answers one gap the way the panel does, and hands back the new CV. */
function answer(cv: CV, kind: ProfileGapKind, jobId?: string): CV {
  const work = (cv.workExperience ?? []) as Record<string, unknown>[]
  switch (kind) {
    case "jobTitle":
      return {
        ...cv,
        personalDetails: { ...(cv.personalDetails ?? {}), jobTitle: "Analista de Riesgo" },
        summary: "Analista de riesgo con experiencia en carteras de clientes privados y evaluación crediticia.",
        skills: [{ id: "s1", name: "Análisis de Riesgo" }],
      }
    case "workExperience":
      return {
        ...cv,
        workExperience: [...work, {
          id: `w${work.length + 1}`, jobTitle: "Analista de Riesgo", employer: "Banco Mercantil",
          startDate: "05/2010", endDate: "10/2015", currentlyWorking: false, description: "",
        }],
      }
    case "jobDates":
      return { ...cv, workExperience: work.map((j) => j.id === jobId ? { ...j, startDate: "05/2010", endDate: "10/2015" } : j) }
    case "jobBullets":
      return { ...cv, workExperience: work.map((j) => j.id === jobId ? { ...j, description: "• Evalué carteras de clientes privados" } : j) }
    case "education":
      return { ...cv, education: [{ id: "e1", institution: "UMSA", degree: "Administración", endDate: "12/2009" }] }
    case "skills":
      return { ...cv, skills: [{ id: "s1", name: "Análisis de Riesgo" }] }
    case "certifications":
      return { ...cv, certifications: [{ id: "c1", name: "Basilea" }] }
    case "languages":
      return { ...cv, languages: [{ id: "l1", name: "Inglés", level: "b2" }] }
    case "summary":
      return { ...cv, summary: "Analista de riesgo con más de diez años evaluando carteras de clientes privados en banca." }
    case "moreBullets":
    case "moreExperience":
      // "No, that's all" — the panel drops these for the rest of the session.
      return cv
  }
}

describe("the interview, walked end to end", () => {
  it("empties its own list without looping", () => {
    let cv: CV = { personalDetails: { firstName: "Alfredo", email: "a@b.com" } }
    const asked: ProfileGapKind[] = []
    let declinedMoreJobs = false

    for (let step = 0; step < 40; step++) {
      const gaps = computeProfileGaps(cv)
        .filter((g) => g.kind !== "moreExperience" || !declinedMoreJobs)
        .filter((g) => g.kind !== "moreBullets")
      if (gaps.length === 0) break
      const next = gaps[0]
      asked.push(next.kind)
      if (next.kind === "moreExperience") declinedMoreJobs = true
      cv = answer(cv, next.kind, next.jobId)
    }

    // Finished, and every question was asked exactly once.
    expect(
      computeProfileGaps(cv)
        .filter((g) => g.kind !== "moreExperience" || !declinedMoreJobs)
        .filter((g) => g.kind !== "moreBullets")
    ).toEqual([])
    expect(asked).toEqual([...new Set(asked)])
    // The role comes first and the summary last — the two pinned ends.
    expect(asked[0]).toBe("jobTitle")
    expect(asked[asked.length - 1]).toBe("summary")
  })

  it("covers every section a résumé needs on the way", () => {
    let cv: CV = { personalDetails: { firstName: "Alfredo", email: "a@b.com" } }
    const asked = new Set<ProfileGapKind>()
    let declined = false
    for (let step = 0; step < 40; step++) {
      const gaps = computeProfileGaps(cv)
        .filter((g) => g.kind !== "moreExperience" || !declined)
        .filter((g) => g.kind !== "moreBullets")
      if (gaps.length === 0) break
      const next = gaps[0]
      asked.add(next.kind)
      if (next.kind === "moreExperience") declined = true
      cv = answer(cv, next.kind, next.jobId)
    }
    for (const kind of ["jobTitle", "workExperience", "jobBullets", "education", "certifications", "languages", "summary"] as const) {
      expect(asked.has(kind)).toBe(true)
    }
  })

  it("stops asking someone with no jobs about dates they do not have", () => {
    // The first-jobber path: education and skills, never a phantom role.
    let cv: CV = { personalDetails: { firstName: "Ana", email: "a@b.com" } }
    const asked: ProfileGapKind[] = []
    for (let step = 0; step < 20; step++) {
      const gaps = computeProfileGaps(cv)
        .filter((g) => g.kind !== "workExperience" && g.kind !== "moreExperience" && g.kind !== "moreBullets")
      if (gaps.length === 0) break
      asked.push(gaps[0].kind)
      cv = answer(cv, gaps[0].kind, gaps[0].jobId)
    }
    expect(asked).not.toContain("jobDates")
    expect(asked).not.toContain("jobBullets")
  })
})
