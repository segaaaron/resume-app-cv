// lib/ats/strip-label.ts
//
// A section's NAME is not part of its content.
//
// Reported with the résumé on screen: the summary now begins "Professional
// Summary: iOS Developer with more than 11 years…" — the label got pasted into
// the text and printed inside the CV, under a heading that already says PERFIL.
// The model writes findings like `"Professional Summary: <the actual summary>"`
// because it is quoting a section, and every apply path took the string whole.
//
// Deterministic and conservative: a label is only removed when the line OPENS
// with a short section name followed by a colon. "Led the integration of RESTful
// APIs: the work spanned three teams" keeps its colon — the part before it is a
// sentence, not a heading.
//
// The list is closed by construction: these are the section names a résumé has,
// in the two languages this product supports. It is not a vocabulary of things
// people write, which is the kind of list this project refuses.

const SECTION_LABELS = [
  "professional summary",
  "summary",
  "profile",
  "professional profile",
  "career summary",
  "objective",
  "about me",
  "experience",
  "work experience",
  "bullet",
  "achievement",
  "resumen profesional",
  "resumen",
  "perfil",
  "perfil profesional",
  "objetivo",
  "sobre mí",
  "sobre mi",
  "experiencia",
  "experiencia laboral",
  "logro",
  "viñeta",
]

/** Longest label, in words. Anything longer before a colon is a sentence. */
const MAX_LABEL_WORDS = 3

/**
 * The text without a leading section label.
 *
 * Returns the input untouched when it does not open with one — including when the
 * colon belongs to the writing itself.
 */
export function stripSectionLabel(text: string): string {
  const t = text.trim()
  const m = t.match(/^([^:\n]{1,40}):\s*(.+)$/s)
  if (!m) return t
  const label = m[1].trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  if (label.split(/\s+/).length > MAX_LABEL_WORDS) return t
  const known = SECTION_LABELS.some((l) => l.normalize("NFD").replace(/[̀-ͯ]/g, "") === label)
  if (!known) return t
  const rest = m[2].trim()
  // Never hand back an empty string: a label with nothing after it is not a
  // repair, and replacing a summary with "" is the worst possible outcome.
  return rest.length > 0 ? rest : t
}
