// lib/ats/skill-validation.ts
//
// Is this string something that belongs in a Skills section?
//
// The dictionary alone cannot answer it. Measured against it: "Crash Reporting",
// "unit testing", "code review", "memory management" and "Firebase Analytics"
// are all real skills it does not know — no curated list ever covers a field —
// while it happily says "false" to "Bolivia" and to "the specific analytics
// tools you have used" alike, because unknown is all it can say.
//
// So: a known skill is accepted outright, and everything else has to look like a
// skill and not like something already in the CV. The checks below are about
// SHAPE and about the user's own data, never about a list of banned words.

import { isKnownSkill } from "./skills-dictionary"

/**
 * Words that never appear in a skill, wherever they sit: pronouns, hedges and
 * enumerators. These belong to a sentence about skills, not to a skill.
 */
const PROSE_ANYWHERE = new Set([
  // en
  "you", "your", "yours", "we", "our", "us", "they", "their", "i", "my",
  "used", "using", "use", "have", "has", "had", "including", "etc", "such",
  "various", "specific", "related", "experience", "knowledge", "ability",
  "skills", "proficiency", "familiarity",
  // es
  "tu", "tus", "su", "sus", "nuestro", "nuestra", "yo", "mi", "mis",
  "usado", "usados", "usando", "usar", "incluyendo", "etc", "cualquier",
  "varios", "varias", "especifico", "especifica", "relacionado", "relacionada",
  "experiencia", "conocimiento", "conocimientos", "habilidad", "habilidades",
  "capacidad", "dominio",
])

/**
 * Connectors. Legitimate INSIDE a compound skill — "Análisis de datos",
 * "Internet of Things", "Software as a Service" — and a sign of prose only when
 * they open or close the string ("of the tools", "used for").
 *
 * Measured: banning these anywhere rejected 10 of 17 real skills, most of the
 * Spanish ones, because almost every Spanish compound skill carries "de".
 */
const CONNECTORS = new Set([
  "the", "a", "an", "and", "or", "of", "for", "with", "to", "in", "on", "at", "as",
  "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o", "de", "del",
  "para", "con", "en", "al", "que", "por",
])

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
}

/**
 * Names the CV already uses for something that is NOT a skill: the candidate,
 * their employers, their cities, their job titles.
 *
 * This is the check a dictionary cannot make, because it is per-CV: "Xiobit" is
 * not in any list of non-skills, but it IS this candidate's employer, and an
 * employer in the Skills section is exactly the kind of noise that made the
 * section unusable.
 */
export function nonSkillTermsFrom(sectionData: Record<string, unknown>): Set<string> {
  const out = new Set<string>()
  const add = (v?: string) => { const n = norm(v ?? ""); if (n.length > 1) out.add(n) }

  const pd = (sectionData.personalDetails ?? {}) as Record<string, string | undefined>
  add(pd.firstName); add(pd.lastName); add(pd.city); add(pd.country); add(pd.jobTitle)
  if (pd.firstName || pd.lastName) add(`${pd.firstName ?? ""} ${pd.lastName ?? ""}`)

  for (const w of (sectionData.workExperience ?? []) as Record<string, string | undefined>[]) {
    add(w.employer); add(w.city); add(w.jobTitle)
  }
  for (const e of (sectionData.education ?? []) as Record<string, string | undefined>[]) {
    add(e.institution); add(e.city)
  }
  return out
}

/**
 * @param candidate  what we are about to write into Skills
 * @param sectionData the CV, for the per-CV checks above
 */
export function isPlausibleSkill(candidate: string, sectionData: Record<string, unknown> = {}): boolean {
  const raw = candidate.trim().replace(/^["'“”]+|["'“”.,;:]+$/g, "").trim()
  if (!raw) return false

  // A known skill needs no further argument.
  if (isKnownSkill(raw)) return true

  const words = raw.split(/\s+/)
  // Four words is already generous for a skill ("continuous integration and
  // delivery"); past that it is a sentence, and the model does write sentences
  // ("the specific analytics/crash tools you have used").
  if (words.length > 4) return false
  if (raw.length > 48) return false

  // Pure numbers or a bare year — never a skill.
  if (/^\d+$/.test(raw)) return false
  // Pronouns and hedges: prose wherever they appear.
  if (words.some((w) => PROSE_ANYWHERE.has(norm(w)))) return false
  // A connector at either END is prose ("of the tools", "used for"); the same
  // word between two nouns is a normal compound skill.
  if (CONNECTORS.has(norm(words[0])) || CONNECTORS.has(norm(words[words.length - 1]))) return false
  // Needs at least one letter; "C++" and "C#" survive, "---" does not.
  if (!/\p{L}/u.test(raw)) return false

  // The candidate's own name, employer, city or job title. A real skill can
  // collide with a company name ("Oracle", "Docker"), so the dictionary check
  // above runs FIRST and wins — this only catches what is otherwise unknown.
  if (nonSkillTermsFrom(sectionData).has(norm(raw))) return false

  return true
}
