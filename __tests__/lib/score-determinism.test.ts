import { describe, it, expect } from "vitest"
import { computeATSMatch } from "@/lib/services/ai/shared/ats-matcher"
import { applyTemplatePenalty } from "@/lib/ats/template-ats-safety"

/**
 * The promise the panel makes: the number moves when the CV moves, and only then.
 *
 * The reported failure was the same resume scoring 80 and then 71 with soft skills
 * falling from 100% to 80%. The scoring itself was never the culprit — it is pure —
 * the requirement lists it scores AGAINST were being re-derived by a model on every
 * run. These pin the half that must stay pure, so a future change cannot smuggle
 * variance into it; the other half is pinned by the answer cache.
 */
const KEYWORDS = {
  hardSkills: ["Swift", "SwiftUI", "UIKit", "REST APIs", "Kubernetes"],
  softSkills: ["Ownership", "Cross-functional collaboration"],
  jobTitle: "iOS Developer",
  mustHaves: ["Bachelor's degree"],
}
const HAY = "swift swiftui uikit rest apis ios developer bachelor's degree"
const EVIDENCE = "built swiftui screens and rest apis"
const SECTIONS = { summary: true, work: true, education: true, skills: true }

function runOnce(soft?: Set<string>) {
  const match = computeATSMatch(KEYWORDS, HAY, "iOS Developer", SECTIONS, EVIDENCE, undefined, "iOS Developer", soft)
  return { score: applyTemplatePenalty(match.score, "caution"), sub: match.subScores, missing: match.missingKeywords }
}

describe("the deterministic half of the score", () => {
  it("gives byte-identical results for identical inputs", () => {
    expect(JSON.stringify(runOnce())).toBe(JSON.stringify(runOnce()))
  })

  it("stays identical when the same soft-skill evidence is carried in", () => {
    const soft = new Set(["ownership"])
    expect(JSON.stringify(runOnce(soft))).toBe(JSON.stringify(runOnce(soft)))
  })

  // The whole point of carrying the evidence into the live re-score: without it,
  // typing one character collapsed the soft lever and the number dropped.
  it("does NOT collapse the soft lever when the evidence is carried", () => {
    const withEvidence = runOnce(new Set(["ownership", "cross-functional collaboration"]))
    const without = runOnce()
    expect(withEvidence.sub.softSkills).toBeGreaterThan(without.sub.softSkills ?? 0)
    expect(withEvidence.score).toBeGreaterThan(without.score)
  })

  it("the template correction is applied once, not compounded per call", () => {
    const a = runOnce().score
    const b = runOnce().score
    expect(a).toBe(b)
  })
})
