// lib/services/ai/shared/resume-score.ts
//
// Deterministic, job-description-INDEPENDENT resume score. Same input → same
// number, every time (no LLM, no randomness) — the property that makes the score
// trustworthy and that our LLM-guessing competitors (Rezi/VMock score engines)
// cannot claim. Mirrors the industry-standard dimensions (Impact, Action verbs,
// Completeness, Brevity) using ONLY signals we can measure in code, so nothing is
// fabricated: the score reports what the CV objectively contains, never a guess.

import { assessResumeContent } from "./bullet-quality"
import { parseBullets } from "./bullets"

export type ResumeScoreKey = "impact" | "actionVerbs" | "completeness" | "brevity" | "recruiterScan"

export interface ResumeScoreDimension {
  key: ResumeScoreKey
  /** 0-100, or null when not applicable (e.g. no bullets to judge impact on). */
  score: number | null
  /** Supporting counts so the UI can explain the number honestly. */
  detail: Record<string, number>
}

export interface ResumeScore {
  /** 0-100 weighted mean of the applicable dimensions. */
  overall: number
  dimensions: ResumeScoreDimension[]
}

// Weights of each dimension toward the overall. Only applicable (non-null)
// dimensions are averaged, then renormalized — a CV with no bullets is not
// punished on Impact, it simply scores on the dimensions that do apply.
const WEIGHTS: Record<ResumeScoreKey, number> = {
  impact: 0.3,
  actionVerbs: 0.2,
  completeness: 0.15,
  brevity: 0.15,
  recruiterScan: 0.2,
}

// A summary needs at least this many words to actually be read in the 6-second
// top-of-resume scan; a one-liner reads as a placeholder.
const SCAN_SUMMARY_MIN_WORDS = 15

// A bullet reads well between ~6 and ~32 words; a summary between ~25 and ~90.
// Outside these bands it is either too thin to carry meaning or a run-on a
// recruiter skims past. These bands come from the same guidance the review
// prompt gives users — kept here as the single source for the numeric score.
const BULLET_MIN_WORDS = 6
const BULLET_MAX_WORDS = 32
const SUMMARY_MIN_WORDS = 25
const SUMMARY_MAX_WORDS = 90

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

/** Computes the deterministic resume score from the structured CV data. */
export function computeResumeScore(sectionData: Record<string, unknown>): ResumeScore {
  const content = assessResumeContent(sectionData)

  // ── Impact: share of bullets that carry a real figure. ──────────────────
  const impact: ResumeScoreDimension = {
    key: "impact",
    score: content.totalBullets > 0 ? content.quantificationPct : null,
    detail: { quantified: content.quantifiedBullets, total: content.totalBullets },
  }

  // ── Action verbs: share of bullets NOT opening with a duty phrase. ──────
  const strongOpeners = content.totalBullets - content.weakOpenerBullets
  const actionVerbs: ResumeScoreDimension = {
    key: "actionVerbs",
    score: content.totalBullets > 0 ? clamp((strongOpeners / content.totalBullets) * 100) : null,
    detail: { strong: strongOpeners, weak: content.weakOpenerBullets, total: content.totalBullets },
  }

  // ── Completeness: which core sections are present. ──────────────────────
  const pd = (sectionData.personalDetails ?? {}) as { firstName?: string; email?: string; phone?: string; jobTitle?: string }
  const summary = typeof sectionData.summary === "string" ? sectionData.summary : ""
  const work = Array.isArray(sectionData.workExperience) ? sectionData.workExperience : []
  const education = Array.isArray(sectionData.education) ? sectionData.education : []
  const skills = Array.isArray(sectionData.skills) ? sectionData.skills : []
  const present = {
    contact: !!((pd.firstName ?? "").trim() && ((pd.email ?? "").trim() || (pd.phone ?? "").trim())),
    summary: summary.trim().length > 0,
    work: work.length > 0,
    education: education.length > 0,
    skills: skills.length > 0,
  }
  const presentCount = Object.values(present).filter(Boolean).length
  const completeness: ResumeScoreDimension = {
    key: "completeness",
    score: clamp((presentCount / 5) * 100),
    detail: { present: presentCount, total: 5 },
  }

  // ── Brevity: share of text units (summary + each bullet) within the ─────
  // recommended length band. Too short = thin; too long = a run-on.
  const units: boolean[] = []
  if (summary.trim()) {
    const w = wordCount(summary)
    units.push(w >= SUMMARY_MIN_WORDS && w <= SUMMARY_MAX_WORDS)
  }
  let longBullets = 0
  for (const job of work as Array<{ description?: string }>) {
    for (const b of parseBullets(job?.description ?? "")) {
      const w = wordCount(b)
      const ok = w >= BULLET_MIN_WORDS && w <= BULLET_MAX_WORDS
      units.push(ok)
      if (w > BULLET_MAX_WORDS) longBullets++
    }
  }
  const brevity: ResumeScoreDimension = {
    key: "brevity",
    score: units.length > 0 ? clamp((units.filter(Boolean).length / units.length) * 100) : null,
    detail: { withinRange: units.filter(Boolean).length, total: units.length, tooLong: longBullets },
  }

  // ── Recruiter scan: the 6 items a recruiter checks in the first 6-11 seconds ─
  // (name, current title, a readable summary, most-recent job title+employer+dates,
  // education). Failing these = rejected before the ATS or the deep read matters.
  const typedWork = work as Array<{ jobTitle?: string; employer?: string; startDate?: string; endDate?: string }>
  const yearOf = (w: { startDate?: string; endDate?: string }) => {
    const years = `${w.endDate ?? ""} ${w.startDate ?? ""}`.match(/20\d{2}|19\d{2}/g)
    return years ? Math.max(...years.map(Number)) : 0
  }
  const recentJob = [...typedWork].sort((a, b) => yearOf(b) - yearOf(a))[0]
  const scanChecks = {
    name: (pd.firstName ?? "").trim().length > 0,
    currentTitle: (pd.jobTitle ?? "").trim().length > 0 || (recentJob?.jobTitle ?? "").trim().length > 0,
    readableSummary: summary.trim().length > 0 && wordCount(summary) >= SCAN_SUMMARY_MIN_WORDS,
    recentJobComplete: !!recentJob && (recentJob.jobTitle ?? "").trim().length > 0 && (recentJob.employer ?? "").trim().length > 0 && !!((recentJob.startDate ?? "").trim() || (recentJob.endDate ?? "").trim()),
    education: education.length > 0,
  }
  const scanPassed = Object.values(scanChecks).filter(Boolean).length
  const recruiterScan: ResumeScoreDimension = {
    key: "recruiterScan",
    score: clamp((scanPassed / 5) * 100),
    detail: { passed: scanPassed, total: 5 },
  }

  const dimensions = [impact, actionVerbs, completeness, brevity, recruiterScan]

  // Weighted mean over applicable dimensions only, renormalized.
  let weighted = 0
  let totalW = 0
  for (const d of dimensions) {
    if (d.score === null) continue
    const w = WEIGHTS[d.key]
    weighted += d.score * w
    totalW += w
  }
  const overall = totalW > 0 ? clamp(weighted / totalW) : 0

  return { overall, dimensions }
}
