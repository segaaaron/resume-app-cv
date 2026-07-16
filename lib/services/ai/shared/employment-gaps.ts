// lib/services/ai/shared/employment-gaps.ts
// Deterministic employment-gap detection.
//
// This is the best-evidenced signal in the whole product. Two independent lines
// converge on the same six-month threshold:
//
//  - Kroft, Lange & Notowidigdo (Quarterly Journal of Economics 128(3), 2013):
//    ~12,000 real resumes sent to ~3,000 postings across 100 US metros. An
//    applicant with six months of unemployment received roughly HALF the
//    callbacks of an otherwise identical employed applicant.
//    https://academic.oup.com/qje/article-abstract/128/3/1123/1852133
//  - Fuller et al., "Hidden Workers: Untapped Talent" (Harvard Business School
//    / Accenture, 2021): almost 50% of US employers run a continuity-of-
//    employment filter that excludes gaps longer than six months.
//    https://www.hbs.edu/managing-the-future-of-work/research/Pages/hidden-workers-untapped-talent.aspx
//
// Peer-reviewed field experiment plus employer-side survey agreeing on the same
// number is a standard of evidence nothing else in this space meets — the
// famous "75% of resumes are rejected by an ATS" traces to a defunct vendor's
// 2012 marketing with no study behind it. This is arithmetic over dates the CV
// already has, so no model is involved and the answer never drifts.

/** Months since year 0. Comparable, and month arithmetic is just subtraction. */
type MonthIndex = number

export interface ParsedDate {
  index: MonthIndex
  /** True when the source gave a year but no month. */
  yearOnly: boolean
}

/**
 * Parses the date formats that actually occur in this codebase:
 *   "2021-03"  the editor's DateField writes this
 *   "2021"     lib/resume-parser expandYear() produces this from a PDF
 *   "03/2021"  fill-profile's prompt asks the model for MM/YYYY
 * Anything else — including "" — is unparseable, and unparseable means we say
 * nothing rather than guess.
 */
export function parseCvDate(raw: string | undefined): ParsedDate | null {
  const v = (raw ?? "").trim()
  if (!v) return null

  const iso = v.match(/^(\d{4})-(\d{1,2})$/)
  if (iso) {
    const month = parseInt(iso[2], 10)
    if (month < 1 || month > 12) return null
    return { index: parseInt(iso[1], 10) * 12 + (month - 1), yearOnly: false }
  }

  const slash = v.match(/^(\d{1,2})\/(\d{4})$/)
  if (slash) {
    const month = parseInt(slash[1], 10)
    if (month < 1 || month > 12) return null
    return { index: parseInt(slash[2], 10) * 12 + (month - 1), yearOnly: false }
  }

  const year = v.match(/^(19|20)(\d{2})$/)
  if (year) return { index: parseInt(v, 10) * 12, yearOnly: true }

  return null
}

export interface EmploymentGap {
  /** Whole months with no listed employment. */
  months: number
  /** The job the gap opens after. Empty for a gap before the first job. */
  afterEmployer: string
  /** The job the gap closes at. Empty when the gap runs to today. */
  beforeEmployer: string
}

interface Job {
  employer?: string
  startDate?: string
  endDate?: string
  currentlyWorking?: boolean
}

/** Threshold both the QJE study and the HBS employer survey land on. */
export const GAP_THRESHOLD_MONTHS = 6

/**
 * Finds gaps longer than six months between listed jobs, and between the last
 * job and today.
 *
 * Deliberately conservative. Where a date is year-only the real month is
 * unknown, so the range is read the way that makes the gap SMALLEST: an end of
 * "2020" is treated as December 2020, a start of "2022" as January 2022. Telling
 * someone they have a gap they do not have is worse than staying quiet, and the
 * data genuinely does not say. A job with an unparseable start is skipped
 * entirely rather than guessed at.
 *
 * `now` is a parameter, not a call to Date.now(), so the caller owns the clock
 * and the result is reproducible in a test.
 */
export function findEmploymentGaps(jobs: Job[], now: Date): EmploymentGap[] {
  const nowIndex = now.getFullYear() * 12 + now.getMonth()

  const spans = jobs
    .map((j) => {
      const start = parseCvDate(j.startDate)
      if (!start) return null

      let end: MonthIndex
      if (j.currentlyWorking) {
        end = nowIndex
      } else {
        const parsedEnd = parseCvDate(j.endDate)
        if (!parsedEnd) return null
        // Year-only end: assume the latest month it could mean, shrinking any
        // gap that follows.
        end = parsedEnd.yearOnly ? parsedEnd.index + 11 : parsedEnd.index
      }

      // Year-only start: assume the earliest month it could mean, shrinking any
      // gap before it.
      return { start: start.index, end, employer: j.employer ?? "" }
    })
    .filter((s): s is { start: number; end: number; employer: string } => s !== null)
    .filter((s) => s.end >= s.start)
    .sort((a, b) => a.start - b.start)

  if (!spans.length) return []

  const gaps: EmploymentGap[] = []
  let covered = spans[0].end
  let coveredBy = spans[0].employer

  for (let i = 1; i < spans.length; i++) {
    const s = spans[i]
    // Overlapping or back-to-back jobs leave no gap; just extend the coverage.
    const months = s.start - covered - 1
    if (months >= GAP_THRESHOLD_MONTHS) {
      gaps.push({ months, afterEmployer: coveredBy, beforeEmployer: s.employer })
    }
    if (s.end > covered) {
      covered = s.end
      coveredBy = s.employer
    }
  }

  const trailing = nowIndex - covered - 1
  if (trailing >= GAP_THRESHOLD_MONTHS) {
    gaps.push({ months: trailing, afterEmployer: coveredBy, beforeEmployer: "" })
  }

  return gaps
}
