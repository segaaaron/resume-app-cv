import { describe, it, expect } from "vitest"
import {
  normalize,
  keywordPresent,
  computeATSMatch,
  scoreLabel,
  type ATSKeywords,
  type SectionPresence,
} from "@/lib/services/ai/shared/ats-matcher"

const FULL_SECTIONS: SectionPresence = { summary: true, work: true, skills: true, education: true }

function keywords(partial: Partial<ATSKeywords>): ATSKeywords {
  return { hardSkills: [], softSkills: [], jobTitle: "", mustHaves: [], ...partial }
}

describe("normalize", () => {
  it("lowercases, strips accents and punctuation, collapses whitespace", () => {
    expect(normalize("Gestión  de  Proyectos!")).toBe("gestion de proyectos")
  })
  it("keeps technical characters", () => {
    expect(normalize("Node.js / C++ / CI/CD")).toBe("node.js / c++ / ci/cd")
  })
})

describe("keywordPresent", () => {
  it("matches whole tokens, not substrings", () => {
    // 'java' must NOT match inside 'javascript'
    expect(keywordPresent("Java", normalize("Experienced in JavaScript"))).toBe(false)
    expect(keywordPresent("JavaScript", normalize("Experienced in JavaScript"))).toBe(true)
  })
  it("is accent-insensitive", () => {
    expect(keywordPresent("gestion", normalize("Gestión de equipos"))).toBe(true)
  })
  it("resolves aliases (js ↔ javascript)", () => {
    expect(keywordPresent("JavaScript", normalize("5 years of JS"))).toBe(true)
    expect(keywordPresent("K8s", normalize("Deployed on Kubernetes"))).toBe(true)
  })
  it("matches multi-word phrases", () => {
    expect(keywordPresent("project management", normalize("Led project management for the team"))).toBe(true)
  })
})

describe("computeATSMatch", () => {
  it("is deterministic — same input yields identical output", () => {
    const kw = keywords({ hardSkills: ["React", "AWS", "Docker"] })
    const cv = "Built web apps with React and Docker at scale."
    const a = computeATSMatch(kw, cv, "Frontend Engineer", FULL_SECTIONS)
    const b = computeATSMatch(kw, cv, "Frontend Engineer", FULL_SECTIONS)
    expect(a).toEqual(b)
  })

  it("computes verified missing keywords as a set-difference", () => {
    const kw = keywords({ hardSkills: ["React", "AWS", "Docker"] })
    const cv = "Built apps with React and Docker."
    const res = computeATSMatch(kw, cv, "", FULL_SECTIONS)
    expect(res.matchedKeywords).toEqual(["React", "Docker"])
    expect(res.missingKeywords).toEqual(["AWS"])
    expect(res.subScores.hardSkills).toBe(67) // 2/3
  })

  it("does not flag a present keyword as missing (fixes false-missing bug)", () => {
    const kw = keywords({ hardSkills: ["JavaScript"] })
    const res = computeATSMatch(kw, "Strong JS background", "", FULL_SECTIONS)
    expect(res.missingKeywords).toEqual([])
    expect(res.matchedKeywords).toEqual(["JavaScript"])
  })

  it("recency weight: current title = full credit, old-title-only = partial", () => {
    const kw = keywords({ jobTitle: "iOS Developer" })
    const allTitles = "Barista iOS Developer" // has iOS Developer, but as an OLD role
    // recentTitles = current role only (Barista) → iOS tokens matched only in old title → 60%.
    const old = computeATSMatch(kw, "resume", allTitles, FULL_SECTIONS, "", undefined, "Barista")
    expect(old.subScores.title).toBe(60)
    // recentTitles = iOS Developer (current) → full credit.
    const current = computeATSMatch(kw, "resume", allTitles, FULL_SECTIONS, "", undefined, "iOS Developer")
    expect(current.subScores.title).toBe(100)
    // No recentTitles supplied → legacy behavior, full credit (no recency applied).
    const legacy = computeATSMatch(kw, "resume", allTitles, FULL_SECTIONS)
    expect(legacy.subScores.title).toBe(100)
  })

  it("credits a keyword found only by the semantic pass (embeddings recall)", () => {
    const kw = keywords({ hardSkills: ["APIs REST"] })
    const cv = "Diseñé servicios web" // exact matcher would NOT find "apis rest" here
    // Without semantic matches → missing.
    expect(computeATSMatch(kw, cv, "", FULL_SECTIONS).missingKeywords).toEqual(["APIs REST"])
    // With the semantic pass having proven it present → matched, no longer missing.
    const withSem = computeATSMatch(kw, cv, "", FULL_SECTIONS, "", new Set(["apis rest"]))
    expect(withSem.missingKeywords).toEqual([])
    expect(withSem.matchedKeywords).toEqual(["APIs REST"])
    // Semantic-only match is "listed", never "demonstrated" (no work-experience evidence).
    expect(withSem.listedOnlyKeywords).toContain("APIs REST")
  })

  it("returns null sub-score for categories the JD did not specify", () => {
    const kw = keywords({ hardSkills: ["React"] }) // no soft skills, no title
    const res = computeATSMatch(kw, "React dev", "", FULL_SECTIONS)
    expect(res.subScores.softSkills).toBeNull()
    expect(res.subScores.title).toBeNull()
    expect(res.subScores.hardSkills).toBe(100)
  })

  it("perfect coverage yields a high score, zero coverage a low one", () => {
    const kw = keywords({ hardSkills: ["React", "Docker"], jobTitle: "React Developer" })
    const strong = computeATSMatch(kw, "React and Docker expert", "React Developer", FULL_SECTIONS)
    const weak = computeATSMatch(kw, "Accountant with Excel skills", "Accountant", FULL_SECTIONS)
    expect(strong.score).toBeGreaterThanOrEqual(90)
    expect(weak.score).toBeLessThan(40)
  })

  it("does not penalize missing categories via weight renormalization", () => {
    // Only hard skills specified, fully matched → score should be ~100 despite
    // soft/title being absent.
    const kw = keywords({ hardSkills: ["Python"] })
    const res = computeATSMatch(kw, "Python engineer", "", FULL_SECTIONS)
    expect(res.score).toBe(100)
  })

  it("reflects incomplete CV sections in the sections sub-score", () => {
    const kw = keywords({ hardSkills: ["React"] })
    const res = computeATSMatch(kw, "React dev", "", { summary: true, work: true, skills: false, education: false })
    expect(res.subScores.sections).toBe(50) // 2/4
  })

  it("separates missing must-haves from missing keywords", () => {
    const kw = keywords({ hardSkills: ["React"], mustHaves: ["5 years experience", "Bachelor's degree"] })
    const res = computeATSMatch(kw, "React dev with a Bachelor's degree", "", FULL_SECTIONS)
    expect(res.missingMustHaves).toEqual(["5 years experience"])
    expect(res.missingKeywords).toEqual([])
  })
})

describe("scoreLabel", () => {
  it("buckets scores correctly", () => {
    expect(scoreLabel(95)).toBe("excellent")
    expect(scoreLabel(70)).toBe("good")
    expect(scoreLabel(45)).toBe("fair")
    expect(scoreLabel(20)).toBe("low")
  })
})
