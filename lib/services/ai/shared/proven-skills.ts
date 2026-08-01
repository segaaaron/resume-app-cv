// lib/services/ai/shared/proven-skills.ts
// Reverse skill extraction — the mirror image of keyword stuffing.
//
// Everyone suggests skills the job wants that you might not have. This does the
// opposite: it scans the candidate's OWN experience text for skills from the
// shared vocabulary, subtracts the ones already in their Skills section, and
// surfaces the remainder — skills they demonstrably used and forgot to list.
//
// By construction every result is backed by the candidate's own writing, so it
// can never fabricate a skill or invent a proficiency. It is the same detection
// primitive the paid ATS matcher uses (termPresent, alias-aware), no model, no
// cost, no drift. Cannot produce keyword stuffing: it only echoes proof already
// on the page.
import { ATS_SKILLS } from "@/lib/ats/skills-dictionary"
import { normalizeTerm, termPresent, escapeRegExp } from "@/lib/ats/vocabulary"

/** Most suggestions to surface. Keeps the card scannable; the tail is noise. */
export const MAX_PROVEN_SKILLS = 8

/**
 * Spacing-insensitive form of a term: lowercase, accent-stripped, with spaces,
 * hyphens and dots removed. So "React Native", "ReactNative", "React-Native" and
 * "React.Native" all collapse to "reactnative". Used for a per-token equality
 * check (never substring) so a differently-spaced skill the candidate already
 * listed still dedupes against the dictionary's canonical spelling.
 */
function collapse(s: string): string {
  return normalizeTerm(s).replace(/[\s.-]/g, "")
}

/** Damerau-Levenshtein (optimal string alignment) edit distance. */
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) d[i][0] = i
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[m][n]
}

/**
 * A listed skill the candidate mistyped still dedupes against the dictionary
 * spelling: "React Navite" (collapsed "reactnavite") suppresses the suggestion
 * of "react native" ("reactnative", distance 2). Guarded so distinct skills
 * never collide: only tokens ≥6 chars, length gap ≤2, and an allowed distance
 * that scales with length (⌈len·0.2⌉, capped at 2). So "java"/"javascript" stay
 * apart (length gap) and "kotlin"/"koltin" (1 edit) match. Stakes are one-
 * directional — the worst case is failing to SUGGEST a skill, never corrupting
 * the candidate's data — which is why a fuzzy match is safe HERE and nowhere the
 * ATS matcher scores.
 */
function fuzzyMatchesListed(candidate: string, listedCollapsed: Iterable<string>): boolean {
  if (candidate.length < 6) return false
  for (const l of listedCollapsed) {
    if (l.length < 6 || Math.abs(l.length - candidate.length) > 2) continue
    const tol = Math.min(2, Math.ceil(Math.max(candidate.length, l.length) * 0.2))
    if (editDistance(candidate, l) <= tol) return true
  }
  return false
}

/**
 * Returns the skill worded the way the candidate actually wrote it in `original`
 * (so "React", "Node.js", "CI/CD" keep their casing), or null when no term or
 * alias appears there literally. Word boundaries mirror the vocabulary's own
 * matcher so "+" and "#" survive (c++, c#).
 */
function displayAsWritten(original: string, terms: string[]): string | null {
  for (const t of terms) {
    if (!t) continue
    const re = new RegExp(`(^|[^A-Za-z0-9])(${escapeRegExp(t)})([^A-Za-z0-9+#]|$)`, "i")
    const m = original.match(re)
    if (m) return m[2].trim()
  }
  return null
}

/**
 * Skills present in the candidate's experience text but absent from their listed
 * skills. Returned in vocabulary order, capped at MAX_PROVEN_SKILLS, worded as
 * the candidate wrote them.
 */
export function findProvenUnlistedSkills(experienceText: string, listedSkills: string[]): string[] {
  const expNorm = normalizeTerm(experienceText)
  if (!expNorm) return []

  const listedNorm = normalizeTerm(listedSkills.filter(Boolean).join("  "))
  // Collapsed forms of every listed skill, so a multi-word skill the candidate
  // wrote without a space or with a hyphen ("ReactNative", "React-Native") still
  // dedupes against the dictionary's spaced canonical ("react native"). Exact
  // per-token equality below — never substring — so "java" ≠ "javascript".
  const listedCollapsed = new Set(listedSkills.map(collapse).filter(Boolean))

  const out: string[] = []
  const seen = new Set<string>()

  for (const skill of ATS_SKILLS) {
    if (out.length >= MAX_PROVEN_SKILLS) break
    if (seen.has(skill.term)) continue
    // Proven in the experience, and not already claimed in Skills (alias-aware:
    // "React.js" listed counts as having "react").
    if (!termPresent(skill.term, expNorm)) continue
    if (termPresent(skill.term, listedNorm)) continue
    // Spacing-insensitive backstop: catches the same skill listed under a
    // different spacing that the word-boundary matcher above misses.
    const collapsedForms = [skill.term, ...(skill.aliases ?? [])].map(collapse).filter(Boolean)
    if (collapsedForms.some((f) => listedCollapsed.has(f))) continue
    // Typo-tolerant backstop: a mistyped listed skill ("React Navite") still
    // dedupes against the canonical spelling. Suggestion-only, tightly guarded.
    if (collapsedForms.some((f) => fuzzyMatchesListed(f, listedCollapsed))) continue

    const display = displayAsWritten(experienceText, [skill.term, ...(skill.aliases ?? [])])
    if (!display) continue

    seen.add(skill.term)
    out.push(display)
  }

  return out
}
