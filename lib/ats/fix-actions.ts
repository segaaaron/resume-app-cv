// lib/ats/fix-actions.ts
//
// The gate between "the model says this button should exist" and the button the
// user actually presses.
//
// Pure and dependency-free (no db, no AI client) so it can run on either side of
// the wire and be tested directly.
import type { CvFixAction } from "@/lib/services/ai/shared/ai-types"
import { parseBullets } from "@/lib/services/ai/shared/bullets"

/**
 * Verifies a model-proposed action against the REAL CV before the UI can render
 * it as a button.
 *
 * The model is asked which of our engines repairs a finding; it is not asked to
 * be right about ids and indices, and it will sometimes name a job that is not
 * there or a bullet past the end of one. A button built on that either does
 * nothing or edits the wrong line of the user's CV, which is worse than no
 * button — so anything unverifiable degrades to `manual` (advice, no button).
 */
export function groundFixAction(action: CvFixAction, sectionData: Record<string, unknown>): CvFixAction {
  const MANUAL: CvFixAction = { kind: "manual" }
  const jobs = (sectionData.workExperience ?? []) as { id?: string; description?: string }[]

  switch (action.kind) {
    case "rewrite_bullet": {
      const job = jobs.find((j) => !!j.id && j.id === action.targetId)
      if (!job || action.index === undefined) return MANUAL
      return action.index < parseBullets(job.description ?? "").length ? action : MANUAL
    }
    case "add_skill":
      return action.value?.trim() ? action : MANUAL
    case "rewrite_summary":
      return typeof sectionData.summary === "string" && sectionData.summary.trim() ? action : MANUAL
    case "fix_dates":
    case "remove_duplicates":
      // Both operate on whatever the CV holds and are no-ops on a clean CV; the
      // client tells the user when nothing changed rather than pretending.
      return jobs.length > 0 ? action : MANUAL
    default:
      return MANUAL
  }
}
