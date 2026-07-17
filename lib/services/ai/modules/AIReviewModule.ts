// lib/services/ai/modules/AIReviewModule.ts
import { z } from "zod"
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL,
  AI_TEMPERATURE_PRECISE,
  AI_TEMPERATURE_STRUCTURED,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, resolveLanguage, detectHallucination } from "../shared/ai-helpers"
import { parseBullets } from "../shared/bullets"
import { computeCostUsd } from "../shared/cost-tracker"
import {
  AI_INPUT_LIMITS,
  ATSExtractionSchema,
  ReviewItemSchema,
  ReviewResponseSchema,
  type ATSScoreInput,
  type ATSScoreResult,
  type ReviewCVInput,
  type ReviewResult,
} from "../shared/ai-types"
import { computeATSMatch, scoreLabel, type SectionPresence } from "../shared/ats-matcher"

export class AIReviewModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async atsScore(userId: string, input: ATSScoreInput, plan: string): Promise<ATSScoreResult> {
    await enforceAIQuota(userId, "ats-score", plan)

    const { jobDescription, sectionData, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)
    const en = language === "en"

    const validation = validateAIInput(jobDescription, AI_INPUT_LIMITS.jobDescription)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    // Truncate to 6000 chars — covers 95%+ of real job descriptions without quality loss
    const jobDescriptionTruncated = jobDescription.slice(0, AI_INPUT_LIMITS.jobDescription)

    const data = sectionData ?? {}
    const resumeText = buildResumeContext(data, language)
    if (!resumeText.trim()) throw new AppError("not_enough_resume_data", 400)
    const resumeTextValidation = validateAIInput(resumeText, AI_INPUT_LIMITS.resumeText)
    if (!resumeTextValidation.valid) throw new AppError("invalid_input", 400)

    // ── LLM call #1: EXTRACT requirements from the JD (no scoring). The score is
    // computed deterministically in code below so it is reproducible and the
    // "missing keywords" are verified against the actual CV text. The model only
    // extracts keyword lists + writes a short summary and actionable suggestions.
    const prompt = en
      ? `Extract the hiring requirements from this job description. Do NOT score or rate anything — only extract and advise.

=== JOB DESCRIPTION ===
${jobDescriptionTruncated}

=== CANDIDATE RESUME (context for suggestions only) ===
${resumeText}

Return JSON with this exact shape:
{
  "hardSkills": ["<technical skill / tool / technology the job requires>", ...],
  "softSkills": ["<soft skill the job requires>", ...],
  "jobTitle": "<the role title from the job description>",
  "mustHaves": ["<hard requirement: years of experience, degree, certification, license>", ...],
  "summary": "<1-2 sentence qualitative summary of how the resume fits — do NOT state a numeric score>",
  "suggestions": ["<concrete action to improve fit>", "<action 2>", "<action 3>"]
}

Rules:
- hardSkills/softSkills/mustHaves: write each item exactly as it would appear on a resume (canonical form, e.g. "JavaScript", "Project Management"). Max ~12 hard skills.
- Extract ONLY what the job description actually asks for. Do not invent requirements.
- suggestions: EXACTLY 3, imperative, each naming the CV section to change. Example: "ADD 'Kubernetes' to your Skills section if you have used it".
- If the text is NOT a real job description, return: {"jobTitle":"","hardSkills":[],"softSkills":[],"mustHaves":[],"summary":"","suggestions":[],"label":"off_topic"}
- Respond ONLY with the JSON, no markdown.`
      : `Extrae los requisitos de contratación de esta descripción de puesto. NO puntúes ni califiques nada — solo extrae y aconseja.

=== DESCRIPCIÓN DEL PUESTO ===
${jobDescriptionTruncated}

=== CV DEL CANDIDATO (contexto solo para sugerencias) ===
${resumeText}

Devuelve JSON con esta forma exacta:
{
  "hardSkills": ["<habilidad técnica / herramienta / tecnología que pide el puesto>", ...],
  "softSkills": ["<habilidad blanda que pide el puesto>", ...],
  "jobTitle": "<el título del puesto según la descripción>",
  "mustHaves": ["<requisito duro: años de experiencia, título, certificación, licencia>", ...],
  "summary": "<resumen cualitativo de 1-2 oraciones sobre el encaje del CV — NO indiques un número de score>",
  "suggestions": ["<acción concreta para mejorar el encaje>", "<acción 2>", "<acción 3>"]
}

Reglas:
- hardSkills/softSkills/mustHaves: escribe cada ítem tal como aparecería en un CV (forma canónica, ej. "JavaScript", "Gestión de Proyectos"). Máx ~12 hard skills.
- Extrae SOLO lo que la descripción realmente pide. No inventes requisitos.
- suggestions: EXACTAMENTE 3, en imperativo, cada una nombrando la sección del CV a cambiar. Ejemplo: "AÑADE 'Kubernetes' a tu sección de Habilidades si lo has usado".
- Si el texto NO es una descripción de puesto real, devuelve: {"jobTitle":"","hardSkills":[],"softSkills":[],"mustHaves":[],"summary":"","suggestions":[],"label":"off_topic"}
- Responde ÚNICAMENTE con el JSON, sin markdown.`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 700,
      temperature: AI_TEMPERATURE_PRECISE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un extractor experto de requisitos de vacantes para análisis de compatibilidad ATS. " +
            "Solo procesas descripciones de puestos de trabajo reales. NUNCA asignas un puntaje numérico — solo extraes keywords y das consejos. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const atsUsage = response.usage
    logAIUsage(userId, "ats-score", {
      model: AI_MODEL,
      plan,
      promptTokens: atsUsage?.prompt_tokens ?? 0,
      completionTokens: atsUsage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, atsUsage?.prompt_tokens ?? 0, atsUsage?.completion_tokens ?? 0),
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsedRaw = parseAIJson<unknown>(raw)
    const parsed = ATSExtractionSchema.safeParse(parsedRaw)
    if (!parsed.success) throw new AppError("invalid_response_format", 500)
    const extraction = parsed.data

    // Off-topic guard: explicit label, or the model extracted nothing usable.
    const nothingExtracted =
      extraction.hardSkills.length === 0 &&
      extraction.softSkills.length === 0 &&
      extraction.mustHaves.length === 0 &&
      !extraction.jobTitle.trim()
    if (extraction.label === "off_topic" || nothingExtracted) {
      throw new AppError("off_topic", 422)
    }

    // ── Deterministic scoring in code ──────────────────────────────────────────
    const cvTitles = buildCVTitles(data)
    const sections = buildSectionPresence(data)
    const evidenceText = buildEvidenceText(data)
    const match = computeATSMatch(
      {
        hardSkills: extraction.hardSkills,
        softSkills: extraction.softSkills,
        jobTitle: extraction.jobTitle,
        mustHaves: extraction.mustHaves,
      },
      resumeText,
      cvTitles,
      sections,
      evidenceText,
    )

    const label = localizedLabel(scoreLabel(match.score), en)
    const summary = extraction.summary.trim() || defaultSummary(match.score, en)

    return {
      score: match.score,
      label,
      summary,
      // Strengths / gaps are derived from the deterministic match so they can
      // never contradict the score. A strength is a skill the CV DEMONSTRATES:
      // one that only appears in a list is a claim, and listing it does not make
      // it a strength — that is what let a bare keyword dump look strong.
      strengths: match.demonstratedKeywords,
      gaps: match.missingMustHaves,
      matchedKeywords: match.matchedKeywords,
      missingKeywords: match.missingKeywords,
      listedOnlyKeywords: match.listedOnlyKeywords,
      suggestions: extraction.suggestions,
      subScores: match.subScores,
    }
  }

  async reviewCV(userId: string, input: ReviewCVInput, plan: string): Promise<ReviewResult> {
    await enforceAIQuota(userId, "review-cv", plan)

    const { sectionData, question, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const resumeContext = buildResumeContext(sectionData, language)
    if (!resumeContext.trim()) throw new AppError("not_enough_data", 400)
    const resumeCtxValidation = validateAIInput(resumeContext, AI_INPUT_LIMITS.resumeContext)
    if (!resumeCtxValidation.valid) throw new AppError("invalid_input", 400)

    if (question) {
      const validation = validateAIInput(String(question), AI_INPUT_LIMITS.question)
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

For IMPROVEMENTS only: evaluate if there is a concrete fix the AI can generate. If so, include the "suggestion" field with:
- field: ONE of these exact values: "summary" | "personalDetails.jobTitle" | "skills" | "workExperience.description" | "workExperience.jobTitle" | "languages" | "certifications"
- type: "replace" (replace current content) or "append" (add to current content)
- preview: the IMPROVED, ENRICHED text — more specific, more impactful than the original. NEVER shorten or genericize existing content. NO markdown, NO asterisks, NO HTML. Max 1200 characters. It must read as human-written: natural voice (not a press release), and none of the AI-tell words ("Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy").
- reason: max 12 words explaining the change
- targetId: REQUIRED whenever field starts with "workExperience." — use the item's exact id (shown as ID:xxx in the resume above). Without it the suggestion is discarded, because we would not know which job to apply it to.

preview FORMAT FOR "workExperience.description" (critical):
The description is a LIST OF BULLETS, one per line. Your preview MUST stay a list of bullets:
- One bullet per line, separated by real newlines (\\n). NEVER merge the bullets into a paragraph.
- Return the SAME number of bullets the original has, in the same order. If the original has 4 bullets, your preview has 4 lines.
- Prefix each line with "• ".
- FORBIDDEN to drop a metric, figure, technology or concrete detail already in the original. Rewriting is NOT summarizing: if the original says "cut crashes by 20%", your version still says 20%.

For STRENGTHS: do NOT include suggestion. Strengths confirm what is already working well — never suggest replacing or rewriting them.

CRITICAL RULES FOR SUGGESTIONS (mandatory, no exceptions):
1. ONLY include "suggestion" if you can rewrite using ONLY information already present in the resume context above. Otherwise OMIT the "suggestion" field entirely.
2. DO NOT invent: technologies, frameworks, libraries, tools, company names, job titles, certifications, percentages, numbers, dates, or any metric not explicitly stated in the input.
3. DO NOT add bullets with new content. Only rewrite existing text to be clearer or more impactful.
4. If the improvement requires data the user did not provide, OMIT "suggestion" and use ONLY "text" to describe what the user should add manually (e.g., "Add measurable metrics to your achievements" — NOT "Achieved 80% reduction in load time").
5. NEVER use placeholders like [X%], [N users], <number>, or similar in the preview field. The preview must be production-ready text.
6. If in doubt, OMIT "suggestion". A descriptive "text"-only advice is always preferable to an invented preview.

Respond ONLY with valid JSON (no markdown):
{
  "summary": "<general diagnosis in 2-3 sentences>",
  "strengths": [
    { "text": "<strength — no suggestion>" }
  ],
  "improvements": [
    { "text": "<improvement>", "suggestion": { "field": "workExperience.description", "type": "replace", "preview": "• <rewritten bullet 1>\\n• <rewritten bullet 2>", "reason": "<max 12 words>", "targetId": "<the job's ID:xxx>" } },
    { "text": "<improvement>", "suggestion": { "field": "summary", "type": "replace", "preview": "<enriched text>", "reason": "<max 12 words>" } },
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

Solo para IMPROVEMENTS: evalúa si hay una corrección o mejora concreta que la IA pueda generar. Si la hay, incluye el campo "suggestion" con:
- field: UNO de estos valores exactos: "summary" | "personalDetails.jobTitle" | "skills" | "workExperience.description" | "workExperience.jobTitle" | "languages" | "certifications"
- type: "replace" (reemplazar el contenido actual) o "append" (agregar al contenido actual)
- preview: el texto MEJORADO y ENRIQUECIDO — más específico, más impactante que el original. NUNCA acortes ni hagas más genérico el contenido existente. SIN markdown, SIN asteriscos, SIN HTML. Máximo 1200 caracteres. Debe sonar escrito por una persona: voz natural (no nota de prensa), sin palabras-IA ("Orquestó", "Apalancó", "Utilizó", "sinergia").
- reason: máximo 12 palabras explicando el cambio
- targetId: OBLIGATORIO cuando field empieza por "workExperience." — usa el id exacto del item (lo ves como ID:xxx en el CV de arriba). Sin él la sugerencia se descarta, porque no sabríamos a qué trabajo aplicarla.

FORMATO DE preview PARA "workExperience.description" (crítico):
La descripción es una LISTA DE BULLETS, un bullet por línea. Tu preview DEBE seguir siendo una lista de bullets:
- Un bullet por línea, separados por saltos de línea reales (\\n). NUNCA fusiones los bullets en un párrafo.
- Devuelve el MISMO número de bullets que tiene el original, en el mismo orden. Si el original tiene 4 bullets, tu preview tiene 4 líneas.
- Prefija cada línea con "• ".
- PROHIBIDO eliminar una métrica, cifra, tecnología o dato concreto que ya esté en el original. Reescribir NO es resumir: si el original dice "reduje los crashes un 20%", tu versión sigue diciendo el 20%.

Para STRENGTHS: NO incluyas suggestion. Las fortalezas confirman lo que ya funciona bien — nunca sugieras reemplazar ni reescribir el contenido existente.

REGLAS CRÍTICAS PARA SUGGESTIONS (obligatorias, sin excepciones):
1. SOLO incluye "suggestion" si puedes reescribir usando ÚNICAMENTE información ya presente en el contexto del CV de arriba. Si no, OMITE el campo "suggestion" por completo.
2. NO inventes: tecnologías, frameworks, librerías, herramientas, nombres de empresas, cargos, certificaciones, porcentajes, números, fechas, ni ninguna métrica que no esté explícitamente declarada en el input.
3. NO añadas bullets con contenido nuevo. Solo reescribe texto existente para que sea más claro o impactante.
4. Si la mejora requiere datos que el usuario no proporcionó, OMITE "suggestion" y usa SOLO "text" para describir qué debe añadir manualmente (ej.: "Añade métricas medibles a tus logros" — NO "Logré reducir el tiempo de carga en un 80%").
5. NUNCA uses placeholders como [X%], [N usuarios], <número>, ni similares en el campo preview. El preview debe ser texto listo para producción.
6. Ante la duda, OMITE "suggestion". Un consejo descriptivo en "text" sin preview es siempre preferible a un preview inventado.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{
  "summary": "<diagnóstico general en 2-3 oraciones>",
  "strengths": [
    { "text": "<fortaleza — sin suggestion>" }
  ],
  "improvements": [
    { "text": "<mejora>", "suggestion": { "field": "workExperience.description", "type": "replace", "preview": "• <bullet 1 reescrito>\\n• <bullet 2 reescrito>", "reason": "<max 12 palabras>", "targetId": "<el ID:xxx del trabajo>" } },
    { "text": "<mejora>", "suggestion": { "field": "summary", "type": "replace", "preview": "<texto enriquecido>", "reason": "<max 12 palabras>" } },
    { "text": "<mejora sin acción automatizable>" }
  ],
  "answer": "<respuesta directa a la pregunta del candidato, o cadena vacía si fue revisión general>"
}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 900,
      // review-cv usa temperatura baja (0.3) para reducir alucinaciones en suggestions.preview.
      // No afecta a otros endpoints — cada módulo elige la suya.
      temperature: AI_TEMPERATURE_STRUCTURED,
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

    // Strips markdown emphasis but NOT "•" or newlines: those carry the bullet
    // structure, and flattening them is how a multi-bullet description used to
    // come back as one paragraph.
    const sanitizePreview = (text: string) =>
      text.replace(/[_`#>]/g, "").replace(/^\s*\*\s+/gm, "• ").replace(/\n{3,}/g, "\n\n").trim()

    const sanitizeItem = (item: z.infer<typeof ReviewItemSchema>) => {
      if (!item.suggestion) return { ...item, suggestion: undefined }
      const cleanedPreview = sanitizePreview(item.suggestion.preview)
      const { field, targetId } = item.suggestion

      // A workExperience suggestion with no targetId cannot be placed. The client
      // used to fall back to item [0], silently overwriting whichever job happened
      // to be first — so drop it and keep the advisory text instead.
      if (field.startsWith("workExperience.") && !targetId) {
        this.logger.warn("[AIService.reviewCV] dropped suggestion with no targetId", { field })
        return { ...item, suggestion: undefined }
      }

      // Fail-safe: if preview seems to have invented data not present in the
      // resume context, drop the suggestion and keep only the advisory text.
      if (detectHallucination(cleanedPreview, resumeContext)) {
        this.logger.warn("[AIService.reviewCV] dropped hallucinated suggestion", {
          field,
          previewSample: cleanedPreview.slice(0, 120),
        })
        return { ...item, suggestion: undefined }
      }

      // Rewriting is not summarizing: a description preview that comes back with
      // fewer bullets than the original is destroying the user's content.
      if (field === "workExperience.description" && targetId) {
        const job = (sectionData.workExperience as { id?: string; description?: string }[] | undefined)
          ?.find((j) => j.id === targetId)
        if (job) {
          const before = parseBullets(job.description ?? "").length
          const after = parseBullets(cleanedPreview).length
          if (before > 1 && after < before) {
            this.logger.warn("[AIService.reviewCV] dropped suggestion that collapses bullets", {
              targetId, before, after,
            })
            return { ...item, suggestion: undefined }
          }
        }
      }

      return {
        ...item,
        suggestion: { ...item.suggestion, preview: cleanedPreview },
      }
    }

    const reviewUsage = response.usage
    const reviewLogOpts = {
      model: AI_MODEL,
      plan,
      promptTokens: reviewUsage?.prompt_tokens ?? 0,
      completionTokens: reviewUsage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, reviewUsage?.prompt_tokens ?? 0, reviewUsage?.completion_tokens ?? 0),
    }

    const validated = ReviewResponseSchema.safeParse(parsed)
    if (!validated.success) {
      this.logger.warn("[AIService.reviewCV] Zod validation failed, returning without suggestions", { error: validated.error.flatten() })
      logAIUsage(userId, "review-cv", reviewLogOpts)
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

    logAIUsage(userId, "review-cv", reviewLogOpts)
    return {
      summary: validated.data.summary,
      strengths: validated.data.strengths.map(sanitizeItem),
      improvements: validated.data.improvements.map(sanitizeItem),
      answer: validated.data.answer,
    }
  }
}

// ── ats-score helpers (module-level, pure) ────────────────────────────────────

/** Target role + past job titles, joined — feeds the title-match sub-score. */
/**
 * The work-experience text alone — job titles, employers and bullets. This is
 * the evidence half of the CV: a keyword here is demonstrated, the same keyword
 * only in the Skills list is a claim.
 */
function buildEvidenceText(data: Record<string, unknown>): string {
  const work = (data.workExperience as Array<{
    jobTitle?: string; employer?: string; description?: string
  }> | undefined) ?? []
  return work
    .map((w) => [w?.jobTitle, w?.employer, w?.description].filter(Boolean).join(" "))
    .join("\n")
}

function buildCVTitles(data: Record<string, unknown>): string {
  const pd = data.personalDetails as { jobTitle?: string } | undefined
  const work = (data.workExperience as Array<{ jobTitle?: string }> | undefined) ?? []
  return [pd?.jobTitle, ...work.map((w) => w?.jobTitle)].filter(Boolean).join(" ")
}

function buildSectionPresence(data: Record<string, unknown>): SectionPresence {
  const nonEmptyArray = (v: unknown) => Array.isArray(v) && v.length > 0
  return {
    summary: typeof data.summary === "string" && data.summary.trim().length > 0,
    work: nonEmptyArray(data.workExperience),
    skills: nonEmptyArray(data.skills),
    education: nonEmptyArray(data.education),
  }
}

function localizedLabel(bucket: "excellent" | "good" | "fair" | "low", en: boolean): string {
  const map = {
    excellent: en ? "Excellent" : "Excelente",
    good: en ? "Good" : "Bueno",
    fair: en ? "Fair" : "Regular",
    low: en ? "Low" : "Bajo",
  }
  return map[bucket]
}

function defaultSummary(score: number, en: boolean): string {
  if (score >= 80) return en ? "Strong match with the role's requirements." : "Fuerte coincidencia con los requisitos del puesto."
  if (score >= 60) return en ? "Good match — a few targeted additions will strengthen it." : "Buena coincidencia — algunos ajustes puntuales la reforzarán."
  if (score >= 40) return en ? "Partial match — several key requirements are missing." : "Coincidencia parcial — faltan varios requisitos clave."
  return en ? "Low match — the resume is missing most of the role's requirements." : "Baja coincidencia — al CV le faltan la mayoría de los requisitos del puesto."
}
