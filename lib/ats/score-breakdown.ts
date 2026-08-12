// lib/ats/score-breakdown.ts
//
// ONE job: turn per-category coverage into a score, and show the arithmetic.
//
// The sum used to live inside the matcher, folded into the same function that
// tokenizes text, matches keywords, scores titles and builds the gap plan. Nobody
// could answer "why is this an 89?" without reading all of it, and a number you
// cannot audit reads as invented — which, for the weights, it partly is.
//
// Splitting it out buys three things:
//   · the calculation has a single owner, so the score and the "path to your
//     target" cannot drift apart — they are the same renormalization, computed
//     once, here;
//   · it is pure, so it is tested against arithmetic instead of against a fixture
//     of a whole résumé;
//   · the breakdown it returns is the honest UI: every category, what it was
//     worth, what it contributed, and what our basis for that weight is.
import { SCORE_WEIGHTS, type Basis } from "./scoring-config"

export type ScoreCategory = keyof typeof SCORE_WEIGHTS

/** One category's contribution, with every step of it visible. */
export interface CategoryBreakdown {
  category: ScoreCategory
  /** How much of this category the CV covers, 0-100. */
  coveragePct: number
  /** Configured weight before renormalization. */
  weight: number
  /** Share of the final score this category actually carries, 0-1. */
  share: number
  /** Points it contributes to the total, out of 100. */
  points: number
  /** Points still recoverable here — what closing this gap completely is worth. */
  recoverable: number
  /** What backs this weight. Surfaced so the user can judge the number. */
  basis: Basis
}

export interface ScoreBreakdown {
  score: number
  categories: CategoryBreakdown[]
  /**
   * Categories the posting never mentioned, dropped before weighting.
   *
   * They are not zeros: a job that lists no soft skills must not cost the
   * candidate the soft-skill weight. The remaining weights renormalize to 1, which
   * is why `share` and `weight` differ.
   */
  skipped: ScoreCategory[]
}

/** Coverage per category. `null` = the posting asked for nothing here. */
export type CoverageInput = Partial<Record<ScoreCategory, number | null>>

/**
 * The score, and how it got there.
 *
 * Every category with a measured coverage is weighted; the rest are dropped and
 * the weights renormalize over what is left. `points` across all categories sums
 * to `score` (±1 from rounding), which is the property that makes the breakdown
 * legible: the user can add it up.
 */
export function computeScoreBreakdown(coverage: CoverageInput): ScoreBreakdown {
  const keys = Object.keys(SCORE_WEIGHTS) as ScoreCategory[]
  const measured = keys.filter((k) => typeof coverage[k] === "number")
  const skipped = keys.filter((k) => typeof coverage[k] !== "number")

  const totalW = measured.reduce((acc, k) => acc + SCORE_WEIGHTS[k].value, 0)
  if (totalW === 0) return { score: 0, categories: [], skipped }

  const categories: CategoryBreakdown[] = measured.map((category) => {
    const coveragePct = coverage[category] as number
    const weight = SCORE_WEIGHTS[category].value
    const share = weight / totalW
    return {
      category,
      coveragePct,
      weight,
      share,
      points: Math.round(share * coveragePct),
      recoverable: Math.round(share * (100 - coveragePct)),
      basis: SCORE_WEIGHTS[category].basis,
    }
  })

  // Rounded once at the end, not by summing rounded parts: rounding each
  // contribution first drifts the total by a point or two, and a breakdown whose
  // rows do not add up to the headline is worse than no breakdown.
  const score = Math.round(
    categories.reduce((acc, c) => acc + c.share * c.coveragePct, 0),
  )

  return { score, categories, skipped }
}
