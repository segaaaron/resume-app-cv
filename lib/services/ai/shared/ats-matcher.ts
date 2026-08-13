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

import { SCORE_WEIGHTS, OLD_TITLE_CREDIT } from "@/lib/ats/scoring-config"
import { computeScoreBreakdown, type ScoreBreakdown } from "@/lib/ats/score-breakdown"
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
  /**
   * How the score was reached, category by category.
   *
   * Published so the panel can show the arithmetic instead of asking the user to
   * trust a number whose weights are, honestly, ours. Every row states what it
   * covered, what it was worth, what it contributed and what backs that weight.
   */
  breakdown: ScoreBreakdown
}

// Weighting of each category toward the overall score. Hard skills dominate
// because that is what real ATS keyword filters reward most. Categories with no
// extracted keywords are dropped and the remaining weights are renormalized, so
// a JD that lists no soft skills never penalizes the candidate for it.
// Sourced from lib/ats/scoring-config, where every tunable states what backs it.
// They used to be literals here, which made "why is this an 89?" unanswerable
// without reading the engine.
const WEIGHTS = {
  hardSkills: SCORE_WEIGHTS.hardSkills.value,
  mustHaves: SCORE_WEIGHTS.mustHaves.value,
  title: SCORE_WEIGHTS.title.value,
  softSkills: SCORE_WEIGHTS.softSkills.value,
  sections: SCORE_WEIGHTS.sections.value,
}

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
function coverage(
  keywords: string[],
  haystackNorm: string,
  evidenceNorm: string,
  semanticMatches?: Set<string>,
  /**
   * Normalized keywords a bullet was judged to DEMONSTRATE (see
   * soft-skill-evidence.ts). Used for the soft-skills lever, where the
   * requirement is a behaviour rather than a term: "comfortable working with
   * ambiguity" is never a string in a CV, so string presence pinned that
   * sub-score at 0% for everyone, forever. Evidence outranks presence here —
   * a behaviour shown in the work history is demonstrated by definition, which
   * is the strongest form of the match, not the weakest.
   */
  demonstratedByEvidence?: Set<string>,
): Coverage {
  const unique = dedupe(keywords)
  if (unique.length === 0) {
    return { matched: [], missing: [], demonstrated: [], listedOnly: [], pct: null }
  }
  // Presence (exact OR semantic) is the shared ATS-core primitive — the same
  // loop the free tool runs. See lib/ats/core/matching.ts.
  const { matched, missing: notPresent } = partitionByPresence(unique, haystackNorm, semanticMatches)
  const shown = demonstratedByEvidence?.size
    ? notPresent.filter((k) => demonstratedByEvidence.has(normalizeTerm(k)))
    : []
  const missing = shown.length ? notPresent.filter((k) => !shown.includes(k)) : notPresent
  const demonstrated: string[] = [...shown]
  const listedOnly: string[] = []
  for (const k of matched) {
    // Demonstrated still requires the keyword in the work experience text —
    // a semantic-only match is a claim (listed), not evidence of doing it.
    const exact = keywordPresent(k, haystackNorm)
    if (exact && keywordPresent(k, evidenceNorm)) demonstrated.push(k)
    else listedOnly.push(k)
  }
  return {
    matched: [...matched, ...shown],
    missing,
    demonstrated,
    listedOnly,
    pct: Math.round(((matched.length + shown.length) / unique.length) * 100),
  }
}

// Recency weight: a JD title token found in the candidate's CURRENT / target
// title is full evidence; one found only in an OLD title is discounted (0.6) —
// "iOS Developer 8 years ago" is not the same signal as "iOS Developer now",
// and real ATS (Workday/Taleo) weight the current title heavily. When
// `recentTitlesNorm` is omitted, behavior is unchanged (every title full credit),
// so existing callers and any non-recency path score exactly as before.
const RECENCY_OLD_TITLE_CREDIT = OLD_TITLE_CREDIT.value

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
  /**
   * Soft skills a bullet was judged to demonstrate. Only the soft lever reads
   * this: a hard skill is a tool and either appears or does not, while a soft
   * requirement is a behaviour and appears in what the candidate DID.
   */
  softDemonstrated?: Set<string>,
): ATSMatchResult {
  const hay = normalize(resumeText)
  const titlesNorm = normalize(cvTitles)
  const evidence = normalize(evidenceText)

  const hard = coverage(keywords.hardSkills, hay, evidence, semanticMatches)
  const soft = coverage(keywords.softSkills, hay, evidence, semanticMatches, softDemonstrated)
  const must = coverage(keywords.mustHaves, hay, evidence, semanticMatches)
  const title = titleScore(keywords.jobTitle, titlesNorm, recentTitles ? normalize(recentTitles) : undefined)
  const sectionsPct = sectionsScore(sections)

  // The arithmetic has ONE owner (lib/ats/score-breakdown): the number and the
  // "path to your target" below are the same renormalization, computed once, so
  // they cannot drift apart. It also returns the breakdown the panel shows, which
  // is what turns "trust the 89" into "here is where the 89 comes from".
  const breakdown = computeScoreBreakdown({
    hardSkills: hard.pct,
    mustHaves: must.pct,
    title,
    softSkills: soft.pct,
    sections: sectionsPct,
  })
  const score = breakdown.score

  // Path to target. Each lever's recoverable points = its share of the score
  // (w / totalW, the exact renormalization the score uses) times the gap it has
  // left to 100. Same math as `score`, so maxing every lever here lands on 100 —
  // the number and the plan can never disagree. Template layout is NOT here; the
  // caller adds it because only it knows the template.
  const missingCounts: Partial<Record<GapLever["key"], number>> = {
    hardSkills: hard.missing.length,
    mustHaves: must.missing.length,
    softSkills: soft.missing.length,
  }
  const gapLevers: GapLever[] = breakdown.categories
    .filter((c) => c.recoverable > 0)
    .map((c) => ({
      key: c.category,
      points: c.recoverable,
      currentPct: c.coveragePct,
      ...(missingCounts[c.category] !== undefined ? { missingCount: missingCounts[c.category] } : {}),
    }))

  return {
    score: clamp(score),
    gapLevers,
    breakdown,
    subScores: {
      hardSkills: hard.pct,
      softSkills: soft.pct,
      title,
      sections: sectionsPct,
    },
    matchedKeywords: dedupe(hard.matched).slice(0, 12),
    missingKeywords: hard.missing.slice(0, 8),
    missingMustHaves: must.missing.slice(0, 6),
    missingSoftSkills: soft.missing.slice(0, 6),
    // The stuffing answer. Dumping every missing keyword into Skills still
    // moves the score — coverage only asks whether the word is there — but now
    // all of them come back listed-only, and the user sees exactly which
    // claims their own CV does not back up. A fact, not an invented penalty.
    // Deduped: a posting can list the same requirement as both a hard skill and a
    // soft one ("Debugging production issues"), and concatenating the two buckets
    // emitted it twice. React saw two children with the same key and warned that it
    // may duplicate or OMIT one — a real risk of a button that edits the wrong
    // thing. Fixed at the source rather than in the render, so every consumer of
    // these lists gets one entry per requirement.
    demonstratedKeywords: dedupe([...hard.demonstrated, ...soft.demonstrated]).slice(0, 12),
    listedOnlyKeywords: dedupe([...hard.listedOnly, ...soft.listedOnly]).slice(0, 12),
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
