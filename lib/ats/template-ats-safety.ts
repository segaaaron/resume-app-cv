// ATS parseability of a resume template, derived from the SINGLE maintained
// source of truth: `TEMPLATES[].columns` in types/resume.ts. No parallel hand-list.
//
// Why this exists: the ATS score used to run only on the structured CV data and
// was blind to the chosen template. A single-column template parses cleanly in
// every ATS; a double-column / sidebar layout can be reordered or split by strict
// parsers (Workday, Taleo, iCIMS), so a high content score can still ship a file
// that a real parser mangles. This module lets the score reflect the actual
// template the user will export.

import { MULTI_COLUMN_PENALTY } from "@/lib/ats/scoring-config"
import { TEMPLATES } from "@/types/resume"

export type AtsSafety = "safe" | "caution"

// single-column → clean parse everywhere. double-column → a strict ATS may
// reorder the two tracks. We report it as "caution" (an honest heads-up), not a
// hard "risk", because many premium templates are deliberately two-column and
// parse fine in most systems — the user decides with the facts in front of them.
const SAFETY_BY_ID: Map<string, AtsSafety> = new Map(
  TEMPLATES.map((t) => [t.id, t.columns === "double" ? "caution" : "safe"] as const),
)

// The dedicated ATS template is the explicit gold standard, always safe.
const ALWAYS_SAFE = new Set<string>(["ats"])

/** Parseability tier of a template. Unknown/empty id defaults to "safe" (no false alarm). */
export function getTemplateAtsSafety(templateId: string | null | undefined): AtsSafety {
  if (!templateId) return "safe"
  if (ALWAYS_SAFE.has(templateId)) return "safe"
  return SAFETY_BY_ID.get(templateId) ?? "safe"
}

// Contribution of the template's layout to the ATS format sub-score.
// safe = clean single column; caution = multi-column body a strict parser may reorder.
const FORMAT_SCORE: Record<AtsSafety, number> = { safe: 100, caution: 65 }

/** Format sub-score (0-100) contributed by the template's parseability. */
export function templateFormatScore(safety: AtsSafety): number {
  return FORMAT_SCORE[safety]
}

// A multi-column ("caution") template can be reordered by a strict ATS, so its
// overall score takes a modest, proportional ding — NOT a hard penalty. 5%
// acknowledges the real (but not universal) parse risk without over-punishing
// premium two-column designs. Single source so atsScore and atsRescore never drift.
export const CAUTION_SCORE_FACTOR = MULTI_COLUMN_PENALTY.value

/** Apply the template parseability ding to an overall score. "safe" is untouched. */
export function applyTemplatePenalty(score: number, safety: AtsSafety): number {
  return safety === "caution" ? Math.round(score * CAUTION_SCORE_FACTOR) : score
}

/** Message key the UI localizes to explain the tier. */
export function templateAtsMessageKey(safety: AtsSafety): string {
  return safety === "caution" ? "template_ats_caution" : "template_ats_safe"
}
