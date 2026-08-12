// lib/ats/scoring-config.ts
//
// EVERY tunable number the ATS score depends on, in one file, each one stating
// what backs it.
//
// They used to live in four files with a sentence of justification each, which
// made an honest question — "why is this an 89?" — impossible to answer without
// reading the engine. Worse, it hid how few of them there are: five constants
// decide the whole number, and none of them is measured. Calling that out in one
// place is the difference between a model we can defend and a number that merely
// looks precise.
//
// THE HONEST FRAME. Nobody has a real "ATS score" — not Jobscan, not Rezi, not
// Teal. No applicant tracking system exposes its ranking, so every score in this
// category is a weighting somebody chose. Ours is too. What we can be is the only
// one that SAYS SO and shows its arithmetic, and that backs the parts that are
// facts (does this keyword appear? does the PDF parse?) with actual verification.
//
// RULE FOR CHANGING ANY OF THESE: they move every user's score at once. A change
// needs a reason written here — not a hunch, and never a number tuned until one
// example looked better.

/** How a value got here. Displayed nowhere; it exists to keep us honest. */
export type Basis =
  /** Observable behaviour of real parsers, reproducible on demand. */
  | "verified"
  /** Widely published résumé-writing convention. Not measured by us. */
  | "convention"
  /** Our judgement. No evidence behind the exact figure. */
  | "chosen"

export interface Tunable {
  value: number
  basis: Basis
  /** Why this number and not another — in the terms a user could be told. */
  why: string
}

/**
 * How much each category moves the score.
 *
 * Hard skills dominate because keyword matching is the one ATS behaviour that is
 * actually documented across vendors: postings are indexed by required skills and
 * candidates are filtered on them. That the split is exactly 45/20/15/10/10 is
 * OURS — the ordering is defensible, the precise figures are not measured, and
 * pretending otherwise would be the kind of false precision this file exists to
 * prevent.
 *
 * Categories the posting does not mention are dropped and the rest renormalize,
 * so a job that lists no soft skills never costs the candidate points for it.
 */
export const SCORE_WEIGHTS: Record<"hardSkills" | "mustHaves" | "title" | "softSkills" | "sections", Tunable> = {
  hardSkills: { value: 0.45, basis: "chosen", why: "Required skills are what keyword filters index and rank on — the largest single lever." },
  mustHaves: { value: 0.20, basis: "chosen", why: "Stated hard requirements: missing one is often a hard reject, not a deduction." },
  title: { value: 0.15, basis: "chosen", why: "Recruiters and search filters both match on job title before reading anything else." },
  softSkills: { value: 0.10, basis: "chosen", why: "Asked for in most postings, rarely used to filter — present but small." },
  sections: { value: 0.10, basis: "convention", why: "A résumé missing a standard section (experience, education, skills) parses incompletely." },
}

/**
 * Credit for the target title when it appears only in an OLD role.
 *
 * "Senior iOS Developer" three jobs ago is weaker evidence than the same title
 * today — that direction is not controversial. That the discount is 0.6 rather
 * than 0.5 or 0.7 is ours.
 */
export const OLD_TITLE_CREDIT: Tunable = {
  value: 0.6,
  basis: "chosen",
  why: "The target title in a past role still counts, but a current one counts more.",
}

/**
 * Multiplier applied when the chosen template is multi-column.
 *
 * The EFFECT is verified, not assumed: we render the real PDF, run it through a
 * parser and read back the text — multi-column layouts come out reordered or
 * interleaved. The 5% size of the penalty is ours: enough to matter, small enough
 * that a strong candidate is never sunk by a design choice.
 */
export const MULTI_COLUMN_PENALTY: Tunable = {
  value: 0.95,
  basis: "verified",
  why: "Two-column layouts get reordered by real parsers — visible in the extracted text.",
}

/**
 * Cosine similarity above which two phrasings count as the same requirement.
 *
 * What stops "APIs REST" on a Spanish CV from reading as missing when the posting
 * says "REST APIs". Overridable in production via SEMANTIC_MATCH_THRESHOLD without
 * a deploy, precisely because it is the one number here most likely to need
 * adjusting against real CVs.
 */
export const SEMANTIC_THRESHOLD: Tunable = {
  value: 0.62,
  basis: "chosen",
  why: "Above this, two phrasings mean the same requirement; below, they are different skills.",
}

/**
 * Bullets on one role before the strong lines compete with the weak ones.
 *
 * Standard résumé-writing guidance, published widely enough to call a convention:
 * 3-5 on a recent role, fewer on older ones. Six is the point at which we speak
 * up rather than the target we push people to.
 */
export const BULLETS_PER_ROLE_MAX: Tunable = {
  value: 6,
  basis: "convention",
  why: "Past six on one role, the lines that show results get diluted by the ones that do not.",
}

/**
 * Everything above, for a UI that wants to show its work.
 *
 * A score you can audit beats a "better" one nobody can question: the user sees
 * which categories were measured, what each is worth, and what our basis for it
 * is. That is the honest version of a number that cannot be validated against
 * hiring outcomes we do not have.
 */
export const ALL_TUNABLES: Record<string, Tunable> = {
  ...Object.fromEntries(Object.entries(SCORE_WEIGHTS).map(([k, v]) => [`weight.${k}`, v])),
  oldTitleCredit: OLD_TITLE_CREDIT,
  multiColumnPenalty: MULTI_COLUMN_PENALTY,
  semanticThreshold: SEMANTIC_THRESHOLD,
  bulletsPerRoleMax: BULLETS_PER_ROLE_MAX,
}
