// lib/services/ai/shared/apply-suggestion.ts
// Single owner of "what does accepting an AI suggestion write into the CV".
//
// ATSScorePanel renders review-cv suggestions — its textarea reroutes to
// review-cv when the user types a question. This logic used to be duplicated in a
// second panel; two bugs were fixed in one copy and survived untouched in the
// other for hours: a missing targetId silently rewrote
// workExperience[0], and an append welded every existing bullet onto one line.
// Duplicated write paths over user data are how that happens, so there is one
// now. It is pure: callers own the toasts and the modal.
import { nanoid } from "nanoid"
import type { PersonalDetails, ResumeSections, SkillItem, WorkExperienceItem } from "@/types/resume"
import { parseBullets, serializeBullets } from "./bullets"

export type SuggestionField =
  | "summary"
  | "personalDetails.jobTitle"
  | "skills"
  | "workExperience.description"
  | "workExperience.jobTitle"
  | "languages"
  | "certifications"

export interface ApplyInput {
  field: SuggestionField
  type: "replace" | "append"
  preview: string
  targetId?: string
}

/**
 * `section` and `value` stay paired per branch, so a caller can hand them to
 * updateSectionData without a cast — a cast here would let a wrong-shaped value
 * reach the store silently.
 */
export type ApplyResult =
  | { status: "applied"; section: "summary"; value: ResumeSections["summary"] }
  | { status: "applied"; section: "personalDetails"; value: ResumeSections["personalDetails"] }
  | { status: "applied"; section: "skills"; value: ResumeSections["skills"] }
  | { status: "applied"; section: "workExperience"; value: ResumeSections["workExperience"] }
  /** Nothing to write — the user has to do this one by hand. */
  | { status: "manual"; field: "languages" | "certifications" }
  /** The suggestion names no job we can find. Never guess with user data. */
  | { status: "unplaceable" }

/**
 * Computes the section update for an accepted suggestion. Returns `unplaceable`
 * rather than falling back to the first job: review-cv does omit targetId in
 * practice, and guessing rewrites whichever job happens to be first.
 */
export function applySuggestion(input: ApplyInput, sectionData: ResumeSections): ApplyResult {
  const { field, type, preview, targetId } = input

  if (field === "summary") {
    const current = (sectionData.summary as string) ?? ""
    return {
      status: "applied",
      section: "summary",
      value: type === "append" ? [current, preview].filter(Boolean).join(" ") : preview,
    }
  }

  if (field === "personalDetails.jobTitle") {
    const pd = (sectionData.personalDetails ?? {}) as PersonalDetails
    return { status: "applied", section: "personalDetails", value: { ...pd, jobTitle: preview } }
  }

  if (field === "skills") {
    const existing = (sectionData.skills ?? []) as SkillItem[]
    const toAdd = preview
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((n) => !existing.some((e) => e.name.toLowerCase() === n.toLowerCase()))
    return {
      status: "applied",
      section: "skills",
      value: [...existing, ...toAdd.map((n): SkillItem => ({ id: nanoid(), name: n, level: "intermediate" }))],
    }
  }

  if (field === "workExperience.description" || field === "workExperience.jobTitle") {
    const items = [...((sectionData.workExperience ?? []) as WorkExperienceItem[])]
    const idx = targetId ? items.findIndex((i) => i.id === targetId) : -1
    if (idx === -1) return { status: "unplaceable" }

    const updated = { ...items[idx] }
    if (field === "workExperience.description") {
      // Bullets are newline-separated lines inside one string. Appending with a
      // space turns the whole block into a single run-on line.
      updated.description = serializeBullets(
        type === "append"
          ? [...parseBullets(updated.description), ...parseBullets(preview)]
          : parseBullets(preview),
      )
    } else {
      updated.jobTitle = type === "append"
        ? [updated.jobTitle, preview].filter(Boolean).join(" ")
        : preview
    }
    items[idx] = updated
    return { status: "applied", section: "workExperience", value: items }
  }

  return { status: "manual", field }
}

/**
 * What the target field will literally read after the suggestion is applied,
 * computed by RUNNING the write and reading the result back.
 *
 * The confirmation modal used to rebuild the "after" text itself. It joined an
 * appended bullet with a space while applySuggestion joins with a newline, so
 * the preview shown one click before writing was not the text that got written.
 * Any second implementation of "what will this look like" drifts from the first
 * one eventually — so there is no second implementation. If the write changes,
 * the preview changes with it, for free.
 *
 * Returns null when there is nothing to show (nothing to write, or a field the
 * user has to edit by hand).
 */
export function previewSuggestion(
  input: ApplyInput,
  sectionData: ResumeSections,
): { before: string; after: string } | null {
  const result = applySuggestion(input, sectionData)
  if (result.status !== "applied") return null

  if (result.section === "summary") {
    return { before: (sectionData.summary as string) ?? "", after: result.value ?? "" }
  }

  if (result.section === "personalDetails") {
    return {
      before: (sectionData.personalDetails as PersonalDetails | undefined)?.jobTitle ?? "",
      after: (result.value as PersonalDetails).jobTitle ?? "",
    }
  }

  if (result.section === "skills") {
    const names = (list: SkillItem[] | undefined) => (list ?? []).map((s) => s.name).join(", ")
    return {
      before: names(sectionData.skills as SkillItem[] | undefined),
      after: names(result.value as SkillItem[]),
    }
  }

  // workExperience: show only the job that changed, not the whole array.
  const items = result.value as WorkExperienceItem[]
  const updated = input.targetId ? items.find((i) => i.id === input.targetId) : undefined
  const original = input.targetId
    ? ((sectionData.workExperience ?? []) as WorkExperienceItem[]).find((i) => i.id === input.targetId)
    : undefined
  if (!updated) return null

  return input.field === "workExperience.jobTitle"
    ? { before: original?.jobTitle ?? "", after: updated.jobTitle ?? "" }
    : { before: original?.description ?? "", after: updated.description ?? "" }
}
