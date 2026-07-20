// Shared text-normalization primitives.
//
// Only the truly-identical normalizers live here. Purpose-specific cleaners stay
// where they belong on purpose — they are NOT the same operation:
//   · vocabulary.normalizeTerm   → ATS keyword matching (keeps + # . / -)
//   · text-similarity.normalize  → Levenshtein input (strips bullet markers)
//   · parseResumeText.normalizeLine → heading matching (strips template numbering)

/**
 * Lowercase and strip diacritics. The one operation `analyzer.normalize` and
 * `languages.normalizeToken` each hand-rolled. `form` selects the Unicode
 * decomposition: NFD (accents only) or NFKD (accents + compatibility chars like
 * ligatures/full-width digits) — the two callers differed only in this.
 */
export function foldAccentsLower(s: string, form: "NFD" | "NFKD" = "NFD"): string {
  return s.normalize(form).replace(/[̀-ͯ]/g, "").toLowerCase()
}
