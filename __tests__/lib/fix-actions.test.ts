import { describe, it, expect } from "vitest"
import { groundFixAction } from "@/lib/ats/fix-actions"
import { ATSExtractionSchema, CvAnalysisSchema } from "@/lib/services/ai/shared/ai-types"

const CV = {
  summary: "Desarrollador iOS con más de 7 años de experiencia.",
  workExperience: [
    { id: "w1", jobTitle: "iOS Developer", description: "• Bullet uno\n• Bullet dos" },
  ],
}

// Every rendered button edits the user's CV, so an action that names something
// the CV does not contain must never reach the UI.
describe("groundFixAction", () => {
  it("keeps a bullet action that points at a real bullet", () => {
    expect(groundFixAction({ kind: "rewrite_bullet", targetId: "w1", index: 1 }, CV))
      .toEqual({ kind: "rewrite_bullet", targetId: "w1", index: 1 })
  })

  it("downgrades a bullet index past the end of the job", () => {
    expect(groundFixAction({ kind: "rewrite_bullet", targetId: "w1", index: 5 }, CV)).toEqual({ kind: "manual" })
  })

  it("downgrades a job that does not exist", () => {
    expect(groundFixAction({ kind: "rewrite_bullet", targetId: "nope", index: 0 }, CV)).toEqual({ kind: "manual" })
  })

  it("downgrades a bullet action with no index at all", () => {
    expect(groundFixAction({ kind: "rewrite_bullet", targetId: "w1" }, CV)).toEqual({ kind: "manual" })
  })

  it("downgrades add_skill with no skill", () => {
    expect(groundFixAction({ kind: "add_skill", value: "  " }, CV)).toEqual({ kind: "manual" })
    expect(groundFixAction({ kind: "add_skill", value: "GraphQL" }, CV)).toEqual({ kind: "add_skill", value: "GraphQL" })
  })

  it("downgrades rewrite_summary when there is no summary to rewrite", () => {
    expect(groundFixAction({ kind: "rewrite_summary" }, { workExperience: CV.workExperience })).toEqual({ kind: "manual" })
    expect(groundFixAction({ kind: "rewrite_summary" }, CV)).toEqual({ kind: "rewrite_summary" })
  })

  it("downgrades CV-wide actions when there is no experience at all", () => {
    expect(groundFixAction({ kind: "fix_dates" }, {})).toEqual({ kind: "manual" })
    expect(groundFixAction({ kind: "remove_duplicates" }, {})).toEqual({ kind: "manual" })
  })
})

describe("schemas tolerate what the model actually returns", () => {
  it("accepts a suggestion written as a plain string — it just gets no button", () => {
    const parsed = ATSExtractionSchema.parse({
      hardSkills: [], softSkills: [], jobTitle: "", mustHaves: [], summary: "",
      suggestions: ["ADD 'Kubernetes' to your Skills section"],
    })
    expect(parsed.suggestions).toEqual([
      { text: "ADD 'Kubernetes' to your Skills section", action: { kind: "manual" } },
    ])
  })

  it("keeps the other suggestions when one action is malformed", () => {
    const parsed = ATSExtractionSchema.parse({
      hardSkills: [], softSkills: [], jobTitle: "", mustHaves: [], summary: "",
      suggestions: [
        { text: "Add GraphQL", action: { kind: "add_skill", value: "GraphQL" } },
        { text: "Something", action: { kind: "not_a_kind" } },
      ],
    })
    expect(parsed.suggestions).toHaveLength(2)
    expect(parsed.suggestions[1].action.kind).toBe("manual")
  })

  it("defaults a critical fix with no action at all to manual", () => {
    const parsed = CvAnalysisSchema.parse({
      verdict: "v", passRisk: "high",
      criticalFixes: [{ issue: "i", why: "w", fix: "f", severity: "high" }],
      strengths: [],
    })
    expect(parsed.criticalFixes[0].action).toEqual({ kind: "manual" })
  })
})
