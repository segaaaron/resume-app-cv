import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import { getOpenAI, AI_MODEL, AI_TEMPERATURE, checkRateLimit, logAIUsage, buildResumeContext } from "@/lib/ai-client"
import { checkOrigin } from "@/lib/csrf"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (!await checkRateLimit(session.user.id, "improve-summary")) {
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

  const { summary, userDescription, sectionData, language: rawLanguage } = await req.json()
  const language = rawLanguage === "en" ? "en" : "es"
  const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

  const hasSummary = summary && typeof summary === "string" && summary.trim().length > 10
  const hasDescription = userDescription && typeof userDescription === "string" && userDescription.trim().length >= 5

  if (!hasSummary && !hasDescription) {
    return NextResponse.json({ error: "Proporciona el resumen actual o describe tu perfil profesional" }, { status: 400 })
  }

  if (hasSummary) {
    const validation = validateAIInput(summary, 3000)
    if (!validation.valid) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 })
    }
  }

  if (hasDescription) {
    const validation = validateAIInput(userDescription, 500)
    if (!validation.valid) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 })
    }
  }

  const resumeContext = sectionData ? buildResumeContext(sectionData) : ""

  const prompt = hasSummary
    ? `TAREA: Revisa y mejora el siguiente resumen profesional. Devuelve 3 versiones optimizadas.

${hasDescription ? `Instrucción adicional del candidato: "${userDescription.trim()}"` : ""}
${resumeContext ? `\nContexto del CV:\n${resumeContext}` : ""}

Resumen actual:
${summary.trim()}

INSTRUCCIONES:
1. Detecta y corrige errores de redacción, clichés y frases débiles.
2. Usa verbos de impacto: Desarrollé, Lideré, Optimicé, Implementé, Especializo.
3. Sin pronombres personales excesivos. Orientado a logros y valor aportado.
4. Si hay métricas en el original, consérvelas. Si no las hay, usa placeholders [X años], [N proyectos]. NUNCA inventes cifras.
5. Cada versión con un enfoque diferente:
   - Versión 1: Concisa y ejecutiva (2-3 oraciones potentes)
   - Versión 2: Técnica y detallada (habilidades + stack + logros)
   - Versión 3: Orientada al impacto de negocio y resultados

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"versions": ["version1", "version2", "version3"]}`
    : `TAREA: Crea un resumen profesional desde cero basado en la descripción del candidato. Devuelve 3 versiones.

Descripción del candidato: "${userDescription.trim()}"
${resumeContext ? `\nContexto del CV:\n${resumeContext}` : ""}

INSTRUCCIONES:
1. 3-4 oraciones por versión. Denso en valor, sin relleno.
2. Verbos de impacto: Especializo, Desarrollo, Lidero, Implemento.
3. Usa placeholders [X años], [N proyectos] si el candidato no especificó métricas. NUNCA inventes cifras.
4. Cada versión con un enfoque diferente:
   - Versión 1: Concisa y ejecutiva
   - Versión 2: Técnica y orientada al stack/herramientas
   - Versión 3: Orientada al impacto de negocio

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"versions": ["version1", "version2", "version3"]}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      max_tokens: 700,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite especializado en redacción de resúmenes profesionales de alto impacto para CVs. " +
            "Transformas resúmenes genéricos en textos que destacan al candidato con logros concretos y lenguaje de impacto. " +
            "SOLO trabajas con resúmenes profesionales de CV y perfiles laborales reales. " +
            "Cuando no hay métricas, usas SIEMPRE placeholders explícitos entre corchetes ([X años], [N proyectos]) — NUNCA inventas cifras reales. " +
            "Si el contenido no tiene relación con un perfil profesional, responde únicamente con: {\"versions\": []} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed.versions)) throw new Error("Invalid response format")
    if (parsed.versions.length === 0) return NextResponse.json({ error: "off_topic" }, { status: 422 })

    logAIUsage(session.user.id, "improve-summary")
    return NextResponse.json({ versions: parsed.versions.slice(0, 3) })
  } catch {
    return NextResponse.json({ error: "Error al mejorar el resumen" }, { status: 500 })
  }
}
