// lib/services/ai/shared/bullet-quality.ts
// Deterministic per-bullet quality signals.
//
// improve-bullet currently asks the model to decide which bullets lack a figure
// and returns status "metric_missing" so the UI can ask the user for it. That
// decision does not need a language model: whether a sentence contains a number
// is a regex, and a regex gives the same answer every time and costs nothing.
//
// Same split that made improve-summary work: the algorithm detects, the model
// only writes.
import { ANY_METRIC_REGEX } from "./ai-helpers"
import { parseBullets } from "./bullets"

/** Openers that describe a duty instead of an achievement. */
const WEAK_OPENERS: readonly string[] = [
  // en
  "responsible for", "in charge of", "assisted with", "helped with",
  "worked on", "duties included", "tasked with", "involved in",
  "participated in", "contributed to",
  // es
  "responsable de", "encargado de", "encargada de", "apoyé en", "apoye en",
  "ayudé con", "ayude con", "trabajé en", "trabaje en",
  "mis funciones incluían", "participé en", "participe en", "colaboré en",
]

export interface BulletAssessment {
  /** Position in the original description, 0-based. */
  index: number
  text: string
  /** The bullet states a real figure. */
  hasMetric: boolean
  /** The bullet opens by describing a duty rather than an achievement. */
  weakOpener: boolean
}

export interface DescriptionQuality {
  bullets: BulletAssessment[]
  /** Share of bullets carrying a real figure, 0-1. NaN-free: 0 when empty. */
  quantificationRatio: number
  /** Indices of bullets with no figure — what to ask the user about. */
  missingMetricIndices: number[]
  /** Indices of bullets that open with a duty phrase. */
  weakOpenerIndices: number[]
}

function opensWeakly(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return WEAK_OPENERS.some((o) => lower.startsWith(o))
}

/**
 * Scores each bullet of a work-experience description.
 *
 * Reports, never judges: a bullet without a figure is not automatically bad —
 * plenty of real work has no number attached, and demanding one is exactly what
 * used to push the model into inventing "[N users]". Callers decide what to do
 * with the ratio; this only says what is there.
 */
export function assessDescription(description: string): DescriptionQuality {
  const bullets = parseBullets(description).map((text, index) => ({
    index,
    text,
    hasMetric: ANY_METRIC_REGEX.test(text),
    weakOpener: opensWeakly(text),
  }))

  const withMetric = bullets.filter((b) => b.hasMetric).length

  return {
    bullets,
    quantificationRatio: bullets.length ? withMetric / bullets.length : 0,
    missingMetricIndices: bullets.filter((b) => !b.hasMetric).map((b) => b.index),
    weakOpenerIndices: bullets.filter((b) => b.weakOpener).map((b) => b.index),
  }
}
