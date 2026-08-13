// lib/ats/metric-credibility.ts
//
// Whether the numbers in a résumé can be believed.
//
// This is the check that was deferred twice, on purpose, because the obvious
// version is dangerous: judging whether "50 users" is impressive needs context we
// do not have — fifty users is nothing for a delivery app and is the entire market
// for a hospital's internal tool. A threshold on the size of a number would flag
// real achievements and send people deleting their best lines.
//
// So it judges the PATTERN, never a single figure. Two structural signals, both
// language- and industry-independent:
//
//   1. SATURATION. Almost every bullet ends in a percentage. No real career
//      produces a clean percentage for every task ever performed, and a reader who
//      sees fifteen consecutive "by N%" endings stops believing all fifteen —
//      including the ones that are true. This is the tell of generated text, and
//      it is measurable without judging any line on its own.
//
//   2. NO ANCHOR. "Reduced crashes by 40%" cannot be checked by anybody: forty
//      percent of what, from what? "Cut crash rate from 2.1% to 0.4%" can be
//      discussed in an interview. A CV whose figures are ALL bare deltas is making
//      claims it cannot defend — which is exactly what a candidate discovers, too
//      late, when the interviewer asks.
//
// Both are reported as one finding about the document, never as an accusation
// against a line. The user keeps every number; what changes is that they are told
// which ones they will be asked to defend.

import { isKnownVocabularyTerm } from "@/lib/ats/vocabulary"

/** A percentage with nothing to measure it against: "by 40%", "en un 30%". */
const BARE_DELTA = /\b(?:by|en (?:un )?|de)\s*\d{1,3}\s*%/i
/** Any percentage at all. */
const ANY_PERCENT = /\d{1,3}\s*%/
/**
 * A figure the reader can place: a before→after pair, a count of things, a
 * currency amount, or a unit. These are defensible in an interview.
 */
const ANCHORED = [
  /\bfrom\s+[\d.,]+\s*%?\s+to\s+[\d.,]+/i,
  /\bde\s+[\d.,]+\s*%?\s+a\s+[\d.,]+/i,
  /[\d.,]+\s*(?:ms|s|seg|segundos|min|minutos|h|horas|hrs|kb|mb|gb|tb)\b/i,
  /[$€£]\s?[\d.,]+|\b[\d.,]+\s?(?:usd|eur|bob|mxn|cop|ars)\b/i,
  /\b\d[\d.,]*\s*(?:k|m|mil|millones|million)\b/i,
  // A plain count of real things: "30 nurses", "15 viviendas", "40 accounts".
  /\b\d[\d.,]*\s+[a-záéíóúñ]{3,}/i,
]

export interface MetricCredibility {
  /** Bullets carrying any figure at all. */
  quantified: number
  /** Of those, the ones whose only figure is an unanchored percentage. */
  bareDelta: number
  /** Of those, the ones a reader can place and the candidate can defend. */
  anchored: number
  total: number
  /**
   * True when the document reads as manufactured: nearly every quantified line is
   * a bare percentage and almost nothing is anchored.
   */
  saturated: boolean
}

/**
 * Percentage of quantified bullets that must be bare deltas before the pattern is
 * called out. High on purpose: a CV where two thirds of the numbers are honest
 * deltas is normal writing, not a manufactured document.
 */
const SATURATION_RATIO = 0.8
/** Below this many quantified lines there is no pattern to speak of, only lines. */
const MIN_QUANTIFIED = 4

export function assessMetricCredibility(bullets: string[]): MetricCredibility {
  const lines = bullets.map((b) => b.trim()).filter(Boolean)
  let quantified = 0
  let bareDelta = 0
  let anchored = 0

  for (const line of lines) {
    const hasFigure = /\d/.test(line)
    if (!hasFigure) continue
    quantified++
    const isAnchored = ANCHORED.some((re) => re.test(line))
    if (isAnchored) {
      anchored++
      continue
    }
    if (BARE_DELTA.test(line) || ANY_PERCENT.test(line)) bareDelta++
  }

  // The ratio is the whole rule. Requiring anchored === 0 on top of it was two
  // conditions saying one thing, and the stricter one was wrong: a real document
  // has the odd defensible figure among the manufactured ones, and demanding
  // literally none of them let the pattern walk through. At 80% bare deltas the
  // anchored share is already a fifth or less — the ratio says that by itself.
  const saturated = quantified >= MIN_QUANTIFIED && bareDelta / quantified >= SATURATION_RATIO

  return { quantified, bareDelta, anchored, total: lines.length, saturated }
}

/**
 * A skill entry that is really the candidate's degree.
 *
 * "Systems engineer" sitting in the Skills list next to Swift and Git. It is not a
 * skill, it is what they studied, and it dilutes the section an ATS indexes most
 * heavily. Checked PER CV rather than against a list of degree names: the only
 * reliable evidence that a string is this candidate's qualification is that it
 * appears in their own education entries. No list of professions could do it, and
 * any list would be wrong in some country.
 *
 * ONE exception, and it matters more than the check itself: for most careers the
 * field of study IS the skill. An accountant lists "Accounting", a designer lists
 * "Graphic Design", a nurse lists "Nursing" — telling them to delete the single
 * most relevant chip on their resume would be far more expensive than a slightly
 * padded skills list. So a term the shared vocabulary already recognises as a
 * skill is never flagged, whatever their diploma says.
 *
 * That exception is evidence, not a second list: the vocabulary is the same one
 * the matcher scores with, so anything a job posting would search for is safe by
 * construction. A job TITLE like "Systems engineer" is not in it, and stays
 * flagged — which is the case this check was built for.
 */
export function findDegreeInSkills(
  skills: string[],
  education: { degree?: string; fieldOfStudy?: string }[],
): string[] {
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
  const degrees = new Set(
    education.flatMap((e) => [e.degree, e.fieldOfStudy]).filter((v): v is string => !!v?.trim()).map(norm),
  )
  if (degrees.size === 0) return []
  return skills.filter((s) => {
    const n = norm(s)
    return n.length > 3 && degrees.has(n) && !isKnownVocabularyTerm(s)
  })
}

/**
 * Whether the résumé offers anywhere to verify the claims.
 *
 * A link is the cheapest proof there is, and its absence is invisible to every
 * keyword matcher: a portfolio, a repository, a published app, a professional
 * profile. Reported, never scored — plenty of honest careers have nothing to link,
 * and penalising a nurse for having no GitHub would be exactly the tech-shaped
 * blindness this file exists to avoid.
 */
export function hasVerifiableLink(values: unknown): boolean {
  const seen: string[] = []
  const walk = (v: unknown, depth = 0) => {
    if (depth > 6 || seen.length > 400) return
    if (typeof v === "string") { seen.push(v); return }
    if (Array.isArray(v)) { for (const x of v) walk(x, depth + 1); return }
    if (v && typeof v === "object") for (const x of Object.values(v as Record<string, unknown>)) walk(x, depth + 1)
  }
  walk(values)
  return seen.some((s) => /https?:\/\/\S+|\b[\w-]+\.(?:com|net|org|io|dev|app|co|me)\b/i.test(s))
}
