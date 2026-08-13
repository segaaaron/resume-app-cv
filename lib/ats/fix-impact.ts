// lib/ats/fix-impact.ts
//
// Which number does this repair actually move?
//
// The panel shows one big score, labels a list "CRITICAL FIXES", and the score is
// keyword coverage against the posting — deterministic, and by a decision this
// project has taken twice and written down, blind to writing quality. So the
// candidate rewrites a bullet from "3%" to "3.2s → 1.1s across 80k users", sees
// 53 → 53, and concludes the tool is broken. Reported exactly that way.
//
// Worse than the confusion: the incentive. The only lever that moves the number is
// adding skills, so a candidate who trusts the number learns to stuff keywords —
// the behaviour this product exists to argue against.
//
// The number is not wrong. Presenting it alone is. Every repair moves SOMETHING
// measurable; this says which, so the panel can show the axis that responded
// instead of a figure that will not budge.
//
// No new arithmetic lives here. It is a map from an action to the number that
// already exists, kept in one place so the badge on a finding and the ring at the
// top can never claim different things.

/**
 * - `match`   — coverage against this posting (the ATS score).
 * - `content` — how the writing reads (the résumé health score).
 * - `trust`   — reasons a reader stops believing the document (credibility).
 */
export type FixAxis = "match" | "content" | "trust"

/**
 * The axis a fix moves, from the action the analysis attached to it.
 *
 * `manual` and anything unrecognised return null: no badge is better than a badge
 * promising movement we cannot verify. Silence is the safe default here, the same
 * way an unvalidated action degrades to no button at all.
 */
export function fixAxis(kind: string | undefined): FixAxis | null {
  switch (kind) {
    case "add_skill":
      // The only action that changes what the matcher indexes.
      return "match"
    case "rewrite_bullet":
    case "rewrite_summary":
    case "replace_text":
      // Wording. Reaches the health score through impact and action verbs, and
      // never the match — the same words stay on the page either way.
      return "content"
    case "fix_dates":
    case "remove_duplicates":
      // Neither adds a keyword nor improves a sentence. Both remove a reason to
      // doubt the document, which is precisely what credibility measures.
      return "trust"
    default:
      return null
  }
}
