// lib/ats/skill-dedup.ts
// "You already have this skill" detection for the Skills editor. Catches a new
// entry that duplicates an existing one four ways, from strictest to fuzziest:
//   1. exact (after normalization)
//   2. spacing/hyphen/dot variant  ("React-Native" ≡ "react native")
//   3. alias-equivalent            ("React" ≡ "React.js" via the ATS vocabulary)
//   4. ~90% similar                ("Objetive-C" ≡ "Objective-C" — a typo of it)
// Pure + shared so the editor, the ATS panel and Tailor all dedupe identically.
import { normalizeTerm, expandTerm } from "@/lib/ats/vocabulary"
import { isKnownSkill } from "@/lib/ats/skills-dictionary"
import { normalizedSimilarity } from "@/lib/services/ai/shared/text-similarity"

const SIMILAR_THRESHOLD = 0.9

/** Collapse spaces/hyphens/dots so "React-Native" and "react native" match. */
function collapse(s: string): string {
  return normalizeTerm(s).replace(/[\s.\-]/g, "")
}

/**
 * Returns the EXISTING skill that `name` duplicates (so the UI can name it in the
 * message), or null if `name` is genuinely new. Comparison is case/accent/spacing
 * insensitive, alias-aware, and typo-tolerant (≥90% similar).
 */
export function findDuplicateSkill(name: string, existing: readonly string[]): string | null {
  const n = normalizeTerm(name)
  if (!n) return null
  const nc = collapse(name)
  const nAliases = new Set(expandTerm(name))
  for (const e of existing) {
    const en = normalizeTerm(e)
    if (!en || en === n) { if (en === n) return e; continue }
    if (collapse(e) === nc) return e
    if (expandTerm(e).some((a) => nAliases.has(a))) return e
    if (normalizedSimilarity(n, en) >= SIMILAR_THRESHOLD) return e
  }
  return null
}

/**
 * Is `candidate` already contained in `listed` as whole words?
 *
 * Deliberately NOT termPresent: that expands aliases, so "JavaScript" (alias
 * "js") matched inside "React.js" and blocked a legitimate skill. This compares
 * the normalized word sequence only — "communication" is inside "teamwork and
 * communication", while "javascript" is not inside "react.js".
 *
 * Containment only means "already covered" when the listed entry is a PHRASE the
 * user wrote ("Teamwork and communication"), never when it is a skill of its own.
 * "Swift Package Manager", "React Native" and "Core Data" all contain a shorter
 * real skill, and blocking it left the user unable to list Swift or React at all
 * — the field cleared itself and the dropdown hid the entry. A dictionary entry
 * of its own is the generic signal: it says these are two skills, not one
 * repeated, without any list of exceptions.
 */
export function containsSkill(candidate: string, listed: string): boolean {
  const c = normalizeTerm(candidate).trim()
  const l = normalizeTerm(listed).trim()
  if (!c || !l || c === l) return c === l && c.length > 0
  if (isKnownSkill(l)) return false // a catalogued compound skill ≠ its head word
  // Word-boundary containment on the normalized form.
  return new RegExp(`(^|\\s)${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(l)
}
