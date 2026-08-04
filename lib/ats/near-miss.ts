// lib/ats/near-miss.ts
//
// Typo / near-miss detector. A real ATS matches keywords by EXACT (stemmed) text,
// so "React Navite", "GrahpQL" or "Objetive-C" silently fail to match "React
// Native", "GraphQL", "Objective-C" — the candidate loses the keyword to a
// spelling slip they cannot see. Our own keyword score is blind to this too: it
// just reports the requirement as "missing", never as "you misspelled it".
//
// This module closes that gap deterministically. For each JD requirement that is
// NOT present in the CV, it looks for a CV phrase that is one or two edits away —
// a probable typo — and surfaces "you wrote X, the job wants Y". No LLM.
//
// It runs against the EXACT-missing set on purpose: the semantic (embedding) pass
// can quietly credit "React Navite" as "React Native present", which hides the
// typo while the real ATS still fails on it. Catching it here keeps the warning
// honest regardless of what the semantic pass decided.
import { distance } from "fastest-levenshtein"
import { normalizeTerm, termPresent } from "@/lib/ats/vocabulary"
import { isKnownSkill } from "@/lib/ats/skills-dictionary"

export interface NearMiss {
  /** The requirement as the job/canonical form spells it (what the ATS looks for). */
  keyword: string
  /** What the CV actually says — the probable typo, in the CV's own casing. */
  typed: string
}

/** Max edit distance that still reads as a typo (not a different word), by length. */
function maxEditDistance(normLen: number): number {
  if (normLen <= 4) return 1
  return 2
}

/** Strip surrounding punctuation for display without touching the inner spelling. */
function trimEdges(s: string): string {
  return s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}+#.]+$/gu, "")
}

/**
 * Find probable typos in the CV for the given required keywords.
 *
 * @param jdKeywords requirement keywords (hard skills + must-haves) in canonical form
 * @param cvText     the candidate's full CV text
 */
export function findNearMisses(jdKeywords: string[], cvText: string): NearMiss[] {
  const cvNorm = normalizeTerm(cvText)
  if (!cvNorm) return []

  // Parallel arrays: original words (for display) and their normalized forms
  // (for comparison). Empty normalized tokens (pure punctuation) are dropped from
  // both so an n-gram never straddles a gap.
  const rawWords = cvText.split(/\s+/).map(trimEdges).filter(Boolean)
  const words = rawWords
    .map((w) => ({ orig: w, norm: normalizeTerm(w) }))
    .filter((w) => w.norm.length > 0)

  const seen = new Set<string>()
  const out: NearMiss[] = []

  for (const kwRaw of jdKeywords) {
    const kw = normalizeTerm(kwRaw)
    if (kw.length < 4) continue // too short: an edit of 1 is a different word
    // Already in the CV (exact or via alias)? Then it is not a typo — skip.
    if (termPresent(kwRaw, cvNorm)) continue

    const n = kw.split(" ").filter(Boolean).length
    const budget = maxEditDistance(kw.replace(/\s/g, "").length)

    let best: { d: number; orig: string; norm: string } | null = null
    for (let i = 0; i + n <= words.length; i++) {
      const slice = words.slice(i, i + n)
      const candNorm = slice.map((w) => w.norm).join(" ")
      // A length gap wider than the budget can never be a typo — skip the costly
      // distance call. (guards "React" vs "React Native" style subset noise.)
      if (Math.abs(candNorm.length - kw.length) > budget) continue
      const d = distance(kw, candNorm)
      if (best === null || d < best.d) {
        best = { d, orig: slice.map((w) => w.orig).join(" "), norm: candNorm }
      }
    }

    if (!best || best.d < 1 || best.d > budget) continue
    // The candidate is itself a real, distinct skill (Vue vs Vuex, Java vs JavaScript)
    // → not a typo, a different technology. Don't "correct" it.
    if (isKnownSkill(best.norm)) continue

    const key = kw
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ keyword: kwRaw, typed: best.orig })
    if (out.length >= 6) break
  }

  return out
}
