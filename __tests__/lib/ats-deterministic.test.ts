import { describe, it, expect } from "vitest"
import { computeATSMatch } from "@/lib/services/ai/shared/ats-matcher"

/**
 * The score has to answer one question: "did my edit help?".
 *
 * It could not, because the engine's INPUT was re-sampled on every run — the
 * model that reads the posting is not deterministic and `temperature` is dropped
 * for reasoning models. Same CV, same posting, different keywords, different
 * score. These pin the half we control: given the same keywords, the engine is
 * reproducible, and the missing soft skills come from here rather than from the
 * rate-limited tailor call.
 */
const keywords = {
  hardSkills: ["Swift", "SwiftUI", "UIKit", "GraphQL"],
  softSkills: ["mentoring", "communication"],
  jobTitle: "iOS Developer",
  mustHaves: ["5+ years of experience"],
}
const haystack = "swift swiftui uikit ios developer mentoring junior developers"
const sections = { summary: true, work: true, education: true, skills: true }

describe("ATS score — same input, same number", () => {
  it("returns an identical result across repeated runs", () => {
    const runs = Array.from({ length: 5 }, () =>
      computeATSMatch(keywords, haystack, "iOS Developer", sections, haystack),
    )
    for (const r of runs) {
      expect(r.score).toBe(runs[0].score)
      expect(r.missingKeywords).toEqual(runs[0].missingKeywords)
      expect(r.subScores).toEqual(runs[0].subScores)
    }
  })

  it("moves ONLY when the CV changes", () => {
    const before = computeATSMatch(keywords, haystack, "iOS Developer", sections, haystack)
    const after = computeATSMatch(keywords, haystack + " graphql", "iOS Developer", sections, haystack + " graphql")
    expect(after.score).toBeGreaterThan(before.score)
  })

  it("reports the soft skills the CV does not demonstrate", () => {
    // Previously only available as a by-product of the rate-limited tailor call,
    // so two analyses in a row left the list empty.
    const r = computeATSMatch(keywords, haystack, "iOS Developer", sections, haystack)
    expect(r.missingSoftSkills).toContain("communication")
    expect(r.missingSoftSkills).not.toContain("mentoring")
  })
})

describe("ATS score — the analysis and the live re-score must agree", () => {
  // Reported from a real CV: 70 in the report, 33 after editing. The full
  // analysis credits requirements the CV phrases differently through an
  // embedding pass; the instant re-score ran WITHOUT that set, so the same CV
  // lost those points the moment anything was re-scored.
  //
  // The terms below are deliberately outside the shared vocabulary — the exact
  // matcher already resolves known aliases ("APIs REST" ≡ "REST APIs"), so only
  // something it cannot know isolates what the embedding pass contributes.
  const jdKeywords = {
    hardSkills: ["stakeholder alignment", "capacity planning", "incident triage", "Swift"],
    softSkills: [],
    jobTitle: "iOS Developer",
    mustHaves: [],
  }
  const cv = "ios developer · swift · alineacion con interesados · planeacion de capacidad · clasificacion de incidentes"
  const sections = { summary: true, work: true, skills: true, education: true }
  // What the embedding pass proved equivalent (normalized, as the matcher stores them).
  const synonyms = new Set(["stakeholder alignment", "capacity planning", "incident triage"])

  it("credits the synonym set — and loses those points without it", () => {
    const withSynonyms = computeATSMatch(jdKeywords, cv, "iOS Developer", sections, cv, synonyms)
    const withoutSynonyms = computeATSMatch(jdKeywords, cv, "iOS Developer", sections, cv, undefined)
    expect(withSynonyms.score).toBeGreaterThan(withoutSynonyms.score)
    // Not a rounding difference — this gap IS the drop the user reported.
    expect(withSynonyms.score - withoutSynonyms.score).toBeGreaterThan(15)
  })

  it("gives the re-score the same number as the analysis when the set is carried", () => {
    const analysis = computeATSMatch(jdKeywords, cv, "iOS Developer", sections, cv, synonyms)
    const rescore = computeATSMatch(jdKeywords, cv, "iOS Developer", sections, cv, synonyms)
    expect(rescore.score).toBe(analysis.score)
    expect(rescore.missingKeywords).toEqual(analysis.missingKeywords)
  })
})
