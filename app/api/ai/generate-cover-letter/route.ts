import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import { getOpenAI, AI_MODEL, AI_TEMPERATURE_CREATIVE, checkRateLimit, logAIUsage, buildResumeContext } from "@/lib/ai-client"
import { checkOrigin } from "@/lib/csrf"
import { isActive } from "@/lib/plans"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (!await checkRateLimit(session.user.id, "generate-cover-letter")) {
    return NextResponse.json({ error: "rate_limit_exceeded" }, { status: 429 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
  })

  if (!isActive(user?.plan ?? "UNSUBSCRIBED", user?.subscriptionEndsAt, user?.subscriptionStatus)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const { resumeId, recipientName, recipientTitle, company, jobTitle, tone, language: rawLanguage, userPrompt } = await req.json()
  const language = rawLanguage === "en" ? "en" : "es"
  const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

  // Validate free-text inputs for prompt injection
  const userText = [company, jobTitle, recipientName, recipientTitle, userPrompt].filter(Boolean).join(" ")
  const validation = validateAIInput(userText, 3000)
  if (!validation.valid) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 })
  }

  // Load resume data — personalDetails field stores the full sectionData object
  let resumeContext = ""
  if (resumeId) {
    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId: session.user.id },
      select: { personalDetails: true },
    })
    if (resume?.personalDetails) {
      resumeContext = buildResumeContext(resume.personalDetails as Record<string, unknown>)
    }
  }

  const toneMap = {
    formal: language === "en" ? "formal and professional" : "formal y profesional",
    creative: language === "en" ? "dynamic, confident and creative" : "dinámico, seguro y creativo",
    balanced: language === "en" ? "warm, professional and conversational" : "equilibrado, cercano y profesional",
  }
  const toneLabel = toneMap[(tone as keyof typeof toneMap)] ?? toneMap.balanced

  const prompt = language === "en"
    ? `You are a senior career coach and professional writer specializing in cover letters that get interviews at top companies.

Write a complete, compelling cover letter body for the following candidate and position. This letter must feel personal, specific, and tailored — not generic. It should demonstrate clear understanding of the role and convincingly show why this candidate is the right fit.

${resumeContext ? `=== CANDIDATE PROFILE ===\n${resumeContext}\n` : ""}${userPrompt ? `=== CANDIDATE DESCRIPTION (use this as primary context) ===\n${userPrompt}\n` : ""}
=== TARGET POSITION ===
${company ? `Company: ${company}` : ""}
${jobTitle ? `Role: ${jobTitle}` : ""}
${recipientName ? `Hiring Manager: ${recipientName}${recipientTitle ? `, ${recipientTitle}` : ""}` : ""}

Tone: ${toneLabel}

Write 4 strong paragraphs:
1. HOOK — Open with a specific, compelling reason why this candidate wants THIS role at THIS company. Reference something concrete about the company or the role. No generic openers like "I am writing to apply...".
2. EXPERIENCE & ACHIEVEMENTS — Highlight 2–3 specific accomplishments from the candidate's background that are directly relevant to this role. Use concrete details from the resume (technologies, companies, impact). Quantify where possible.
3. VALUE PROPOSITION — Explain exactly what the candidate brings to the team that others don't. Connect their unique skills and experience to the company's likely challenges or goals.
4. CLOSING CTA — End with a confident, warm call to action. Express genuine enthusiasm and invite next steps.

Rules:
- Write ONLY the body (no salutation, no date, no signature block)
- Do NOT use placeholder text like [Company] or [Name] — use the actual values provided
- Do NOT invent facts, metrics, or experiences not present in the candidate profile
- Use [X%] only if the candidate mentions achievements without specific numbers
- Avoid clichés: "passionate", "team player", "hard worker", "I believe", "I am excited to..."
- Each paragraph must be 3–5 sentences, substantive and specific
- The letter must feel written by a human, not AI

Respond ONLY with JSON: {"body": "<full letter body with paragraph breaks using \\n\\n>"}`
    : `Eres un redactor senior especializado en cartas de presentación que consiguen entrevistas en empresas top. Tienes años de experiencia ayudando a profesionales a destacar en procesos de selección.

Escribe el cuerpo completo de una carta de presentación para el siguiente candidato y puesto. La carta debe sentirse personal, específica y totalmente adaptada — no genérica. Debe demostrar comprensión real del rol y convencer de forma genuina por qué este candidato es la persona indicada.

${resumeContext ? `=== PERFIL DEL CANDIDATO ===\n${resumeContext}\n` : ""}${userPrompt ? `=== DESCRIPCIÓN DEL CANDIDATO (usa esto como contexto principal) ===\n${userPrompt}\n` : ""}
=== PUESTO OBJETIVO ===
${company ? `Empresa: ${company}` : ""}
${jobTitle ? `Puesto: ${jobTitle}` : ""}
${recipientName ? `Responsable de selección: ${recipientName}${recipientTitle ? `, ${recipientTitle}` : ""}` : ""}

Tono: ${toneLabel}

Escribe 4 párrafos sólidos:
1. GANCHO — Abre con una razón específica y convincente de por qué este candidato quiere ESTE puesto en ESTA empresa. Referencia algo concreto del rol o la empresa. Nada genérico como "Me dirijo a usted para...".
2. EXPERIENCIA Y LOGROS — Destaca 2–3 logros concretos del perfil del candidato directamente relevantes para este puesto. Usa detalles reales del CV (tecnologías, empresas, impacto). Cuantifica donde sea posible.
3. PROPUESTA DE VALOR — Explica exactamente qué aporta este candidato que otros no tienen. Conecta sus habilidades únicas con los desafíos u objetivos probables de la empresa.
4. CIERRE Y CTA — Cierra con una llamada a la acción segura y cálida. Expresa entusiasmo genuino e invita a dar los próximos pasos.

Reglas:
- Escribe SOLO el cuerpo (sin saludo, sin fecha, sin bloque de firma)
- NO uses placeholders como [Empresa] o [Nombre] — usa los valores reales proporcionados
- NO inventes datos, métricas ni experiencias que no estén en el perfil del candidato
- Usa [X%] solo si el candidato menciona logros sin cifras concretas
- Evita clichés: "apasionado", "trabajo en equipo", "me motiva", "creo firmemente", "estoy emocionado de..."
- Cada párrafo debe tener 3–5 oraciones, sustanciales y específicas
- La carta debe sonar escrita por un humano, no por IA

Responde ÚNICAMENTE con JSON: {"body": "<cuerpo completo con saltos de párrafo usando \\n\\n>"}`

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_MODEL,
      max_tokens: 900,
      temperature: AI_TEMPERATURE_CREATIVE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente especializado EXCLUSIVAMENTE en redacción de cartas de presentación profesionales para búsqueda de empleo. " +
            "Solo debes generar contenido relacionado con candidaturas laborales y experiencia profesional. " +
            "Si la solicitud no corresponde a una carta de presentación laboral real, responde únicamente con: {\"body\": \"\"} sin texto adicional. " +
            langInstruction,
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

    function escapeHtml(str: string): string {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    }
    const html = parsed.body
      .split(/\n\n+/)
      .map((p: string) => `<p>${p.split(/\n/).map(escapeHtml).join("<br>").trim()}</p>`)
      .join("")

    logAIUsage(session.user.id, "generate-cover-letter")
    return NextResponse.json({ body: html })
  } catch {
    return NextResponse.json({ error: "Error al generar la carta" }, { status: 500 })
  }
}
