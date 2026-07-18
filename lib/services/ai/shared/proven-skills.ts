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

  const out: string[] = []
  const seen = new Set<string>()

  for (const skill of ATS_SKILLS) {
    if (out.length >= MAX_PROVEN_SKILLS) break
    if (seen.has(skill.term)) continue
    // Proven in the experience, and not already claimed in Skills (alias-aware:
    // "React.js" listed counts as having "react").
    if (!termPresent(skill.term, expNorm)) continue
    if (termPresent(skill.term, listedNorm)) continue

    const display = displayAsWritten(experienceText, [skill.term, ...(skill.aliases ?? [])])
    if (!display) continue

    seen.add(skill.term)
    out.push(display)
  }

  return out
}
