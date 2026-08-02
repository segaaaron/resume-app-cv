// lib/ats/cover-letter-brief.ts
//
// Deterministic PLANNING layer for cover-letter generation — the "algorithm
// detects, the AI writes" pattern the project already uses for the résumé ATS.
//
// The generator used to hand the model a free-text blob and hope. The result was
// generic letters (the model guessing what to feature) and, on thin input, an
// empty body → off_topic. This module removes the guessing: given the Job
// Description and the candidate's REAL résumé, it computes — with the same shared
// ATS engine the résumé scoring uses — exactly which of the vacancy's keywords the
// résumé genuinely supports, and which concrete résumé lines back them. The model
// then writes prose AROUND that grounded skeleton.
//
// Two guarantees fall out of this by construction, not by prompt wording:
//  • Tailored, not generic — the letter features the vacancy's own top terms.
//  • Never invented — only keywords the résumé already supports are featured;
//    JD terms the résumé lacks are returned as gaps to AVOID, never to fabricate.
//
// Pure text analysis: no LLM, no quota, deterministic — so it is golden-testable
// and costs nothing to run.

import { extractTopKeywords, normalize } from "./analyzer"
import { partitionByPresence, dedupe } from "./core/matching"
import { isKnownSkill } from "./skills-dictionary"

/** How many supported JD keywords to hand the model. Enough to tailor, capped so
 *  the prompt can't be stuffed into keyword soup. */
const MAX_FEATURE_KEYWORDS = 12
/** How many concrete résumé lines to surface as evidence for the "why me" body. */
const MAX_EVIDENCE = 5
/** A JD shorter than this carries no usable signal — treat as "no JD supplied". */
const MIN_JD_LEN = 20

/** extractTopKeywords tokenises a JD by frequency, so it leaks punctuation-tailed
 *  tokens ("apis.", "cd.") and generic words. Strip leading/trailing punctuation
 *  but keep skill-internal marks (node.js, c++, c#) so a keyword reads like a word. */
function cleanTerm(t: string): string {
  return t.replace(/^[^\p{L}\p{N}]+/u, "").replace(/[^\p{L}\p{N}+#]+$/u, "")
}

export interface CoverLetterEvidence {
  /** A concrete line from the résumé (a work bullet, the summary, a project). */
  text: string
  /** Which featured JD keywords this line backs — the reason to include it. */
  keywords: string[]
}

export interface CoverLetterBrief {
  company: string
  role: string
  /** JD keywords the résumé genuinely supports, in priority order — SAFE to feature. */
  featureKeywords: string[]
  /** JD keywords the résumé does NOT support — never invent these into the letter. */
  gapsToAvoid: string[]
  /** Real résumé lines that map to top JD requirements, richest first. */
  supportingEvidence: CoverLetterEvidence[]
  hasJd: boolean
  hasResume: boolean
}

/** The subset of résumé section data this planner reads. Mirrors the shape
 *  buildResumeContext already parses, so callers pass the same object. */
interface ResumeSections {
  personalDetails?: { jobTitle?: string }
  workExperience?: Array<{ jobTitle?: string; employer?: string; description?: string }>
  skills?: Array<{ name?: string }>
  summary?: string
  certifications?: Array<{ name?: string; issuer?: string }>
  projects?: Array<{ name?: string; description?: string }>
}

/** Strip rich-text markup a description field may carry, down to plain words. */
function toPlain(s: string | undefined): string {
  if (!s) return ""
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

/** Split a work/project description into candidate evidence lines (one per bullet
 *  or sentence), so a keyword maps to the specific achievement that backs it. */
function splitLines(text: string): string[] {
  return toPlain(text)
    .split(/[\n•·]|(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ])/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 12)
}

/** Everything the résumé says, normalized once, as the haystack we test JD
 *  keywords against — skills, work, summary, projects, certs, titles. */
function resumeHaystack(r: ResumeSections): string {
  const parts: string[] = []
  if (r.personalDetails?.jobTitle) parts.push(r.personalDetails.jobTitle)
  for (const s of r.skills ?? []) if (s?.name) parts.push(s.name)
  for (const w of r.workExperience ?? []) {
    if (w?.jobTitle) parts.push(w.jobTitle)
    if (w?.employer) parts.push(w.employer)
    if (w?.description) parts.push(toPlain(w.description))
  }
  if (r.summary) parts.push(toPlain(r.summary))
  for (const c of r.certifications ?? []) {
    if (c?.name) parts.push(c.name)
    if (c?.issuer) parts.push(c.issuer)
  }
  for (const p of r.projects ?? []) {
    if (p?.name) parts.push(p.name)
    if (p?.description) parts.push(toPlain(p.description))
  }
  return normalize(parts.join(" \n "))
}

/** Candidate evidence lines: work bullets, the summary, project blurbs. */
function evidenceLines(r: ResumeSections): string[] {
  const lines: string[] = []
  for (const w of r.workExperience ?? []) {
    if (w?.description) lines.push(...splitLines(w.description))
  }
  if (r.summary) lines.push(...splitLines(r.summary))
  for (const p of r.projects ?? []) {
    if (p?.description) lines.push(...splitLines(p.description))
  }
  return lines
}

export interface BuildBriefInput {
  jobDescription?: string
  sectionData?: Record<string, unknown> | null
  company?: string
  jobTitle?: string
}

/**
 * Plan a cover letter: what to feature (grounded in the résumé AND relevant to
 * the vacancy), what NOT to touch (JD gaps), and which real lines to build the
 * "why me" body around. Deterministic — same inputs, same brief.
 */
export function buildCoverLetterBrief(input: BuildBriefInput): CoverLetterBrief {
  const jd = (input.jobDescription ?? "").trim()
  const hasJd = jd.length >= MIN_JD_LEN
  const r = (input.sectionData ?? {}) as ResumeSections
  const hasResume = !!(r.workExperience?.length || r.skills?.length || r.summary || r.projects?.length)

  const company = (input.company ?? "").trim()
  const role = (input.jobTitle ?? r.personalDetails?.jobTitle ?? "").trim()

  // No JD → nothing to tailor against. Return an empty plan; the caller still
  // generates from the résumé context, just without vacancy targeting.
  if (!hasJd) {
    return { company, role, featureKeywords: [], gapsToAvoid: [], supportingEvidence: [], hasJd: false, hasResume }
  }

  const topKw = extractTopKeywords(jd)
  const haystack = resumeHaystack(r)

  // The crux: split the vacancy's own top keywords into the ones the résumé
  // genuinely backs (feature these — true AND relevant) and the ones it doesn't
  // (gaps — never fabricate). extractTopKeywords already returns them by weight,
  // so featureKeywords stays in priority order.
  const { matched, missing } = partitionByPresence(topKw, haystack)
  // Clean + dedupe so the model never sees "apis." or a doubled "node.js".
  const featureKeywords = dedupe(matched.map(cleanTerm).filter(Boolean)).slice(0, MAX_FEATURE_KEYWORDS)
  // Gaps are only useful to the model as "real tools the CV lacks — don't claim
  // them". Filtering to the skills dictionary drops generic JD noise ("hiring",
  // "senior", "lead") so the anti-invention hint stays about actual tech.
  const gapsToAvoid = dedupe(missing.map(cleanTerm).filter((t) => t && isKnownSkill(t)))

  // Attach evidence: for each real résumé line, which featured keywords it backs.
  // A line that backs more of the vacancy's priorities is stronger, so rank by
  // hit count and keep the top few for the body.
  const supportingEvidence: CoverLetterEvidence[] = []
  if (featureKeywords.length) {
    for (const line of evidenceLines(r)) {
      const hits = dedupe(partitionByPresence(featureKeywords, normalize(line)).matched)
      if (hits.length) supportingEvidence.push({ text: line, keywords: hits })
    }
    supportingEvidence.sort((a, b) => b.keywords.length - a.keywords.length)
  }

  return {
    company,
    role,
    featureKeywords,
    gapsToAvoid,
    supportingEvidence: supportingEvidence.slice(0, MAX_EVIDENCE),
    hasJd: true,
    hasResume,
  }
}
