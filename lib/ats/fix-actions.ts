// lib/ats/fix-actions.ts
//
// The gate between "the model says this button should exist" and the button the
// user actually presses.
//
// Pure and dependency-free (no db, no AI client) so it can run on either side of
// the wire and be tested directly.
import type { CvFixAction } from "@/lib/services/ai/shared/ai-types"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { parseBullets } from "@/lib/services/ai/shared/bullets"
import { isPlausibleSkill } from "./skill-validation"

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
/** Every string value in the resume, however deeply nested. */
function collectStrings(value: unknown, out: string[] = [], depth = 0): string[] {
  if (depth > 6) return out
  if (typeof value === "string") { if (value.trim()) out.push(value) ; return out }
  if (Array.isArray(value)) { for (const v of value) collectStrings(v, out, depth + 1); return out }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) collectStrings(v, out, depth + 1)
  }
  return out
}

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
      // Not just "is it non-empty": the model has returned whole sentences here
      // ("the specific analytics tools you have used"). Validated against the
      // skills engine, so a button that would write prose into Skills is never
      // drawn at all.
      return action.value && isPlausibleSkill(action.value, sectionData) ? action : MANUAL
    case "rewrite_summary":
      return typeof sectionData.summary === "string" && sectionData.summary.trim() ? action : MANUAL
    case "replace_text": {
      // The wrong wording must EXIST in the CV, verbatim, and differ from the
      // replacement. A find-and-replace whose target is not there would either
      // do nothing or — worse — be applied somewhere it does not belong.
      const from = action.value?.trim()
      const to = action.replacement?.trim()
      if (!from || !to || from === to) return MANUAL
      // EVERY string in the CV, walked generically.
      //
      // This used to look at the summary and the job descriptions only, so a typo
      // in a job TITLE ("Debeloper") or in a skill ("Objetive-C") was never found
      // here and the finding degraded to advice — the report named the defect,
      // printed the correct spelling, and offered no way to apply it. Meanwhile
      // the writer (applySpellingFix) reaches every field, so the validator was
      // strictly narrower than the thing it was validating.
      //
      // A generic walk instead of a longer field list: a section added next month
      // is covered without anyone remembering to come back here.
      return collectStrings(sectionData).some((t) => t.includes(from)) ? action : MANUAL
    }
    case "fix_dates": {
      // Dates are the one thing here that CODE knows and the model guesses.
      //
      // Reported: a role reading "(2023 – 2026)" was raised as a credibility
      // problem because "an end year of 2026 can look like a future date" — in
      // August 2026. Our own checker takes the current year and would never have
      // said it. Worse, the text the model printed proposed rewriting the end
      // date to "Present", which is a claim about whether the candidate still
      // works there. Only they know that, and the button attached does something
      // else entirely (it normalises FORMATS). A finding whose proposed text and
      // whose button disagree is worse than no finding.
      //
      // So this action survives only when a deterministic check actually found
      // something to fix: mixed formats, a date in the future, or reverse order.
      // With a clean set of dates the button is never drawn and the model's
      // invented concern degrades to advice.
      // Wrapped because this file's whole job is to be the layer that CANNOT
      // fail: it runs inside the analysis loop, and an exception here does not
      // degrade one button — it takes down the entire report with a 500. Every
      // other branch reaches only for optional chaining and array length;
      // analyzeWriting assumes shapes (it calls .map and .trim on what it is
      // given), and sectionData reaching here from an old row or a partial import
      // is not guaranteed to have them. Measured: `workExperience: "oops"` threw
      // "work.map is not a function".
      //
      // Fails closed: no verdict means no button, which is the same answer this
      // function gives to everything it cannot verify.
      let realDefect = false
      try {
        const checks = analyzeWriting(sectionData)
        realDefect = !!checks.dateInconsistency || checks.futureDates.length > 0 || !!checks.chronology
      } catch {
        return MANUAL
      }
      return realDefect ? action : MANUAL
    }
    case "remove_duplicates":
      // Operates on whatever the CV holds and is a no-op on a clean CV; the
      // client tells the user when nothing changed rather than pretending.
      return jobs.length > 0 ? action : MANUAL
    default:
      return MANUAL
  }
}
