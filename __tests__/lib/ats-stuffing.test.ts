import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { computeATSMatch } from "@/lib/services/ai/shared/ats-matcher"

const KEYWORDS = {
  hardSkills: ["React", "TypeScript", "GraphQL", "AWS"],
  softSkills: ["Communication"],
  jobTitle: "Senior Frontend Engineer",
  mustHaves: ["5+ years experience"],
}
const SECTIONS = { summary: true, work: true, skills: true, education: true }

// A real CV: the skills appear inside the work the candidate describes.
const HONEST_CV =
  "Senior Frontend Engineer. Built the checkout with React and TypeScript. Deployed on AWS. Strong communication with product. 5+ years experience."
const HONEST_EVIDENCE =
  "Senior Frontend Engineer at Acme. Built the checkout with React and TypeScript. Deployed on AWS. Worked with product on communication."

// The stuffed CV: every keyword present, no work behind any of them. This is
// what "+ Add all" produced, and what the scorer used to reward.
const STUFFED_CV =
  "React TypeScript GraphQL AWS Communication 5+ years experience Senior Frontend Engineer"
const STUFFED_EVIDENCE = "Worked at Acme."

describe("computeATSMatch — listed vs demonstrated", () => {
  it("counts a skill the work experience backs up as demonstrated", () => {
    const r = computeATSMatch(KEYWORDS, HONEST_CV, "Senior Frontend Engineer", SECTIONS, HONEST_EVIDENCE)
    expect(r.demonstratedKeywords).toEqual(expect.arrayContaining(["React", "TypeScript", "AWS"]))
    expect(r.listedOnlyKeywords).not.toContain("React")
  })

  // The whole point: a keyword dump still moves the coverage score — the word IS
  // there — but every one of them comes back unbacked, so the user sees exactly
  // which claims their own CV does not support.
  it("marks every keyword in a stuffed CV as listed-only", () => {
    const r = computeATSMatch(KEYWORDS, STUFFED_CV, "Senior Frontend Engineer", SECTIONS, STUFFED_EVIDENCE)
    expect(r.demonstratedKeywords).toEqual([])
    expect(r.listedOnlyKeywords).toEqual(expect.arrayContaining(["React", "TypeScript", "GraphQL", "AWS"]))
  })

  // A strength is something the CV shows, not something it claims. This is what
  // stopped a bare keyword list from reading as a strong candidate.
  it("gives a stuffed CV no strengths and an honest CV several", () => {
    const stuffed = computeATSMatch(KEYWORDS, STUFFED_CV, "Senior Frontend Engineer", SECTIONS, STUFFED_EVIDENCE)
    const honest = computeATSMatch(KEYWORDS, HONEST_CV, "Senior Frontend Engineer", SECTIONS, HONEST_EVIDENCE)
    expect(stuffed.demonstratedKeywords.length).toBe(0)
    expect(honest.demonstratedKeywords.length).toBeGreaterThan(2)
  })

  it("splits matched into exactly demonstrated + listed-only", () => {
    const r = computeATSMatch(KEYWORDS, HONEST_CV, "Senior Frontend Engineer", SECTIONS, HONEST_EVIDENCE)
    const hardMatched = r.matchedKeywords
    const covered = [...r.demonstratedKeywords, ...r.listedOnlyKeywords]
    for (const k of hardMatched) expect(covered).toContain(k)
  })

  it("treats everything as unbacked when no evidence text is given", () => {
    // The parameter is optional so existing callers keep working; without it
    // nothing can be shown to be demonstrated, which is the safe default.
    const r = computeATSMatch(KEYWORDS, HONEST_CV, "Senior Frontend Engineer", SECTIONS)
    expect(r.demonstratedKeywords).toEqual([])
  })

  it("still finds a demonstrated skill through an alias", () => {
    const r = computeATSMatch(
      { ...KEYWORDS, hardSkills: ["Amazon Web Services"] },
      "Engineer. Ran the platform on AWS.",
      "Engineer",
      SECTIONS,
      "Engineer at Acme. Ran the platform on AWS for three years.",
    )
    expect(r.demonstratedKeywords).toContain("Amazon Web Services")
  })

  it("does not report a missing skill as either demonstrated or listed", () => {
    const r = computeATSMatch(KEYWORDS, HONEST_CV, "Senior Frontend Engineer", SECTIONS, HONEST_EVIDENCE)
    expect(r.missingKeywords).toContain("GraphQL")
    expect(r.demonstratedKeywords).not.toContain("GraphQL")
    expect(r.listedOnlyKeywords).not.toContain("GraphQL")
  })
})

/**
 * The title sub-score tokenizes a job title by dropping FUNCTION words only.
 * These lock in the boundary against the recurring "just share one stopword list
 * with the free analyzer" refactor — that list strips prose from a job
 * description and swallows words that ARE the title.
 */
describe("computeATSMatch — title tokenization", () => {
  const SECTIONS = { summary: true, work: true, skills: true, education: true }
  const NO_KEYWORDS = { hardSkills: [], softSkills: [], mustHaves: [] }
  const titlePct = (jdTitle: string, cvTitles: string) =>
    computeATSMatch({ ...NO_KEYWORDS, jobTitle: jdTitle }, "", cvTitles, SECTIONS).subScores.title

  it("keeps words the free analyzer treats as prose filler", () => {
    // "team" and "support" are stopwords for the JD-prose scanner. Here they carry
    // the whole title — dropping them would score any *Lead / any *Engineer as 100%.
    expect(titlePct("Team Lead", "Team Lead")).toBe(100)
    expect(titlePct("Team Lead", "Tech Lead")).toBe(50)
    expect(titlePct("Support Engineer", "Sales Engineer")).toBe(50)
  })

  it("ignores connectors so they cannot inflate the match", () => {
    // "of"/"de" are length-filtered; "for"/"para"/"the"/"del" come off the list.
    expect(titlePct("Head of Design", "Design Director")).toBe(50)
    expect(titlePct("Ingeniero de Sistemas", "Sistemas Distribuidos")).toBe(50)
    // "for"/"the" drop out; analyst·risk·team survive → 2 of 3 matched.
    expect(titlePct("Analyst for the Risk Team", "Risk Analyst")).toBe(67)
    expect(titlePct("Desarrollador para Web", "Desarrollador Web")).toBe(100)
  })

  it("returns null when a title is nothing but connectors", () => {
    expect(titlePct("the and for", "Engineer")).toBeNull()
  })
})
