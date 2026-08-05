import { describe, it, expect } from "vitest"
import { applySuggestion, previewSuggestion } from "@/lib/services/ai/shared/apply-suggestion"
import type { ResumeSections, WorkExperienceItem } from "@/types/resume"

/**
 * The contract these tests defend: what the confirmation modal SHOWS and what
 * the editor WRITES come from the same code path. A preview computed by a second
 * implementation drifts — that is exactly how an appended bullet ended up joined
 * with a space on screen and a newline in the CV.
 */
const cv = {
  summary: "Ingeniero de software con experiencia en pagos.",
  personalDetails: { firstName: "Ana", jobTitle: "Backend Engineer" },
  skills: [{ id: "s1", name: "React", level: "advanced" }],
  workExperience: [
    {
      id: "job-1",
      employer: "Acme",
      jobTitle: "Backend Engineer",
      description: "Construí la API de pagos\nLideré la migración a Postgres",
    },
    { id: "job-2", employer: "Globex", jobTitle: "Dev", description: "Mantuve el portal interno" },
  ],
} as unknown as ResumeSections

const descriptionOf = (data: ResumeSections, id: string) =>
  ((data.workExperience ?? []) as WorkExperienceItem[]).find((j) => j.id === id)?.description ?? ""

describe("previewSuggestion matches what applySuggestion writes", () => {
  it("appends a bullet exactly as it will be stored (newline, not space)", () => {
    const input = {
      field: "workExperience.description" as const,
      type: "append" as const,
      preview: "Mentoré a dos desarrolladores junior",
      targetId: "job-1",
    }
    const preview = previewSuggestion(input, cv)
    const applied = applySuggestion(input, cv)

    expect(applied.status).toBe("applied")
    if (applied.status !== "applied" || applied.section !== "workExperience") throw new Error("unexpected")
    const written = descriptionOf({ workExperience: applied.value } as ResumeSections, "job-1")

    expect(preview?.after).toBe(written)
    expect(preview?.after).toContain("\n")
    // The regression this guards: a space-joined preview.
    expect(preview?.after).not.toContain("Postgres Mentoré")
  })

  it("previews a replaced description as the stored value", () => {
    const input = {
      field: "workExperience.description" as const,
      type: "replace" as const,
      preview: "Reduje la latencia de pagos un 40%",
      targetId: "job-1",
    }
    const preview = previewSuggestion(input, cv)
    const applied = applySuggestion(input, cv)
    if (applied.status !== "applied" || applied.section !== "workExperience") throw new Error("unexpected")

    expect(preview?.before).toBe(descriptionOf(cv, "job-1"))
    expect(preview?.after).toBe(descriptionOf({ workExperience: applied.value } as ResumeSections, "job-1"))
    // serializeBullets prefixes the bullet glyph. The old modal rebuilt the text
    // itself and showed it WITHOUT the glyph, so the confirmed text and the
    // stored text differed by the very first characters on the line.
    expect(preview?.after.startsWith("• ")).toBe(true)
  })

  it("shows only the job that changes, never another one", () => {
    const preview = previewSuggestion(
      { field: "workExperience.description", type: "append", preview: "Nuevo logro", targetId: "job-2" },
      cv
    )
    expect(preview?.before).toBe("Mantuve el portal interno")
    expect(preview?.after).not.toContain("API de pagos")
  })

  it("previews a summary append with the same separator the write uses", () => {
    const input = { field: "summary" as const, type: "append" as const, preview: "Enfocado en ATS." }
    const preview = previewSuggestion(input, cv)
    const applied = applySuggestion(input, cv)
    if (applied.status !== "applied" || applied.section !== "summary") throw new Error("unexpected")
    expect(preview?.after).toBe(applied.value)
  })

  it("previews added skills as the resulting list", () => {
    const preview = previewSuggestion(
      { field: "skills", type: "append", preview: "TypeScript, GraphQL" },
      cv
    )
    expect(preview?.before).toBe("React")
    expect(preview?.after).toBe("React, TypeScript, GraphQL")
  })

  it("previews a job title change", () => {
    const preview = previewSuggestion(
      { field: "personalDetails.jobTitle", type: "replace", preview: "Senior Backend Engineer" },
      cv
    )
    expect(preview).toEqual({ before: "Backend Engineer", after: "Senior Backend Engineer" })
  })

  it("returns null when the suggestion cannot be placed (never guesses a job)", () => {
    expect(
      previewSuggestion(
        { field: "workExperience.description", type: "replace", preview: "x", targetId: "does-not-exist" },
        cv
      )
    ).toBeNull()
    // …and null for fields the user must edit by hand.
    expect(previewSuggestion({ field: "languages", type: "replace", preview: "Inglés C1" }, cv)).toBeNull()
  })
})
