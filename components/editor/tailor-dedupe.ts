import { expandTerm } from "@/lib/ats/vocabulary"

/**
 * The missing-skills Tailor should still show as actionable chips: those the user
 * does not already own AND the ATS score above did not already list.
 *
 * Matching goes through the shared ATS vocabulary (expandTerm), not plain string
 * equality, so an alias slipping past under a different spelling — "React" vs
 * "React.js", "aws" vs "amazon web services", "ci/cd" vs "continuous integration"
 * — is caught. Without this the user saw the same keyword twice: once in the ATS
 * list, once as a Tailor chip.
 */
export function filterVisibleMissingSkills(
  missingSkills: string[],
  ownedSkillNames: string[],
  atsMissingKeywords: string[],
): string[] {
  const shown = new Set<string>()
  for (const name of ownedSkillNames) for (const form of expandTerm(name)) shown.add(form)
  for (const kw of atsMissingKeywords) for (const form of expandTerm(kw)) shown.add(form)
  return missingSkills.filter((s) => {
    const forms = expandTerm(s)
    return forms.length > 0 && !forms.some((form) => shown.has(form))
  })
}
