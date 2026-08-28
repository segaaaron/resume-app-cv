// lib/cover-letter/cover-letter-ats.ts
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

import { wordsOf } from "@/lib/services/ai/shared/text-similarity"
import { extractTopKeywords, normalize } from "./analyzer"
import { partitionByPresence } from "@/lib/ats/core/matching"

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

// Ideal cover-letter length is one page ≈ 210-400 words (recruiters skim < 30s;
// a tight 220-word letter out-callbacks a 500+ word one). The floor is 210, not 250,
// so a genuinely concise, specific letter (~230 words) reads as ideal, not "short" —
// brevity is a virtue here, only true padding-shortness (< 180) is a caution.
const LEN_IDEAL_MIN = 210
const LEN_IDEAL_MAX = 400
const LEN_OK_MIN = 160
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
      // A cover letter is PROSE, not a keyword list: a well-written one naturally
      // echoes only a fraction of a JD's terms. Judging it by CV-grade keyword
      // density (was pass≥55) flagged good letters as "risk". Hitting ~a third of
      // the JD's keywords through real sentences is a healthy letter.
      verdict: kwScore >= 30 ? "pass" : kwScore >= 15 ? "caution" : "risk",
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
  // Keywords are a NUDGE for a letter, not the verdict. They used to weigh 0.45,
  // which let a low prose-vs-JD overlap (normal for a good letter) drag an otherwise
  // clean, well-sized, readable letter down to red. Format/length/readability — what
  // actually makes a letter parse and read well — now carry it; keywords inform.
  const score = keywords.checked
    ? Math.round(0.25 * keywords.score + 0.25 * lengthScore + 0.3 * formatScore + 0.2 * readScore)
    : Math.round(0.4 * lengthScore + 0.35 * formatScore + 0.25 * readScore)

  return { score, verdict: scoreToVerdict(score), keywords, length, format, readability }
}
