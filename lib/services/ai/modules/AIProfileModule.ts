// lib/services/ai/modules/AIProfileModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL,
  AI_TEMPERATURE,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, buildSectionContext, resolveLanguage, detectHallucination } from "../shared/ai-helpers"
import { computeCostUsd } from "../shared/cost-tracker"
import {
  AI_INPUT_LIMITS,
  FillProfileResponseSchema,
  type FillProfileInput,
  type FillProfileResult,
} from "../shared/ai-types"

export class AIProfileModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async fillProfile(userId: string, input: FillProfileInput, plan: string): Promise<FillProfileResult> {
    await enforceAIQuota(userId, "fill-profile", plan)

    const { prompt, sectionData, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const validation = validateAIInput(prompt, AI_INPUT_LIMITS.prompt)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    const sd = sectionData ?? {}
    const resumeContext = buildResumeContext(sd, language)
    const fillCtxValidation = validateAIInput(resumeContext, AI_INPUT_LIMITS.resumeContext)
    if (!fillCtxValidation.valid) throw new AppError("invalid_input", 400)

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

    // Only work experience stores bullets; the other three sections are prose.
    const workExpCtx = buildSectionContext(language === "en" ? "WORK EXPERIENCE" : "EXPERIENCIA LABORAL", (sd.workExperience ?? []) as Parameters<typeof buildSectionContext>[1], { bullets: true })
    const educationCtx = buildSectionContext(language === "en" ? "EDUCATION" : "EDUCACIÓN", (sd.education ?? []) as Parameters<typeof buildSectionContext>[1])
    const projectsCtx = buildSectionContext(language === "en" ? "PROJECTS" : "PROYECTOS", (sd.projects ?? []) as Parameters<typeof buildSectionContext>[1])
    const volunteerCtx = buildSectionContext(language === "en" ? "VOLUNTEER" : "VOLUNTARIADO", (sd.volunteer ?? []) as Parameters<typeof buildSectionContext>[1])

    const sectionsWithIds = [workExpCtx, educationCtx, projectsCtx, volunteerCtx].filter(Boolean).join("\n")

    const userPrompt = language === "en"
      ? `CRITICAL ANTI-HALLUCINATION RULES (mandatory, no exceptions):
1. ONLY produce content derivable from the candidate's instruction and the CURRENT RESUME above. Do NOT invent technologies, frameworks, libraries, company names, job titles, certifications, dates, percentages, or real numbers not provided.
2. NEVER use placeholders like [X%] or [N users] in final output — if the user didn't provide a metric, omit it.
3. For workExperienceNew: every entry must come from a company/role explicitly mentioned in the instruction. If you cannot fully ground a new entry in the user's input, OMIT the entry — never fill gaps with invented details.
4. For suggestedSkills: only skills explicitly mentioned in the instruction or the current resume. Never invent unrelated skills.

The candidate wants to improve their resume with this instruction:
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
- Do not invent data (dates, companies, metrics) the candidate didn't mention.
- Human voice (avoid AI-detection): write summaries/descriptions with varied sentence length and a natural tone, not a press release. Avoid AI-tell words: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy", "Results-driven".`
      : `REGLAS CRÍTICAS ANTI-ALUCINACIÓN (obligatorias, sin excepciones):
1. SOLO produce contenido derivable de la instrucción del candidato y del CV ACTUAL de arriba. NO inventes tecnologías, frameworks, librerías, nombres de empresas, cargos, certificaciones, fechas, porcentajes ni números reales no proporcionados.
2. NUNCA uses placeholders como [X%] o [N usuarios] en el output final — si el usuario no proporcionó una métrica, omítela.
3. Para workExperienceNew: cada entrada debe provenir de una empresa/rol mencionado explícitamente en la instrucción. Si no puedes fundamentar completamente una entrada nueva en el input del usuario, OMÍTELA — nunca rellenes huecos con detalles inventados.
4. Para suggestedSkills: solo habilidades mencionadas explícitamente en la instrucción o en el CV actual. Nunca inventes habilidades no relacionadas.

El candidato quiere mejorar su CV con esta instrucción:
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
- No inventes datos (fechas, empresas, métricas) que el candidato no mencionó.
- Voz humana (evita detección de IA): escribe resúmenes/descripciones con frases de largo variado y tono natural, no nota de prensa. Evita palabras-IA: "Orquestó", "Apalancó", "Utilizó", "sinergia", "orientado a resultados".`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 2000,
      // fill-profile uses 0.4 — needs some creativity to map natural-language
      // instructions to structured fields, but stays faithful to user input.
      temperature: AI_TEMPERATURE,
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

    // Anti-hallucination grounding source = user instruction + current resume.
    const groundingSource = `${prompt}\n${resumeContext}`.toLowerCase()

    // suggestedSkills: keep only those mentioned in prompt or sectionData.
    let droppedSkills = 0
    const cleanSkills = (data.suggestedSkills ?? [])
      .filter((s: string) => !skillBlocklist.has(s.toLowerCase().trim()))
      .filter((s: string) => {
        const sl = s.toLowerCase().trim()
        if (!sl) return false
        if (groundingSource.includes(sl)) return true
        droppedSkills++
        return false
      })
      .slice(0, 8)

    // workExperienceNew: drop entries whose employer or jobTitle cannot be
    // grounded in the user's instruction (the resume's existing items are
    // handled via workExperienceUpdates, so new ones must come from the prompt).
    const promptLower = prompt.toLowerCase()
    let droppedNewWork = 0
    const cleanNewWork = (data.workExperienceNew ?? [])
      .filter((entry) => {
        const employer = (entry.employer ?? "").toLowerCase().trim()
        const role = (entry.jobTitle ?? "").toLowerCase().trim()
        const employerGrounded = !!employer && promptLower.includes(employer)
        const roleGrounded = !!role && promptLower.includes(role)
        // Require BOTH employer and jobTitle to be derivable from the prompt.
        if (!employerGrounded || !roleGrounded) {
          droppedNewWork++
          return false
        }
        // Description must not introduce hallucinated tech/metrics.
        if (
          entry.description &&
          detectHallucination(entry.description, `${prompt}\n${resumeContext}`)
        ) {
          droppedNewWork++
          return false
        }
        return true
      })
      .slice(0, 3)

    if (droppedSkills > 0 || droppedNewWork > 0) {
      this.logger.warn("[AIService.fillProfile] dropped hallucinated content", {
        droppedSkills,
        droppedNewWork,
      })
    }

    const usage = response.usage
    logAIUsage(userId, "fill-profile", {
      model: AI_MODEL,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
    })
    return {
      summary: data.summary ?? null,
      jobTitle: data.jobTitle ?? null,
      hobbies: data.hobbies ?? null,
      suggestedSkills: cleanSkills,
      suggestedLanguages: (data.suggestedLanguages ?? []).slice(0, 5),
      workExperienceUpdates: (data.workExperienceUpdates ?? []).filter((u: { id: string }) => validWorkIds.has(u.id)),
      workExperienceNew: cleanNewWork,
      educationUpdates: (data.educationUpdates ?? []).filter((u: { id: string }) => validEduIds.has(u.id)),
      projectUpdates: (data.projectUpdates ?? []).filter((u: { id: string }) => validProjIds.has(u.id)),
      volunteerUpdates: (data.volunteerUpdates ?? []).filter((u: { id: string }) => validVolIds.has(u.id)),
    }
  }
}
