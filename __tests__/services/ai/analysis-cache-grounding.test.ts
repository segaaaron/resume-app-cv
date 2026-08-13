import { describe, it, expect } from "vitest"
import { groundFixAction } from "@/lib/ats/fix-actions"

/**
 * The analysis cache is keyed on the CV's TEXT, and two resumes can share text —
 * duplicating a CV is a feature of this product. The stored actions point at job
 * ids, which the duplicate does not have. These pin the behaviour the grounding
 * pass has to provide on every read, not once at write time.
 */
describe("a cached analysis must be re-bound to the resume in front of us", () => {
  const original = {
    workExperience: [{ id: "job-original", jobTitle: "iOS Developer", description: "• Built the checkout screen\n• Wrote tests" }],
  }
  const duplicate = {
    workExperience: [{ id: "job-copy", jobTitle: "iOS Developer", description: "• Built the checkout screen\n• Wrote tests" }],
  }

  it("keeps the action on the resume it was written for", () => {
    const action = { kind: "rewrite_bullet" as const, targetId: "job-original", index: 0 }
    expect(groundFixAction(action, original)).toEqual(action)
  })

  it("degrades to advice on a copy whose ids differ — never edits a job that is not there", () => {
    const action = { kind: "rewrite_bullet" as const, targetId: "job-original", index: 0 }
    expect(groundFixAction(action, duplicate)).toEqual({ kind: "manual" })
  })

  it("degrades when the bullet the analysis pointed at no longer exists", () => {
    const action = { kind: "rewrite_bullet" as const, targetId: "job-original", index: 7 }
    expect(groundFixAction(action, original)).toEqual({ kind: "manual" })
  })
})

describe("structuredClone protects the cached analysis from its own reader", () => {
  // The caller prunes criticalFixes before rendering. Doing that to the cached
  // object meant each read returned fewer findings than the last, on a CV nobody
  // had touched.
  it("pruning a copy leaves the source intact", () => {
    const cached = { criticalFixes: [{ issue: "a" }, { issue: "b" }] }
    const copy = structuredClone(cached)
    copy.criticalFixes = copy.criticalFixes.filter((f) => f.issue !== "a")
    expect(copy.criticalFixes).toHaveLength(1)
    expect(cached.criticalFixes).toHaveLength(2)
  })
})
