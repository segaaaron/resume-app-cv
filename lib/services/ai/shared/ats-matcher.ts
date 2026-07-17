// lib/services/ai/shared/ats-matcher.ts
//
// Deterministic ATS matching. Given the requirement keywords extracted from a
// job description and the candidate's CV text, this module computes coverage
// sub-scores and a single overall score IN CODE — no LLM, no randomness. The
// same (keywords, CV) input always yields the same score, which is what makes
// the ATS score trustworthy and reproducible (unlike an LLM-guessed number).

import type { ATSSubScores } from "./ai-types"
import { normalizeTerm, termPresent, escapeRegExp } from "@/lib/ats/vocabulary"

// The vocabulary is shared with the free /tools/ats-checker. This module used
// to carry its own 13-group alias table while a curated 244-term dictionary sat
// one directory away, unread — so "5 years on AWS" did not match "Amazon Web
// Services" and "liderazgo de equipos" did not match "Leadership". The aliases
// that fixed both were already written.
export const normalize = normalizeTerm
export const keywordPresent = termPresent

export interface ATSKeywords {
  hardSkills: string[]
  softSkills: string[]
  jobTitle: string
  mustHaves: string[]
}

export interface SectionPresence {
  summary: boolean
  work: boolean
  skills: boolean
  education: boolean
}

export interface ATSMatchResult {
  score: number
  subScores: ATSSubScores
  matchedKeywords: string[]   // hard skills found in the CV
  missingKeywords: string[]   // hard skills NOT in the CV (verified set-diff)
  missingMustHaves: string[]  // requirements/qualifications NOT in the CV
}

// Weighting of each category toward the overall score. Hard skills dominate
// because that is what real ATS keyword filters reward most. Categories with no
// extracted keywords are dropped and the remaining weights are renormalized, so
// a JD that lists no soft skills never penalizes the candidate for it.
const WEIGHTS = { hardSkills: 0.45, mustHaves: 0.2, title: 0.15, softSkills: 0.1, sections: 0.1 }

const STOPWORDS = new Set([
  "the", "and", "for", "with", "los", "las", "una", "uno", "del", "por", "con",
  "de", "la", "el", "en", "y", "a", "of", "to", "in", "on", "at",
])

/**
 * Normalize text for comparison: lowercase, strip accents, drop punctuation
 * (keeping technical characters like + # . / -), collapse whitespace.
 */


interface Coverage {
  matched: string[]
  missing: string[]
  pct: number | null // null = no keywords in this category (not applicable)
}

function coverage(keywords: string[], haystackNorm: string): Coverage {
  const unique = dedupe(keywords)
  if (unique.length === 0) return { matched: [], missing: [], pct: null }
  const matched: string[] = []
  const missing: string[] = []
  for (const k of unique) {
    if (keywordPresent(k, haystackNorm)) matched.push(k)
    else missing.push(k)
  }
  return { matched, missing, pct: Math.round((matched.length / unique.length) * 100) }
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of items) {
    const item = raw.trim()
    if (!item) continue
    const key = normalize(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

function titleScore(jdTitle: string, cvTitlesNorm: string): number | null {
  const norm = normalize(jdTitle)
  const tokens = norm.split(" ").filter((w) => w.length > 2 && !STOPWORDS.has(w))
  if (tokens.length === 0) return null
  const hits = tokens.filter((tk) =>
    new RegExp(`(^|[^a-z0-9])${escapeRegExp(tk)}`).test(cvTitlesNorm),
  ).length
  return Math.round((hits / tokens.length) * 100)
}

function sectionsScore(s: SectionPresence): number {
  const present = [s.summary, s.work, s.skills, s.education].filter(Boolean).length
  return Math.round((present / 4) * 100)
}

/**
 * Compute the deterministic ATS match. `resumeText` is the plain-text CV, and
 * `cvTitles` is the candidate's target role + past job titles (used only for the
 * title-match sub-score).
 */
export function computeATSMatch(
  keywords: ATSKeywords,
  resumeText: string,
  cvTitles: string,
  sections: SectionPresence,
): ATSMatchResult {
  const hay = normalize(resumeText)
  const titlesNorm = normalize(cvTitles)

  const hard = coverage(keywords.hardSkills, hay)
  const soft = coverage(keywords.softSkills, hay)
  const must = coverage(keywords.mustHaves, hay)
  const title = titleScore(keywords.jobTitle, titlesNorm)
  const sectionsPct = sectionsScore(sections)

  const parts: Array<{ pct: number; w: number }> = []
  if (hard.pct !== null) parts.push({ pct: hard.pct, w: WEIGHTS.hardSkills })
  if (must.pct !== null) parts.push({ pct: must.pct, w: WEIGHTS.mustHaves })
  if (title !== null) parts.push({ pct: title, w: WEIGHTS.title })
  if (soft.pct !== null) parts.push({ pct: soft.pct, w: WEIGHTS.softSkills })
  parts.push({ pct: sectionsPct, w: WEIGHTS.sections })

  const totalW = parts.reduce((acc, p) => acc + p.w, 0)
  const score = totalW === 0
    ? 0
    : Math.round(parts.reduce((acc, p) => acc + p.pct * p.w, 0) / totalW)

  return {
    score: clamp(score),
    subScores: {
      hardSkills: hard.pct,
      softSkills: soft.pct,
      title,
      sections: sectionsPct,
    },
    matchedKeywords: hard.matched.slice(0, 12),
    missingKeywords: hard.missing.slice(0, 8),
    missingMustHaves: must.missing.slice(0, 6),
  }
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n))
}

/** Bucket label key from a score. UI maps this to a localized string. */
export function scoreLabel(score: number): "excellent" | "good" | "fair" | "low" {
  if (score >= 80) return "excellent"
  if (score >= 60) return "good"
  if (score >= 40) return "fair"
  return "low"
}
