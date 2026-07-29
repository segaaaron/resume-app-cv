// lib/services/ai/shared/text-similarity.ts
// Safety net against no-op AI suggestions.
//
// The real fix for echoed suggestions is the response contract (return only the
// items you actually changed, and be allowed to return none). This is the belt
// to that pair of braces: if a model still hands back a near-copy of the input,
// drop it here rather than show the user a diff with nothing in it.
import { distance } from "fastest-levenshtein"

/** Collapses whitespace/case/markers so only real edits register. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/^[\s•·]+|^[-*]+\s+/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.;,]+$/, "")
    .trim()
}

/**
 * Normalized Levenshtein similarity in [0, 1]. 1 = identical after normalization.
 */
export function normalizedSimilarity(a: string, b: string): number {
  const A = normalize(a)
  const B = normalize(b)
  if (!A && !B) return 1
  const longest = Math.max(A.length, B.length)
  if (longest === 0) return 1
  return 1 - distance(A, B) / longest
}

/**
 * Similarity at or above which an edit reads as an echo rather than a rewrite.
 *
 * No published threshold exists for "this edit is too trivial to show" — the
 * near-duplicate literature targets document-scale dedup, which does not
 * transfer to single sentences. 0.90 is a deliberate first guess, not a number
 * borrowed from a paper: calibrate it against real (original, suggested) pairs
 * from AIUsageLog before trusting it, and expect it to differ per endpoint.
 */
export const TRIVIAL_EDIT_SIMILARITY = 0.9

/**
 * True when `suggested` is not a real improvement over `original`: identical,
 * empty, or a near-copy. Callers drop these instead of surfacing a diff whose
 * two sides read the same.
 */
export function isTrivialEdit(original: string, suggested: string): boolean {
  if (!suggested.trim()) return true
  return normalizedSimilarity(original, suggested) >= TRIVIAL_EDIT_SIMILARITY
}

/** Significant words of a normalized string (drops leading markers, empties). */
function wordsOf(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean)
}

/**
 * Similarity floor above which a near-copy is a candidate for the cosmetic-reword
 * check. Below it the two texts differ enough to be a genuine rewrite worth showing.
 * Deliberately below TRIVIAL_EDIT_SIMILARITY: a synonym swap ("improve"→"strengthen")
 * changes more characters than a typo fix, so it lands lower on the similarity scale
 * yet still adds no information.
 */
export const COSMETIC_REWORD_SIMILARITY = 0.82

/**
 * True when `suggested` merely rewords `original` with synonyms while carrying no
 * new information — a near-copy where real words were SUBSTITUTED for other real
 * words (e.g. "improve"→"strengthen", "helped reduce"→"reduced").
 *
 * Deliberately distinguished from two things that also read as near-copies but ARE
 * worth keeping:
 *   • a spelling/grammar fix — the changed word is a small in-word correction of an
 *     original token (levenshtein small), so it is NOT counted as a substitution;
 *   • an enrichment that ADDS a real keyword/metric — words are added but none are
 *     removed, so there is no substitution pair.
 * Only when BOTH a real word left and a real word came in (a swap) on an otherwise
 * near-identical sentence is it cosmetic.
 */
export function isCosmeticReword(original: string, suggested: string): boolean {
  if (!suggested.trim()) return false
  if (normalizedSimilarity(original, suggested) < COSMETIC_REWORD_SIMILARITY) return false

  const o = wordsOf(original)
  const s = wordsOf(suggested)
  const oSet = new Set(o)
  const sSet = new Set(s)
  const removed = o.filter((w) => !sSet.has(w))
  const added = s.filter((w) => !oSet.has(w))
  if (added.length === 0 || removed.length === 0) return false // pure add or pure delete — not a swap

  // A changed pair is a typo fix (keep) when the new word is a small in-word edit of
  // a removed word; a synonym swap (drop) when it is not close to anything removed.
  const isTypoFix = (a: string, r: string) => {
    const d = distance(a, r)
    return d > 0 && d <= Math.max(1, Math.floor(Math.min(a.length, r.length) * 0.34))
  }
  const addedReal = added.filter((a) => !removed.some((r) => isTypoFix(a, r)))
  const removedReal = removed.filter((r) => !added.some((a) => isTypoFix(a, r)))
  return addedReal.length > 0 && removedReal.length > 0
}
