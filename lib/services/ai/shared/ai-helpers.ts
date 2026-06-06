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
    const desc = item.description ? `\n    Descripción actual: ${item.description.slice(0, 200)}` : ""
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
