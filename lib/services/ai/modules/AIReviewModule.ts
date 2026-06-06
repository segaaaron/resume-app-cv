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
import { computeCostUsd } from "../shared/cost-tracker"
import {
  AI_INPUT_LIMITS,
  ReviewItemSchema,
  ReviewResponseSchema,
  type ATSScoreInput,
  type ATSScoreResult,
  type ReviewCVInput,
  type ReviewResult,
} from "../shared/ai-types"

export class AIReviewModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async atsScore(userId: string, input: ATSScoreInput, plan: string): Promise<ATSScoreResult> {
    await enforceAIQuota(userId, "ats-score", plan)

    const { jobDescription, sectionData, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const validation = validateAIInput(jobDescription, AI_INPUT_LIMITS.jobDescription)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    // Truncate to 6000 chars — covers 95%+ of real job descriptions without quality loss
    const jobDescriptionTruncated = jobDescription.slice(0, AI_INPUT_LIMITS.jobDescription)

    const resumeText = buildResumeContext(sectionData ?? {}, language)
    if (!resumeText.trim()) throw new AppError("not_enough_resume_data", 400)
    const resumeTextValidation = validateAIInput(resumeText, AI_INPUT_LIMITS.resumeText)
    if (!resumeTextValidation.valid) throw new AppError("invalid_input", 400)

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

    const atsUsage = response.usage
    logAIUsage(userId, "ats-score", {
      model: AI_MODEL,
      plan,
      promptTokens: atsUsage?.prompt_tokens ?? 0,
      completionTokens: atsUsage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, atsUsage?.prompt_tokens ?? 0, atsUsage?.completion_tokens ?? 0),
    })
    return parsed
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
- preview: the IMPROVED, ENRICHED text — more specific, more impactful than the original. NEVER shorten or genericize existing content. NO markdown, NO asterisks, NO HTML. Max 500 characters.
- reason: max 12 words explaining the change
- targetId: only if the improvement applies to a specific array item (use the item id from the resume)

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
    { "text": "<improvement>", "suggestion": { "field": "...", "type": "replace", "preview": "<enriched text, more specific than the original>", "reason": "<max 12 words>" } },
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
- preview: el texto MEJORADO y ENRIQUECIDO — más específico, más impactante que el original. NUNCA acortes ni hagas más genérico el contenido existente. SIN markdown, SIN asteriscos, SIN HTML. Máximo 500 caracteres.
- reason: máximo 12 palabras explicando el cambio
- targetId: solo si la mejora aplica a un item específico de un array (usa el id del item del CV)

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
    { "text": "<mejora>", "suggestion": { "field": "...", "type": "replace", "preview": "<texto enriquecido, más específico que el original>", "reason": "<max 12 palabras>" } },
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

    const sanitizePreview = (text: string) =>
      text.replace(/[*_`#>]/g, "").replace(/\n{3,}/g, "\n\n").trim()

    const sanitizeItem = (item: z.infer<typeof ReviewItemSchema>) => {
      if (!item.suggestion) return { ...item, suggestion: undefined }
      const cleanedPreview = sanitizePreview(item.suggestion.preview)
      // Fail-safe: if preview seems to have invented data not present in the
      // resume context, drop the suggestion and keep only the advisory text.
      if (detectHallucination(cleanedPreview, resumeContext)) {
        this.logger.warn("[AIService.reviewCV] dropped hallucinated suggestion", {
          field: item.suggestion.field,
          previewSample: cleanedPreview.slice(0, 120),
        })
        return { ...item, suggestion: undefined }
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
