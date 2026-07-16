import { describe, it, expect } from "vitest"
import { applySuggestion } from "@/lib/services/ai/shared/apply-suggestion"
import type { ResumeSections, SkillItem, WorkExperienceItem } from "@/types/resume"

const sections = (over: Partial<ResumeSections> = {}) => ({
  summary: "iOS developer.",
  personalDetails: { firstName: "Ana", lastName: "Rivas", jobTitle: "Dev" },
  skills: [{ id: "s1", name: "Swift", level: "expert" }],
  workExperience: [
    { id: "w1", jobTitle: "iOS Dev", employer: "Xiobit", description: "• Alpha\n• Beta" },
    { id: "w2", jobTitle: "Junior Dev", employer: "Salamanca", description: "• Gamma" },
  ],
  ...over,
}) as unknown as ResumeSections

describe("applySuggestion — summary", () => {
  it("replaces", () => {
    const r = applySuggestion({ field: "summary", type: "replace", preview: "New." }, sections())
    expect(r).toEqual({ status: "applied", section: "summary", value: "New." })
  })

  it("appends with a space", () => {
    const r = applySuggestion({ field: "summary", type: "append", preview: "More." }, sections())
    expect(r).toMatchObject({ value: "iOS developer. More." })
  })

  it("appends onto an empty summary without a leading space", () => {
    const r = applySuggestion({ field: "summary", type: "append", preview: "Only." }, sections({ summary: "" }))
    expect(r).toMatchObject({ value: "Only." })
  })
})

describe("applySuggestion — personalDetails.jobTitle", () => {
  it("sets the title and keeps the other fields", () => {
    const r = applySuggestion({ field: "personalDetails.jobTitle", type: "replace", preview: "Senior Dev" }, sections())
    expect(r).toMatchObject({ section: "personalDetails", value: { firstName: "Ana", lastName: "Rivas", jobTitle: "Senior Dev" } })
  })
})

describe("applySuggestion — skills", () => {
  it("appends comma-separated skills", () => {
    const r = applySuggestion({ field: "skills", type: "replace", preview: "Combine, XCTest" }, sections())
    const value = (r as { value: SkillItem[] }).value
    expect(value.map((s) => s.name)).toEqual(["Swift", "Combine", "XCTest"])
    expect(value[1]).toMatchObject({ level: "intermediate" })
  })

  it("does not duplicate an existing skill, whatever the case", () => {
    const r = applySuggestion({ field: "skills", type: "replace", preview: "swift, Combine" }, sections())
    expect((r as { value: SkillItem[] }).value.map((s) => s.name)).toEqual(["Swift", "Combine"])
  })

  it("ignores empty entries", () => {
    const r = applySuggestion({ field: "skills", type: "replace", preview: "Combine, , ,  " }, sections())
    expect((r as { value: SkillItem[] }).value).toHaveLength(2)
  })
})

describe("applySuggestion — workExperience", () => {
  const work = (r: ApplyReturn) => (r as { value: WorkExperienceItem[] }).value
  type ApplyReturn = ReturnType<typeof applySuggestion>

  it("targets the job by id, not by position", () => {
    const r = applySuggestion(
      { field: "workExperience.description", type: "replace", preview: "• Rebuilt Gamma", targetId: "w2" },
      sections(),
    )
    expect(work(r)[0].description).toBe("• Alpha\n• Beta")   // untouched
    expect(work(r)[1].description).toBe("• Rebuilt Gamma")
  })

  // The bug this module exists to prevent: without a targetId the old code wrote
  // to workExperience[0] — the wrong job, silently. review-cv does omit it.
  it("refuses to guess when there is no targetId", () => {
    expect(applySuggestion(
      { field: "workExperience.description", type: "replace", preview: "• X" },
      sections(),
    )).toEqual({ status: "unplaceable" })
  })

  it("refuses when the targetId matches no job", () => {
    expect(applySuggestion(
      { field: "workExperience.description", type: "replace", preview: "• X", targetId: "nope" },
      sections(),
    )).toEqual({ status: "unplaceable" })
  })

  // The other bug: append joined with " ", welding every existing bullet into
  // one run-on line.
  it("appends bullets as new lines, never welded onto one", () => {
    const r = applySuggestion(
      { field: "workExperience.description", type: "append", preview: "• Delta", targetId: "w1" },
      sections(),
    )
    expect(work(r)[0].description).toBe("• Alpha\n• Beta\n• Delta")
  })

  it("keeps every bullet on replace", () => {
    const r = applySuggestion(
      { field: "workExperience.description", type: "replace", preview: "• One\n• Two\n• Three", targetId: "w1" },
      sections(),
    )
    expect(work(r)[0].description.split("\n")).toHaveLength(3)
  })

  it("normalises an unmarked preview into bullets", () => {
    const r = applySuggestion(
      { field: "workExperience.description", type: "replace", preview: "Alpha\nBeta", targetId: "w1" },
      sections(),
    )
    expect(work(r)[0].description).toBe("• Alpha\n• Beta")
  })

  it("replaces a job title", () => {
    const r = applySuggestion(
      { field: "workExperience.jobTitle", type: "replace", preview: "Senior iOS Engineer", targetId: "w1" },
      sections(),
    )
    expect(work(r)[0].jobTitle).toBe("Senior iOS Engineer")
    expect(work(r)[0].description).toBe("• Alpha\n• Beta")   // description untouched
  })

  it("appends a job title with a space, not a newline", () => {
    const r = applySuggestion(
      { field: "workExperience.jobTitle", type: "append", preview: "(Contract)", targetId: "w1" },
      sections(),
    )
    expect(work(r)[0].jobTitle).toBe("iOS Dev (Contract)")
  })

  it("does not mutate the input", () => {
    const s = sections()
    const before = JSON.stringify(s)
    applySuggestion({ field: "workExperience.description", type: "replace", preview: "• X", targetId: "w1" }, s)
    expect(JSON.stringify(s)).toBe(before)
  })
})

describe("applySuggestion — manual sections", () => {
  it("reports languages as manual", () => {
    expect(applySuggestion({ field: "languages", type: "replace", preview: "English" }, sections()))
      .toEqual({ status: "manual", field: "languages" })
  })

  it("reports certifications as manual", () => {
    expect(applySuggestion({ field: "certifications", type: "replace", preview: "AWS" }, sections()))
      .toEqual({ status: "manual", field: "certifications" })
  })
})
