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
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true },
  })

  if (user?.plan !== "PRO" || user?.subscriptionStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const { resumeId, recipientName, recipientTitle, company, jobTitle, tone } = await req.json()

  if (!company) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 })
  }

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
      select: { personalDetails: true, title: true },
    })
    if (resume?.personalDetails) {
      const pd = resume.personalDetails as Record<string, unknown>
      const sections = pd as {
        personalDetails?: { firstName?: string; lastName?: string; jobTitle?: string; email?: string }
        workExperience?: Array<{ jobTitle?: string; employer?: string; startDate?: string; endDate?: string; description?: string }>
        education?: Array<{ degree?: string; institution?: string }>
        skills?: Array<{ name?: string }>
        summary?: string
      }

      const name = sections.personalDetails?.firstName
        ? `${sections.personalDetails.firstName} ${sections.personalDetails.lastName ?? ""}`.trim()
        : ""
      const currentRole = sections.personalDetails?.jobTitle ?? ""
      const summaryText = typeof sections.summary === "string" ? sections.summary : ""

      const expLines = (sections.workExperience ?? []).slice(0, 3).map(
        (j) => `- ${j.jobTitle ?? ""} en ${j.employer ?? ""} (${j.startDate ?? ""} - ${j.endDate ?? "Presente"})`
      ).join("\n")

      const skillNames = (sections.skills ?? []).slice(0, 8).map((s) => s.name).filter(Boolean).join(", ")

      resumeContext = [
        name ? `Nombre del candidato: ${name}` : "",
        currentRole ? `Puesto actual/objetivo: ${currentRole}` : "",
        summaryText ? `Resumen profesional: ${summaryText}` : "",
        expLines ? `Experiencia laboral:\n${expLines}` : "",
        skillNames ? `Habilidades: ${skillNames}` : "",
      ].filter(Boolean).join("\n")
    }
  }

  const toneLabel = tone === "formal" ? "formal y profesional" : tone === "creative" ? "creativo y dinámico" : "equilibrado y cercano"

  const prompt = `Eres un experto en redacción de cartas de presentación profesionales para procesos de selección de personal.

Genera el cuerpo de una carta de presentación en tono ${toneLabel} para el siguiente candidato y puesto.

${resumeContext ? `=== DATOS DEL CANDIDATO ===\n${resumeContext}\n` : ""}
=== PUESTO AL QUE APLICA ===
Empresa: ${company}
${jobTitle ? `Puesto: ${jobTitle}` : ""}
${recipientName ? `Destinatario: ${recipientName}${recipientTitle ? `, ${recipientTitle}` : ""}` : ""}

Instrucciones para la carta:
- Escribe SOLO el cuerpo de la carta (sin saludo, sin despedida, sin fecha)
- Entre 3 y 4 párrafos concisos
- Párrafo 1: por qué el candidato está interesado en esta empresa/puesto específico
- Párrafo 2: logros y experiencia más relevante para el puesto
- Párrafo 3: qué valor aportaría al equipo
- Párrafo 4 (opcional): cierre motivador con llamada a la acción
- Usa el mismo idioma que los datos del candidato (español o inglés)
- Sé específico, evita clichés genéricos
- No inventes datos que no están en el CV

Responde ÚNICAMENTE con un JSON: {"body": "<cuerpo de la carta>"}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
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
