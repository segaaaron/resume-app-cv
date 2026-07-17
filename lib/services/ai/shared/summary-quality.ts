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
import { ANY_METRIC_REGEX } from "./ai-helpers"
import { hasCliche } from "./cliches"

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

  if (hasCliche(text)) issues.push("cliche")
  if (PRONOUN_REGEX.test(text)) issues.push("pronouns")

  // Only a fault when the CV actually has a figure to carry over.
  if (profileHasMetrics && !ANY_METRIC_REGEX.test(text)) issues.push("missing_metric")

  return { alreadyGood: issues.length === 0, issues }
}

/** True when the CV states any figure a summary could legitimately quote. */
export function profileStatesMetrics(sectionData: Record<string, unknown> | undefined): boolean {
  return extractProfileMetrics(sectionData).length > 0
}

/** Global variant — the exported one is sticky-free and used with .test(). */
const METRIC_SCAN =
  /\b\d+(?:[.,]\d+)?\s*(?:%|percent|x\b|k\b|m\b|users?|usuarios?|clients?|clientes?|people|personas|engineers?|ingenieros?|teams?|equipos?|projects?|proyectos?|years?|a[ñn]os?|months?|meses?|minutes?|minutos?|hours?|horas?|releases?|versions?|versiones?|countries?|pa[ií]ses?|accounts?|cuentas?|tickets?|deals?|leads?)/gi

/**
 * One sentence per claim.
 *
 * Splits only on a terminator followed by whitespace, so "3.5%" and "$1.2M"
 * stay whole — a decimal point has no space after it. A line with no terminator
 * comes back as itself, which keeps every CV bullet exactly as it was.
 */
function splitSentences(line: string): string[] {
  return line.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
}

/**
 * The actual figures the CV states, with a little context around each.
 *
 * generate-summary was told "include the figure only if the profile states one"
 * and then had to go find them itself in a wall of prose. It didn't: a CV
 * saying "cutting deploy time from 40 minutes to under 6" and "cut crash rate
 * 20%" produced three summaries with no number at all — it vagued the strongest
 * thing the candidate had into "significantly enhanced efficiency". Handing the
 * model the list is the same move that fixed metric_missing for bullets: the
 * regex finds them, the model only writes.
 */
export function extractProfileMetrics(sectionData: Record<string, unknown> | undefined): string[] {
  if (!sectionData) return []
  const work = (sectionData.workExperience ?? []) as { description?: string }[]
  return extractMetricsFromText(work.map((j) => j.description ?? "").join("\n"))
}

/**
 * The same scan over any free text the candidate wrote.
 *
 * improve-summary looked for figures with profileStatesMetrics(sectionData) —
 * the CV only. So a user who has no CV yet and types "cut churn 30% across 5
 * markets" into the box stated two figures the check could not see, and the
 * rewrite was free to drop them. The figure is the candidate's, wherever they
 * happened to type it.
 */
export function extractMetricsFromText(text: string | undefined): string[] {
  if (!text) return []
  const found: string[] = []

  for (const line of text.split("\n")) {
    // A CV bullet is one line, so splitting on "\n" gave one figure per entry.
    // A summary is one paragraph: the whole thing came back as a single "figure"
    // and the prompt block — meant to be a clean list of numbers — reprinted the
    // user's entire summary under "THE CANDIDATE'S REAL NUMBERS", duplicating
    // text already in the prompt and diluting the one instruction it exists to
    // carry. Sentences are the real unit: one claim, one figure, its context.
    for (const sentence of splitSentences(line)) {
      // Fresh regex per sentence: METRIC_SCAN is /g, and a shared lastIndex
      // would make the scan skip inputs depending on what matched before them.
      const re = new RegExp(METRIC_SCAN.source, "gi")
      if (!re.test(sentence)) continue
      // Trimmed of its marker — the figure means nothing without the thing it
      // measures.
      const clean = sentence.replace(/^\s*[•·]+\s*|^\s*[-*]+\s+/, "").trim()
      if (clean) found.push(clean)
    }
  }
  return found.slice(0, 6)
}
