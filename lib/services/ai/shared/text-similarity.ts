// lib/services/ai/shared/text-similarity.ts
// Safety net against no-op AI suggestions.
//
// The real fix for echoed suggestions is the response contract (return only the
// items you actually changed, and be allowed to return none). This is the belt
// to that pair of braces: if a model still hands back a near-copy of the input,
// drop it here rather than show the user a diff with nothing in it.
import { distance } from "fastest-levenshtein"
import { isKnownSkill } from "@/lib/ats/skills-dictionary"

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

// Connective words that carry no content — dropping or adding one is not a
// meaningful change. EN + ES, so a bilingual bullet is judged the same way.
const CONTENT_STOPWORDS = new Set([
  // en
  "the", "and", "for", "with", "into", "while", "that", "this", "was", "were",
  "are", "been", "being", "its", "their", "our", "from", "than", "then", "your",
  // es
  "los", "las", "una", "uno", "del", "por", "con", "para", "que", "como", "sus",
  "sobre", "entre", "fue", "era", "son", "ser", "mas",
])

/** Content words (≥3 chars, not a stopword) with hyphens/slashes split out. */
function contentWords(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9áéíóúñ]+/i)
    .filter((w) => w.length >= 3 && !CONTENT_STOPWORDS.has(w))
}

/** Two words share a stem (mentoring ≈ mentored) — a long common prefix. Keeps a
 *  tense/morphology change from counting as a brand-new word. */
function sameStem(a: string, b: string): boolean {
  const min = Math.min(a.length, b.length)
  if (min < 4) return a === b
  let i = 0
  while (i < min && a[i] === b[i]) i++
  return i >= Math.ceil(min * 0.7)
}

/**
 * True when a token looks like a named technology / proper noun worth keeping —
 * internal capitals (RXSwift, GraphQL, iOS, PostgreSQL), camelCase, or a digit/tech
 * char (C++, C#, S3). `lowerWord` is the normalized token; `raw` is the original
 * text, scanned for the token's real casing since normalize() lowercased it away.
 * ATS parsers match these keywords exactly, so dropping one loses a real match.
 */
function isNamedToken(lowerWord: string, raw: string): boolean {
  if (isKnownSkill(lowerWord)) return true
  const token = raw
    .split(/[^A-Za-z0-9+#.]+/)
    .find((t) => t.toLowerCase().replace(/\.$/, "") === lowerWord)
  if (!token) return false
  if (/[0-9+#]/.test(token)) return true            // c++, c#, s3, 30
  if (/[A-Z].*[A-Z]/.test(token)) return true       // RXSwift, iOS, GraphQL, ALLCAPS
  if (/[a-z][A-Z]/.test(token)) return true         // camelCase (typeScript)
  return false
}

/**
 * True when `suggested` STRIPS meaningful content the original stated and puts
 * nothing concrete back — a lateral, lossy reword that reads as "different" but
 * says less. Two firing shapes:
 *   1. it drops a NAMED technology/keyword (RXSwift, GraphQL, iOS…) and adds no
 *      concrete replacement — "…patterns using RXSwift" → "…patterns" (a real ATS
 *      keyword thrown away); OR
 *   2. it drops ≥2 content words and adds nothing new — "…to enhance iOS app
 *      functionality" → "…into the iOS app".
 *
 * Distinct from the other guards: not a near-copy (isTrivialEdit), not a synonym
 * swap (isCosmeticReword), not a fabrication (detectHallucination). Stem-aware so a
 * tense change (mentoring → mentored) is not a "new" word. Apply ONLY to an
 * already-strong bullet — a weak bullet legitimately loses filler when fixed.
 */
export function dropsContentWithoutGain(original: string, suggested: string): boolean {
  if (!suggested.trim()) return true
  const o = contentWords(original)
  const s = contentWords(suggested)
  const oSet = new Set(o)
  const sSet = new Set(s)
  const removed = o.filter((w) => !sSet.has(w))
  const added = s.filter((w) => !oSet.has(w))
  const addedReal = added.filter((a) => !removed.some((r) => sameStem(a, r)))
  const removedReal = removed.filter((r) => !added.some((a) => sameStem(a, r)))

  // A concrete gain: the rewrite brought in a NEW number (a metric — checked on the
  // raw text so short figures like "30" survive contentWords' length filter) or a
  // new named technology.
  const origNums = new Set(original.match(/\d+/g) ?? [])
  const addedNumber = (suggested.match(/\d+/g) ?? []).some((n) => !origNums.has(n))
  const addedConcrete = addedNumber || addedReal.some((a) => isNamedToken(a, suggested))
  // 1. Dropped a named keyword, replaced it with nothing concrete.
  const droppedNamed = removedReal.some((r) => isNamedToken(r, original))
  if (droppedNamed && !addedConcrete) return true
  // 2. Lateral lossy: the rewrite drops materially MORE content than it brings back
  //    (net loss of two-plus real words) and adds nothing concrete — a new number or
  //    named technology. A single swapped-in filler word ("ensuring"→"to maintain")
  //    used to let a 4-words-lost rewrite through; the NET test closes that.
  return removedReal.length - addedReal.length >= 2 && !addedConcrete
}
