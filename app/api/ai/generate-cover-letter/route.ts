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

  const { resumeId, recipientName, recipientTitle, company, jobTitle, tone } = await req.json()

  // Validate free-text inputs for prompt injection
  const userText = [company, jobTitle, recipientName, recipientTitle].filter(Boolean).join(" ")
  const validation = validateAIInput(userText, 2000)
  if (!validation.valid && validation.error === "injection_detected") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }

  // Load resume data if provided
  let resumeContext = ""
  if (resumeId) {
    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId: session.user.id },
      select: { personalDetails: true, sections: true },
    })
    if (resume) {
      // Merge personalDetails + sections into sectionData format for buildResumeContext
      const pd = resume.personalDetails as Record<string, unknown>
      const sections = Array.isArray(resume.sections) ? resume.sections as Array<{ type: string; items?: unknown[] }> : []

      const sectionMap: Record<string, unknown> = { personalDetails: pd }
      for (const sec of sections) {
        if (sec.type && Array.isArray(sec.items)) {
          sectionMap[sec.type] = sec.items
        }
      }
      // summary may be a top-level string field on personalDetails or a section
      if (typeof pd.summary === "string") sectionMap.summary = pd.summary

      resumeContext = buildResumeContext(sectionMap)
    }
  }

  const toneLabel = tone === "formal" ? "formal y profesional" : tone === "creative" ? "creativo y dinámico" : "equilibrado y cercano"

  const prompt = `Eres un experto en redacción de cartas de presentación profesionales para procesos de selección de personal.

Genera el cuerpo de una carta de presentación en tono ${toneLabel} para el siguiente candidato y puesto.

${resumeContext ? `=== DATOS DEL CANDIDATO ===\n${resumeContext}\n` : ""}
=== PUESTO AL QUE APLICA ===
${company ? `Empresa: ${company}` : ""}
${jobTitle ? `Puesto: ${jobTitle}` : ""}
${recipientName ? `Destinatario: ${recipientName}${recipientTitle ? `, ${recipientTitle}` : ""}` : ""}

Instrucciones para la carta:
- Escribe SOLO el cuerpo de la carta (sin saludo, sin despedida, sin fecha)
- Entre 3 y 4 párrafos concisos
- Párrafo 1: por qué el candidato está interesado en esta empresa/puesto específico
- Párrafo 2: logros y experiencia más relevante para el puesto
- Párrafo 3: qué valor concreto aportaría al equipo
- Párrafo 4 (opcional): cierre motivador con llamada a la acción
- Usa el mismo idioma que los datos del candidato (español o inglés)
- Sé específico, evita clichés genéricos
- No inventes datos que no están en el CV

Responde ÚNICAMENTE con un JSON: {"body": "<cuerpo de la carta>"}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      max_tokens: 1000,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente especializado EXCLUSIVAMENTE en redacción de cartas de presentación profesionales para búsqueda de empleo. " +
            "Solo debes generar contenido relacionado con candidaturas laborales y experiencia profesional. " +
            "Si la solicitud no corresponde a una carta de presentación laboral real, responde únicamente con: {\"body\": \"\"} sin texto adicional.",
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = JSON.parse(raw)

    if (!parsed.body || typeof parsed.body !== "string") {
      throw new Error("Invalid response format")
    }

    if (parsed.body.trim() === "") {
      return NextResponse.json({ error: "off_topic" }, { status: 422 })
    }

    return NextResponse.json({ body: parsed.body })
  } catch (err) {
    console.error("[ai/generate-cover-letter] error:", err)
    return NextResponse.json({ error: "Error al generar la carta" }, { status: 500 })
  }
}
