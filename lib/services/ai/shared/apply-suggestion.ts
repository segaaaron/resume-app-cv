// lib/services/ai/shared/apply-suggestion.ts
// Single owner of "what does accepting an AI suggestion write into the CV".
//
// ATSScorePanel and CVReviewPanel both render review-cv suggestions — the ATS
// textarea reroutes to review-cv when the user types a question — and each kept
// its own copy of this logic. Two bugs were fixed in one copy and survived
// untouched in the other for hours: a missing targetId silently rewrote
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
