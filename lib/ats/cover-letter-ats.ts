// lib/ats/cover-letter-ats.ts
//
// Deterministic ATS-friendliness check for a COVER LETTER. No LLM, no quota —
// pure text analysis, so it runs client-side for free and always gives the same
// letter the same verdict.
//
// Honest scope (research: Workday/Greenhouse/Lever/Taleo/iCIMS parse and store
// cover letters, and some score them by keyword — but it varies by system). So
// we do NOT claim to BE the ATS or hand a guaranteed score. We check the things
// that make a letter machine-friendly AND recruiter-friendly: does it use the
// job's language, is it one page, is it clean of placeholders, is it readable.
//
// Keyword extraction + presence matching are the EXACT shared core the resume
// ATS uses (extractTopKeywords + partitionByPresence over the shared vocabulary),
// so a letter is checked against the very keywords a CV would be.

import { extractTopKeywords, normalize } from "./analyzer"
import { partitionByPresence } from "./core/matching"

export type CoverLetterAtsVerdict = "pass" | "caution" | "risk"

export type CoverLetterFormatIssue = "placeholder" | "unfilled_bracket"

export interface CoverLetterAtsResult {
  /** Overall 0-100, weighted across the dimensions that could be measured. */
  score: number
  verdict: CoverLetterAtsVerdict
  keywords: {
    /** false when no job description was supplied — the dimension is skipped. */
    checked: boolean
    score: number
    verdict: CoverLetterAtsVerdict
    matched: string[]
    missing: string[]
  }
  length: { verdict: CoverLetterAtsVerdict; wordCount: number }
  format: { verdict: CoverLetterAtsVerdict; issues: CoverLetterFormatIssue[] }
  readability: { verdict: CoverLetterAtsVerdict; avgSentenceWords: number; paragraphs: number }
}

// Ideal cover-letter length is one page ≈ 250-400 words (recruiters skim < 30s;
// 250-word letters out-callback 500+ word ones). These bands turn that into a score.
const LEN_IDEAL_MIN = 250
const LEN_IDEAL_MAX = 400
const LEN_OK_MIN = 180
const LEN_OK_MAX = 520

// Stand-in tokens that mean the letter was never finished: "XYZ Corp", "[Company]",
// "{name}", "Lorem ipsum". A recruiter reads these verbatim.
const PLACEHOLDER_RE = /\bXYZ\b|\bABC\s+(?:corp|company|inc)\b|lorem\s+ipsum/i
const BRACKET_RE = /\[[^\]]{1,40}\]|\{[^}]{1,40}\}/

function scoreToVerdict(score: number): CoverLetterAtsVerdict {
  if (score >= 75) return "pass"
  if (score >= 50) return "caution"
  return "risk"
}

function wordsOf(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

/**
 * Analyze a cover letter's ATS-friendliness. `letterText` is PLAIN text (the
 * caller strips HTML first). `jobDescription` is optional — without it the
 * keyword dimension is skipped and the score is drawn from the rest.
 */
export function analyzeCoverLetterAts(letterText: string, jobDescription = ""): CoverLetterAtsResult {
  const text = (letterText ?? "").trim()
  const words = wordsOf(text)
  const wordCount = words.length

  // ── Keywords ──────────────────────────────────────────────────────────────
  const jd = (jobDescription ?? "").trim()
  let keywords: CoverLetterAtsResult["keywords"]
  if (jd.length >= 20 && wordCount > 0) {
    const top = extractTopKeywords(jd)
    const { matched, missing } = partitionByPresence(top, normalize(text))
    const kwScore = top.length ? Math.round((matched.length / top.length) * 100) : 0
    keywords = {
      checked: true,
      score: kwScore,
      verdict: kwScore >= 55 ? "pass" : kwScore >= 30 ? "caution" : "risk",
      matched,
      missing,
    }
  } else {
    keywords = { checked: false, score: 0, verdict: "caution", matched: [], missing: [] }
  }

  // ── Length (one page) ─────────────────────────────────────────────────────
  let lengthScore: number
  if (wordCount >= LEN_IDEAL_MIN && wordCount <= LEN_IDEAL_MAX) lengthScore = 100
  else if (wordCount >= LEN_OK_MIN && wordCount <= LEN_OK_MAX) lengthScore = 70
  else lengthScore = 40
  const length = { verdict: scoreToVerdict(lengthScore), wordCount }

  // ── Format (placeholders / brackets) ──────────────────────────────────────
  const issues: CoverLetterFormatIssue[] = []
  if (PLACEHOLDER_RE.test(text)) issues.push("placeholder")
  if (BRACKET_RE.test(text)) issues.push("unfilled_bracket")
  const formatScore = issues.length === 0 ? 100 : 30
  const format = { verdict: scoreToVerdict(formatScore), issues }

  // ── Readability ───────────────────────────────────────────────────────────
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0)
  const paragraphs = text.split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean).length
  const avgSentenceWords = sentences.length ? Math.round(wordCount / sentences.length) : 0
  let readScore: number
  if (avgSentenceWords > 32) readScore = 40
  else if (avgSentenceWords >= 26 || paragraphs < 2) readScore = 65
  else readScore = 100
  // An empty / near-empty letter is not "readable", it's nothing.
  if (wordCount < 20) readScore = 40
  const readability = { verdict: scoreToVerdict(readScore), avgSentenceWords, paragraphs }

  // ── Overall ───────────────────────────────────────────────────────────────
  const score = keywords.checked
    ? Math.round(0.45 * keywords.score + 0.2 * lengthScore + 0.2 * formatScore + 0.15 * readScore)
    : Math.round(0.4 * lengthScore + 0.35 * formatScore + 0.25 * readScore)

  return { score, verdict: scoreToVerdict(score), keywords, length, format, readability }
}
