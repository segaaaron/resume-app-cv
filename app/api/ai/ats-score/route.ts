import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import OpenAI from "openai"
import { validateAIInput } from "@/lib/ai-safety"

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Simple in-memory rate limiter: 20 requests per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= 20) return false
  entry.count++
  return true
}

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

  const { jobDescription, sectionData } = await req.json()

  if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 20) {
    return NextResponse.json({ error: "Job description too short" }, { status: 400 })
  }

  const validation = validateAIInput(jobDescription, 5000)
  if (!validation.valid && validation.error === "injection_detected") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }

  const { personalDetails, workExperience, education, skills, summary } = sectionData ?? {}

  const resumeText = [
    personalDetails?.jobTitle ? `Puesto actual: ${personalDetails.jobTitle}` : "",
    summary ? `Resumen: ${summary}` : "",
    (workExperience ?? []).map((j: { jobTitle?: string; employer?: string; description?: string }) =>
      `Experiencia: ${j.jobTitle ?? ""} en ${j.employer ?? ""}${j.description ? ` — ${j.description}` : ""}`
    ).join("\n"),
    (education ?? []).map((e: { degree?: string; school?: string; institution?: string }) =>
      `Educación: ${e.degree ?? ""} en ${e.institution ?? e.school ?? ""}`
    ).join("\n"),
    (skills ?? []).map((s: { name?: string }) => s.name).filter(Boolean).join(", ")
      ? `Habilidades: ${(skills ?? []).map((s: { name?: string }) => s.name).filter(Boolean).join(", ")}`
      : "",
  ].filter(Boolean).join("\n")

  if (!resumeText.trim()) {
    return NextResponse.json({ error: "Not enough resume data" }, { status: 400 })
  }

  const prompt = `Eres un experto en sistemas ATS (Applicant Tracking Systems) y selección de personal.
Analiza la compatibilidad entre el CV y la descripción del puesto de trabajo.

=== CV DEL CANDIDATO ===
${resumeText}

=== DESCRIPCIÓN DEL PUESTO ===
${jobDescription}

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
- suggestions: acciones concretas para mejorar la compatibilidad
- Responde ÚNICAMENTE con el JSON, sin markdown ni explicaciones`

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente especializado EXCLUSIVAMENTE en análisis de compatibilidad entre currículums vitae (CVs) y descripciones de puestos de trabajo (job descriptions). " +
            "Solo debes analizar contenido relacionado con empleo, habilidades profesionales, experiencia laboral y requisitos de puestos. " +
            "Si el contenido recibido no corresponde a un CV o a una descripción de empleo real, responde únicamente con este JSON: " +
            "{\"score\": 0, \"label\": \"off_topic\", \"summary\": \"\", \"strengths\": [], \"gaps\": [], \"missingKeywords\": [], \"suggestions\": []} sin texto adicional.",
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = JSON.parse(raw)

    if (parsed.label === "off_topic") {
      return NextResponse.json({ error: "off_topic" }, { status: 422 })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("[ai/ats-score] error:", err)
    return NextResponse.json({ error: "Error al analizar compatibilidad ATS" }, { status: 500 })
  }
}
