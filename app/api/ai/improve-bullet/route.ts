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

  const prompt = `TAREA: Revisa y mejora TODOS los bullets de esta descripción de experiencia laboral. Devuelve 3 versiones completas mejoradas.

${context ? `Contexto: ${context}` : ""}
Descripción actual:
${text}

INSTRUCCIONES PARA CADA VERSIÓN:
1. Mejora CADA bullet existente: verbo de acción fuerte al inicio, orientado a logros, ATS-friendly.
2. Agrega 2-3 bullets nuevos y relevantes si enriquecen el perfil para el puesto.
3. Elimina bullets débiles, repetitivos o irrelevantes para un CV profesional.
4. Métricas: usa PLACEHOLDERS como [X%], [N usuarios], [$Z] cuando no hay cifras reales. NUNCA inventes números.
5. Sin pronombres personales. Empieza cada bullet directo con el verbo.
6. Verbos fuertes: Desarrollé, Implementé, Optimicé, Lideré, Diseñé, Reduje, Automaticé, Colaboré, Entregué.
7. Mantén el mismo idioma que el texto original.

LAS 3 VERSIONES DEBEN DIFERENCIARSE ASÍ:
- Versión 1: enfoque técnico — resalta stack, arquitectura y soluciones técnicas.
- Versión 2: enfoque en logros — cuantifica impacto, métricas y resultados de negocio.
- Versión 3: enfoque en liderazgo y colaboración — resalta trabajo en equipo, mentoring y entrega ágil.

Cada versión es una cadena con todos los bullets separados por \\n, cada uno empezando con "• ".

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"versions": ["bullets_version1", "bullets_version2", "bullets_version3"]}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      max_tokens: 2000,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite y experto en optimización de ATS (Applicant Tracking Systems). " +
            "Tu especialidad es revisar descripciones de experiencia laboral bullet por bullet: mejorar los existentes, agregar nuevos relevantes y eliminar los débiles. " +
            "Devuelves siempre 3 versiones completas de la descripción mejorada con todos sus bullets. " +
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
