import OpenAI from "openai"
import { db } from "@/lib/db"

// Re-export so existing AI routes don't need to change their import path
export { checkRateLimit, recordRateLimitUsage } from "@/lib/rate-limit"

// Lazy singleton — never instantiate at module level (Docker build fails without OPENAI_API_KEY)
let _openai: OpenAI | null = null
export function getOpenAI(): OpenAI {
  return (_openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY }))
}

// Shared model config
export const AI_MODEL = "gpt-4o-mini" as const
export const AI_TEMPERATURE = 0.4 as const
export const AI_TEMPERATURE_CREATIVE = 0.7 as const  // cover letters — needs variety
export const AI_TEMPERATURE_BALANCED = 0.5 as const  // profile fill — between deterministic and creative

// Fire-and-forget usage log — never throws
export function logAIUsage(userId: string, endpoint: string): void {
  db.aIUsageLog.create({ data: { userId, endpoint } }).catch(() => {})
}

// Extract plain-text summary of CV data for use in AI prompts
export function buildResumeContext(sectionData: Record<string, unknown>): string {
  const {
    personalDetails,
    workExperience,
    education,
    skills,
    summary,
    languages,
    certifications,
    projects,
  } = sectionData as {
    personalDetails?: { firstName?: string; lastName?: string; jobTitle?: string; email?: string; phone?: string; location?: string }
    workExperience?: Array<{ jobTitle?: string; employer?: string; startDate?: string; endDate?: string; description?: string }>
    education?: Array<{ degree?: string; institution?: string; school?: string; startDate?: string; endDate?: string }>
    skills?: Array<{ name?: string; level?: string }>
    summary?: string
    languages?: Array<{ language?: string; level?: string }>
    certifications?: Array<{ name?: string; issuer?: string; date?: string }>
    projects?: Array<{ name?: string; description?: string }>
  }

  const lines: string[] = []

  if (personalDetails) {
    const name = [personalDetails.firstName, personalDetails.lastName].filter(Boolean).join(" ")
    if (name) lines.push(`Nombre: ${name}`)
    if (personalDetails.jobTitle) lines.push(`Puesto objetivo: ${personalDetails.jobTitle}`)
    if (personalDetails.location) lines.push(`Ubicación: ${personalDetails.location}`)
  }

  if (summary) lines.push(`Resumen profesional: ${summary}`)

  if (workExperience?.length) {
    lines.push("Experiencia laboral:")
    workExperience.slice(0, 5).forEach((j) => {
      const period = [j.startDate, j.endDate ?? "Presente"].filter(Boolean).join(" - ")
      lines.push(`  - ${j.jobTitle ?? ""} en ${j.employer ?? ""} (${period})`)
      if (j.description) lines.push(`    ${j.description.slice(0, 500)}`)
    })
  }

  if (education?.length) {
    lines.push("Educación:")
    education.slice(0, 3).forEach((e) => {
      lines.push(`  - ${e.degree ?? ""} en ${e.institution ?? e.school ?? ""}`)
    })
  }

  if (skills?.length) {
    const skillList = skills.slice(0, 12).map((s) => s.name).filter(Boolean).join(", ")
    if (skillList) lines.push(`Habilidades: ${skillList}`)
  }

  if (languages?.length) {
    const langList = languages.map((l) => `${l.language ?? ""}${l.level ? ` (${l.level})` : ""}`).filter(Boolean).join(", ")
    if (langList) lines.push(`Idiomas: ${langList}`)
  }

  if (certifications?.length) {
    const certList = certifications.slice(0, 3).map((c) => c.name).filter(Boolean).join(", ")
    if (certList) lines.push(`Certificaciones: ${certList}`)
  }

  if (projects?.length) {
    lines.push("Proyectos:")
    projects.slice(0, 3).forEach((p) => {
      lines.push(`  - ${p.name ?? ""}${p.description ? `: ${p.description.slice(0, 100)}` : ""}`)
    })
  }

  return lines.join("\n")
}
