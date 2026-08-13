// lib/ats/credibility.ts
//
// The second number: does a person believe this résumé?
//
// The ATS score answers whether a filter will pass the document. It is a good
// answer to the wrong half of the problem. A CV listed oldest-first, claiming
// seven years over dates spanning eleven, with the same achievement written twice,
// passes the filter and loses the seven-second screen — and until this file
// existed the product had no way to say so. Worse, it said the opposite: the
// writing score rated that exact CV 81, because its five dimensions measure craft
// (impact, verbs, sections, brevity, scan) and not one of them measures trust.
//
// The gap between the two numbers IS the diagnosis. "ATS 76 · Recruiter 58" tells
// a candidate more than either number alone: your keywords are there, your
// credibility is not, and no amount of extra keywords will fix it.
//
// Deterministic and pure. Every input is already computed by the writing checks,
// so this costs nothing, runs live on every keystroke, and cannot come out
// different on a second reading of an unchanged CV.

import { CREDIBILITY_PENALTIES } from "./scoring-config"
import type { WritingChecks } from "./writing-checks"

export type CredibilityKey =
  | "reverse_order"
  | "future_date"
  | "years_contradiction"
  | "duplicates"
  | "overloaded_roles"
  | "mixed_dates"
  | "empty_lines"
  | "metric_saturation"
  | "degree_as_skill"
  | "incomplete_education"

/**
 * What the reader concludes. This is the ranking axis — not the size of the
 * deduction — because the whole point of the second number is to answer "what
 * costs me the interview", and a reason to disbelieve outranks a reason to frown
 * however the arithmetic lands.
 */
export type CredibilityBand =
  /** "This is not true." The application is over. */
  | "trust"
  /** "A machine wrote this." Every other line is now suspect. */
  | "authenticity"
  /** "This is careless." A deduction, not a rejection. */
  | "polish"

export interface CredibilityFinding {
  key: CredibilityKey
  band: CredibilityBand
  /** Points this finding took off the 100. */
  cost: number
  /** How many times it occurs — a pattern reads worse than a slip. */
  count: number
}

export interface CredibilityResult {
  /** 0–100. What is left of the reader's trust. */
  score: number
  /** Ranked: trust first, then authenticity, then polish; costliest within each. */
  findings: CredibilityFinding[]
}

const BAND_ORDER: Record<CredibilityBand, number> = { trust: 0, authenticity: 1, polish: 2 }

/**
 * `checks` comes straight from analyzeWriting, so this file adds no new analysis
 * and cannot disagree with the cards that show the same findings.
 */
export function computeCredibility(checks: WritingChecks): CredibilityResult {
  const P = CREDIBILITY_PENALTIES
  const findings: CredibilityFinding[] = []

  if (checks.chronology) {
    findings.push({ key: "reverse_order", band: "trust", cost: P.reverseOrder.value, count: 1 })
  }
  if (checks.futureDates.length > 0) {
    findings.push({ key: "future_date", band: "trust", cost: P.futureDate.value, count: checks.futureDates.length })
  }
  if (checks.yearsClaim) {
    findings.push({ key: "years_contradiction", band: "trust", cost: P.yearsContradiction.value, count: 1 })
  }

  // Exact copies and rewrites of the same achievement are one problem to a reader.
  const duplicateCount = checks.duplicateBullets.length + checks.nearDuplicates.length
  if (duplicateCount > 0) {
    findings.push({
      key: "duplicates",
      band: "authenticity",
      cost: Math.min(duplicateCount * P.duplicatePair.value, P.duplicateCap.value),
      count: duplicateCount,
    })
  }

  const emptyCount = checks.clicheBullets.length
  if (emptyCount > 0) {
    findings.push({
      key: "empty_lines",
      band: "authenticity",
      cost: Math.min(emptyCount * P.emptyLine.value, P.emptyLineCap.value),
      count: emptyCount,
    })
  }

  /**
   * Numbers nobody can check.
   *
   * Authenticity, not trust: the reader does not conclude the CV is false, they
   * conclude it was manufactured — and then treats every figure in it as decoration.
   */
  if (checks.metrics.saturated) {
    findings.push({ key: "metric_saturation", band: "authenticity", cost: P.metricSaturation.value, count: checks.metrics.bareDelta })
  }
  if (checks.degreeInSkills.length > 0) {
    findings.push({ key: "degree_as_skill", band: "polish", cost: P.degreeAsSkill.value, count: checks.degreeInSkills.length })
  }

  // Polish, not trust: nobody doubts the candidate studied there, it just reads
  // like a form somebody stopped filling in — and a parser gets nothing to index.
  if (checks.incompleteEducation.length > 0) {
    findings.push({ key: "incomplete_education", band: "polish", cost: P.degreeAsSkill.value, count: checks.incompleteEducation.length })
  }

  const overloaded = checks.bulletBalance.filter((b) => b.kind === "too_many").length
  if (overloaded > 0) {
    findings.push({ key: "overloaded_roles", band: "polish", cost: P.overloadedRole.value * overloaded, count: overloaded })
  }
  if (checks.dateInconsistency) {
    findings.push({ key: "mixed_dates", band: "polish", cost: P.mixedDates.value, count: 1 })
  }

  findings.sort((a, b) => BAND_ORDER[a.band] - BAND_ORDER[b.band] || b.cost - a.cost)

  const total = findings.reduce((sum, f) => sum + f.cost, 0)
  // Floored at 20, not 0: a résumé with every defect on this list is still a
  // document with real work in it, and a zero would say something we do not mean.
  return { score: Math.max(20, 100 - total), findings }
}

/**
 * The sentence the whole panel exists to be able to say.
 *
 * Returned as a shape rather than a string so the UI localises it — and only when
 * the two numbers actually disagree, because "your keywords are there, your
 * credibility is not" is a real finding, not a badge to print on every report.
 */
export function credibilityVerdict(
  atsScore: number,
  credibility: number,
): { kind: "keywords_ahead" | "credibility_ahead" | "aligned"; gap: number } {
  const gap = Math.abs(atsScore - credibility)
  // Under this the two agree closely enough that contrasting them would be noise.
  if (gap < 12) return { kind: "aligned", gap }
  return { kind: atsScore > credibility ? "keywords_ahead" : "credibility_ahead", gap }
}
