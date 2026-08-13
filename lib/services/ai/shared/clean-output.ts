// lib/services/ai/shared/clean-output.ts
//
// Nothing the AI writes reaches the user misspelled.
//
// The product ships a spell-checker that runs over the CV — and the CV contains
// text this product generated. Handing someone a rewritten bullet and then
// flagging a typo in it, in our own words, is the sort of thing that makes an
// assistant feel unreliable. So generated text is checked before it is returned.
//
// Safe to fix silently, unlike the user's own writing: this is OUR output, the
// user never typed it, and there is nothing of theirs to preserve. The card that
// checks the user's CV still only ever SUGGESTS.
//
// Deterministic and local — the same Hunspell dictionaries the card uses. No
// model, no network, no cost.

import { checkSpelling } from "@/lib/ats/spellcheck"
import { stripSectionLabel } from "@/lib/ats/strip-label"
import { replaceWord } from "@/lib/ats/apply-spelling"
import { collectProperNouns } from "@/lib/ats/spellcheck-collect"

/**
 * @param texts       the generated strings, in order
 * @param language    the language they were written in
 * @param sectionData the CV, so its own proper nouns (employers, products,
 *                    people) are never "corrected" into something else
 * @returns the same strings with confident spelling fixes applied
 */
export async function cleanGeneratedText(
  texts: string[],
  language: "es" | "en",
  sectionData: Record<string, unknown> = {},
): Promise<string[]> {
  // A section's NAME is not part of its content. The model quotes the section it
  // is fixing ("Professional Summary: …"), and applied verbatim that label was
  // printed inside a CV under a heading that already said PERFIL. Stripped here,
  // where EVERY generated text passes, so no write path can miss it.
  texts = texts.map((t) => (t?.trim() ? stripSectionLabel(t) : t))
  const nonEmpty = texts.filter((t) => t?.trim())
  if (nonEmpty.length === 0) return texts

  try {
    const issues = await checkSpelling(nonEmpty, language, collectProperNouns(sectionData))
    if (issues.length === 0) return texts

    return texts.map((t) => {
      let out = t
      for (const issue of issues) {
        const correct = issue.suggestions[0]
        // Only a confident, single correction. Where the dictionary offers
        // nothing, the word stays — a wrong "fix" in generated text is worse
        // than the typo, because the user did not write either one and cannot
        // tell which is which.
        if (correct) out = replaceWord(out, issue.typed, correct)
      }
      return out
    })
  } catch {
    // Fail open: a spell-check failure must never cost the user the rewrite
    // they asked for. Worst case they get exactly what they got before.
    return texts
  }
}
