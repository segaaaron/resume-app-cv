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
  // The match is case-insensitive, so the occurrence found may be capitalised
  // while the correction is not — "Desarollo backend" must not become
  // "desarrollo backend" and start a bullet in lowercase. Only the leading
  // capital is carried over, and only when the correction has no capitals of
  // its own: a canonical spelling like "JavaScript" keeps its exact form.
  const hasOwnCase = correct !== correct.toLowerCase()
  return text.replace(re, (m, pre: string) => {
    const occurrence = m.slice(pre.length)
    const startsUpper = occurrence[0] !== occurrence[0].toLowerCase()
    const out = startsUpper && !hasOwnCase
      ? correct.charAt(0).toUpperCase() + correct.slice(1)
      : correct
    return `${pre}${out}`
  })
}

/** Sections the corrector may rewrite, paired with the fields inside each. */
const PROSE_FIELDS: Record<string, string[]> = {
  workExperience: ["jobTitle", "description"],
  education: ["degree", "fieldOfStudy", "description"],
  projects: ["role", "description"],
  volunteer: ["role", "description"],
}

type Unknown = Record<string, unknown>

/**
 * Apply one correction across EVERY prose field of the CV, non-destructively.
 *
 * Returns a patch of only the sections that actually changed, so the caller
 * writes nothing it does not need to — an untouched section keeps its exact
 * object identity. The word is replaced wherever it appears, because a typo the
 * user made once in the summary is usually made again in a bullet, and fixing
 * "the one the panel showed me" leaves the other behind.
 *
 * Mirrors collectSpellcheckText: fields that hold names (employer, institution,
 * skills, certifications) are never rewritten, since they were never checked.
 */
export function applySpellingFix(
  sectionData: Unknown,
  typed: string,
  correct: string,
  opts: { includeSkills?: boolean } = {},
): { patch: Record<string, unknown>; changed: boolean } {
  const patch: Record<string, unknown> = {}
  if (!typed.trim() || !correct.trim()) return { patch, changed: false }
  const sub = (v: unknown) => (typeof v === "string" ? replaceWord(v, typed, correct) : v)

  // Skills are OFF by default because the general spell checker never reads them
  // (they are product names a dictionary would flag wholesale). The job-keyword
  // near-miss fix is the opposite case: "Javscript" almost always sits in the
  // skills list, and that misspelling is precisely what breaks the ATS match.
  if (opts.includeSkills && Array.isArray(sectionData.skills)) {
    let skillsChanged = false
    const next = (sectionData.skills as Unknown[]).map((skill) => {
      const name = sub(skill.name)
      if (name === skill.name) return skill
      skillsChanged = true
      return { ...skill, name }
    })
    if (skillsChanged) patch.skills = next
  }

  for (const key of ["summary", "hobbies"]) {
    const cur = sectionData[key]
    if (typeof cur !== "string") continue
    const next = sub(cur)
    if (next !== cur) patch[key] = next
  }

  const pd = sectionData.personalDetails as Unknown | undefined
  if (pd && typeof pd.jobTitle === "string") {
    const next = sub(pd.jobTitle)
    if (next !== pd.jobTitle) patch.personalDetails = { ...pd, jobTitle: next }
  }

  for (const [section, fields] of Object.entries(PROSE_FIELDS)) {
    const items = sectionData[section]
    if (!Array.isArray(items)) continue
    let sectionChanged = false
    const next = (items as Unknown[]).map((item) => {
      let itemChanged = false
      const copy: Unknown = { ...item }
      for (const f of fields) {
        const val = sub(copy[f])
        if (val !== copy[f]) { copy[f] = val; itemChanged = true }
      }
      if (!itemChanged) return item
      sectionChanged = true
      return copy
    })
    if (sectionChanged) patch[section] = next
  }

  // Custom sections are nested one level deeper (section title → items). They are
  // checked by collectSpellcheckText, so they must be fixable too — otherwise the
  // panel reports a typo it then refuses to correct ("that word is no longer in
  // your CV"), which reads as the button being broken.
  const custom = sectionData.customSections
  if (Array.isArray(custom)) {
    let anyChanged = false
    const next = (custom as Unknown[]).map((section) => {
      let sectionChanged = false
      const copy: Unknown = { ...section }
      const title = sub(copy.title)
      if (title !== copy.title) { copy.title = title; sectionChanged = true }

      if (Array.isArray(copy.items)) {
        let itemsChanged = false
        const items = (copy.items as Unknown[]).map((item) => {
          let itemChanged = false
          const it: Unknown = { ...item }
          for (const f of ["title", "subtitle", "description"]) {
            const val = sub(it[f])
            if (val !== it[f]) { it[f] = val; itemChanged = true }
          }
          if (!itemChanged) return item
          itemsChanged = true
          return it
        })
        if (itemsChanged) { copy.items = items; sectionChanged = true }
      }

      if (!sectionChanged) return section
      anyChanged = true
      return copy
    })
    if (anyChanged) patch.customSections = next
  }

  return { patch, changed: Object.keys(patch).length > 0 }
}
