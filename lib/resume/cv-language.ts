// lib/resume/cv-language.ts
//
// Single source of truth for "what language is THIS CV written in".
//
// The AI endpoints take a `language` field that decides the language of every
// line they write. Sending the APP locale meant an English CV edited in the
// Spanish UI got Spanish bullets welded into it (and vice-versa) — the rewrite
// is applied straight into the résumé, so a mismatch corrupts the document.
// The language of the document must come from the document.
//
// Deterministic (no LLM, no cost): reuses the same `detectLanguage` detector the
// translator uses, over the CV's prose fields only. Pure and client-safe, so the
// editor can call it on every render through `useMemo`.

import { detectLanguage } from "@/lib/services/ai/shared/translate-fields"

/**
 * Minimum amount of prose needed to judge a language from. Below this a nearly
 * empty CV would be classified on almost no signal, and the detector resolves
 * ties to Spanish — so a brand-new English CV would get Spanish suggestions on
 * its very first AI call. Under the floor we defer to the caller's fallback
 * (the app locale), which is the best guess available for an empty document.
 */
export const CV_LANG_MIN_CHARS = 60

type ProseSource = {
  summary?: unknown
  workExperience?: unknown
  projects?: unknown
}

function pushText(out: string[], v: unknown): void {
  if (typeof v === "string" && v.trim()) out.push(v)
}

/**
 * Collects the CV's free prose — the only fields that carry language signal.
 * Names, employers, dates and skills are proper nouns or machine values and say
 * nothing about the language the candidate writes in.
 */
export function collectCvProse(sectionData: ProseSource | null | undefined): string[] {
  const parts: string[] = []
  if (!sectionData) return parts

  pushText(parts, sectionData.summary)

  const work = Array.isArray(sectionData.workExperience) ? sectionData.workExperience : []
  for (const w of work as { jobTitle?: unknown; description?: unknown }[]) {
    pushText(parts, w?.jobTitle)
    pushText(parts, w?.description)
  }

  const projects = Array.isArray(sectionData.projects) ? sectionData.projects : []
  for (const p of projects as { role?: unknown; description?: unknown }[]) {
    pushText(parts, p?.role)
    pushText(parts, p?.description)
  }

  return parts
}

/**
 * The language the AI should WRITE IN for this CV: the CV's own language when
 * there is enough prose to tell, the fallback (app locale) otherwise.
 */
export function detectCvLanguage(
  sectionData: ProseSource | null | undefined,
  fallback: "es" | "en"
): "es" | "en" {
  const parts = collectCvProse(sectionData)
  const blob = parts.join(" ").trim()
  if (blob.length < CV_LANG_MIN_CHARS) return fallback
  return detectLanguage(parts)
}

/**
 * Same detection, but reports `null` instead of a fallback when the CV is too
 * short to judge. For UI that must stay silent rather than guess (the language
 * notice), not for picking the language of an AI call.
 */
export function detectCvLanguageOrNull(
  sectionData: ProseSource | null | undefined
): "es" | "en" | null {
  const parts = collectCvProse(sectionData)
  const blob = parts.join(" ").trim()
  if (blob.length < CV_LANG_MIN_CHARS) return null
  return detectLanguage(parts)
}
