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
  it("no longer carries suggestions — the recruiter analysis owns the findings", () => {
    // Two lists telling the user to do the same work is what this removed.
    const parsed = ATSExtractionSchema.parse({
      hardSkills: ["Swift"], softSkills: [], jobTitle: "iOS Developer", mustHaves: [], summary: "",
      suggestions: ["ADD 'Kubernetes' to your Skills section"],
    })
    expect("suggestions" in parsed).toBe(false)
    expect(parsed.hardSkills).toEqual(["Swift"])
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

describe("fix_dates — the calendar is code's job, not the model's", () => {
  const clean = {
    workExperience: [
      { id: "w1", jobTitle: "iOS Developer", employer: "IA interactive", startDate: "01/2023", endDate: "06/2026", description: "- Shipped the payments flow" },
      { id: "w2", jobTitle: "Developer", employer: "Xiobit", startDate: "01/2015", endDate: "12/2016", description: "- Built the sync layer" },
    ],
  }

  it("draws no button when the dates are consistent and in the past", () => {
    // Reported: "(2023 – 2026)" raised as a future date, in August 2026, with a
    // proposed rewrite to "Present" that the button could never have produced.
    expect(groundFixAction({ kind: "fix_dates" }, clean)).toEqual({ kind: "manual" })
  })

  it("keeps the button when formats really are mixed", () => {
    const mixed = {
      workExperience: [
        { ...clean.workExperience[0], endDate: "June 2026" },
        clean.workExperience[1],
      ],
    }
    expect(groundFixAction({ kind: "fix_dates" }, mixed)).toEqual({ kind: "fix_dates" })
  })
})

describe("remove_duplicates — the button only appears when it can act", () => {
  it("is not drawn for two lines that merely say the same thing", () => {
    // Reported: the finding said "this repeats the previous bullet almost
    // exactly" and pressing the button answered "no repeated lines left". The
    // collapser only removes IDENTICAL lines; a near duplicate is a rewrite, and
    // only the candidate can say which half to keep.
    const near = {
      workExperience: [{
        id: "w1",
        description: "- Implemented authentication flows for the app\n- Implemented Authentication flows for the app with secure data handling",
      }],
    }
    expect(groundFixAction({ kind: "remove_duplicates" }, near)).toEqual({ kind: "manual" })
  })

  it("is drawn when a line really is written twice", () => {
    const exact = {
      workExperience: [{ id: "w1", description: "- Built the payments flow\n- Built the payments flow" }],
    }
    expect(groundFixAction({ kind: "remove_duplicates" }, exact)).toEqual({ kind: "remove_duplicates" })
  })

  it("survives malformed data without throwing", () => {
    expect(groundFixAction({ kind: "remove_duplicates" }, { workExperience: [{ id: "w1", description: 5 }] })).toEqual({ kind: "manual" })
  })
})
