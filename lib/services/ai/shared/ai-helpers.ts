// lib/services/ai/shared/ai-helpers.ts
// Shared helpers used across multiple AI modules.
import { AppError } from "@/lib/services/auth/AppError"

/** Safe JSON parser — throws AppError("parse_error", 500) on failure. */
export function parseAIJson<T>(raw: string): T {
  try {
    return JSON.parse(raw || "{}") as T
  } catch {
    throw new AppError("parse_error", 500)
  }
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
): string {
  if (!items.length) return ""
  return `\n${label}:\n` + items.map((item, i) => {
    const name = item.employer ?? item.organization ?? item.name ?? item.title ?? item.degree ?? item.role ?? item.jobTitle ?? ""
    const desc = item.description ? `\n    Descripción actual: ${item.description.slice(0, 500)}` : ""
    return `  [${i + 1}] id="${item.id}" | ${name}${desc}`
  }).join("\n")
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

export interface DetectHallucinationOptions {
  /**
   * When true, bracket placeholders like [X%], [N users], [X years] are
   * permitted (some modules explicitly instruct the model to use them when
   * real metrics are missing — e.g. improve-bullet, improve-summary,
   * improve-cover-letter). Default false (review-cv behaviour: previews must
   * be production-ready text with no placeholders).
   */
  allowPlaceholders?: boolean
}

/**
 * Fail-safe hallucination detector. Returns true if `text` looks like it
 * introduces data (placeholders, metrics, or technologies) not present in
 * `sourceContext`. Callers should drop/replace flagged content rather than
 * surface invented data to the user.
 *
 * Detection layers:
 *   1. Placeholder patterns like [X%], [N users], [métrica] — only when
 *      `allowPlaceholders` is false.
 *   2. Metric tokens present in text but absent from source.
 *   3. Tech buzzwords from TECH_BUZZWORDS present in text but absent from source.
 */
export function detectHallucination(
  text: string,
  sourceContext: string,
  options: DetectHallucinationOptions = {},
): boolean {
  if (!text) return false
  const textLower = text.toLowerCase()
  const sourceLower = sourceContext.toLowerCase()

  // 1. Placeholders never allowed in production-ready output (unless caller opts in).
  if (!options.allowPlaceholders) {
    if (/\[[^\]]*(?:x|n|number|métrica|metric|porcentaje|percent|usuarios?|users?)[^\]]*\]/i.test(text)) {
      return true
    }
  }

  // 2. Metric tokens present in text but absent from the source.
  //    Skip tokens that are inside bracket placeholders when those are allowed.
  const cleanText = options.allowPlaceholders ? text.replace(/\[[^\]]+\]/g, " ") : text
  const textMetrics = cleanText.match(METRIC_REGEX) ?? []
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
