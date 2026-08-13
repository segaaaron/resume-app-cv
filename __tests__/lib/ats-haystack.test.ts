import { describe, it, expect } from "vitest"
import { computeATSMatch } from "@/lib/services/ai/shared/ats-matcher"

/**
 * The prompt's token budget is not the matcher's field of view.
 *
 * buildResumeContext truncates every section to fit the LLM — ten roles, forty
 * skills, six certifications, six projects — and that truncated string was reused
 * to answer "does this candidate have this keyword?". Everything past a cap was
 * reported MISSING although the user had written it. The bug was found and fixed
 * once for skills alone and never generalised.
 *
 * These pin the fix at the level that matters: the matcher's answer, for the
 * professions where a certification IS the credential.
 */
const SECTIONS = { summary: true, work: true, education: true, skills: true }

function matchAgainst(haystack: string, required: string[]) {
  return computeATSMatch(
    { hardSkills: required, softSkills: [], jobTitle: "", mustHaves: [] },
    haystack,
    "",
    SECTIONS,
    "",
  )
}

describe("a certification past the prompt's cap is still on the résumé", () => {
  // Seven certifications: a nurse, an electrician, an accountant. The seventh was
  // invisible before, and the posting asks for exactly that one.
  const certs = ["BLS", "ACLS", "PALS", "NRP", "TNCC", "CCRN", "RN License"]
  const haystack = `Enfermera de emergencias\nCertifications: ${certs.join(", ")}`.toLowerCase()

  it("matches the seventh certification, not just the first six", () => {
    const m = matchAgainst(haystack, ["CCRN", "RN License"])
    expect(m.missingKeywords).toHaveLength(0)
  })

  it("still reports one the candidate genuinely does not have", () => {
    expect(matchAgainst(haystack, ["CPHQ"]).missingKeywords).toContain("CPHQ")
  })
})

describe("the same for the other sections the prompt truncates", () => {
  it("sees a project past the sixth", () => {
    const h = "Projects: alpha, beta, gamma, delta, epsilon, zeta, inventory system".toLowerCase()
    expect(matchAgainst(h, ["inventory system"]).missingKeywords).toHaveLength(0)
  })

  it("sees a degree the education cap would have hidden", () => {
    const h = "Education: a, b, c, d, e, f, contaduria publica".toLowerCase()
    expect(matchAgainst(h, ["contaduria publica"]).missingKeywords).toHaveLength(0)
  })

  it("sees a role past the tenth", () => {
    const roles = Array.from({ length: 12 }, (_, i) => `role ${i}`)
    const h = `Experience: ${roles.join(", ")}, soldadura tig`.toLowerCase()
    expect(matchAgainst(h, ["soldadura tig"]).missingKeywords).toHaveLength(0)
  })
})
