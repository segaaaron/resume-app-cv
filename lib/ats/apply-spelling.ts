// lib/ats/apply-spelling.ts
// Deterministic spelling correction for the "Fix typo" button. Replaces a whole,
// boundary-delimited occurrence of the misspelled term with the correct one —
// case-insensitive, but never mid-word, so "Objetive-C" → "Objective-C" while
// "ObjetiveCoding" is left untouched. Kept pure and separate so it can be tested
// without a React component harness.
import { escapeRegExp } from "@/lib/ats/vocabulary"

/**
 * Replace every whole-word occurrence of `typed` with `correct` in `text`.
 * Boundaries use Unicode letter/number classes so hyphenated/plus tech terms
 * ("Objective-C", "C++") match correctly and partial words never do.
 */
export function replaceWord(text: string, typed: string, correct: string): string {
  if (!text || !typed.trim()) return text
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(typed)}(?![\\p{L}\\p{N}])`, "giu")
  return text.replace(re, (_m, pre: string) => `${pre}${correct}`)
}
