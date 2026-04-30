import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import { getOpenAI, AI_MODEL, AI_TEMPERATURE, checkRateLimit, logAIUsage, buildResumeContext } from "@/lib/ai-client"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!await checkRateLimit(session.user.id, "generate-summary")) {
    return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true },
  })

  if (user?.plan !== "PRO" || user?.subscriptionStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const body = await req.json()
  const language = body.language === "en" ? "en" : "es"
  const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

  // Accept either a full sectionData object or individual fields
  const sectionData = body.sectionData ?? body
  const resumeContext = buildResumeContext(sectionData)

  if (!resumeContext.trim()) {
    return NextResponse.json({ error: "Not enough data" }, { status: 400 })
  }

  // Validate free-text inputs for prompt injection
  const validation = validateAIInput(resumeContext, 5000)
  if (!validation.valid && validation.error === "injection_detected") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }

  const prompt = `TAREA: Genera 3 versiones de resumen profesional de alto impacto para un CV, basadas en los siguientes datos del candidato.

${resumeContext}

REGLAS DE ORO (aplica todas):
1. Fórmula de posicionamiento: "[Título profesional] con [X años/logro clave] especializado en [área]. Ha [verbo de logro] [resultado medible] mediante [diferenciador único]."
2. Verbos de logro: Lideró, Desarrolló, Impulsó, Optimizó, Transformó. NUNCA uses "Responsable de" o "Con experiencia en".
3. Métricas: si los datos no incluyen cifras, usa placeholders explícitos entre corchetes ([X años], [N equipos], [X%]). NUNCA inventes números reales.
4. Sin pronombres personales: no uses "Yo", "Mi", "Soy". El resumen habla del candidato en tercera persona o de forma impersonal.
5. ATS-Friendly: incluye palabras clave del sector del candidato de forma natural.
6. Longitud: 2 a 4 oraciones máximo. Denso en valor, sin relleno.
7. Idioma: mismo idioma que predomina en los datos.

Genera exactamente 3 versiones con estos tonos:
- Versión 1: Formal y ejecutiva
- Versión 2: Equilibrada y directa
- Versión 3: Dinámica y orientada al impacto

Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown, sin explicaciones):
{"versions": ["version1", "version2", "version3"]}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      max_tokens: 500,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite y experto en optimización de ATS (Applicant Tracking Systems). " +
            "Tu especialidad es crear resúmenes profesionales de alto impacto que posicionan al candidato como la opción ideal para su industria. " +
            "Usas la fórmula: [Título] con [logro clave] especializado en [área], que ha [verbo de logro] [resultado] mediante [diferenciador]. " +
            "SOLO respondes con perfiles profesionales reales. Cuando no hay métricas, usas placeholders explícitos entre corchetes ([X años], [X%]). NUNCA inventas cifras. " +
            "Si los datos no corresponden a un perfil profesional real, responde únicamente con: {\"versions\": []} sin texto adicional. " +
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

    logAIUsage(session.user.id, "generate-summary")
    return NextResponse.json({ versions: parsed.versions.slice(0, 3) })
  } catch {
    return NextResponse.json({ error: "Error al generar el resumen" }, { status: 500 })
  }
}
