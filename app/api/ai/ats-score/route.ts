import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import { getOpenAI, AI_MODEL, AI_TEMPERATURE, checkRateLimit, logAIUsage, buildResumeContext } from "@/lib/ai-client"
import { checkOrigin } from "@/lib/csrf"
import { isActive } from "@/lib/plans"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [allowed, user] = await Promise.all([
    checkRateLimit(session.user.id, "ats-score"),
    db.user.findUnique({ where: { id: session.user.id }, select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true } }),
  ])
  if (!allowed) return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 })

  if (!isActive(user?.plan ?? "UNSUBSCRIBED", user?.subscriptionEndsAt, user?.subscriptionStatus)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const { jobDescription, sectionData, language: rawLanguage } = await req.json()
  const language = rawLanguage === "en" ? "en" : "es"
  const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

  if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 20) {
    return NextResponse.json({ error: "Job description too short" }, { status: 400 })
  }

  const validation = validateAIInput(jobDescription, 6000)
  if (!validation.valid) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }

  // Truncate to 6000 chars — covers 95%+ of real job descriptions without quality loss
  const jobDescriptionTruncated = jobDescription.slice(0, 6000)

  const resumeText = buildResumeContext(sectionData ?? {})

  if (!resumeText.trim()) {
    return NextResponse.json({ error: "Not enough resume data" }, { status: 400 })
  }

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

  try {
    const response = await getOpenAI().chat.completions.create({
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
    const parsed = JSON.parse(raw)

    if (parsed.label === "off_topic") {
      return NextResponse.json({ error: "off_topic" }, { status: 422 })
    }

    logAIUsage(session.user.id, "ats-score")
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: "Error al analizar compatibilidad ATS" }, { status: 500 })
  }
}
