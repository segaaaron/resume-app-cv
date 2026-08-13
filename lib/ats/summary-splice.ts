// lib/ats/summary-splice.ts
//
// A fix that rewrites ONE sentence must not overwrite the whole paragraph.
//
// Reported, and it is the worst thing this panel has done: the analyst quoted a
// single sentence of a summary, criticised it, and offered a better version of
// THAT sentence. Applying it replaced the entire summary with the one sentence.
// Measured on the real case: 56 words down to 24, and gone with them were "7
// years", "UIKit", "SwiftUI", "unit and UI testing" and a 15% figure — the four
// things a recruiter actually reads. The tool made the résumé worse and called it
// a fix.
//
// The rule here is the same one the bullet guards already enforce: never accept a
// rewrite that DROPS content without adding any. Applied to a paragraph, that
// means finding the sentence the rewrite is about and swapping only that one.
//
// Pure and deterministic — no model decides where the text goes.

/** Splits prose into sentences, keeping their terminator. */
function sentencesOf(text: string): string[] {
  return text.match(/[^.!?]+[.!?]*\s*/g)?.map((s) => s.trim()).filter(Boolean) ?? []
}

function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9+#.]+/)
    .filter((w) => w.length > 2)
}

/** Share of the shorter side's words that both texts share. */
function overlap(a: string, b: string): number {
  const A = new Set(words(a))
  const B = new Set(words(b))
  if (A.size === 0 || B.size === 0) return 0
  let shared = 0
  for (const w of A) if (B.has(w)) shared++
  return shared / Math.min(A.size, B.size)
}

/**
 * Enough of the rewrite's vocabulary must come from a sentence for us to believe
 * the rewrite is ABOUT that sentence. Below this it is a new paragraph, not a
 * repair, and splicing it in would be guessing.
 */
const SAME_SUBJECT = 0.5

/**
 * How much shorter a replacement may be before we treat it as a fragment rather
 * than a new summary. A genuine full rewrite lands near the original's length; a
 * single sentence offered for a three-sentence paragraph does not.
 */
const FRAGMENT_RATIO = 0.7

/**
 * The summary as it should be written after applying `replacement`.
 *
 * - Replacement roughly as long as the original → a real full rewrite, used as is.
 * - Clearly shorter AND clearly about one sentence → that sentence is swapped and
 *   everything else survives untouched.
 * - Clearly shorter and about nothing in particular → null. Refusing is correct:
 *   we cannot place it, and overwriting the paragraph is how the content was lost
 *   in the first place.
 */
export function spliceSummary(current: string, replacement: string): string | null {
  const cur = current.trim()
  const next = replacement.trim()
  if (!next) return null
  if (!cur) return next

  const curWords = words(cur).length
  const nextWords = words(next).length
  if (curWords === 0 || nextWords / curWords >= FRAGMENT_RATIO) return next

  const parts = sentencesOf(cur)
  if (parts.length < 2) return next

  let bestIndex = -1
  let best = 0
  parts.forEach((sentence, i) => {
    const score = overlap(sentence, next)
    if (score > best) { best = score; bestIndex = i }
  })
  if (bestIndex < 0 || best < SAME_SUBJECT) return null

  const spliced = [...parts]
  spliced[bestIndex] = next
  return spliced.join(" ").replace(/\s+/g, " ").trim()
}
