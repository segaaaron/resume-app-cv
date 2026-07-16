// lib/services/ai/shared/summary-quality.ts
// Deterministic "is this summary already good?" check.
//
// improve-summary used to ask the model this in prose (its STEP 0 gate) and the
// model never once said yes — measured 0/5 even on a summary that satisfied
// every criterion the prompt listed. The reason isn't the wording: the endpoint
// is all-or-nothing, so "return nothing" reads to the model like failing the
// task, and no amount of licensing in the prompt changes that. Endpoints that
// return per-item results (improve-bullet, tailor-cv) can decline per item and
// do; this one can't.
//
// Every criterion in that gate is checkable in code, so it belongs here: no
// token spent, instant, and the same summary always gets the same verdict.

/** Openers that carry no impact. Mirrors the prompt's banned list. */
const CLICHES: readonly string[] = [
  // en
  "responsible for", "passionate about", "looking for new challenges",
  "experienced in", "team player", "detail-oriented", "hard-working",
  "results-driven", "go-getter", "self-starter", "proven track record",
  "think outside the box", "wear many hats",
  // es
  "responsable de", "apasionado por", "apasionada por", "con experiencia en",
  "busco nuevos retos", "trabajo en equipo", "orientado al detalle",
  "orientada al detalle", "proactivo", "proactiva", "orientado a resultados",
  "orientada a resultados", "don de gentes",
]

/** First-person pronouns — a CV summary is written impersonally. */
const PRONOUN_REGEX =
  /\b(i|i'm|i've|my|me|myself|yo|mi|mis|me|conmigo|soy|tengo|busco)\b/i

/** Impact verbs the prompts already name, plus the forms a summary opens with. */
const IMPACT_VERBS: readonly string[] = [
  "led", "leads", "leading", "developed", "develops", "developing",
  "transformed", "scaled", "optimized", "implemented", "drove", "drives",
  "designed", "built", "builds", "rebuilt", "grew", "delivered", "delivers",
  "shipped", "ships", "cut", "reduced", "increased", "launched", "mentored",
  "architected", "automated", "migrated", "deployed", "refactored",
  "lideró", "lidera", "desarrolló", "desarrolla", "transformó", "escaló",
  "optimizó", "implementó", "impulsó", "diseñó", "construyó", "creó",
  "redujo", "incrementó", "lanzó", "mentoró", "arquitectó", "automatizó",
  "migró", "desplegó", "refactorizó",
]

/** Numbers that read as an achievement metric, not a year or a phone number. */
const METRIC_REGEX =
  /\b\d+(?:[.,]\d+)?\s*(?:%|percent|x\b|k\b|m\b|users?|usuarios?|clients?|clientes?|people|personas|engineers?|ingenieros?|teams?|equipos?|projects?|proyectos?|years?|años?|months?|meses?|minutes?|minutos?|hours?|horas?|releases?|versions?|versiones?)/i

export interface SummaryQuality {
  /** True when nothing here is worth an AI rewrite. */
  alreadyGood: boolean
  /** Which checks failed — drives what we tell the user. */
  issues: Array<"weak_opener" | "cliche" | "pronouns" | "missing_metric" | "too_short">
}

function startsWithImpact(text: string): boolean {
  const first = text.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^\p{L}]/gu, "") ?? ""
  if (!first) return false
  if (IMPACT_VERBS.includes(first)) return true
  // A role title is an equally strong opener ("Senior iOS engineer who…").
  // Capitalised and not a pronoun is the cheapest reliable signal.
  const raw = text.trim().split(/\s+/)[0] ?? ""
  return /^\p{Lu}/u.test(raw) && !PRONOUN_REGEX.test(first)
}

/**
 * Judges a professional summary against the criteria improve-summary's prompt
 * already lists. `profileHasMetrics` comes from the CV itself: a summary is not
 * penalised for lacking a figure the candidate never provided — demanding one
 * is exactly what used to push the model into inventing it.
 */
export function assessSummary(summary: string, profileHasMetrics: boolean): SummaryQuality {
  const text = (summary ?? "").trim()
  const issues: SummaryQuality["issues"] = []

  if (text.split(/\s+/).filter(Boolean).length < 25) issues.push("too_short")
  if (!startsWithImpact(text)) issues.push("weak_opener")

  const lower = text.toLowerCase()
  if (CLICHES.some((c) => lower.includes(c))) issues.push("cliche")
  if (PRONOUN_REGEX.test(text)) issues.push("pronouns")

  // Only a fault when the CV actually has a figure to carry over.
  if (profileHasMetrics && !METRIC_REGEX.test(text)) issues.push("missing_metric")

  return { alreadyGood: issues.length === 0, issues }
}

/** True when the CV states any figure a summary could legitimately quote. */
export function profileStatesMetrics(sectionData: Record<string, unknown> | undefined): boolean {
  if (!sectionData) return false
  const work = (sectionData.workExperience ?? []) as { description?: string }[]
  return work.some((j) => METRIC_REGEX.test(j.description ?? ""))
}
