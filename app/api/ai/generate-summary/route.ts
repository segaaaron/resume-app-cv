import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import OpenAI from "openai"
import { validateAIInput } from "@/lib/ai-safety"

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) }

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

  const { personalDetails, jobTitle, workExperience, education, skills } = await req.json()

  const name = personalDetails?.firstName
    ? `${personalDetails.firstName} ${personalDetails.lastName ?? ""}`.trim()
    : null

  const experienceLines = (workExperience ?? [])
    .slice(0, 3)
    .map((j: { jobTitle?: string; employer?: string; startDate?: string; endDate?: string }) =>
      `- ${j.jobTitle ?? ""} en ${j.employer ?? ""} (${j.startDate ?? ""} - ${j.endDate ?? "Presente"})`
    )
    .join("\n")

  const educationLines = (education ?? [])
    .slice(0, 2)
    .map((e: { degree?: string; school?: string }) => `- ${e.degree ?? ""} en ${e.school ?? ""}`)
    .join("\n")

  const skillNames = (skills ?? [])
    .slice(0, 8)
    .map((s: { name?: string }) => s.name)
    .filter(Boolean)
    .join(", ")

  if (!experienceLines && !educationLines && !skillNames) {
    return NextResponse.json({ error: "Not enough data" }, { status: 400 })
  }

  // Validate free-text inputs for prompt injection
  const textToValidate = [jobTitle, experienceLines, educationLines, skillNames].filter(Boolean).join(" ")
  if (textToValidate.trim().length > 0) {
    const validation = validateAIInput(textToValidate, 5000)
    if (!validation.valid && validation.error === "injection_detected") {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 })
    }
  }

  const prompt = `Eres un experto en redacción de CVs profesionales.
Genera un resumen profesional conciso y atractivo para un CV, basado en los siguientes datos del candidato.

${name ? `Nombre: ${name}` : ""}
${jobTitle ? `Puesto objetivo: ${jobTitle}` : ""}
${experienceLines ? `Experiencia laboral:\n${experienceLines}` : ""}
${educationLines ? `Educación:\n${educationLines}` : ""}
${skillNames ? `Habilidades: ${skillNames}` : ""}

El resumen debe:
- Tener entre 2 y 4 oraciones
- Ser en primera persona o tercera persona (elige la más natural)
- Destacar los puntos fuertes del candidato
- Ser impactante, profesional y orientado a resultados
- Estar en el idioma que predomina en los datos (español o inglés)

Genera 3 versiones del resumen, de más formal a más creativa.

Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown, sin explicaciones):
{"versions": ["version1", "version2", "version3"]}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente especializado EXCLUSIVAMENTE en redacción de currículums vitae (CVs) y perfiles profesionales. " +
            "Solo debes generar resúmenes relacionados con experiencia laboral, habilidades y trayectoria profesional. " +
            "Si los datos recibidos no corresponden a un perfil profesional real, responde únicamente con este JSON: {\"versions\": []} sin texto adicional.",
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
  } catch (err) {
    console.error("[ai/generate-summary] error:", err)
    return NextResponse.json({ error: "Error al generar el resumen" }, { status: 500 })
  }
}
