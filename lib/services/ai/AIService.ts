// lib/services/ai/AIService.ts
import { z } from "zod"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL,
  AI_TEMPERATURE,
  AI_TEMPERATURE_CREATIVE,
  AI_TEMPERATURE_BALANCED,
  AI_TEMPERATURE_PRECISE,
  AI_TEMPERATURE_STRUCTURED,
  checkAndIncrementRateLimit,
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

export interface BulletResult {
  bullets: string[]
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

export interface TailorCVInput {
  sectionData: Record<string, unknown>
  jobDescription: string
  language?: string
}

export interface TailorCVResult {
  summaryVersion: string
  bulletSuggestions: Array<{ targetId: string; jobTitle: string; employer: string; improved: string }>
  missingSkills: string[]
  keywordsToAdd: string[]
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

  async improveBullet(userId: string, input: ImproveBulletInput): Promise<BulletResult> {
    const allowed = await checkAndIncrementRateLimit(userId, "improve-bullet")
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

    const prompt = language === "en"
      ? `TASK: Transform this work experience description into high-impact professional bullets for an executive resume.

${context ? `Position context: ${context}` : ""}

Original description:
${text}

TRANSFORMATION RULES:
1. CAR method per bullet: Action (strong verb) → Brief context (if applicable) → Measurable result.
2. Verb first, always. PROHIBITED: "Responsible for", "In charge of", "Assisted with", personal pronouns (I, my).
3. Impact order: highest business-impact bullet goes FIRST. Last bullet can be scope/reach.
4. Metrics: if not in the original, use PLACEHOLDERS: [X%], [N users], [$Z], [N months]. NEVER invent real figures.
5. Choose verbs based on role context:
   - Tech/Product: Architected, Developed, Automated, Migrated, Optimized, Deployed, Refactored, Scaled
   - Leadership/Management: Led, Mentored, Coordinated, Aligned, Consolidated, Transformed, Prioritized
   - Operations/Process: Reduced, Standardized, Implemented, Centralized, Increased, Structured
   - Sales/Business/Marketing: Grew, Closed, Negotiated, Expanded, Positioned, Captured, Generated
6. Quantity based on content richness:
   - Basic (1-2 generic responsibilities): 3-4 dense bullets
   - Medium (several responsibilities, some achievements): 4-6 bullets
   - Rich (concrete achievements, projects, metrics, leadership): 6-8 bullets
7. ATS: naturally incorporate 1-2 industry/role keywords within bullets.

Respond ONLY with valid JSON (no markdown):
{"bullets": ["• bullet1", "• bullet2", ...]}`
      : `TAREA: Transforma esta descripción de experiencia laboral en bullets profesionales de alto impacto, listos para un CV ejecutivo.

${context ? `Contexto del puesto: ${context}` : ""}

Descripción original:
${text}

REGLAS DE TRANSFORMACIÓN:
1. Método CAR por bullet: Acción (verbo fuerte) → Contexto breve (si aplica) → Resultado medible.
2. Verbo primero, siempre. PROHIBIDO: "Responsable de", "Encargado de", "Apoyé en", pronombres (yo, mi, mis).
3. Orden de impacto: el bullet con mayor impacto de negocio va PRIMERO. El último puede ser de alcance/scope.
4. Métricas: si no existen en el original, usa PLACEHOLDERS: [X%], [N usuarios], [$Z], [N meses]. NUNCA inventes cifras reales.
5. Elige verbos según el contexto del puesto:
   - Tech/Producto: Arquitecté, Desarrollé, Automaticé, Migré, Optimicé, Desplegué, Refactoricé, Escalé
   - Liderazgo/Gestión: Lideré, Mentoré, Coordiné, Alineé, Consolidé, Transformé, Prioricé
   - Operaciones/Procesos: Reduje, Estandaricé, Implementé, Centralicé, Incrementé, Estructuré
   - Ventas/Negocio/Marketing: Crecí, Cerré, Negocié, Expandí, Posicioné, Capturé, Generé
6. Cantidad según riqueza del contenido:
   - Básico (1-2 responsabilidades genéricas): 3-4 bullets densos
   - Medio (varias responsabilidades, algún logro): 4-6 bullets
   - Rico (logros concretos, proyectos, métricas, liderazgo): 6-8 bullets
7. ATS: incorpora 1-2 keywords del sector/puesto de forma natural dentro de los bullets.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"bullets": ["• bullet1", "• bullet2", ...]}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 600,
      temperature: AI_TEMPERATURE_CREATIVE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite con expertise en optimización de CVs ejecutivos para empresas Fortune 500 y startups de alto crecimiento. " +
            "Tu especialidad: transformar descripciones genéricas en bullets de alto impacto que superan filtros ATS y capturan la atención de recruiters en los primeros 6 segundos de lectura. " +
            "Usas el método CAR (Acción-Contexto-Resultado) y priorizas logros de negocio sobre responsabilidades. " +
            "SOLO procesas contenido de experiencia laboral profesional real. Si el contenido no es de experiencia laboral, responde: {\"bullets\": []}. " +
            "Cuando no hay métricas reales, usas SIEMPRE placeholders explícitos [X%], [N usuarios], [$Z] — NUNCA inventas cifras. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ bullets?: unknown }>(raw)

    if (!Array.isArray(parsed.bullets)) throw new AppError("invalid_response_format", 500)
    if (parsed.bullets.length === 0) {
      throw new AppError("off_topic", 422)
    }

    logAIUsage(userId, "improve-bullet")
    return { bullets: (parsed.bullets as string[]).slice(0, 10) }
  }

  // ── 2. generate-summary ──────────────────────────────────────────────────────

  async generateSummary(userId: string, input: GenerateSummaryInput): Promise<VersionsResult> {
    const allowed = await checkAndIncrementRateLimit(userId, "generate-summary")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { sectionData, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const resumeContext = buildResumeContext(sectionData ?? {}, language)
    if (!resumeContext.trim()) throw new AppError("not_enough_data", 400)

    const validation = validateAIInput(resumeContext, 5000)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    const prompt = language === "en"
      ? `TASK: Analyze this professional profile and generate 3 high-impact resume summaries, each with a different positioning.

=== CANDIDATE PROFILE ===
${resumeContext}

PHASE 1 — INTERNAL DIAGNOSIS (do not include in response, use to guide writing):
• Seniority level: detect from experience and responsibilities (Junior <2yr / Mid 2-5yr / Senior 5-10yr / Lead/Director 10yr+)
• Primary sector and industry
• 2-3 unique differentiators: what this candidate has that others in their role don't
• Most impactful achievement (with figure if exists, placeholder if not)
• Key ATS keywords for the sector to include naturally

PHASE 2 — GENERATE 3 VERSIONS (include in JSON response):

Version 1 — EXECUTIVE: Positions candidate as a senior expert. Emphasis on business impact, leadership and scale. Tone: authority, decisiveness, results. Exactly 3 sentences.

Version 2 — SPECIALIST: Emphasis on technical or functional expertise specific to the sector. Include key tools, methodologies or technologies if applicable. Tone: precise, competent, no filler. 2-3 sentences.

Version 3 — VALUE PROPOSITION: Focuses on what the candidate brings to their next team. Combines past achievement + differential skill + future value. Tone: dynamic, forward-looking, impact-oriented. 3 sentences.

ABSOLUTE RULES:
• Impact verbs: Led, Developed, Transformed, Scaled, Optimized, Implemented, Drove, Designed. NEVER: "Responsible for", "Passionate about", "Looking for new challenges", "Experienced in", "Team player".
• No personal pronouns (I, My, I am). Third person or impersonal form.
• If no metrics in profile: use [X years], [N projects], [X%], [N teams] as placeholders. NEVER invent real figures.
• Each version must feel written by the candidate — personal and authentic, not AI-generated.

Respond ONLY with valid JSON (no markdown, no explanations):
{"versions": ["version1", "version2", "version3"]}`
      : `TAREA: Analiza este perfil profesional y genera 3 resúmenes de CV de alto impacto, cada uno con posicionamiento diferente.

=== PERFIL DEL CANDIDATO ===
${resumeContext}

FASE 1 — DIAGNÓSTICO INTERNO (no incluir en respuesta, solo usar para informar la escritura):
• Nivel de seniority: detecta según años de experiencia y responsabilidades (Junior <2 años / Mid 2-5 / Senior 5-10 / Lead/Director 10+)
• Sector e industria principal del candidato
• 2-3 diferenciadores únicos: qué tiene este candidato que otros en su rol no tienen
• Logro más impactante del perfil (con cifra si existe, con placeholder si no)
• Keywords ATS clave del sector para incluir de forma natural

FASE 2 — GENERA 3 VERSIONES (incluir en respuesta JSON):

Versión 1 — EJECUTIVA: Posiciona al candidato como experto de alto nivel. Énfasis en impacto de negocio, liderazgo y escala. Tono: autoridad, decisión y resultados. Exactamente 3 oraciones.

Versión 2 — ESPECIALISTA: Énfasis en expertise técnico o funcional específico del sector. Si aplica: incluye herramientas, metodologías o tecnologías clave. Tono: preciso, competente, sin relleno. 2-3 oraciones.

Versión 3 — PROPUESTA DE VALOR: Enfoca en lo que el candidato aporta a su próximo equipo. Combina logro pasado + habilidad diferencial + valor futuro. Tono: dinámico, propositivo, orientado al impacto. 3 oraciones.

REGLAS ABSOLUTAS:
• Verbos de impacto: Lideró, Desarrolló, Transformó, Escaló, Optimizó, Implementó, Impulsó, Diseñó. NUNCA: "Responsable de", "Apasionado por", "Con experiencia en", "Busca", "Está interesado en".
• Sin pronombres personales (Yo, Mi, Soy). Tercera persona o forma impersonal.
• Si no hay métricas en el perfil: usa [X años], [N proyectos], [X%], [N equipos] como placeholders. NUNCA inventes cifras reales.
• Cada versión debe sonar escrita por el candidato — personal y auténtica, no genérica.

Responde ÚNICAMENTE con JSON válido (sin markdown, sin explicaciones):
{"versions": ["version1", "version2", "version3"]}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 600,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite especializado en escritura de resúmenes profesionales que consiguen entrevistas en empresas top. " +
            "Tu método: analizar el perfil completo del candidato, identificar su nivel real de seniority, extraer sus diferenciadores únicos y construir resúmenes que posicionan al candidato como la opción ideal para su sector. " +
            "Cada resumen debe sonar personal y auténtico — escrito por el candidato, no generado por IA. " +
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
    if (parsed.versions.length === 0) {
      throw new AppError("off_topic", 422)
    }

    logAIUsage(userId, "generate-summary")
    return { versions: (parsed.versions as string[]).slice(0, 3) }
  }

  // ── 3. improve-summary ───────────────────────────────────────────────────────

  async improveSummary(userId: string, input: ImproveSummaryInput): Promise<VersionsResult> {
    const allowed = await checkAndIncrementRateLimit(userId, "improve-summary")
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

    const resumeContext = sectionData ? buildResumeContext(sectionData, language) : ""

    const prompt = language === "en"
      ? hasSummary
        ? `TASK: Analyze the current summary and identify its weaknesses. Generate 3 improved versions, each with a different positioning.

${hasDescription ? `Candidate instruction: "${userDescription!.trim()}"` : ""}
${resumeContext ? `\nResume context:\n${resumeContext}` : ""}

Current summary to improve:
"${summary!.trim()}"

DIAGNOSIS (use internally to guide writing):
• Detect: clichés, weak phrases, passive voice, low-impact verbs
• Identify: hidden achievements that can be amplified with metrics or placeholders
• Extract: candidate's real differentiator in their sector

GENERATE 3 IMPROVED VERSIONS:

Version 1 — EXECUTIVE (exactly 3 sentences): Emphasis on business impact, leadership and quantifiable results. Direct tone, no filler. Positions as senior expert.

Version 2 — SPECIALIST (2-3 sentences): Emphasis on technical/functional expertise specific to the sector. Includes key tools, methodologies or technologies from the CV or original summary.

Version 3 — VALUE PROPOSITION (3 sentences): Combines most impactful past achievement + differential skill + value the candidate will bring to the next company. Dynamic and forward-looking tone.

ABSOLUTE RULES:
• Preserve real metrics from the original. If none: use [X years], [N projects], [X%], [$Z]. NEVER invent figures.
• PROHIBITED: "Responsible for", "Passionate about", "Looking for new challenges", "Experienced in", "Team player".
• No personal pronouns (I, My, I am). Third person or impersonal.
• Impact verbs: Led, Developed, Transformed, Scaled, Optimized, Implemented, Drove.

Respond ONLY with valid JSON (no markdown):
{"versions": ["version1", "version2", "version3"]}`
        : `TASK: Create a high-impact professional summary from scratch based on the candidate's description. Return 3 distinct versions.

Candidate description: "${userDescription!.trim()}"
${resumeContext ? `\nResume context:\n${resumeContext}` : ""}

GENERATE 3 VERSIONS:

Version 1 — EXECUTIVE (3 sentences): Positioning as a senior expert in their area. Emphasis on impact and leadership.

Version 2 — SPECIALIST (2-3 sentences): Emphasis on technical/functional stack or the most specific area of expertise the candidate mentions.

Version 3 — VALUE PROPOSITION (3 sentences): Focuses on what the candidate brings to their next team. Combines skills + vision of future value.

RULES:
• If the candidate didn't specify metrics: use [X years], [N projects], [X%] as placeholders. NEVER invent figures.
• No personal pronouns. No clichés. Impact verbs first.
• Each version must sound authentic — personal, not generic.

Respond ONLY with valid JSON (no markdown):
{"versions": ["version1", "version2", "version3"]}`
      : hasSummary
        ? `TAREA: Analiza el resumen actual e identifica sus debilidades. Genera 3 versiones mejoradas, cada una con posicionamiento diferente.

${hasDescription ? `Instrucción del candidato: "${userDescription!.trim()}"` : ""}
${resumeContext ? `\nContexto del CV:\n${resumeContext}` : ""}

Resumen actual a mejorar:
"${summary!.trim()}"

DIAGNÓSTICO (usa internamente para guiar las versiones):
• Detecta: clichés, frases débiles, voz pasiva, verbos sin impacto
• Identifica: logros ocultos que pueden amplificarse con métricas o placeholders
• Extrae: diferenciador real del candidato en su sector

GENERA 3 VERSIONES MEJORADAS:

Versión 1 — EJECUTIVA (3 oraciones exactas): Énfasis en impacto de negocio, liderazgo y resultados cuantificables. Tono directo, sin relleno. Posiciona como experto senior.

Versión 2 — ESPECIALISTA (2-3 oraciones): Énfasis en expertise técnico/funcional específico del sector. Incluye herramientas, metodologías o tecnologías clave mencionadas en el CV o resumen original.

Versión 3 — PROPUESTA DE VALOR (3 oraciones): Combina logro más impactante del pasado + habilidad diferencial + valor que aportará a la próxima empresa. Tono dinámico y propositivo.

REGLAS ABSOLUTAS:
• Conserva métricas reales del original. Si no hay: usa [X años], [N proyectos], [X%], [$Z]. NUNCA inventes cifras.
• PROHIBIDO: "Responsable de", "Apasionado por", "Busco nuevos retos", "Con experiencia en", "Equipo de trabajo".
• Sin pronombres personales (Yo, Mi, Soy). Tercera persona o impersonal.
• Verbos de impacto: Lideró, Desarrolló, Transformó, Escaló, Optimizó, Implementó, Impulsó.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"versions": ["version1", "version2", "version3"]}`
        : `TAREA: Crea un resumen profesional de alto impacto desde cero, basado en la descripción del candidato. Devuelve 3 versiones distintas.

Descripción del candidato: "${userDescription!.trim()}"
${resumeContext ? `\nContexto del CV:\n${resumeContext}` : ""}

GENERA 3 VERSIONES:

Versión 1 — EJECUTIVA (3 oraciones): Posicionamiento como experto senior en su área. Énfasis en impacto y liderazgo.

Versión 2 — ESPECIALISTA (2-3 oraciones): Énfasis en stack técnico/funcional o área de expertise más específica que menciona el candidato.

Versión 3 — PROPUESTA DE VALOR (3 oraciones): Enfoca en qué aporta el candidato a su próximo equipo. Combina habilidades + visión de valor futuro.

REGLAS:
• Si el candidato no especificó métricas: usa [X años], [N proyectos], [X%] como placeholders. NUNCA inventes cifras.
• Sin pronombres personales. Sin clichés. Verbos de impacto al inicio.
• Cada versión debe sonar auténtica — personal, no genérica.

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
    if (parsed.versions.length === 0) {
      throw new AppError("off_topic", 422)
    }

    logAIUsage(userId, "improve-summary")
    return { versions: (parsed.versions as string[]).slice(0, 3) }
  }

  // ── 4. ats-score ─────────────────────────────────────────────────────────────

  async atsScore(userId: string, input: ATSScoreInput): Promise<ATSScoreResult> {
    const allowed = await checkAndIncrementRateLimit(userId, "ats-score")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { jobDescription, sectionData, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const validation = validateAIInput(jobDescription, 6000)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    // Truncate to 6000 chars — covers 95%+ of real job descriptions without quality loss
    const jobDescriptionTruncated = jobDescription.slice(0, 6000)

    const resumeText = buildResumeContext(sectionData ?? {}, language)
    if (!resumeText.trim()) throw new AppError("not_enough_resume_data", 400)

    const prompt = language === "en"
      ? `Analyze the compatibility between this resume and the job description.

=== CANDIDATE RESUME ===
${resumeText}

=== JOB DESCRIPTION ===
${jobDescriptionTruncated}

Evaluate and return results in JSON with this exact format:
{
  "score": <number from 0 to 100>,
  "label": "<Excellent|Good|Fair|Low>",
  "summary": "<1-2 sentence summary of overall compatibility>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "missingKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],
  "suggestions": ["<concrete suggestion 1>", "<concrete suggestion 2>", "<concrete suggestion 3>"]
}

Evaluation rules:
- score 80-100 = Excellent, 60-79 = Good, 40-59 = Fair, 0-39 = Low
- strengths: specific resume strengths that match the job (not generic)
- gaps: specific mismatches between what the job requires and what the resume shows
- missingKeywords: job keywords NOT found in the resume — order from most to least critical (max 8)
- suggestions: EXACTLY 3 concrete actions. Each in this format:
  "[IMPERATIVE VERB] [what to do exactly] in [specific CV section]: [concrete example of how to do it]"
  Example: "ADD the keyword 'agile project management' to your Experience section at [most recent employer]: rewrite the team leadership bullet to mention Scrum/Kanban if you used them"
  Prioritize the 3 actions with the highest score impact.
- Respond ONLY with the JSON, no markdown, no explanations`
      : `Analiza la compatibilidad entre el CV y la descripción del puesto de trabajo.

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

Reglas de evaluación:
- score 80-100 = Excelente, 60-79 = Bueno, 40-59 = Regular, 0-39 = Bajo
- strengths: fortalezas concretas del CV que coinciden con el puesto (no genéricas)
- gaps: brechas específicas entre lo que pide el puesto y lo que muestra el CV
- missingKeywords: palabras clave del puesto que NO aparecen en el CV — ordena de más a menos crítica (máximo 8)
- suggestions: EXACTAMENTE 3 acciones concretas. Cada una con este formato:
  "[VERBO EN IMPERATIVO] [qué hacer exactamente] en [sección específica del CV]: [ejemplo o detalle concreto de cómo hacerlo]"
  Ejemplo: "AÑADE la keyword 'gestión de proyectos ágiles' en tu sección de Experiencia en [empresa más reciente]: reescribe el bullet de liderazgo de equipo para incluir Scrum/Kanban si lo usaste"
  Prioriza las 3 acciones de mayor impacto en el score.
- Responde ÚNICAMENTE con el JSON, sin markdown ni explicaciones`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 800,
      temperature: AI_TEMPERATURE_PRECISE,
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
    return parsed
  }

  // ── 5. generate-cover-letter ─────────────────────────────────────────────────

  async generateCoverLetter(userId: string, input: GenerateCoverLetterInput): Promise<CoverLetterResult> {
    const allowed = await checkAndIncrementRateLimit(userId, "generate-cover-letter")
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
    if (parsed.body.trim() === "") {
      throw new AppError("off_topic", 422)
    }

    const html = parsed.body
      .split(/\n\n+/)
      .map((p: string) => `<p>${p.split(/\n/).map(escapeHtml).join("<br>").trim()}</p>`)
      .join("")

    logAIUsage(userId, "generate-cover-letter")
    return { body: html }
  }

  // ── 6. improve-cover-letter ──────────────────────────────────────────────────

  async improveCoverLetter(userId: string, input: ImproveCoverLetterInput): Promise<VersionsResult> {
    const allowed = await checkAndIncrementRateLimit(userId, "improve-cover-letter")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { body, company, jobTitle, recipientTitle, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const validation = validateAIInput(body, 3000)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    if (company) { const v = validateAIInput(company, 500); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (jobTitle) { const v = validateAIInput(jobTitle, 500); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (recipientTitle) { const v = validateAIInput(recipientTitle, 500); if (!v.valid) throw new AppError("invalid_input", 400) }

    const context = language === "en"
      ? [
          company ? `Company: ${company}` : "",
          jobTitle ? `Role: ${jobTitle}` : "",
          recipientTitle ? `Recipient: ${recipientTitle}` : "",
        ].filter(Boolean).join(" | ")
      : [
          company ? `Empresa: ${company}` : "",
          jobTitle ? `Puesto: ${jobTitle}` : "",
          recipientTitle ? `Destinatario: ${recipientTitle}` : "",
        ].filter(Boolean).join(" | ")

    const prompt = language === "en"
      ? `TASK: Improve this cover letter body and generate 3 optimized versions.

${context ? `Context: ${context}` : ""}
Current letter:
${body}

GOLDEN RULES (apply all):
1. Keep the 3-4 paragraph structure: hook → relevant achievements → value proposition → closing CTA.
2. Eliminate clichés ("I am a proactive person", "I am passionate about teamwork"). Replace with concrete achievements.
3. Impact verbs: Led, Developed, Optimized, Implemented, Grew, Drove. NEVER use "Responsible for".
4. If the original has metrics, preserve them. If not, use explicit placeholders [X%], [N projects], [$Z]. NEVER invent real figures.
5. Each version must have a distinct tone:
   - Version 1: Formal and executive
   - Version 2: Balanced and direct
   - Version 3: Dynamic and impact-oriented
6. Maximum 4 paragraphs per version. Maximum 200 words per version. Dense in value, no filler.

Respond ONLY with valid JSON (no markdown, no explanations):
{"versions": ["version1", "version2", "version3"]}`
      : `TAREA: Mejora el siguiente cuerpo de carta de presentación y genera 3 versiones optimizadas.

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
6. Máximo 4 párrafos por versión. Cada versión máximo 200 palabras. Denso en valor, sin relleno.

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
    if (parsed.versions.length === 0) {
      throw new AppError("off_topic", 422)
    }

    logAIUsage(userId, "improve-cover-letter")
    return { versions: (parsed.versions as string[]).slice(0, 3) }
  }

  // ── 7. review-cv ─────────────────────────────────────────────────────────────

  async reviewCV(userId: string, input: ReviewCVInput): Promise<ReviewResult> {
    const allowed = await checkAndIncrementRateLimit(userId, "review-cv")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { sectionData, question, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const resumeContext = buildResumeContext(sectionData, language)
    if (!resumeContext.trim()) throw new AppError("not_enough_data", 400)

    if (question) {
      const validation = validateAIInput(String(question), 300)
      if (!validation.valid) throw new AppError("invalid_input", 400)
    }

    const userQuestion = language === "en"
      ? question?.trim()
        ? `Candidate's specific question: "${question.trim()}"`
        : "The candidate wants a general review of their resume."
      : question?.trim()
        ? `Pregunta específica del candidato: "${question.trim()}"`
        : "El candidato quiere una revisión general de su CV."

    const prompt = language === "en"
      ? `TASK: Analyze this resume and provide a detailed professional review.

=== CANDIDATE RESUME ===
${resumeContext}

=== REQUEST ===
${userQuestion}

INSTRUCTIONS:
1. Analyze the full resume: clarity, impact, structure, ATS keywords, coherence, completeness.
2. Answer the question directly if it is specific.
3. Be concrete — mention real sections or data from the resume.
4. Tone: professional consultant, direct and constructive.

For each strength and improvement item, evaluate if there is a concrete fix the AI can generate. If so, include the "suggestion" field with:
- field: ONE of these exact values: "summary" | "personalDetails.jobTitle" | "skills" | "workExperience.description" | "workExperience.jobTitle" | "languages" | "certifications"
- type: "replace" (replace current content) or "append" (add to current content)
- preview: the final suggested text, NO markdown, NO asterisks, NO HTML. Max 500 characters.
- reason: max 12 words explaining the change
- targetId: only if the improvement applies to a specific array item (use the item id from the resume)

Do NOT include suggestion if:
- The improvement requires data the AI doesn't have (dates, company names, real metrics)
- The improvement is general advice ("get references", "gain more experience")
- The field is not in the allowed list
- You are not sure of the final value

Respond ONLY with valid JSON (no markdown):
{
  "summary": "<general diagnosis in 2-3 sentences>",
  "strengths": [
    { "text": "<strength>", "suggestion": { "field": "...", "type": "replace", "preview": "...", "reason": "..." } }
  ],
  "improvements": [
    { "text": "<improvement>", "suggestion": { "field": "...", "type": "replace", "preview": "...", "reason": "..." } },
    { "text": "<improvement without automatable action>" }
  ],
  "answer": "<direct answer to candidate's question, or empty string if general review>"
}`
      : `TAREA: Analiza el siguiente CV y proporciona una revisión profesional detallada.

=== CV DEL CANDIDATO ===
${resumeContext}

=== SOLICITUD ===
${userQuestion}

INSTRUCCIONES:
1. Analiza el CV completo: claridad, impacto, estructura, keywords ATS, coherencia, completitud.
2. Responde directamente a la pregunta si es específica.
3. Sé concreto — menciona secciones o datos reales del CV.
4. Tono: consultor profesional, directo y constructivo.

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

    if (parsed.answer === "off_topic") {
      throw new AppError("off_topic", 422)
    }

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
    return {
      summary: validated.data.summary,
      strengths: validated.data.strengths.map(sanitizeItem),
      improvements: validated.data.improvements.map(sanitizeItem),
      answer: validated.data.answer,
    }
  }

  // ── 8. fill-profile ──────────────────────────────────────────────────────────

  async fillProfile(userId: string, input: FillProfileInput): Promise<FillProfileResult> {
    const allowed = await checkAndIncrementRateLimit(userId, "fill-profile")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { prompt, sectionData, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const validation = validateAIInput(prompt, 500)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    const sd = sectionData ?? {}
    const resumeContext = buildResumeContext(sd, language)

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

    const workExpCtx = buildSectionContext(language === "en" ? "WORK EXPERIENCE" : "EXPERIENCIA LABORAL", (sd.workExperience ?? []) as Parameters<typeof buildSectionContext>[1])
    const educationCtx = buildSectionContext(language === "en" ? "EDUCATION" : "EDUCACIÓN", (sd.education ?? []) as Parameters<typeof buildSectionContext>[1])
    const projectsCtx = buildSectionContext(language === "en" ? "PROJECTS" : "PROYECTOS", (sd.projects ?? []) as Parameters<typeof buildSectionContext>[1])
    const volunteerCtx = buildSectionContext(language === "en" ? "VOLUNTEER" : "VOLUNTARIADO", (sd.volunteer ?? []) as Parameters<typeof buildSectionContext>[1])

    const sectionsWithIds = [workExpCtx, educationCtx, projectsCtx, volunteerCtx].filter(Boolean).join("\n")

    const userPrompt = language === "en"
      ? `The candidate wants to improve their resume with this instruction:
"${prompt.trim()}"

=== CURRENT RESUME ===
${resumeContext}
${sectionsWithIds}

${existingSkills ? `Current skills (DO NOT repeat): ${existingSkills}` : ""}
${existingLanguages ? `Current languages (DO NOT repeat): ${existingLanguages}` : ""}
${(sd as { hobbies?: string }).hobbies ? `Current interests: ${(sd as { hobbies?: string }).hobbies}` : ""}

TASK: Analyze the instruction and determine which resume sections need improvement. Apply changes where appropriate:

- If mentions a company or role that already exists in the resume → improve that entry's description using its exact id in workExperienceUpdates
- If mentions a company or role NOT in the current resume → create it in workExperienceNew with jobTitle, employer, city, startDate, endDate, currentlyWorking and description (• bullet points, no markdown). Max 3 new entries.
- If talks about their general profile → improve the summary and/or jobTitle
- If mentions skills → add to suggestedSkills (ONLY real technical or soft skills: frameworks, languages, tools, methodologies; NEVER company names, employers, job titles, cities or locations)
- If mentions languages → add to suggestedLanguages with appropriate level
- If mentions education → improve that education entry's description
- If mentions projects → improve that project's description
- If mentions volunteer work → improve that entry's description
- If mentions interests or hobbies → update the hobbies field
- Can apply to multiple sections simultaneously

Respond ONLY with valid JSON (no markdown). Only include fields that actually change, omit the rest:
{
  "summary": "<improved summary or null>",
  "jobTitle": "<updated title or null>",
  "hobbies": "<updated interests or null>",
  "suggestedSkills": ["<new skill>"],
  "suggestedLanguages": [{ "name": "<language>", "level": "elementary|limited|professional|full_professional|native" }],
  "workExperienceUpdates": [{ "id": "<exact id>", "description": "<improved description with • bullets, no markdown>" }],
  "workExperienceNew": [{ "jobTitle": "<role>", "employer": "<company>", "city": "<optional city>", "startDate": "<MM/YYYY optional>", "endDate": "<MM/YYYY optional>", "currentlyWorking": false, "description": "<• bullets>" }],
  "educationUpdates": [{ "id": "<exact id>", "description": "<improved description>" }],
  "projectUpdates": [{ "id": "<exact id>", "description": "<improved description with • bullets>" }],
  "volunteerUpdates": [{ "id": "<exact id>", "description": "<improved description>" }]
}

Rules:
- ALWAYS use the exact ids from the section listing above. Never invent an id.
- Improved descriptions integrate what the candidate said + what already existed, cohesively and professionally.
- Do not invent data (dates, companies, metrics) the candidate didn't mention. Use [X] as placeholder if the candidate wants metrics.`
      : `El candidato quiere mejorar su CV con esta instrucción:
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
- No inventes datos (fechas, empresas, métricas) que el candidato no mencionó. Usa [X] como placeholder si el candidato quiere métricas.`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 700,
      temperature: AI_TEMPERATURE_STRUCTURED,
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

    if (!hasContent) {
      throw new AppError("off_topic", 422)
    }

    const validated = FillProfileResponseSchema.safeParse(parsed)
    const data = validated.success ? validated.data : parsed

    const validWorkIds = new Set(((sd.workExperience ?? []) as { id: string }[]).map((j) => j.id))
    const validEduIds = new Set(((sd.education ?? []) as { id: string }[]).map((e) => e.id))
    const validProjIds = new Set(((sd.projects ?? []) as { id: string }[]).map((p) => p.id))
    const validVolIds = new Set(((sd.volunteer ?? []) as { id: string }[]).map((v) => v.id))

    logAIUsage(userId, "fill-profile")
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
    const allowed = await checkAndIncrementRateLimit(userId, "suggest-skills")
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

    const prompt = `Suggest the most relevant and high-value skills for a "${jobTitle}"${industry ? ` in the ${industry} industry` : ""} to include in a professional CV/resume.
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
- ORDER by relevance: most critical/in-demand skill for this specific role FIRST
- Use SPECIFIC, precise skill names (not generic): prefer "React.js" over "React", "Python (Data Analysis)" over "Python", "Google Analytics 4" over "Analytics", "Scrum / Agile" over "Agile"
- Distribution: 60% hard/technical skills specific to the role, 40% soft/cross-functional skills
- Hard skills first in the list, soft skills at the end
- Assign realistic levels for a mid-level professional in this role (avoid all "expert" — be honest)
- Only return the JSON object, no other text
- If the job title is not a real profession or is off-topic, return { "skills": [] }`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 400,
      temperature: AI_TEMPERATURE_PRECISE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a senior career strategist and talent acquisition expert who knows exactly which skills recruiters search for in each role and industry. You suggest specific, high-value skills that differentiate candidates and pass ATS filters — never generic filler. Only suggest skills relevant to professional CV/resume contexts. If the input is off-topic or nonsensical, return { \"skills\": [] }. " + langInstruction,
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
    return { skills }
  }

  async tailorCV(userId: string, input: TailorCVInput): Promise<TailorCVResult> {
    const allowed = await checkAndIncrementRateLimit(userId, "tailor-cv")
    if (!allowed) throw new AppError("rate_limit_exceeded", 429)

    const { sectionData, jobDescription, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const jdValidation = validateAIInput(jobDescription, 6000)
    if (!jdValidation.valid) throw new AppError(jdValidation.error ?? "invalid_input", 400)

    const resumeContext = buildResumeContext(sectionData, language)
    const work = (sectionData.workExperience ?? []) as { id?: string; jobTitle?: string; employer?: string; description?: string }[]
    const workList = work.slice(0, 4).map((j) =>
      `ID:${j.id ?? "?"} | ${j.jobTitle ?? ""} at ${j.employer ?? ""}: ${(j.description ?? "").slice(0, 300)}`
    ).join("\n")

    const prompt = language === "en"
      ? `You are an expert resume strategist. Tailor the candidate's CV to this specific job description.

JOB DESCRIPTION:
${jobDescription.slice(0, 4000)}

CANDIDATE CV:
${resumeContext}

WORK EXPERIENCE DETAILS:
${workList}

Return a JSON object with this structure:
{
  "summaryVersion": "rewritten professional summary (3-4 sentences, 80-120 words) aligned to this job",
  "bulletSuggestions": [
    { "targetId": "work experience ID from the list", "jobTitle": "job title", "employer": "employer", "improved": "rewritten bullet(s) using CAR method, highlighting what this job description values" }
  ],
  "missingSkills": ["skill1", "skill2"],
  "keywordsToAdd": ["keyword1", "keyword2"]
}

Rules:
- summaryVersion: mirror the job's language and keywords naturally; no exaggeration
- bulletSuggestions: only for work experiences where improvement would meaningfully help; max 3
- missingSkills: skills required by the job that the candidate doesn't have (max 5)
- keywordsToAdd: ATS keywords from the job not present in the CV (max 8)
- Be specific and actionable; no generic advice
- Only return the JSON object`
      : `Eres un estratega experto en currículos. Adapta el CV del candidato a esta oferta de trabajo específica.

OFERTA DE TRABAJO:
${jobDescription.slice(0, 4000)}

CV DEL CANDIDATO:
${resumeContext}

DETALLES DE EXPERIENCIA LABORAL:
${workList}

Devuelve un objeto JSON con esta estructura:
{
  "summaryVersion": "resumen profesional reescrito (3-4 oraciones, 80-120 palabras) alineado a esta oferta",
  "bulletSuggestions": [
    { "targetId": "ID de la experiencia laboral", "jobTitle": "puesto", "employer": "empresa", "improved": "bullet(s) reescritos con método CAR, destacando lo que valora esta oferta" }
  ],
  "missingSkills": ["habilidad1", "habilidad2"],
  "keywordsToAdd": ["keyword1", "keyword2"]
}

Reglas:
- summaryVersion: refleja el lenguaje y palabras clave de la oferta de forma natural; sin exageraciones
- bulletSuggestions: solo para experiencias donde la mejora aporte valor real; máximo 3
- missingSkills: habilidades requeridas por la oferta que el candidato no tiene (máximo 5)
- keywordsToAdd: keywords ATS de la oferta no presentes en el CV (máximo 8)
- Sé específico y accionable; nada genérico
- Solo devuelve el objeto JSON`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 1200,
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an elite career coach and ATS optimization specialist. You tailor resumes to specific job postings with surgical precision, identifying keyword gaps, aligning professional summaries, and rewriting experience bullets to maximize recruiter and ATS impact. You only work on real job postings — if the input is off-topic or nonsensical, return { "summaryVersion": "", "bulletSuggestions": [], "missingSkills": [], "keywordsToAdd": [] }. ${langInstruction}`,
        },
        { role: "user", content: prompt },
      ],
    })

    const content = response.choices[0]?.message?.content ?? "{}"
    const raw = parseAIJson<TailorCVResult>(content)

    if (!raw.summaryVersion && !raw.bulletSuggestions?.length && !raw.missingSkills?.length) {
      throw new AppError("off_topic", 422)
    }

    logAIUsage(userId, "tailor-cv")
    return {
      summaryVersion: raw.summaryVersion ?? "",
      bulletSuggestions: (raw.bulletSuggestions ?? []).slice(0, 3),
      missingSkills: (raw.missingSkills ?? []).slice(0, 5),
      keywordsToAdd: (raw.keywordsToAdd ?? []).slice(0, 8),
    }
  }
}
