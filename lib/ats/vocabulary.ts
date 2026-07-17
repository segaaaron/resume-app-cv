// lib/ats/vocabulary.ts
// One vocabulary for every ATS keyword comparison in the product.
//
// There were three, none aware of the others:
//   ats-matcher.ts   ALIAS_GROUPS — 13 groups, paid ats-score
//   skills-dictionary.ts ATS_SKILLS — 244 curated terms with aliases, used only
//                        by the free /tools/ats-checker
//   ai-helpers.ts    WORD_ALIASES — 12 groups for fill-profile grounding
//
// The aliases that fix the paid matcher's worst misses (aws → amazon web
// services, gcp → google cloud, liderazgo → leadership) were already sitting in
// the dictionary it ignored. This joins them, so both scorers answer "is this
// skill present?" the same way.
import { ATS_SKILLS } from "./skills-dictionary"

/**
 * Lowercase, accent-stripped, punctuation-normalised. Keeps + # . / and - so
 * "c++", "c#", "node.js" and "ci/cd" survive as themselves.
 */
export function normalizeTerm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Alias groups the dictionary does not cover: role and process vocabulary
 * rather than named skills. Kept here so there is exactly one place to add one.
 */
const EXTRA_ALIAS_GROUPS: readonly string[][] = [
  ["continuous integration", "ci/cd", "cicd", "integracion continua"],
  ["project manager", "project management", "pm", "gestion de proyectos", "jefe de proyecto"],
  ["user experience", "ux", "experiencia de usuario"],
  ["user interface", "ui", "interfaz de usuario"],
  ["search engine optimization", "seo", "posicionamiento web"],
  ["leadership", "liderazgo", "team lead", "lider de equipo"],
  ["communication", "comunicacion"],
  ["teamwork", "trabajo en equipo"],
  ["problem solving", "resolucion de problemas"],
  ["data analysis", "analisis de datos"],
  ["customer service", "atencion al cliente", "servicio al cliente"],
  ["quality assurance", "qa", "aseguramiento de calidad"],
]

/**
 * normalized term → the set of every term equivalent to it.
 * Built once: ~244 dictionary entries plus the groups above.
 */
const EQUIVALENCE: Map<string, Set<string>> = (() => {
  const map = new Map<string, Set<string>>()

  const link = (terms: string[]) => {
    const norm = terms.map(normalizeTerm).filter(Boolean)
    if (norm.length < 2) {
      // A term with no aliases still needs an entry so lookups are uniform.
      if (norm[0] && !map.has(norm[0])) map.set(norm[0], new Set([norm[0]]))
      return
    }
    // Merge with anything already linked, so groups that share a term unify.
    const merged = new Set<string>()
    for (const t of norm) {
      merged.add(t)
      const existing = map.get(t)
      if (existing) for (const e of existing) merged.add(e)
    }
    for (const t of merged) map.set(t, merged)
  }

  for (const skill of ATS_SKILLS) link([skill.term, ...(skill.aliases ?? [])])
  for (const group of EXTRA_ALIAS_GROUPS) link([...group])

  return map
})()

/**
 * Every term equivalent to `keyword`, itself included. Unknown terms return
 * just themselves — an unknown skill is still matched literally.
 */
export function expandTerm(keyword: string): string[] {
  const norm = normalizeTerm(keyword)
  if (!norm) return []
  const group = EQUIVALENCE.get(norm)
  return group ? [...group] : [norm]
}

/** How many terms the shared vocabulary knows. Surfaced for diagnostics. */
export const VOCABULARY_SIZE = EQUIVALENCE.size

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * True when `keyword`, or any equivalent term, appears in already-normalized
 * text as a whole token.
 *
 * Word boundaries are enforced by hand rather than \b: \b treats "+" and "#" as
 * boundaries, so "c++" would match inside "c" and "c#" inside "c". Checking the
 * surrounding character instead keeps those intact.
 */
export function termPresent(keyword: string, haystackNorm: string): boolean {
  return expandTerm(keyword).some((v) => {
    if (!v) return false
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(v)}([^a-z0-9+#]|$)`)
    return re.test(haystackNorm)
  })
}
