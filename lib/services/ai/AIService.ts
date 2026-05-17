// lib/services/ai/AIService.ts
import { z } from "zod"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL,
  AI_TEMPERATURE,
  AI_TEMPERATURE_CREATIVE,
  AI_TEMPERATURE_BALANCED,
  checkRateLimit,
  recordRateLimitUsage,
  logAIUsage,
  buildResumeContext,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

// ─── Shared Types ──────────────────────────────────────────────────────────────

export interface VersionsResult {
  versions: string[]
}

export interface ATSScoreResult {
  score: number
  label: string
  summary: string
  strengths: string[]
  gaps: string[]
  missingKeywords: string[]
  suggestions: string[]
}

export interface CoverLetterResult {
  body: string
}

export interface SkillItem {
  name: string
  level: string
}

export interface SuggestSkillsResult {
  skills: SkillItem[]
}

// ─── review-cv Zod schemas (mirrored from route) ──────────────────────────────

const SUGGESTION_FIELDS = [
  "summary",
  "personalDetails.jobTitle",
  "skills",
  "workExperience.description",
  "workExperience.jobTitle",
  "languages",
  "certifications",
] as const

const SuggestionSchema = z.object({
  field: z.enum(SUGGESTION_FIELDS),
  type: z.enum(["replace", "append"]),
  preview: z.string().min(1).max(1000),
  reason: z.string().max(120),
  targetId: z.string().optional(),
})

const ReviewItemSchema = z.object({
  text: z.string().min(1),
  suggestion: SuggestionSchema.optional(),
})

const ReviewResponseSchema = z.object({
  summary: z.string(),
  strengths: z.array(ReviewItemSchema).max(5),
  improvements: z.array(ReviewItemSchema).max(5),
  answer: z.string(),
})

export type ReviewResult = z.infer<typeof ReviewResponseSchema>

// ─── fill-profile Zod schemas (mirrored from route) ───────────────────────────

const ItemUpdateSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
})

const NewWorkExperienceSchema = z.object({
  jobTitle: z.string().min(1),
  employer: z.string().min(1),
  city: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currentlyWorking: z.boolean().optional(),
  description: z.string().min(1),
})

const FillProfileResponseSchema = z.object({
  summary: z.string().nullable().optional(),
  jobTitle: z.string().nullable().optional(),
  hobbies: z.string().nullable().optional(),
  suggestedSkills: z.array(z.string()).max(10).optional(),
  suggestedLanguages: z.array(z.object({ name: z.string(), level: z.string() })).max(5).optional(),
  workExperienceUpdates: z.array(ItemUpdateSchema).max(5).optional(),
  workExperienceNew: z.array(NewWorkExperienceSchema).max(3).optional(),
  educationUpdates: z.array(ItemUpdateSchema).max(5).optional(),
  projectUpdates: z.array(ItemUpdateSchema).max(5).optional(),
  volunteerUpdates: z.array(ItemUpdateSchema).max(5).optional(),
})

export type FillProfileResult = z.infer<typeof FillProfileResponseSchema>

// ─── improve-bullet input ─────────────────────────────────────────────────────

export interface ImproveBulletInput {
  text: string
  jobTitle?: string
  employer?: string
  industry?: string
  language?: string
}

// ─── generate-summary input ───────────────────────────────────────────────────

export interface GenerateSummaryInput {
  sectionData?: Record<string, unknown>
  language?: string
}

// ─── improve-summary input ────────────────────────────────────────────────────

export interface ImproveSummaryInput {
  summary?: string
  userDescription?: string
  sectionData?: Record<string, unknown>
  language?: string
}

// ─── ats-score input ──────────────────────────────────────────────────────────

export interface ATSScoreInput {
  jobDescription: string
  sectionData?: Record<string, unknown>
  language?: string
}

// ─── generate-cover-letter input ──────────────────────────────────────────────

export interface GenerateCoverLetterInput {
  resumeId?: string
  recipientName?: string
  recipientTitle?: string
  company?: string
  jobTitle?: string
  tone?: string
  language?: string
  userPrompt?: string
}

// ─── improve-cover-letter input ───────────────────────────────────────────────

export interface ImproveCoverLetterInput {
  body: string
  company?: string
  jobTitle?: string
  recipientTitle?: string
  language?: string
}

// ─── review-cv input ──────────────────────────────────────────────────────────

export interface ReviewCVInput {
  sectionData: Record<string, unknown>
  question?: string
  language?: string
}

// ─── fill-profile input ───────────────────────────────────────────────────────

export interface FillProfileInput {
  prompt: string
  sectionData?: Record<string, unknown>
  language?: string
}

// ─── suggest-skills input ─────────────────────────────────────────────────────

export interface SuggestSkillsInput {
  jobTitle: string
  industry?: string
  existingSkills?: string[]
  language?: string
}

// ─── Safe JSON parser ─────────────────────────────────────────────────────────

function parseAIJson<T>(raw: string): T {
  try {
    return JSON.parse(raw || "{}") as T
  } catch {
    throw new AppError("parse_error", 500)
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildSectionContext(
  label: string,
  items: { id: string; name?: string; title?: string; employer?: string; organization?: string; role?: string; jobTitle?: string; degree?: string; description?: string }[]
): string {
  if (!items.length) return ""
  return `\n${label}:\n` + items.map((item, i) => {
    const name = item.employer ?? item.organization ?? item.name ?? item.title ?? item.degree ?? item.role ?? item.jobTitle ?? ""
    const desc = item.description ? `\n    Descripción actual: ${item.description.slice(0, 200)}` : ""
    return `  [${i + 1}] id="${item.id}" | ${name}${desc}`
  }).join("\n")
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// ─── AIService ────────────────────────────────────────────────────────────────

export class AIService {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  // ── 1. improve-bullet ────────────────────────────────────────────────────────

  async improveBullet(userId: string, input: ImproveBulletInput): Promise<VersionsResult> {
    const allowed = await checkRateLimit(userId, "improve-bullet")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { text, jobTitle, employer, industry, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const validation = validateAIInput(text, 2000)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    const context = [
      jobTitle ? `Puesto: ${jobTitle}` : "",
      employer ? `Empresa: ${employer}` : "",
      industry ? `Industria: ${industry}` : "",
    ].filter(Boolean).join(" | ")

    const prompt = `TAREA: Revisa y mejora TODOS los bullets de esta descripción de experiencia laboral. Devuelve 3 versiones completas mejoradas.

${context ? `Contexto: ${context}` : ""}
Descripción actual:
${text}

INSTRUCCIONES PARA CADA VERSIÓN:
1. Mejora CADA bullet existente: verbo de acción fuerte al inicio, orientado a logros, ATS-friendly.
2. Agrega 2-3 bullets nuevos y relevantes si enriquecen el perfil para el puesto.
3. Elimina bullets débiles, repetitivos o irrelevantes para un CV profesional.
4. Métricas: usa PLACEHOLDERS como [X%], [N usuarios], [$Z] cuando no hay cifras reales. NUNCA inventes números.
5. Sin pronombres personales. Empieza cada bullet directo con el verbo.
6. Verbos fuertes: Desarrollé, Implementé, Optimicé, Lideré, Diseñé, Reduje, Automaticé, Colaboré, Entregué.
7. Mantén el mismo idioma que el texto original.

LAS 3 VERSIONES DEBEN DIFERENCIARSE ASÍ:
- Versión 1: enfoque técnico — resalta stack, arquitectura y soluciones técnicas.
- Versión 2: enfoque en logros — cuantifica impacto, métricas y resultados de negocio.
- Versión 3: enfoque en liderazgo y colaboración — resalta trabajo en equipo, mentoring y entrega ágil.

Cada versión es una cadena con todos los bullets separados por \\n, cada uno empezando con "• ".

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"versions": ["bullets_version1", "bullets_version2", "bullets_version3"]}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 1800,
      temperature: AI_TEMPERATURE_CREATIVE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite y experto en optimización de ATS (Applicant Tracking Systems). " +
            "Tu especialidad es revisar descripciones de experiencia laboral bullet por bullet: mejorar los existentes, agregar nuevos relevantes y eliminar los débiles. " +
            "Devuelves siempre 3 versiones completas de la descripción mejorada con todos sus bullets. " +
            "SOLO respondes solicitudes relacionadas con CVs, experiencia laboral y perfiles de empleo. " +
            "Cuando el original no tiene métricas, usas SIEMPRE placeholders explícitos entre corchetes ([X%], [N], [$Z]) — NUNCA inventas cifras reales. " +
            "Si el contenido no corresponde a experiencia laboral, responde únicamente con: {\"versions\": []} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ versions?: unknown }>(raw)

    if (!Array.isArray(parsed.versions)) throw new AppError("invalid_response_format", 500)
    if (parsed.versions.length === 0) throw new AppError("off_topic", 422)

    logAIUsage(userId, "improve-bullet")
    recordRateLimitUsage(userId, "improve-bullet")
    return { versions: (parsed.versions as string[]).slice(0, 3) }
  }

  // ── 2. generate-summary ──────────────────────────────────────────────────────

  async generateSummary(userId: string, input: GenerateSummaryInput): Promise<VersionsResult> {
    const allowed = await checkRateLimit(userId, "generate-summary")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { sectionData, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const resumeContext = buildResumeContext(sectionData ?? {})
    if (!resumeContext.trim()) throw new AppError("not_enough_data", 400)

    const validation = validateAIInput(resumeContext, 5000)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    const prompt = `TAREA: Genera 3 versiones de resumen profesional de alto impacto para un CV, basadas en los siguientes datos del candidato.

${resumeContext}

REGLAS DE ORO (aplica todas):
1. Fórmula de posicionamiento: "[Título profesional] con [X años/logro clave] especializado en [área]. Ha [verbo de logro] [resultado medible] mediante [diferenciador único]."
2. Verbos de logro: Lideró, Desarrolló, Impulsó, Optimizó, Transformó. NUNCA uses "Responsable de" o "Con experiencia en".
3. Métricas: si los datos no incluyen cifras, usa placeholders explícitos entre corchetes ([X años], [N equipos], [X%]). NUNCA inventes números reales.
4. Sin pronombres personales: no uses "Yo", "Mi", "Soy". El resumen habla del candidato en tercera persona o de forma impersonal.
5. ATS-Friendly: incluye palabras clave del sector del candidato de forma natural.
6. Longitud: 2 a 4 oraciones máximo. Denso en valor, sin relleno.
7. Idioma: mismo idioma que predomina en los datos.

Genera exactamente 3 versiones con estos tonos:
- Versión 1: Formal y ejecutiva
- Versión 2: Equilibrada y directa
- Versión 3: Dinámica y orientada al impacto

Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown, sin explicaciones):
{"versions": ["version1", "version2", "version3"]}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 500,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite y experto en optimización de ATS (Applicant Tracking Systems). " +
            "Tu especialidad es crear resúmenes profesionales de alto impacto que posicionan al candidato como la opción ideal para su industria. " +
            "Usas la fórmula: [Título] con [logro clave] especializado en [área], que ha [verbo de logro] [resultado] mediante [diferenciador]. " +
            "SOLO respondes con perfiles profesionales reales. Cuando no hay métricas, usas placeholders explícitos entre corchetes ([X años], [X%]). NUNCA inventas cifras. " +
            "Si los datos no corresponden a un perfil profesional real, responde únicamente con: {\"versions\": []} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ versions?: unknown }>(raw)

    if (!Array.isArray(parsed.versions)) throw new AppError("invalid_response_format", 500)
    if (parsed.versions.length === 0) throw new AppError("off_topic", 422)

    logAIUsage(userId, "generate-summary")
    recordRateLimitUsage(userId, "generate-summary")
    return { versions: (parsed.versions as string[]).slice(0, 3) }
  }

  // ── 3. improve-summary ───────────────────────────────────────────────────────

  async improveSummary(userId: string, input: ImproveSummaryInput): Promise<VersionsResult> {
    const allowed = await checkRateLimit(userId, "improve-summary")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { summary, userDescription, sectionData, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const hasSummary = summary && typeof summary === "string" && summary.trim().length > 10
    const hasDescription = userDescription && typeof userDescription === "string" && userDescription.trim().length >= 5

    if (!hasSummary && !hasDescription) throw new AppError("missing_content", 400)

    if (hasSummary) {
      const validation = validateAIInput(summary!, 3000)
      if (!validation.valid) throw new AppError("invalid_input", 400)
    }
    if (hasDescription) {
      const validation = validateAIInput(userDescription!, 500)
      if (!validation.valid) throw new AppError("invalid_input", 400)
    }

    const resumeContext = sectionData ? buildResumeContext(sectionData) : ""

    const prompt = hasSummary
      ? `TAREA: Revisa y mejora el siguiente resumen profesional. Devuelve 3 versiones optimizadas.

${hasDescription ? `Instrucción adicional del candidato: "${userDescription!.trim()}"` : ""}
${resumeContext ? `\nContexto del CV:\n${resumeContext}` : ""}

Resumen actual:
${summary!.trim()}

INSTRUCCIONES:
1. Detecta y corrige errores de redacción, clichés y frases débiles.
2. Usa verbos de impacto: Desarrollé, Lideré, Optimicé, Implementé, Especializo.
3. Sin pronombres personales excesivos. Orientado a logros y valor aportado.
4. Si hay métricas en el original, consérvelas. Si no las hay, usa placeholders [X años], [N proyectos]. NUNCA inventes cifras.
5. Cada versión con un enfoque diferente:
   - Versión 1: Concisa y ejecutiva (2-3 oraciones potentes)
   - Versión 2: Técnica y detallada (habilidades + stack + logros)
   - Versión 3: Orientada al impacto de negocio y resultados

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"versions": ["version1", "version2", "version3"]}`
      : `TAREA: Crea un resumen profesional desde cero basado en la descripción del candidato. Devuelve 3 versiones.

Descripción del candidato: "${userDescription!.trim()}"
${resumeContext ? `\nContexto del CV:\n${resumeContext}` : ""}

INSTRUCCIONES:
1. 3-4 oraciones por versión. Denso en valor, sin relleno.
2. Verbos de impacto: Especializo, Desarrollo, Lidero, Implemento.
3. Usa placeholders [X años], [N proyectos] si el candidato no especificó métricas. NUNCA inventes cifras.
4. Cada versión con un enfoque diferente:
   - Versión 1: Concisa y ejecutiva
   - Versión 2: Técnica y orientada al stack/herramientas
   - Versión 3: Orientada al impacto de negocio

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"versions": ["version1", "version2", "version3"]}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 700,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite especializado en redacción de resúmenes profesionales de alto impacto para CVs. " +
            "Transformas resúmenes genéricos en textos que destacan al candidato con logros concretos y lenguaje de impacto. " +
            "SOLO trabajas con resúmenes profesionales de CV y perfiles laborales reales. " +
            "Cuando no hay métricas, usas SIEMPRE placeholders explícitos entre corchetes ([X años], [N proyectos]) — NUNCA inventas cifras reales. " +
            "Si el contenido no tiene relación con un perfil profesional, responde únicamente con: {\"versions\": []} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ versions?: unknown }>(raw)

    if (!Array.isArray(parsed.versions)) throw new AppError("invalid_response_format", 500)
    if (parsed.versions.length === 0) throw new AppError("off_topic", 422)

    logAIUsage(userId, "improve-summary")
    recordRateLimitUsage(userId, "improve-summary")
    return { versions: (parsed.versions as string[]).slice(0, 3) }
  }

  // ── 4. ats-score ─────────────────────────────────────────────────────────────

  async atsScore(userId: string, input: ATSScoreInput): Promise<ATSScoreResult> {
    const allowed = await checkRateLimit(userId, "ats-score")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { jobDescription, sectionData, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const validation = validateAIInput(jobDescription, 6000)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    // Truncate to 6000 chars — covers 95%+ of real job descriptions without quality loss
    const jobDescriptionTruncated = jobDescription.slice(0, 6000)

    const resumeText = buildResumeContext(sectionData ?? {})
    if (!resumeText.trim()) throw new AppError("not_enough_resume_data", 400)

    const prompt = `Eres un experto en sistemas ATS (Applicant Tracking Systems) y selección de personal.
Analiza la compatibilidad entre el CV y la descripción del puesto de trabajo.

=== CV DEL CANDIDATO ===
${resumeText}

=== DESCRIPCIÓN DEL PUESTO ===
${jobDescriptionTruncated}

Evalúa y devuelve los resultados en JSON con este formato exacto:
{
  "score": <número del 0 al 100>,
  "label": "<Excelente|Bueno|Regular|Bajo>",
  "summary": "<resumen de 1-2 oraciones de la compatibilidad general>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>", "<fortaleza 3>"],
  "gaps": ["<brecha 1>", "<brecha 2>", "<brecha 3>"],
  "missingKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],
  "suggestions": ["<sugerencia concreta 1>", "<sugerencia concreta 2>", "<sugerencia concreta 3>"]
}

Reglas:
- score 80-100 = Excelente, 60-79 = Bueno, 40-59 = Regular, 0-39 = Bajo
- missingKeywords: palabras clave del puesto que NO aparecen en el CV (máximo 8)
- suggestions: acciones concretas y específicas para mejorar la compatibilidad (menciona secciones del CV donde aplicar cada mejora)
- Responde ÚNICAMENTE con el JSON, sin markdown ni explicaciones`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 800,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente especializado EXCLUSIVAMENTE en análisis de compatibilidad entre currículums vitae (CVs) y descripciones de puestos de trabajo (job descriptions). " +
            "Solo debes analizar contenido relacionado con empleo, habilidades profesionales, experiencia laboral y requisitos de puestos. " +
            "Si el contenido recibido no corresponde a un CV o a una descripción de empleo real, responde únicamente con este JSON: " +
            "{\"score\": 0, \"label\": \"off_topic\", \"summary\": \"\", \"strengths\": [], \"gaps\": [], \"missingKeywords\": [], \"suggestions\": []} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<ATSScoreResult>(raw)

    if (typeof parsed.score !== "number" || parsed.label === "off_topic") {
      throw new AppError("off_topic", 422)
    }

    logAIUsage(userId, "ats-score")
    recordRateLimitUsage(userId, "ats-score")
    return parsed
  }

  // ── 5. generate-cover-letter ─────────────────────────────────────────────────

  async generateCoverLetter(userId: string, input: GenerateCoverLetterInput): Promise<CoverLetterResult> {
    const allowed = await checkRateLimit(userId, "generate-cover-letter")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { resumeId, recipientName, recipientTitle, company, jobTitle, tone, language: rawLanguage, userPrompt } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const userText = [company, jobTitle, recipientName, recipientTitle, userPrompt].filter(Boolean).join(" ")
    const validation = validateAIInput(userText, 3000)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    if (company) { const v = validateAIInput(company, 500); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (recipientName) { const v = validateAIInput(recipientName, 500); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (jobTitle) { const v = validateAIInput(jobTitle, 500); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (userPrompt) { const v = validateAIInput(userPrompt, 2000); if (!v.valid) throw new AppError("invalid_input", 400) }

    let resumeContext = ""
    if (resumeId) {
      const resume = await db.resume.findFirst({
        where: { id: resumeId, userId },
        select: { personalDetails: true },
      })
      if (resume?.personalDetails) {
        resumeContext = buildResumeContext(resume.personalDetails as Record<string, unknown>)
      }
    }

    const toneMap = {
      formal: language === "en" ? "formal and professional" : "formal y profesional",
      creative: language === "en" ? "dynamic, confident and creative" : "dinámico, seguro y creativo",
      balanced: language === "en" ? "warm, professional and conversational" : "equilibrado, cercano y profesional",
    }
    const toneLabel = toneMap[(tone as keyof typeof toneMap)] ?? toneMap.balanced

    const prompt = language === "en"
      ? `You are a senior career coach and professional writer specializing in cover letters that get interviews at top companies.

Write a complete, compelling cover letter body for the following candidate and position. This letter must feel personal, specific, and tailored — not generic. It should demonstrate clear understanding of the role and convincingly show why this candidate is the right fit.

${resumeContext ? `=== CANDIDATE PROFILE ===\n${resumeContext}\n` : ""}${userPrompt ? `=== CANDIDATE DESCRIPTION (use this as primary context) ===\n${userPrompt}\n` : ""}
=== TARGET POSITION ===
${company ? `Company: ${company}` : ""}
${jobTitle ? `Role: ${jobTitle}` : ""}
${recipientName ? `Hiring Manager: ${recipientName}${recipientTitle ? `, ${recipientTitle}` : ""}` : ""}

Tone: ${toneLabel}

Write 4 strong paragraphs:
1. HOOK — Open with a specific, compelling reason why this candidate wants THIS role at THIS company. Reference something concrete about the company or the role. No generic openers like "I am writing to apply...".
2. EXPERIENCE & ACHIEVEMENTS — Highlight 2–3 specific accomplishments from the candidate's background that are directly relevant to this role. Use concrete details from the resume (technologies, companies, impact). Quantify where possible.
3. VALUE PROPOSITION — Explain exactly what the candidate brings to the team that others don't. Connect their unique skills and experience to the company's likely challenges or goals.
4. CLOSING CTA — End with a confident, warm call to action. Express genuine enthusiasm and invite next steps.

Rules:
- Write ONLY the body (no salutation, no date, no signature block)
- Do NOT use placeholder text like [Company] or [Name] — use the actual values provided
- Do NOT invent facts, metrics, or experiences not present in the candidate profile
- Use [X%] only if the candidate mentions achievements without specific numbers
- Avoid clichés: "passionate", "team player", "hard worker", "I believe", "I am excited to..."
- Each paragraph must be 3–5 sentences, substantive and specific
- The letter must feel written by a human, not AI

Respond ONLY with JSON: {"body": "<full letter body with paragraph breaks using \\n\\n>"}`
      : `Eres un redactor senior especializado en cartas de presentación que consiguen entrevistas en empresas top. Tienes años de experiencia ayudando a profesionales a destacar en procesos de selección.

Escribe el cuerpo completo de una carta de presentación para el siguiente candidato y puesto. La carta debe sentirse personal, específica y totalmente adaptada — no genérica. Debe demostrar comprensión real del rol y convencer de forma genuina por qué este candidato es la persona indicada.

${resumeContext ? `=== PERFIL DEL CANDIDATO ===\n${resumeContext}\n` : ""}${userPrompt ? `=== DESCRIPCIÓN DEL CANDIDATO (usa esto como contexto principal) ===\n${userPrompt}\n` : ""}
=== PUESTO OBJETIVO ===
${company ? `Empresa: ${company}` : ""}
${jobTitle ? `Puesto: ${jobTitle}` : ""}
${recipientName ? `Responsable de selección: ${recipientName}${recipientTitle ? `, ${recipientTitle}` : ""}` : ""}

Tono: ${toneLabel}

Escribe 4 párrafos sólidos:
1. GANCHO — Abre con una razón específica y convincente de por qué este candidato quiere ESTE puesto en ESTA empresa. Referencia algo concreto del rol o la empresa. Nada genérico como "Me dirijo a usted para...".
2. EXPERIENCIA Y LOGROS — Destaca 2–3 logros concretos del perfil del candidato directamente relevantes para este puesto. Usa detalles reales del CV (tecnologías, empresas, impacto). Cuantifica donde sea posible.
3. PROPUESTA DE VALOR — Explica exactamente qué aporta este candidato que otros no tienen. Conecta sus habilidades únicas con los desafíos u objetivos probables de la empresa.
4. CIERRE Y CTA — Cierra con una llamada a la acción segura y cálida. Expresa entusiasmo genuino e invita a dar los próximos pasos.

Reglas:
- Escribe SOLO el cuerpo (sin saludo, sin fecha, sin bloque de firma)
- NO uses placeholders como [Empresa] o [Nombre] — usa los valores reales proporcionados
- NO inventes datos, métricas ni experiencias que no estén en el perfil del candidato
- Usa [X%] solo si el candidato menciona logros sin cifras concretas
- Evita clichés: "apasionado", "trabajo en equipo", "me motiva", "creo firmemente", "estoy emocionado de..."
- Cada párrafo debe tener 3–5 oraciones, sustanciales y específicas
- La carta debe sonar escrita por un humano, no por IA

Responde ÚNICAMENTE con JSON: {"body": "<cuerpo completo con saltos de párrafo usando \\n\\n>"}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 900,
      temperature: AI_TEMPERATURE_CREATIVE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente especializado EXCLUSIVAMENTE en redacción de cartas de presentación profesionales para búsqueda de empleo. " +
            "Solo debes generar contenido relacionado con candidaturas laborales y experiencia profesional. " +
            "Si la solicitud no corresponde a una carta de presentación laboral real, responde únicamente con: {\"body\": \"\"} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ body: string }>(raw)

    if (typeof parsed.body !== "string") throw new AppError("invalid_response_format", 500)
    if (parsed.body.trim() === "") throw new AppError("off_topic", 422)

    const html = parsed.body
      .split(/\n\n+/)
      .map((p: string) => `<p>${p.split(/\n/).map(escapeHtml).join("<br>").trim()}</p>`)
      .join("")

    logAIUsage(userId, "generate-cover-letter")
    recordRateLimitUsage(userId, "generate-cover-letter")
    return { body: html }
  }

  // ── 6. improve-cover-letter ──────────────────────────────────────────────────

  async improveCoverLetter(userId: string, input: ImproveCoverLetterInput): Promise<VersionsResult> {
    const allowed = await checkRateLimit(userId, "improve-cover-letter")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { body, company, jobTitle, recipientTitle, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const validation = validateAIInput(body, 3000)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    if (company) { const v = validateAIInput(company, 500); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (jobTitle) { const v = validateAIInput(jobTitle, 500); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (recipientTitle) { const v = validateAIInput(recipientTitle, 500); if (!v.valid) throw new AppError("invalid_input", 400) }

    const context = [
      company ? `Empresa: ${company}` : "",
      jobTitle ? `Puesto: ${jobTitle}` : "",
      recipientTitle ? `Destinatario: ${recipientTitle}` : "",
    ].filter(Boolean).join(" | ")

    const prompt = `TAREA: Mejora el siguiente cuerpo de carta de presentación y genera 3 versiones optimizadas.

${context ? `Contexto: ${context}` : ""}
Carta actual:
${body}

REGLAS DE ORO (aplica todas):
1. Mantén la estructura en 3-4 párrafos: interés → logros relevantes → valor aportado → cierre.
2. Elimina clichés ("soy una persona proactiva", "me apasiona el trabajo en equipo"). Sustituye por logros concretos.
3. Verbos de impacto: Lideré, Desarrollé, Optimicé, Implementé, Incrementé. NUNCA uses "Responsable de".
4. Si hay métricas en el texto original, consérvales. Si no las hay, usa placeholders explícitos [X%], [N proyectos], [$Z]. NUNCA inventes cifras reales.
5. Cada versión debe tener un tono distinto:
   - Versión 1: Formal y ejecutiva
   - Versión 2: Equilibrada y directa
   - Versión 3: Dinámica y orientada al impacto
6. Idioma: mismo idioma que el texto original.
7. Máximo 4 párrafos por versión. Cada versión máximo 200 palabras. Denso en valor, sin relleno.

Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown, sin explicaciones):
{"versions": ["version1", "version2", "version3"]}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 1000,
      temperature: AI_TEMPERATURE_CREATIVE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite especializado en redacción de cartas de presentación de alto impacto para procesos de selección. " +
            "Tu especialidad es transformar cartas genéricas en textos que destacan al candidato con logros concretos y lenguaje de impacto. " +
            "SOLO trabajas con cartas de presentación laborales. " +
            "Cuando no hay métricas, usas SIEMPRE placeholders explícitos entre corchetes ([X%], [N proyectos]) — NUNCA inventas cifras reales. " +
            "Si el contenido no es una carta de presentación laboral, responde únicamente con: {\"versions\": []} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ versions?: unknown }>(raw)

    if (!Array.isArray(parsed.versions)) throw new AppError("invalid_response_format", 500)
    if (parsed.versions.length === 0) throw new AppError("off_topic", 422)

    logAIUsage(userId, "improve-cover-letter")
    recordRateLimitUsage(userId, "improve-cover-letter")
    return { versions: (parsed.versions as string[]).slice(0, 3) }
  }

  // ── 7. review-cv ─────────────────────────────────────────────────────────────

  async reviewCV(userId: string, input: ReviewCVInput): Promise<ReviewResult> {
    const allowed = await checkRateLimit(userId, "review-cv")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { sectionData, question, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const resumeContext = buildResumeContext(sectionData)
    if (!resumeContext.trim()) throw new AppError("not_enough_data", 400)

    if (question) {
      const validation = validateAIInput(String(question), 300)
      if (!validation.valid) throw new AppError("invalid_input", 400)
    }

    const userQuestion = question?.trim()
      ? `Pregunta específica del candidato: "${question.trim()}"`
      : "El candidato quiere una revisión general de su CV."

    const prompt = `TAREA: Analiza el siguiente CV y proporciona una revisión profesional detallada.

=== CV DEL CANDIDATO ===
${resumeContext}

=== SOLICITUD ===
${userQuestion}

INSTRUCCIONES:
1. Analiza el CV completo: claridad, impacto, estructura, keywords ATS, coherencia, completitud.
2. Responde directamente a la pregunta si es específica.
3. Sé concreto — menciona secciones o datos reales del CV.
4. Tono: consultor profesional, directo y constructivo.
5. Idioma: mismo idioma que el CV.

Para cada item de strengths e improvements, evalúa si hay una corrección o mejora concreta que la IA pueda generar. Si la hay, incluye el campo "suggestion" con:
- field: UNO de estos valores exactos: "summary" | "personalDetails.jobTitle" | "skills" | "workExperience.description" | "workExperience.jobTitle" | "languages" | "certifications"
- type: "replace" (reemplazar el contenido actual) o "append" (agregar al contenido actual)
- preview: el texto final sugerido, SIN markdown, SIN asteriscos, SIN HTML. Máximo 500 caracteres.
- reason: máximo 12 palabras explicando el cambio
- targetId: solo si la mejora aplica a un item específico de un array (usa el id del item del CV)

NO incluyas suggestion si:
- La mejora requiere datos que la IA no tiene (fechas, nombres de empresas, métricas reales)
- La mejora es un consejo general ("busca referencias", "consigue más experiencia")
- El campo no está en la lista de fields permitidos
- No estás seguro del valor final

Responde ÚNICAMENTE con JSON válido (sin markdown):
{
  "summary": "<diagnóstico general en 2-3 oraciones>",
  "strengths": [
    { "text": "<fortaleza>", "suggestion": { "field": "...", "type": "replace", "preview": "...", "reason": "..." } }
  ],
  "improvements": [
    { "text": "<mejora>", "suggestion": { "field": "...", "type": "replace", "preview": "...", "reason": "..." } },
    { "text": "<mejora sin acción automatizable>" }
  ],
  "answer": "<respuesta directa a la pregunta del candidato, o cadena vacía si fue revisión general>"
}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 900,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite especializado en revisión y optimización de CVs. " +
            "SOLO respondes sobre el CV del candidato, perfil profesional, experiencia laboral o búsqueda de empleo. " +
            "Si la pregunta no tiene relación, responde únicamente con: " +
            "{\"summary\": \"\", \"strengths\": [], \"improvements\": [], \"answer\": \"off_topic\"} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<ReviewResult & { answer: string }>(raw)

    if (parsed.answer === "off_topic") throw new AppError("off_topic", 422)

    const sanitizePreview = (text: string) =>
      text.replace(/[*_`#>]/g, "").replace(/\n{3,}/g, "\n\n").trim()

    const sanitizeItem = (item: z.infer<typeof ReviewItemSchema>) => ({
      ...item,
      suggestion: item.suggestion
        ? { ...item.suggestion, preview: sanitizePreview(item.suggestion.preview) }
        : undefined,
    })

    const validated = ReviewResponseSchema.safeParse(parsed)
    if (!validated.success) {
      this.logger.warn("[AIService.reviewCV] Zod validation failed, returning without suggestions", { error: validated.error.flatten() })
      logAIUsage(userId, "review-cv")
      recordRateLimitUsage(userId, "review-cv")
      return {
        summary: parsed.summary ?? "",
        strengths: (parsed.strengths ?? []).slice(0, 5).map((s: unknown) =>
          typeof s === "string" ? { text: s } : { text: (s as { text?: string }).text ?? "" }
        ),
        improvements: (parsed.improvements ?? []).slice(0, 5).map((s: unknown) =>
          typeof s === "string" ? { text: s } : { text: (s as { text?: string }).text ?? "" }
        ),
        answer: parsed.answer ?? "",
      }
    }

    logAIUsage(userId, "review-cv")
    recordRateLimitUsage(userId, "review-cv")
    return {
      summary: validated.data.summary,
      strengths: validated.data.strengths.map(sanitizeItem),
      improvements: validated.data.improvements.map(sanitizeItem),
      answer: validated.data.answer,
    }
  }

  // ── 8. fill-profile ──────────────────────────────────────────────────────────

  async fillProfile(userId: string, input: FillProfileInput): Promise<FillProfileResult> {
    const allowed = await checkRateLimit(userId, "fill-profile")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { prompt, sectionData, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const validation = validateAIInput(prompt, 500)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    const sd = sectionData ?? {}
    const resumeContext = buildResumeContext(sd)

    const existingSkills = ((sd.skills ?? []) as { name: string }[]).map((s) => s.name).join(", ")

    const workExpItems = (sd.workExperience ?? []) as { employer?: string; jobTitle?: string }[]
    const personalDet = (sd.personalDetails ?? {}) as { location?: string; jobTitle?: string }
    const skillBlocklist = new Set(
      [
        ...workExpItems.flatMap((j) => [j.employer, j.jobTitle]),
        personalDet.location,
        personalDet.jobTitle,
      ]
        .filter((v): v is string => Boolean(v))
        .map((v) => v.toLowerCase().trim())
    )
    const existingLanguages = ((sd.languages ?? []) as { name: string }[]).map((l) => l.name).join(", ")

    const workExpCtx = buildSectionContext("EXPERIENCIA LABORAL", (sd.workExperience ?? []) as Parameters<typeof buildSectionContext>[1])
    const educationCtx = buildSectionContext("EDUCACIÓN", (sd.education ?? []) as Parameters<typeof buildSectionContext>[1])
    const projectsCtx = buildSectionContext("PROYECTOS", (sd.projects ?? []) as Parameters<typeof buildSectionContext>[1])
    const volunteerCtx = buildSectionContext("VOLUNTARIADO", (sd.volunteer ?? []) as Parameters<typeof buildSectionContext>[1])

    const sectionsWithIds = [workExpCtx, educationCtx, projectsCtx, volunteerCtx].filter(Boolean).join("\n")

    const userPrompt = `El candidato quiere mejorar su CV con esta instrucción:
"${prompt.trim()}"

=== CV ACTUAL ===
${resumeContext}
${sectionsWithIds}

${existingSkills ? `Habilidades actuales (NO repetir): ${existingSkills}` : ""}
${existingLanguages ? `Idiomas actuales (NO repetir): ${existingLanguages}` : ""}
${(sd as { hobbies?: string }).hobbies ? `Intereses actuales: ${(sd as { hobbies?: string }).hobbies}` : ""}

TAREA: Analiza la instrucción y determina qué secciones del CV deben mejorar. Aplica los cambios donde corresponda:

- Si menciona una empresa o rol que ya existe en el CV → mejora la descripción de esa entrada usando su id exacto en workExperienceUpdates
- Si menciona una empresa o rol que NO existe en el CV actual → créala en workExperienceNew con jobTitle, employer, city, startDate, endDate, currentlyWorking y description (viñetas • sin markdown). Máximo 3 entradas nuevas.
- Si habla de su perfil general → mejora el resumen (summary) y/o título (jobTitle)
- Si menciona habilidades → agrégalas a suggestedSkills (SOLO habilidades técnicas o blandas reales: frameworks, lenguajes, herramientas, metodologías; NUNCA nombres de empresas, empleadores, puestos de trabajo, ciudades ni ubicaciones)
- Si menciona idiomas → agrégalos a suggestedLanguages con nivel apropiado
- Si menciona estudios → mejora la descripción de esa educación
- Si menciona proyectos → mejora la descripción de ese proyecto
- Si menciona voluntariado → mejora la descripción de esa entrada
- Si menciona intereses o hobbies → actualiza el campo hobbies
- Puede aplicar a múltiples secciones simultáneamente

Responde ÚNICAMENTE con JSON válido (sin markdown). Solo incluye los campos que realmente cambian, omite los demás:
{
  "summary": "<resumen mejorado o null>",
  "jobTitle": "<título actualizado o null>",
  "hobbies": "<intereses actualizados o null>",
  "suggestedSkills": ["<skill nuevo>"],
  "suggestedLanguages": [{ "name": "<idioma>", "level": "elementary|limited|professional|full_professional|native" }],
  "workExperienceUpdates": [{ "id": "<id exacto>", "description": "<descripción mejorada con viñetas •, sin markdown>" }],
  "workExperienceNew": [{ "jobTitle": "<puesto>", "employer": "<empresa>", "city": "<ciudad opcional>", "startDate": "<MM/YYYY opcional>", "endDate": "<MM/YYYY opcional>", "currentlyWorking": false, "description": "<bullets •>" }],
  "educationUpdates": [{ "id": "<id exacto>", "description": "<descripción mejorada>" }],
  "projectUpdates": [{ "id": "<id exacto>", "description": "<descripción mejorada con viñetas •>" }],
  "volunteerUpdates": [{ "id": "<id exacto>", "description": "<descripción mejorada>" }]
}

Reglas:
- Usa SIEMPRE los ids exactos del listado de secciones de arriba. Nunca inventes un id.
- Las descripciones mejoradas integran lo que el candidato dijo + lo que ya existía, de forma cohesiva y profesional.
- No inventes datos (fechas, empresas, métricas) que el candidato no mencionó. Usa [X] como placeholder si el candidato quiere métricas.
- Mismo idioma que la descripción del candidato.`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 700,
      temperature: AI_TEMPERATURE_BALANCED,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un redactor experto en CVs profesionales. Tu trabajo es tomar instrucciones del candidato y traducirlas en contenido profesional concreto para cada sección de su CV. " +
            "Respetas y amplías lo que el candidato menciona — nunca inventas información no derivada de su descripción. " +
            "SOLO procesas instrucciones relacionadas con perfil laboral real. " +
            "Si el texto no tiene relación profesional, responde con: {} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: userPrompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<FillProfileResult>(raw)

    const hasContent = parsed.summary || parsed.jobTitle || parsed.hobbies ||
      parsed.suggestedSkills?.length || parsed.suggestedLanguages?.length ||
      parsed.workExperienceUpdates?.length || parsed.workExperienceNew?.length ||
      parsed.educationUpdates?.length || parsed.projectUpdates?.length || parsed.volunteerUpdates?.length

    if (!hasContent) throw new AppError("off_topic", 422)

    const validated = FillProfileResponseSchema.safeParse(parsed)
    const data = validated.success ? validated.data : parsed

    const validWorkIds = new Set(((sd.workExperience ?? []) as { id: string }[]).map((j) => j.id))
    const validEduIds = new Set(((sd.education ?? []) as { id: string }[]).map((e) => e.id))
    const validProjIds = new Set(((sd.projects ?? []) as { id: string }[]).map((p) => p.id))
    const validVolIds = new Set(((sd.volunteer ?? []) as { id: string }[]).map((v) => v.id))

    logAIUsage(userId, "fill-profile")
    recordRateLimitUsage(userId, "fill-profile")
    return {
      summary: data.summary ?? null,
      jobTitle: data.jobTitle ?? null,
      hobbies: data.hobbies ?? null,
      suggestedSkills: (data.suggestedSkills ?? [])
        .filter((s: string) => !skillBlocklist.has(s.toLowerCase().trim()))
        .slice(0, 8),
      suggestedLanguages: (data.suggestedLanguages ?? []).slice(0, 5),
      workExperienceUpdates: (data.workExperienceUpdates ?? []).filter((u: { id: string }) => validWorkIds.has(u.id)),
      workExperienceNew: (data.workExperienceNew ?? []).slice(0, 3),
      educationUpdates: (data.educationUpdates ?? []).filter((u: { id: string }) => validEduIds.has(u.id)),
      projectUpdates: (data.projectUpdates ?? []).filter((u: { id: string }) => validProjIds.has(u.id)),
      volunteerUpdates: (data.volunteerUpdates ?? []).filter((u: { id: string }) => validVolIds.has(u.id)),
    }
  }

  // ── 9. suggest-skills ────────────────────────────────────────────────────────

  async suggestSkills(userId: string, input: SuggestSkillsInput): Promise<SuggestSkillsResult> {
    const allowed = await checkRateLimit(userId, "suggest-skills")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { jobTitle, industry, existingSkills = [], language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const validation = validateAIInput(jobTitle)
    if (!validation.valid) throw new AppError(validation.error ?? "invalid_input", 400)

    if (industry) { const v = validateAIInput(industry, 500); if (!v.valid) throw new AppError("invalid_input", 400) }

    const existingList = existingSkills.length > 0
      ? `The candidate already has these skills: ${existingSkills.join(", ")}. Do not repeat them.`
      : ""

    const prompt = `You are a professional career coach. Suggest relevant skills for a "${jobTitle}"${industry ? ` in the ${industry} industry` : ""}.
${existingList}

Return a JSON object with this exact structure:
{
  "skills": [
    { "name": "skill name", "level": "beginner|intermediate|advanced|expert" },
    ...
  ]
}

Rules:
- Return exactly 8-10 skills
- Mix technical and soft skills appropriate for the role
- Assign realistic levels for a typical professional in this role
- Only return the JSON object, no other text
- If the job title is not a real profession or is off-topic, return { "skills": [] }`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 400,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a career coach. Only suggest skills relevant to professional CV/resume contexts. If the input is off-topic or nonsensical, return { \"skills\": [] }. " + langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const content = response.choices[0]?.message?.content ?? "{}"
    const result = parseAIJson<{ skills?: { name: string; level: string }[] }>(content)

    if (!Array.isArray(result.skills) || result.skills.length === 0) {
      throw new AppError("off_topic", 422)
    }

    const validLevels = new Set(["beginner", "intermediate", "advanced", "expert"])
    const skills = result.skills
      .filter((s) => s.name && typeof s.name === "string")
      .map((s) => ({
        name: s.name.trim(),
        level: validLevels.has(s.level) ? s.level : "intermediate",
      }))

    logAIUsage(userId, "suggest-skills")
    recordRateLimitUsage(userId, "suggest-skills")
    return { skills }
  }
}
