// lib/ats/import-classification.ts
//
// Which list does an imported entry belong in: skills or certifications?
//
// ONE function, exported, so the tests can run the real thing. That is not a
// detail — the previous version lived inside the import module and its tests
// re-implemented it by copy-paste, so thirty-nine tests passed green while the
// product moved a candidate's dated bootcamps into their skill chips. A test that
// re-implements the rule tests the copy, and the copy is never the thing that
// ships.
//
// WHY IT EXISTS. A two-column résumé extracts interleaved: SKILLS on the left,
// CERTIFICATIONS on the right, and the text arrives with the columns woven
// together. "SwiftUI" and "Unit testing" landed under Certifications. Teaching the
// model to tell them apart produced the mirror failure — it swept the real
// certifications into skills, and "SwiftUI 6 & MVVM Bootcamp (2025)" became a chip.
// Fixing one direction with a prompt bought the other.
//
// So the model does not decide this. Code does, in both directions, and
// CONSERVATIVELY: the default is to leave every entry exactly where it arrived,
// and it moves only on evidence that is hard to argue with. Being wrong here costs
// a misfiled row; being aggressive costs somebody their credentials.

import { isKnownVocabularyTerm } from "@/lib/ats/vocabulary"

export interface ImportedSkill {
  name: string
  level?: string
}
export interface ImportedCertification {
  name: string
  issuer?: string
  date?: string
  url?: string
}

/** A four-digit year. What every credential is dated by and no skill name contains. */
const HAS_YEAR = /(19|20)\d{2}/
/** Longer than this and it is a course title, not a term. */
const MAX_TERM_WORDS = 4

/**
 * Toward SKILLS: no issuer, no date, no year, short enough to be a term, not an
 * all-capitals acronym, and the shared vocabulary already knows it as a capability.
 *
 * The acronym rule is load-bearing. PMP, CPA, RN, CFA and OSHA exist only as things
 * somebody awards, and the vocabulary lists several of them because CVs also write
 * them under Skills — without it, the rule demoted two of the most common
 * professional credentials in the world. It costs the odd missed rescue (a bled
 * "SQL" stays put), which is the safe direction: an unrecognised term never moves.
 *
 * Bare "MVP" is deliberately absent from the vocabulary and therefore stays where
 * the source put it. That exclusion was measured and paid for — a bookkeeper's CV
 * saying "presenté el MVP" was being tagged with a mobile architecture pattern —
 * and it is not getting undone to make one import look tidier.
 */
export function isSkillNotCertification(c: ImportedCertification): boolean {
  if (c.issuer?.trim() || c.date?.trim()) return false
  const name = c.name.trim()
  if (!name || name.split(/\s+/).length > MAX_TERM_WORDS) return false
  if (HAS_YEAR.test(name)) return false
  if (/^[A-Z0-9]{2,5}$/.test(name)) return false
  return isKnownVocabularyTerm(name)
}

/**
 * Toward CERTIFICATIONS: the year is the tell. Nothing else moves — a long skill
 * name is still a skill, and guessing beyond the year is how the last version
 * emptied someone's certifications section.
 */
export function isCertificationNotSkill(name: string): boolean {
  return HAS_YEAR.test(name.trim())
}

/**
 * Routes both lists, once, in both directions.
 *
 * Nothing is ever dropped: every entry the candidate wrote comes out in exactly one
 * of the two lists. Deduplicated by name, because the same item can legitimately
 * appear on both sides of a column boundary.
 */
export function classifyImportedTerms(input: {
  skills: ImportedSkill[]
  certifications: ImportedCertification[]
}): { skills: ImportedSkill[]; certifications: ImportedCertification[] } {
  const byName = <T extends { name: string }>(items: T[]): T[] =>
    items.filter((it, i, all) => all.findIndex((o) => o.name.trim().toLowerCase() === it.name.trim().toLowerCase()) === i)

  const skills = byName([
    ...input.skills.filter((sk) => !isCertificationNotSkill(sk.name)),
    ...input.certifications
      .filter((c) => isSkillNotCertification(c))
      .map((c) => ({ name: c.name, level: "intermediate" })),
  ])

  const certifications = byName([
    ...input.certifications.filter((c) => !isSkillNotCertification(c)),
    // Recovered from the skills list: a dated course the model filed as a chip.
    ...input.skills
      .filter((sk) => isCertificationNotSkill(sk.name))
      .map((sk) => ({ name: sk.name, issuer: "", date: "", url: "" })),
  ])

  return { skills, certifications }
}
