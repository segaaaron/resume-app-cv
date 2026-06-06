// lib/services/ai/modules/AIProfileModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL,
  AI_TEMPERATURE_STRUCTURED,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, buildSectionContext, resolveLanguage } from "../shared/ai-helpers"
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
}
