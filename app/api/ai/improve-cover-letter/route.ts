import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import { getOpenAI, AI_MODEL, AI_TEMPERATURE, checkRateLimit, logAIUsage } from "@/lib/ai-client"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!await checkRateLimit(session.user.id, "improve-cover-letter")) {
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

  const { body, company, jobTitle, recipientTitle, language: rawLanguage } = await req.json()
  const language = rawLanguage === "en" ? "en" : "es"
  const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

  if (!body || typeof body !== "string" || body.trim().length < 20) {
    return NextResponse.json({ error: "Body text is required" }, { status: 400 })
  }

  const validation = validateAIInput(body, 3000)
  if (!validation.valid) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }

  const context = [
    company ? `Empresa: ${company}` : "",
    jobTitle ? `Puesto: ${jobTitle}` : "",
    recipientTitle ? `Destinatario: ${recipientTitle}` : "",
  ].filter(Boolean).join(" | ")

  const prompt = `TAREA: Mejora el siguiente cuerpo de carta de presentación y genera 3 versiones optimizadas.

${context ? `Contexto: ${context}` : ""}
Carta actual:
${body}

REGLAS DE ORO (aplica todas):
1. Mantén la estructura en 3-4 párrafos: interés → logros relevantes → valor aportado → cierre.
2. Elimina clichés ("soy una persona proactiva", "me apasiona el trabajo en equipo"). Sustituye por logros concretos.
3. Verbos de impacto: Lideré, Desarrollé, Optimicé, Implementé, Incrementé. NUNCA uses "Responsable de".
4. Si hay métricas en el texto original, consérvales. Si no las hay, usa placeholders explícitos [X%], [N proyectos], [$Z]. NUNCA inventes cifras reales.
5. Cada versión debe tener un tono distinto:
   - Versión 1: Formal y ejecutiva
   - Versión 2: Equilibrada y directa
   - Versión 3: Dinámica y orientada al impacto
6. Idioma: mismo idioma que el texto original.
7. Máximo 4 párrafos por versión. Cada versión máximo 200 palabras. Denso en valor, sin relleno.

Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown, sin explicaciones):
{"versions": ["version1", "version2", "version3"]}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      max_tokens: 1000,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite especializado en redacción de cartas de presentación de alto impacto para procesos de selección. " +
            "Tu especialidad es transformar cartas genéricas en textos que destacan al candidato con logros concretos y lenguaje de impacto. " +
            "SOLO trabajas con cartas de presentación laborales. " +
            "Cuando no hay métricas, usas SIEMPRE placeholders explícitos entre corchetes ([X%], [N proyectos]) — NUNCA inventas cifras reales. " +
            "Si el contenido no es una carta de presentación laboral, responde únicamente con: {\"versions\": []} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed.versions)) throw new Error("Invalid response format")
    if (parsed.versions.length === 0) return NextResponse.json({ error: "off_topic" }, { status: 422 })

    logAIUsage(session.user.id, "improve-cover-letter")
    return NextResponse.json({ versions: parsed.versions.slice(0, 3) })
  } catch {
    return NextResponse.json({ error: "Error al mejorar la carta" }, { status: 500 })
  }
}
