import { describe, it, expect } from "vitest"
import { groundFixAction } from "@/lib/ats/fix-actions"

/**
 * The validator decides whether a finding gets a button. It used to look at the
 * summary and job descriptions only — so a typo in a job TITLE or a SKILL was
 * "not in the CV", the action degraded to advice, and the user was shown the
 * correct spelling with no way to apply it. Reported from the panel: "Debeloper"
 * and "Objetive-C", both with no button.
 */
const CV = {
  summary: "iOS Developer with 7 years shipping apps",
  personalDetails: { firstName: "Miguel", jobTitle: "iOS Developer" },
  workExperience: [
    { id: "j1", jobTitle: "iOS Developer & Web Debeloper & Mobile Developer", employer: "Salamanca Solutions", description: "• Built the checkout screen" },
  ],
  skills: [{ name: "Objetive-C", level: "Advanced" }, { name: "Swift", level: "Expert" }],
  education: [{ school: "Universidad Mayor", degree: "Ingeniería de Sistemas" }],
}

const replace = (from: string, to: string) => ({ kind: "replace_text" as const, value: from, replacement: to })

describe("replace_text is grounded against the WHOLE resume", () => {
  it("finds a typo in a job title", () => {
    expect(groundFixAction(replace("Debeloper", "Developer"), CV)).toEqual(replace("Debeloper", "Developer"))
  })

  it("finds a typo in a skill", () => {
    expect(groundFixAction(replace("Objetive-C", "Objective-C"), CV)).toEqual(replace("Objetive-C", "Objective-C"))
  })

  it("finds text in education — a section the old haystack never read", () => {
    expect(groundFixAction(replace("Ingeniería de Sistemas", "Ingeniería de Sistemas Computacionales"), CV).kind).toBe("replace_text")
  })

  it("still finds the cases it always did", () => {
    expect(groundFixAction(replace("checkout screen", "checkout flow"), CV).kind).toBe("replace_text")
    expect(groundFixAction(replace("7 years", "seven years"), CV).kind).toBe("replace_text")
  })

  // The reason the check exists: a find-and-replace whose target is not there
  // either does nothing or lands somewhere it does not belong.
  it("refuses text that is nowhere in the resume", () => {
    expect(groundFixAction(replace("Kubernetes", "Docker"), CV)).toEqual({ kind: "manual" })
  })

  it("refuses a no-op replacement", () => {
    expect(groundFixAction(replace("Swift", "Swift"), CV)).toEqual({ kind: "manual" })
  })

  it("refuses an empty target", () => {
    expect(groundFixAction(replace("", "Developer"), CV)).toEqual({ kind: "manual" })
  })

  it("survives a resume with missing sections", () => {
    expect(groundFixAction(replace("x", "y"), {})).toEqual({ kind: "manual" })
  })
})
