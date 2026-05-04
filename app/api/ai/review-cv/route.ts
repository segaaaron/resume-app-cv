import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import { getOpenAI, AI_MODEL, AI_TEMPERATURE, checkRateLimit, logAIUsage, buildResumeContext } from "@/lib/ai-client"
import { checkOrigin } from "@/lib/csrf"
import { z } from "zod"
import { isActive } from "@/lib/plans"

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

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [allowed, user] = await Promise.all([
    checkRateLimit(session.user.id, "review-cv"),
    db.user.findUnique({ where: { id: session.user.id }, select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true } }),
  ])
  if (!allowed) return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 })

  if (!isActive(user?.plan ?? "UNSUBSCRIBED", user?.subscriptionEndsAt, user?.subscriptionStatus)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const { sectionData, question, language: rawLanguage } = await req.json()
  const language = rawLanguage === "en" ? "en" : "es"
  const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

  if (!sectionData || typeof sectionData !== "object") {
    return NextResponse.json({ error: "CV data required" }, { status: 400 })
  }

  const resumeContext = buildResumeContext(sectionData)
  if (!resumeContext.trim()) {
    return NextResponse.json({ error: "not_enough_data" }, { status: 400 })
  }

  if (question) {
    const validation = validateAIInput(String(question), 300)
    if (!validation.valid) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 })
    }
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

  try {
    const response = await getOpenAI().chat.completions.create({
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
    const parsed = JSON.parse(raw)

    if (parsed.answer === "off_topic") {
      return NextResponse.json({ error: "off_topic" }, { status: 422 })
    }

    // Validate and sanitize with Zod — filter out invalid suggestions silently
    const validated = ReviewResponseSchema.safeParse(parsed)
    if (!validated.success) {
      console.warn("[review-cv] Zod validation failed, returning without suggestions:", validated.error.flatten())
      // Fallback: return without suggestions if structure is wrong
      return NextResponse.json({
        summary: parsed.summary ?? "",
        strengths: (parsed.strengths ?? []).slice(0, 5).map((s: unknown) =>
          typeof s === "string" ? { text: s } : { text: (s as { text?: string }).text ?? "" }
        ),
        improvements: (parsed.improvements ?? []).slice(0, 5).map((s: unknown) =>
          typeof s === "string" ? { text: s } : { text: (s as { text?: string }).text ?? "" }
        ),
        answer: parsed.answer ?? "",
      })
    }

    // Sanitize previews: strip markdown characters
    const sanitizePreview = (text: string) =>
      text.replace(/[*_`#>]/g, "").replace(/\n{3,}/g, "\n\n").trim()

    const sanitizeItem = (item: z.infer<typeof ReviewItemSchema>) => ({
      ...item,
      suggestion: item.suggestion
        ? { ...item.suggestion, preview: sanitizePreview(item.suggestion.preview) }
        : undefined,
    })

    logAIUsage(session.user.id, "review-cv")
    return NextResponse.json({
      summary: validated.data.summary,
      strengths: validated.data.strengths.map(sanitizeItem),
      improvements: validated.data.improvements.map(sanitizeItem),
      answer: validated.data.answer,
    })
  } catch {
    return NextResponse.json({ error: "Error al revisar el CV" }, { status: 500 })
  }
}
