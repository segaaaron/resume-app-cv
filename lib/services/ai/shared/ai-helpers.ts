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
 * Detects metric tokens (percentages, "K/M" magnitudes, reduction/increase
 * phrases). Used to identify metrics in the AI output that aren't present in
 * the source.
 */
export const METRIC_REGEX =
  /(\d+(?:[.,]\d+)?)\s*(%|percent|x\b|users?|usuarios?|requests?|peticiones?|reduction|reducci[oó]n|increase|aumento|decrease|improvement|mejora)/gi

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
