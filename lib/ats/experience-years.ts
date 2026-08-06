// lib/ats/experience-years.ts
//
// "5+ years of experience as an iOS developer" — is that actually missing?
//
// The must-have matcher answers by looking for the requirement's WORDS in the
// CV, and a CV never writes "5+ years of experience as an iOS developer" back at
// the posting. So a candidate with seven years was told, in the report, that
// five years of experience was a missing requirement. That is the single worst
// kind of false alarm: it tells the user the tool did not read their CV.
//
// This answers it with arithmetic instead: pull the number the requirement asks
// for, work out how many years the CV actually shows, and drop the requirement
// when the candidate clears the bar. Deterministic, both languages, no LLM.

/** "5+ years", "5 años", "al menos 3 años", "3-5 years", "over 7 years". */
const YEARS_RE = /(\d{1,2})\s*(?:\+|\s*-\s*\d{1,2})?\s*(?:\+\s*)?(?:years?|yrs?|años?|anos?)/i

/**
 * Years of experience a requirement demands, or null when it is not about
 * years at all. With a range ("3-5 years") the LOWER bound is the requirement —
 * that is the number the candidate has to clear.
 */
export function requiredYears(requirement: string): number | null {
  const m = YEARS_RE.exec(requirement)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) && n > 0 && n <= 50 ? n : null
}

interface WorkRow { startDate?: string; endDate?: string }

/** First 4-digit year in a free-text date field. */
function yearOf(raw: string | undefined): number | null {
  const m = /(19|20)\d{2}/.exec(raw ?? "")
  if (!m) return null
  const y = Number(m[0])
  return y >= 1950 && y <= 2100 ? y : null
}

/**
 * Years of experience the CV evidences.
 *
 * Two independent readings, and the LARGER wins:
 *  · the span from the earliest start date to the latest end date (an ongoing
 *    role with no end date counts through `now`), and
 *  · a claim the candidate states in prose ("more than 7 years of experience"),
 *    which is what a recruiter reads first.
 *
 * The span is deliberately not a sum of each role's length: overlapping jobs
 * would double-count, and a CV that lists a side role alongside a main one is
 * normal. Erring low here is safe — a low number can only keep a requirement in
 * the report, never invent a pass.
 */
export function cvExperienceYears(sectionData: Record<string, unknown>, now = new Date()): number {
  const work = (sectionData.workExperience ?? []) as WorkRow[]
  const currentYear = now.getFullYear()

  let earliest: number | null = null
  let latest: number | null = null
  for (const j of work) {
    const start = yearOf(j.startDate)
    if (start === null) continue
    // No end date on a job with a start date = still there.
    const end = yearOf(j.endDate) ?? currentYear
    if (earliest === null || start < earliest) earliest = start
    if (latest === null || end > latest) latest = end
  }
  const spanYears = earliest !== null && latest !== null ? Math.max(0, latest - earliest) : 0

  const summary = typeof sectionData.summary === "string" ? sectionData.summary : ""
  const claimed = requiredYears(summary) ?? 0

  return Math.max(spanYears, claimed)
}

/**
 * Drops the "N years of experience" requirements the CV already clears.
 *
 * Only requirements that name a number are ever touched: everything else is
 * outside what arithmetic can judge and is left exactly as the matcher reported
 * it. A requirement asking for MORE years than the CV shows stays in the list —
 * that one is a real gap.
 */
export function dropSatisfiedYearRequirements(
  requirements: string[],
  sectionData: Record<string, unknown>,
  now = new Date(),
): string[] {
  const have = cvExperienceYears(sectionData, now)
  if (have <= 0) return requirements
  return requirements.filter((r) => {
    const needed = requiredYears(r)
    return needed === null || needed > have
  })
}
