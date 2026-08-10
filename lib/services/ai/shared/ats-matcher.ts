// lib/services/ai/shared/ats-matcher.ts
//
// Deterministic ATS matching. Given the requirement keywords extracted from a
// job description and the candidate's CV text, this module computes coverage
// sub-scores and a single overall score IN CODE — no LLM, no randomness. The
// same (keywords, CV) input always yields the same score, which is what makes
// the ATS score trustworthy and reproducible (unlike an LLM-guessed number).
//
// WHY THIS COEXISTS WITH lib/ats/analyzer.ts (audited 2026-07-23 — do not "unify"):
// The two engines measure different things because they receive different inputs.
//   - analyzer.ts  ← plain text extracted from a PDF. Nothing else is knowable, so
//     it scores keywords/format/sections/length/contact.
//   - this module   ← structured resume data. Layout and length are decided by the
//     template (and layout risk is already handled by template-ats-safety.ts), so
//     it scores what only structure exposes: must-haves, title match with recency,
//     and listed-vs-demonstrated evidence.
// Everything that MUST agree is already shared: term normalization and presence
// (lib/ats/vocabulary.ts), the match primitives (lib/ats/core/matching.ts) and the
// skills dictionary. What remains apart is deliberately apart — merging the factor
// sets would force each engine to score inputs it cannot see. See TITLE_CONNECTORS
// below for why the two word lists must stay separate too.

import type { ATSSubScores, GapLever } from "./ai-types"
import { normalizeTerm, termPresent, escapeRegExp } from "@/lib/ats/vocabulary"
import { dedupe, partitionByPresence } from "@/lib/ats/core/matching"

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
  /**
   * Soft skills the posting asks for that the CV does not demonstrate.
   *
   * These used to reach the panel only as a by-product of the tailor call, which
   * is rate-limited — so running two analyses in a row left the soft-skill list
   * silently empty. They come from the same deterministic pass as everything
   * else here, so they are always present.
   */
  missingSoftSkills: string[]
  /** Found in the work experience — the CV backs the claim up. */
  demonstratedKeywords: string[]
  /** Found only in a list, with nothing in the work experience behind it. */
  listedOnlyKeywords: string[]
  /** The scored levers that can still move THIS score, each with the points it can
   *  recover — computed from the SAME weights and renormalization the score uses,
   *  so the "path to your target" can never contradict the number. Template layout
   *  is added by the caller (the matcher does not know the template). */
  gapLevers: GapLever[]
}

// Weighting of each category toward the overall score. Hard skills dominate
// because that is what real ATS keyword filters reward most. Categories with no
// extracted keywords are dropped and the remaining weights are renormalized, so
// a JD that lists no soft skills never penalizes the candidate for it.
const WEIGHTS = { hardSkills: 0.45, mustHaves: 0.2, title: 0.15, softSkills: 0.1, sections: 0.1 }

/**
 * Function words that glue a JOB TITLE together — "Head OF Design", "Ingeniero DE
 * Sistemas", "Analyst FOR Risk". Dropping them leaves the tokens that identify the
 * role, which is all titleScore compares.
 *
 * Named for its job, not "STOPWORDS", on purpose: the free tool's stopword list
 * (lib/ats/analyzer.ts) strips PROSE from a job description and therefore swallows
 * "team", "support", "key", "lead-adjacent" verbs — words that carry the entire
 * meaning of a title ("Team Lead", "Support Engineer"). The two lists must never be
 * merged; sharing them would silently move every user's title sub-score. A name
 * that states the purpose is the cheapest guard against that.
 *
 * Only 3+ character entries belong here: titleScore filters `length > 2` before
 * consulting this set, so shorter words (de/la/el/of/to/in) are already gone and
 * listing them again is dead weight.
 */
const TITLE_CONNECTORS = new Set([
  // EN
  "the", "and", "for", "with",
  // ES
  "los", "las", "una", "uno", "unos", "unas", "del", "por", "con", "para",
])

/**
 * Normalize text for comparison: lowercase, strip accents, drop punctuation
 * (keeping technical characters like + # . / -), collapse whitespace.
 */


interface Coverage {
  matched: string[]
  missing: string[]
  /** Matched, and the CV backs it up somewhere in the work experience. */
  demonstrated: string[]
  /** Matched, but only in a list — Skills, or a bare mention with no work behind it. */
  listedOnly: string[]
  pct: number | null // null = no keywords in this category (not applicable)
}

/**
 * Splits matched keywords by whether the CV actually backs them up.
 *
 * A keyword sitting in the Skills list is a claim; the same keyword inside a
 * work-experience bullet is evidence. Recruiters read it that way, and so does
 * every semantic screener. Nothing is scored down for being listed-only — the
 * distinction is reported, not penalised. Inventing a discount ("a listed skill
 * is worth 60%") would be exactly the fabricated precision this product has
 * been purging.
 */
function coverage(keywords: string[], haystackNorm: string, evidenceNorm: string, semanticMatches?: Set<string>): Coverage {
  const unique = dedupe(keywords)
  if (unique.length === 0) {
    return { matched: [], missing: [], demonstrated: [], listedOnly: [], pct: null }
  }
  // Presence (exact OR semantic) is the shared ATS-core primitive — the same
  // loop the free tool runs. See lib/ats/core/matching.ts.
  const { matched, missing } = partitionByPresence(unique, haystackNorm, semanticMatches)
  const demonstrated: string[] = []
  const listedOnly: string[] = []
  for (const k of matched) {
    // Demonstrated still requires the keyword in the work experience text —
    // a semantic-only match is a claim (listed), not evidence of doing it.
    const exact = keywordPresent(k, haystackNorm)
    if (exact && keywordPresent(k, evidenceNorm)) demonstrated.push(k)
    else listedOnly.push(k)
  }
  return {
    matched,
    missing,
    demonstrated,
    listedOnly,
    pct: Math.round((matched.length / unique.length) * 100),
  }
}

// Recency weight: a JD title token found in the candidate's CURRENT / target
// title is full evidence; one found only in an OLD title is discounted (0.6) —
// "iOS Developer 8 years ago" is not the same signal as "iOS Developer now",
// and real ATS (Workday/Taleo) weight the current title heavily. When
// `recentTitlesNorm` is omitted, behavior is unchanged (every title full credit),
// so existing callers and any non-recency path score exactly as before.
const RECENCY_OLD_TITLE_CREDIT = 0.6

function titleScore(jdTitle: string, cvTitlesNorm: string, recentTitlesNorm?: string): number | null {
  const norm = normalize(jdTitle)
  const tokens = norm.split(" ").filter((w) => w.length > 2 && !TITLE_CONNECTORS.has(w))
  if (tokens.length === 0) return null
  const present = (tk: string, hay: string) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(tk)}`).test(hay)
  let hits = 0
  for (const tk of tokens) {
    if (recentTitlesNorm && present(tk, recentTitlesNorm)) hits += 1
    else if (present(tk, cvTitlesNorm)) hits += recentTitlesNorm ? RECENCY_OLD_TITLE_CREDIT : 1
  }
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
  /**
   * The work-experience text on its own. A keyword found here is demonstrated;
   * one found only in `resumeText` is a claim in a list. Optional so existing
   * callers keep working — when omitted, nothing is treated as demonstrated.
   */
  evidenceText = "",
  /**
   * Normalized keywords an embedding pass proved semantically present in the CV
   * even though the exact matcher missed them (see semantic-match.ts). Optional
   * so every existing caller — and the deterministic instant re-score — keep
   * exact-only behavior unchanged.
   */
  semanticMatches?: Set<string>,
  /**
   * The candidate's current/target titles (target role + most recent job). When
   * provided, the title sub-score credits a JD-title match in these fully and an
   * old-title-only match partially (recency weight). Optional so the instant
   * re-score and existing callers keep identical behavior when omitted.
   */
  recentTitles?: string,
): ATSMatchResult {
  const hay = normalize(resumeText)
  const titlesNorm = normalize(cvTitles)
  const evidence = normalize(evidenceText)

  const hard = coverage(keywords.hardSkills, hay, evidence, semanticMatches)
  const soft = coverage(keywords.softSkills, hay, evidence, semanticMatches)
  const must = coverage(keywords.mustHaves, hay, evidence, semanticMatches)
  const title = titleScore(keywords.jobTitle, titlesNorm, recentTitles ? normalize(recentTitles) : undefined)
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

  // Path to target. Each lever's recoverable points = its share of the score
  // (w / totalW, the exact renormalization the score uses) times the gap it has
  // left to 100. Same math as `score`, so maxing every lever here lands on 100 —
  // the number and the plan can never disagree. Template layout is NOT here; the
  // caller adds it because only it knows the template.
  const share = (w: number) => (totalW === 0 ? 0 : w / totalW)
  const lever = (
    key: GapLever["key"],
    pct: number | null,
    w: number,
    missingCount?: number,
  ): GapLever | null => {
    if (pct === null) return null
    const points = Math.round(share(w) * (100 - pct))
    if (points <= 0) return null
    return { key, points, currentPct: pct, ...(missingCount !== undefined ? { missingCount } : {}) }
  }
  const gapLevers = [
    lever("hardSkills", hard.pct, WEIGHTS.hardSkills, hard.missing.length),
    lever("mustHaves", must.pct, WEIGHTS.mustHaves, must.missing.length),
    lever("title", title, WEIGHTS.title),
    lever("softSkills", soft.pct, WEIGHTS.softSkills, soft.missing.length),
    lever("sections", sectionsPct, WEIGHTS.sections),
  ].filter((l): l is GapLever => l !== null)

  return {
    score: clamp(score),
    gapLevers,
    subScores: {
      hardSkills: hard.pct,
      softSkills: soft.pct,
      title,
      sections: sectionsPct,
    },
    matchedKeywords: hard.matched.slice(0, 12),
    missingKeywords: hard.missing.slice(0, 8),
    missingMustHaves: must.missing.slice(0, 6),
    missingSoftSkills: soft.missing.slice(0, 6),
    // The stuffing answer. Dumping every missing keyword into Skills still
    // moves the score — coverage only asks whether the word is there — but now
    // all of them come back listed-only, and the user sees exactly which
    // claims their own CV does not back up. A fact, not an invented penalty.
    demonstratedKeywords: [...hard.demonstrated, ...soft.demonstrated].slice(0, 12),
    listedOnlyKeywords: [...hard.listedOnly, ...soft.listedOnly].slice(0, 12),
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
