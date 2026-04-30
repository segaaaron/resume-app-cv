import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import { getOpenAI, AI_MODEL, checkRateLimit, logAIUsage, buildResumeContext } from "@/lib/ai-client"
import { z } from "zod"

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

function buildSectionContext(label: string, items: { id: string; name?: string; title?: string; employer?: string; organization?: string; role?: string; jobTitle?: string; degree?: string; description?: string }[]): string {
  if (!items.length) return ""
  return `\n${label}:\n` + items.map((item, i) => {
    const name = item.employer ?? item.organization ?? item.name ?? item.title ?? item.degree ?? item.role ?? item.jobTitle ?? ""
    const desc = item.description ? `\n    Descripción actual: ${item.description.slice(0, 200)}` : ""
    return `  [${i + 1}] id="${item.id}" | ${name}${desc}`
  }).join("\n")
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!await checkRateLimit(session.user.id, "fill-profile")) {
    return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
  })

  const now = new Date()
  const hasActiveAccess =
    user?.plan === "PRO" &&
    user?.subscriptionStatus === "ACTIVE" &&
    (!user?.subscriptionEndsAt || user.subscriptionEndsAt > now)

  if (!hasActiveAccess) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const { prompt, sectionData, language: rawLanguage } = await req.json()
  const language = rawLanguage === "en" ? "en" : "es"
  const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
    return NextResponse.json({ error: "Describe tu perfil (mínimo 10 caracteres)" }, { status: 400 })
  }

  const validation = validateAIInput(prompt, 500)
  if (!validation.valid && validation.error === "injection_detected") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }

  const sd = sectionData ?? {}
  const resumeContext = buildResumeContext(sd)

  const existingSkills = ((sd.skills ?? []) as { name: string }[]).map((s) => s.name).join(", ")

  // Build blocklist: employer names, job titles, locations from work experience — must never appear as skills
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

  // Build section contexts with IDs for AI reference
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
${sd.hobbies ? `Intereses actuales: ${sd.hobbies}` : ""}

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

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      max_tokens: 700,
      temperature: 0.5,
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
    const parsed = JSON.parse(raw)

    // Off-topic: empty object or all fields empty
    const hasContent = parsed.summary || parsed.jobTitle || parsed.hobbies ||
      parsed.suggestedSkills?.length || parsed.suggestedLanguages?.length ||
      parsed.workExperienceUpdates?.length || parsed.workExperienceNew?.length ||
      parsed.educationUpdates?.length || parsed.projectUpdates?.length || parsed.volunteerUpdates?.length

    if (!hasContent) {
      return NextResponse.json({ error: "off_topic" }, { status: 422 })
    }

    const validated = FillProfileResponseSchema.safeParse(parsed)
    const data = validated.success ? validated.data : parsed

    // Validate IDs exist in sectionData
    const validWorkIds = new Set(((sd.workExperience ?? []) as { id: string }[]).map((j) => j.id))
    const validEduIds = new Set(((sd.education ?? []) as { id: string }[]).map((e) => e.id))
    const validProjIds = new Set(((sd.projects ?? []) as { id: string }[]).map((p) => p.id))
    const validVolIds = new Set(((sd.volunteer ?? []) as { id: string }[]).map((v) => v.id))

    logAIUsage(session.user.id, "fill-profile")
    return NextResponse.json({
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
    })
  } catch {
    return NextResponse.json({ error: "Error al generar el perfil" }, { status: 500 })
  }
}
