import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import { getOpenAI, AI_MODEL, AI_TEMPERATURE, checkRateLimit } from "@/lib/ai-client"

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true },
  })

  if (user?.plan !== "PRO" || user?.subscriptionStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const { text, jobTitle, employer, industry, language: rawLanguage } = await req.json()
  const language = rawLanguage === "en" ? "en" : "es"
  const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

  if (!text || typeof text !== "string" || text.trim().length < 5) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 })
  }

  const validation = validateAIInput(text, 2000)
  if (!validation.valid) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }

  const context = [
    jobTitle ? `Puesto: ${jobTitle}` : "",
    employer ? `Empresa: ${employer}` : "",
    industry ? `Industria: ${industry}` : "",
  ].filter(Boolean).join(" | ")

  const prompt = `TAREA: Transforma la siguiente descripción de experiencia laboral en 3 versiones de alto impacto orientadas a logros.

${context ? `Contexto: ${context}` : ""}
Descripción actual:
${text}

REGLAS DE ORO (aplica todas):
1. Fórmula de logro: "Verbo de acción + [qué se logró] + medido por [métrica] + haciendo [cómo]".
2. Verbos de acción fuertes: Lideré, Desarrollé, Optimicé, Incrementé, Implementé, Diseñé, Reduje, Automaticé. NUNCA uses "Responsable de" o "Encargado de".
3. Métricas: cuando el texto original no tenga números, usa PLACEHOLDERS explícitos entre corchetes como [X%], [N usuarios], [$Z], [X horas/semana]. NUNCA inventes cifras reales.
4. Sin pronombres personales: no uses "Yo", "Mi", "Nosotros". Empieza directo con el verbo.
5. ATS-Friendly: integra palabras clave del sector de forma natural.
6. Longitud: máximo 2 oraciones por versión. Conciso y directo.
7. Idioma: mismo idioma que el texto original.

Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown, sin explicaciones):
{"versions": ["version1", "version2", "version3"]}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      max_tokens: 600,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite y experto en optimización de ATS (Applicant Tracking Systems). " +
            "Tu especialidad es transformar descripciones de experiencia laboral ordinarias en logros de alto impacto usando la fórmula de Google: Logré [X] medido por [Y], haciendo [Z]. " +
            "SOLO respondes solicitudes relacionadas con CVs, experiencia laboral y perfiles de empleo. " +
            "Cuando el original no tiene métricas, usas SIEMPRE placeholders explícitos entre corchetes ([X%], [N], [$Z]) — NUNCA inventas cifras reales. " +
            "Si el contenido no corresponde a experiencia laboral, responde únicamente con: {\"versions\": []} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed.versions)) {
      throw new Error("Invalid response format")
    }

    if (parsed.versions.length === 0) {
      return NextResponse.json({ error: "off_topic" }, { status: 422 })
    }

    return NextResponse.json({ versions: parsed.versions.slice(0, 3) })
  } catch {
    return NextResponse.json({ error: "Error al mejorar el texto" }, { status: 500 })
  }
}
