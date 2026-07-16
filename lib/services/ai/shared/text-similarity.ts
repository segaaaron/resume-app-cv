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
