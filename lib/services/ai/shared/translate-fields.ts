// lib/services/ai/shared/translate-fields.ts
//
// Structure-safe resume translation support. The translator never rebuilds the
// resume object — it only swaps prose strings in place. This module extracts the
// exact set of translatable segments (paired with a setter that writes the
// translation back) and provides a deterministic source-language detector.
//
// What is INTENTIONALLY never translated (left byte-for-byte identical):
//   ids, dates, emails, phones, urls, links, enum levels (skill/language),
//   person name, employer / company names, institution names, certification
//   names + issuers, references. These are proper nouns or machine fields;
//   translating them corrupts the CV.

import type { ResumeSections } from "@/types/resume"

export type TranslationSegment = { text: string; set: (v: string) => void }

/**
 * Collects every prose segment worth translating, each paired with a setter that
 * writes the translated value back into `data`. The setters MUTATE `data`, so
 * callers must pass a clone they own (e.g. `structuredClone(original)`).
 */
export function collectResumeSegments(data: ResumeSections): TranslationSegment[] {
  const segs: TranslationSegment[] = []
  const add = (val: unknown, set: (v: string) => void) => {
    if (typeof val === "string" && val.trim().length > 0) segs.push({ text: val, set })
  }

  add(data.summary, (v) => { data.summary = v })
  add(data.hobbies, (v) => { data.hobbies = v })
  if (data.personalDetails) {
    add(data.personalDetails.jobTitle, (v) => { data.personalDetails.jobTitle = v })
  }

  data.workExperience?.forEach((w) => {
    add(w.jobTitle, (v) => { w.jobTitle = v })
    add(w.description, (v) => { w.description = v })
  })

  data.education?.forEach((e) => {
    add(e.degree, (v) => { e.degree = v })
    add(e.fieldOfStudy, (v) => { e.fieldOfStudy = v })
    add(e.description, (v) => { e.description = v })
  })

  // Skills: the translator is instructed to leave brand/technology names as-is
  // (React, Python, AWS, XCTest…) and only translate generic phrases
  // ("Team Leadership" ↔ "Liderazgo de equipos").
  data.skills?.forEach((s) => add(s.name, (v) => { s.name = v }))

  // Language names ("Inglés" ↔ "English"). The proficiency enum is untouched.
  data.languages?.forEach((l) => add(l.name, (v) => { l.name = v }))

  data.projects?.forEach((p) => {
    add(p.role, (v) => { p.role = v })
    add(p.description, (v) => { p.description = v })
  })

  data.volunteer?.forEach((vo) => {
    add(vo.role, (v) => { vo.role = v })
    add(vo.description, (v) => { vo.description = v })
  })

  data.customSections?.forEach((c) => {
    add(c.title, (v) => { c.title = v })
    c.items?.forEach((it) => {
      add(it.title, (v) => { it.title = v })
      add(it.subtitle, (v) => { it.subtitle = v })
      add(it.description, (v) => { it.description = v })
    })
  })

  return segs
}

// Spanish-only diacritics/punctuation — a strong, near-unambiguous signal.
const ES_DIACRITICS = /[áéíóúñü¿¡]/g
// High-frequency function words per language. Word boundaries keep "the" from
// matching inside "theme", etc.
const ES_WORDS = /\b(de|la|el|los|las|un|una|con|para|por|del|que|su|sus|como|más|años|experiencia|desarrollo|empresa|gestión|equipo|equipos|proyecto|proyectos|habilidades|educación|responsable|liderazgo)\b/g
const EN_WORDS = /\b(the|and|for|with|of|to|in|on|at|team|teams|management|experience|development|company|project|projects|years|skills|education|responsible|leadership)\b/g

/**
 * Detects the dominant language of the resume's prose. Deterministic (no LLM):
 * counts language-specific function words plus Spanish diacritics. Ties resolve
 * to Spanish (the product's default locale). Callers translate INTO the opposite.
 */
export function detectLanguage(texts: string[]): "es" | "en" {
  const blob = texts.join(" ").toLowerCase()
  if (!blob.trim()) return "es"
  const diacritics = (blob.match(ES_DIACRITICS) ?? []).length
  const es = (blob.match(ES_WORDS) ?? []).length + diacritics * 2
  const en = (blob.match(EN_WORDS) ?? []).length
  return es >= en ? "es" : "en"
}
