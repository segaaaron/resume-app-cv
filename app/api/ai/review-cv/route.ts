import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import { getOpenAI, AI_MODEL, AI_TEMPERATURE, checkRateLimit, buildResumeContext } from "@/lib/ai-client"

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true },
  })

  if (user?.plan !== "PRO" || user?.subscriptionStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const { sectionData, question } = await req.json()

  if (!sectionData || typeof sectionData !== "object") {
    return NextResponse.json({ error: "CV data required" }, { status: 400 })
  }

  const resumeContext = buildResumeContext(sectionData)
  if (!resumeContext.trim()) {
    return NextResponse.json({ error: "not_enough_data" }, { status: 400 })
  }

  // Validate optional question
  if (question) {
    const validation = validateAIInput(String(question), 300)
    if (!validation.valid && validation.error === "injection_detected") {
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
1. Analiza el CV completo considerando: claridad, impacto, estructura, keywords ATS, coherencia y completitud.
2. Responde directamente a la pregunta del candidato si es específica.
3. Sé concreto y accionable — no genérico. Menciona secciones o datos reales del CV.
4. Tono: consultor profesional, directo y constructivo.
5. Idioma: mismo idioma que el CV.

Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown):
{
  "summary": "<diagnóstico general en 2-3 oraciones>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>", "<fortaleza 3>"],
  "improvements": ["<mejora concreta 1>", "<mejora concreta 2>", "<mejora concreta 3>"],
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
            "Eres un Consultor de Carrera de Élite especializado en revisión y optimización de CVs para procesos de selección. " +
            "SOLO respondes preguntas relacionadas con el CV del candidato, su perfil profesional, experiencia laboral o búsqueda de empleo. " +
            "Si la pregunta no tiene relación con el CV o el empleo, responde únicamente con: " +
            "{\"summary\": \"\", \"strengths\": [], \"improvements\": [], \"answer\": \"off_topic\"} sin texto adicional.",
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = JSON.parse(raw)

    if (parsed.answer === "off_topic") {
      return NextResponse.json({ error: "off_topic" }, { status: 422 })
    }

    if (!parsed.summary || !Array.isArray(parsed.strengths) || !Array.isArray(parsed.improvements)) {
      throw new Error("Invalid response format")
    }

    return NextResponse.json({
      summary: parsed.summary,
      strengths: parsed.strengths.slice(0, 5),
      improvements: parsed.improvements.slice(0, 5),
      answer: parsed.answer ?? "",
    })
  } catch (err) {
    console.error("[ai/review-cv] error:", err)
    return NextResponse.json({ error: "Error al revisar el CV" }, { status: 500 })
  }
}
