// lib/services/ai/shared/ai-helpers.ts
// Shared helpers used across multiple AI modules.
import { AppError } from "@/lib/services/auth/AppError"
import { parseBullets, renderBulletsForPrompt } from "./bullets"

/** Safe JSON parser — throws AppError("parse_error", 500) on failure. */
export function parseAIJson<T>(raw: string): T {
  try {
    return JSON.parse(raw || "{}") as T
  } catch {
    throw new AppError("parse_error", 500)
  }
}

/**
 * Same parse, but a bad body is a value instead of a 500.
 *
 * Callers that can retry need to SEE the failure rather than have the whole
 * request die on it: a truncated extraction is a sampling accident, and turning
 * it into "something went wrong" for the user is worse than asking again.
 */
export function safeParseAIJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw || "{}") as T
  } catch {
    return null
  }
}

export interface BuildSectionContextOptions {
  /**
   * Render `description` as indexed bullet lines via the shared bullets
   * contract. Opt-in: only work experience stores bullets — education,
   * projects and volunteer descriptions are prose, and indexing prose would
   * invent a structure the data doesn't have.
   */
  bullets?: boolean
}

/** Builds a labeled list of section items for prompts (with stable ids). */
export function buildSectionContext(
  label: string,
  items: {
    id: string
    name?: string
    title?: string
    employer?: string
    organization?: string
    role?: string
    jobTitle?: string
    degree?: string
    description?: string
  }[],
  options: BuildSectionContextOptions = {},
): string {
  if (!items.length) return ""
  return `\n${label}:\n` + items.map((item, i) => {
    const name = item.employer ?? item.organization ?? item.name ?? item.title ?? item.degree ?? item.role ?? item.jobTitle ?? ""
    const desc = buildItemDescription(item.description, options.bullets === true)
    return `  [${i + 1}] id="${item.id}" | ${name}${desc}`
  }).join("\n")
}

function buildItemDescription(description: string | undefined, asBullets: boolean): string {
  if (!description) return ""
  if (!asBullets) return `\n    Descripción actual: ${description.slice(0, 500)}`
  const bullets = parseBullets(description)
  if (!bullets.length) return ""
  const rendered = renderBulletsForPrompt(bullets, { indent: "      ", maxTotalLength: 500 })
  return `\n    Descripción actual (bullets):\n${rendered}`
}

/** Minimal HTML escape for AI output rendered as HTML. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Normalizes a raw locale into "es" | "en" and returns the matching system instruction. */
export function resolveLanguage(raw?: string): { language: "es" | "en"; langInstruction: string } {
  const language: "es" | "en" = raw === "en" ? "en" : "es"
  const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."
  return { language, langInstruction }
}

// ─── Anti-hallucination helpers (shared across all AI modules) ────────────────

/**
 * Tech/framework buzzwords commonly invented out of nowhere by LLMs.
 * If any of these appears in the AI output but NOT in the source context,
 * we treat the output as a hallucination.
 */
export const TECH_BUZZWORDS: readonly string[] = [
  "graphql", "redux", "kubernetes", "docker", "terraform", "tca", "swiftui",
  "kotlin", "rust", "ansible", "jenkins", "circleci", "grpc", "kafka",
  "rabbitmq", "redis", "elasticsearch", "prometheus", "grafana", "next.js",
  "nestjs", "fastapi", "django", "rails", "spring boot", "flutter",
  "react", "node", "typescript", "javascript", "python", "aws", "gcp",
  "azure", "postgresql", "mongodb", "tailwind", "vue", "angular",
]

/**
 * Metric tokens that count as INVENTED when they appear in AI output but not in
 * the source. Deliberately NARROW: every token here that the model writes and
 * the source lacks costs the user their whole suggestion, so a false positive
 * is expensive. Only units that are unambiguously performance claims.
 *
 * Not the same list as ANY_METRIC_REGEX, and that is on purpose — see there.
 */
export const METRIC_REGEX =
  /(\d+(?:[.,]\d+)?)\s*(%|percent|x\b|users?|usuarios?|requests?|peticiones?|reduction|reducci[oó]n|increase|aumento|decrease|improvement|mejora)/gi

/**
 * Any figure that quantifies something — used to ask "does this text contain a
 * real number at all?", never to accuse the model of inventing one.
 *
 * Deliberately BROAD, and deliberately broader than METRIC_REGEX. The two
 * answer opposite questions and want opposite errors:
 *
 *   METRIC_REGEX      "is this invented?"  → a false positive DROPS the user's
 *                                            suggestion, so it stays narrow.
 *   ANY_METRIC_REGEX  "does this quantify?" → a false negative just means we
 *                                            nag about a metric that is there,
 *                                            so it stays inclusive.
 *
 * They used to be two unrelated regexes in two files that happened to disagree
 * about whether "5 engineers" was a metric. One list, one place, and the
 * difference is now a decision instead of an accident.
 */
export const ANY_METRIC_REGEX =
  /\b\d+(?:[.,]\d+)?\s*(?:%|percent|x\b|k\b|m\b|users?|usuarios?|clients?|clientes?|people|personas|engineers?|ingenieros?|teams?|equipos?|projects?|proyectos?|years?|a[ñn]os?|months?|meses?|minutes?|minutos?|hours?|horas?|releases?|versions?|versiones?|countries?|pa[ií]ses?|accounts?|cuentas?|tickets?|deals?|leads?)/i

/**
 * The same question, asked structurally instead of by naming units.
 *
 * The list above knows the units somebody thought of. Reported from the panel: a
 * bullet reading "cut release cycle time FROM 4 WEEKS TO 2 WEEKS" was labelled
 * "no metric" — "weeks" was simply not on the list, and neither were days,
 * seconds, patients, students, beds, units or any currency symbol. Telling a
 * candidate that their explicit before-and-after is not a number is the kind of
 * error that makes the whole panel untrustworthy, and no list ever stays ahead of
 * every profession's units.
 *
 * So: a before→after pair, a currency amount, a magnitude, or a figure followed
 * by any real word — which is what quantification looks like in every language
 * this product supports. Same shapes the bullet ranking already scores with, so
 * the two cannot disagree about whether a line carries a figure.
 *
 * The trade-off is deliberate and in the safe direction: over-counting means we
 * stay QUIET about a bullet, while under-counting means we call a real number
 * missing to the person who wrote it.
 */
const STRUCTURAL_METRIC = [
  /\bfrom\s+[\d.,]+\s*%?\s*[a-zá-úñ]*\s+to\s+[\d.,]+/i,
  /\bde\s+[\d.,]+\s*%?\s*[a-zá-úñ]*\s+a\s+[\d.,]+/i,
  /[$€£]\s?[\d.,]+|\b[\d.,]+\s?(?:usd|eur|bob|mxn|cop|ars)\b/i,
  /\b\d[\d.,]*\s*(?:mil|millones|million|billion)\b/i,
  /\b\d[\d.,]*\s*(?:ms|seg|segundos|minutos|horas|hrs|kb|mb|gb|tb)\b/i,
  /\b\d[\d.,]*\s+[a-zá-úñ]{3,}/i,
]

/** True when the text quantifies anything at all. Prefer this over the regex. */
export function hasAnyMetric(text: string): boolean {
  return ANY_METRIC_REGEX.test(text) || STRUCTURAL_METRIC.some((re) => re.test(text))
}

/**
 * Matches a METRIC placeholder: a bracket standing in for a figure the source
 * never provided — [X%], [N users], [$Z], [N meses], [number of clients].
 *
 * Anchored to the START of the bracket, because that is what distinguishes a
 * metric stand-in from ordinary bracketed prose. The previous version accepted
 * the bare letters "x" or "n" ANYWHERE inside the brackets, so "[Your Name]"
 * and "[Company]" both matched on their incidental "n" — which silently binned
 * every cover letter the model signed off with "Sincerely, [Your Name]".
 */
export const METRIC_PLACEHOLDER_REGEX =
  /\[\s*(?:x\b|n\b|z\b|\$|\d|number\b|métrica\b|metric\b|porcentaje\b|percent\b|cifra\b)/i

/**
 * Fail-safe hallucination detector. Returns true if `text` looks like it
 * introduces data (placeholders, metrics, or technologies) not present in
 * `sourceContext`. Callers should drop/replace flagged content rather than
 * surface invented data to the user.
 *
 * Detection layers:
 *   1. Metric placeholders like [X%], [N users], [métrica].
 *   2. Metric tokens present in text but absent from source.
 *   3. Tech buzzwords from TECH_BUZZWORDS present in text but absent from source.
 *
 * There is deliberately no opt-out for layer 1. Modules used to pass
 * `allowPlaceholders: true` and instruct the model to emit "[X%]" whenever a
 * real metric was missing — which shipped unfilled brackets into CVs and cover
 * letters, and gave the model a way to "improve" a bullet by bolting a fake
 * metric onto an otherwise unchanged sentence. When a figure is missing the
 * answer is to write without it, or to ask the user — never to bracket it.
 */
export function detectHallucination(text: string, sourceContext: string): boolean {
  if (!text) return false
  const sourceLower = sourceContext.toLowerCase()

  // 1. Metric placeholders are never allowed in production-ready output.
  if (METRIC_PLACEHOLDER_REGEX.test(text)) return true

  // 2. Metric tokens present in text but absent from the source.
  const textMetrics = text.match(METRIC_REGEX) ?? []
  for (const metric of textMetrics) {
    if (!sourceLower.includes(metric.toLowerCase())) return true
  }

  // 3. Tech buzzwords introduced out of nowhere.
  //    Use word-boundary regex (not substring) to avoid false positives like
  //    "reacción" → "react", "avenue" → "vue", "node_modules" → "node".
  //    Escape `.` and `+` for entries such as "next.js" or hypothetical "c++".
  for (const tech of TECH_BUZZWORDS) {
    const re = new RegExp(`\\b${tech.replace(/[.+]/g, "\\$&")}\\b`, "i")
    if (re.test(text) && !re.test(sourceContext)) return true
  }

  return false
}

// Summary/cover-letter prompts label each variant ("Version 1 — EXECUTIVE", etc.)
// as a styling instruction. Models sometimes echo that header into the body, so
// the saved text ends up reading "Version 2: ...". Strip a single leading
// "Version N"/"Versión N" label (with an optional style word + separator). Only
// the start is touched — never the real prose.
const VERSION_LABEL_REGEX =
  /^\s*versi[oó]n\s*\d+\s*(?:[—–-]\s*[\p{Lu}][\p{L} ]{1,30}?)?\s*[:—–-]\s+/iu

export function stripVersionLabel(text: string): string {
  if (!text) return text
  return text.replace(VERSION_LABEL_REGEX, "").trimStart()
}

/** Words too common to prove anything about grounding. */
const STOPWORDS = new Set([
  "the", "a", "an", "of", "at", "in", "for", "and", "as", "to", "with",
  "el", "la", "los", "las", "un", "una", "de", "del", "en", "para", "y", "como",
])

/**
 * Shorthands people type and the canonical words a CV uses for them. Explicit,
 * because prefix matching cannot tell these apart: "dev" must ground
 * "developer" but not "devops", and both are three-letter prefixes. Mirrors the
 * ALIAS_GROUPS approach in ats-matcher.ts — short and curated on purpose.
 */
const WORD_ALIASES: readonly string[][] = [
  ["dev", "developer", "development"],
  ["eng", "engineer", "engineering"],
  ["ing", "ingeniero", "ingeniera", "ingeniería", "ingenieria"],
  ["mgr", "manager"],
  ["sr", "senior"],
  ["jr", "junior"],
  ["admin", "administrator", "administrador", "administradora"],
  ["arch", "architect", "arquitecto", "arquitecta"],
  ["desarrollador", "desarrolladora", "desarrollo"],
  ["analyst", "analista"],
  ["designer", "diseñador", "diseñadora"],
  ["qa", "tester"],
]

const ALIAS_LOOKUP: Map<string, number> = (() => {
  const m = new Map<string, number>()
  WORD_ALIASES.forEach((group, i) => group.forEach((w) => m.set(w, i)))
  return m
})()

function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true
  const ga = ALIAS_LOOKUP.get(a)
  return ga !== undefined && ga === ALIAS_LOOKUP.get(b)
}

const WORD_SPLIT = /[^\p{L}\p{N}.+#]+/u

/**
 * True when `value` is derivable from `source`: an exact substring, or every
 * significant word matching a source word directly or through WORD_ALIASES.
 *
 * A plain `source.includes(value)` demands a verbatim echo, which binned the
 * model for doing the right thing — the user writes "I worked at Google as a
 * backend dev", the model canonicalises to "Backend Developer", which is the
 * form a CV needs, and the whole entry was dropped. This still rejects a role
 * or employer the user never mentioned, which is what the check is for.
 */
export function isGroundedIn(value: string, source: string): boolean {
  const v = value.toLowerCase().trim()
  if (!v) return false
  const s = source.toLowerCase()
  if (s.includes(v)) return true

  const sourceWords = s.split(WORD_SPLIT).filter(Boolean)
  const valueWords = v.split(WORD_SPLIT).filter((w) => w && !STOPWORDS.has(w))
  if (!valueWords.length) return false

  return valueWords.every((word) => sourceWords.some((sw) => wordsMatch(sw, word)))
}

// Cover-letter prompts ask for the body only — the app renders the candidate's
// real name beneath it. Models sign off anyway (~1 in 8), usually as
// "Sincerely,\n[Your Name]", which leaves an unfilled bracket in a letter the
// user sends to a recruiter. The prompt is the first line of defence; this is
// the deterministic one.
const SIGN_OFF_REGEX =
  /\n+\s*(?:sincerely|regards|best regards|kind regards|warm regards|yours (?:sincerely|truly|faithfully)|thank you|atentamente|saludos(?: cordiales)?|cordialmente|un saludo)\s*,?\s*(?:\n+.{0,60})?\s*$/i

/** Trailing "[Your Name]" / "[Tu Nombre]" line, with or without a sign-off above it. */
const NAME_PLACEHOLDER_LINE_REGEX = /\n+\s*\[[^\]\n]{0,40}\]\s*$/

/**
 * Removes a trailing signature block from a cover-letter body: the sign-off
 * line, and any bracketed name line under it. Only the tail is touched — real
 * prose is never rewritten.
 */
export function stripSignOff(text: string): string {
  if (!text) return text
  let out = text.replace(NAME_PLACEHOLDER_LINE_REGEX, "")
  out = out.replace(SIGN_OFF_REGEX, "")
  return out.trimEnd()
}
