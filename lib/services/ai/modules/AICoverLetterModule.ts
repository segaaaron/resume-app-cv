// lib/services/ai/modules/AICoverLetterModule.ts
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL,
  AI_TEMPERATURE_CREATIVE,
  AI_TEMPERATURE_STRUCTURED,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, escapeHtml, resolveLanguage, detectHallucination, stripVersionLabel } from "../shared/ai-helpers"
import { computeCostUsd } from "../shared/cost-tracker"
import {
  AI_INPUT_LIMITS,
  type CoverLetterResult,
  type GenerateCoverLetterInput,
  type ImproveCoverLetterInput,
  type VersionsResult,
} from "../shared/ai-types"

export class AICoverLetterModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async generateCoverLetter(userId: string, input: GenerateCoverLetterInput, plan: string): Promise<CoverLetterResult> {
    await enforceAIQuota(userId, "generate-cover-letter", plan)

    const { resumeId, recipientName, recipientTitle, company, jobTitle, tone, language: rawLanguage, userPrompt } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const userText = [company, jobTitle, recipientName, recipientTitle, userPrompt].filter(Boolean).join(" ")
    const validation = validateAIInput(userText, AI_INPUT_LIMITS.userText)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    if (company) { const v = validateAIInput(company, AI_INPUT_LIMITS.company); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (recipientName) { const v = validateAIInput(recipientName, AI_INPUT_LIMITS.recipientName); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (jobTitle) { const v = validateAIInput(jobTitle, AI_INPUT_LIMITS.jobTitle); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (userPrompt) { const v = validateAIInput(userPrompt, AI_INPUT_LIMITS.userPrompt); if (!v.valid) throw new AppError("invalid_input", 400) }

    let resumeContext = ""
    if (resumeId) {
      const resume = await db.resume.findFirst({
        where: { id: resumeId, userId },
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

    const response = await this.aiClient.chat({
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
    const parsed = parseAIJson<{ body: string }>(raw)

    if (typeof parsed.body !== "string") throw new AppError("invalid_response_format", 500)
    if (parsed.body.trim() === "") {
      throw new AppError("off_topic", 422)
    }

    const html = parsed.body
      .split(/\n\n+/)
      .map((p: string) => `<p>${p.split(/\n/).map(escapeHtml).join("<br>").trim()}</p>`)
      .join("")

    const genUsage = response.usage
    logAIUsage(userId, "generate-cover-letter", {
      model: AI_MODEL,
      plan,
      promptTokens: genUsage?.prompt_tokens ?? 0,
      completionTokens: genUsage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, genUsage?.prompt_tokens ?? 0, genUsage?.completion_tokens ?? 0),
    })
    return { body: html }
  }

  async improveCoverLetter(userId: string, input: ImproveCoverLetterInput, plan: string): Promise<VersionsResult> {
    await enforceAIQuota(userId, "improve-cover-letter", plan)

    const { body, company, jobTitle, recipientTitle, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const validation = validateAIInput(body, AI_INPUT_LIMITS.body)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    if (company) { const v = validateAIInput(company, AI_INPUT_LIMITS.company); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (jobTitle) { const v = validateAIInput(jobTitle, AI_INPUT_LIMITS.jobTitle); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (recipientTitle) { const v = validateAIInput(recipientTitle, AI_INPUT_LIMITS.recipientTitle); if (!v.valid) throw new AppError("invalid_input", 400) }

    const context = language === "en"
      ? [
          company ? `Company: ${company}` : "",
          jobTitle ? `Role: ${jobTitle}` : "",
          recipientTitle ? `Recipient: ${recipientTitle}` : "",
        ].filter(Boolean).join(" | ")
      : [
          company ? `Empresa: ${company}` : "",
          jobTitle ? `Puesto: ${jobTitle}` : "",
          recipientTitle ? `Destinatario: ${recipientTitle}` : "",
        ].filter(Boolean).join(" | ")

    const prompt = language === "en"
      ? `CRITICAL ANTI-HALLUCINATION RULES (mandatory, no exceptions):
1. ONLY rewrite using information already present in the current letter and the context above. Do NOT introduce technologies, frameworks, company names, job titles, certifications, percentages, real numbers, or dates not present in the source.
2. Preserve real metrics from the original. If none exist, use ONLY the documented placeholders [X%], [N projects], [$Z]. Never replace placeholders with invented figures.
3. If a version would require fabricating content to be impactful, prefer a shorter, conservative rewrite anchored to the source.

TASK: Improve this cover letter body and generate 3 optimized versions.

${context ? `Context: ${context}` : ""}
Current letter:
${body}

GOLDEN RULES (apply all):
1. Keep the 3-4 paragraph structure: hook → relevant achievements → value proposition → closing CTA.
2. Eliminate clichés ("I am a proactive person", "I am passionate about teamwork"). Replace with concrete achievements.
3. Impact verbs: Led, Developed, Optimized, Implemented, Grew, Drove. NEVER use "Responsible for".
4. If the original has metrics, preserve them. If not, use explicit placeholders [X%], [N projects], [$Z]. NEVER invent real figures.
5. Each version must have a distinct tone:
   - Version 1: Formal and executive
   - Version 2: Balanced and direct
   - Version 3: Dynamic and impact-oriented
6. Maximum 4 paragraphs per version. Maximum 200 words per version. Dense in value, no filler.

Respond ONLY with valid JSON (no markdown, no explanations):
{"versions": ["version1", "version2", "version3"]}`
      : `REGLAS CRÍTICAS ANTI-ALUCINACIÓN (obligatorias, sin excepciones):
1. SOLO reescribe usando información ya presente en la carta actual y el contexto de arriba. NO introduzcas tecnologías, frameworks, nombres de empresas, cargos, certificaciones, porcentajes, números reales ni fechas no presentes en el source.
2. Conserva métricas reales del original. Si no las hay, usa ÚNICAMENTE los placeholders documentados [X%], [N proyectos], [$Z]. Nunca sustituyas placeholders por cifras inventadas.
3. Si una versión requiere fabricar contenido para ser impactante, prefiere una reescritura más corta y conservadora anclada al source.

TAREA: Mejora el siguiente cuerpo de carta de presentación y genera 3 versiones optimizadas.

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
6. Máximo 4 párrafos por versión. Cada versión máximo 200 palabras. Denso en valor, sin relleno.

Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown, sin explicaciones):
{"versions": ["version1", "version2", "version3"]}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 1000,
      // improve-cover-letter uses 0.3 — must stay close to the original body
      // and avoid inventing metrics or technologies.
      temperature: AI_TEMPERATURE_STRUCTURED,
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
    const parsed = parseAIJson<{ versions?: unknown }>(raw)

    if (!Array.isArray(parsed.versions)) throw new AppError("invalid_response_format", 500)
    if (parsed.versions.length === 0) {
      throw new AppError("off_topic", 422)
    }

    // Anti-hallucination filter — source = original body + context fields.
    const source = [body, company ?? "", jobTitle ?? "", recipientTitle ?? ""].join("\n")
    const rawVersions = (parsed.versions as unknown[]).slice(0, 3)
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map(stripVersionLabel)
      .filter((v) => v.trim().length > 0)
    let droppedVersions = 0
    const cleanVersions = rawVersions.filter((v) => {
      if (detectHallucination(v, source, { allowPlaceholders: true })) {
        droppedVersions++
        return false
      }
      return true
    })

    if (droppedVersions > 0) {
      this.logger.warn("[AIService.improveCoverLetter] dropped hallucinated versions", {
        droppedVersions,
        keptVersions: cleanVersions.length,
      })
    }

    const improveUsage = response.usage
    logAIUsage(userId, "improve-cover-letter", {
      model: AI_MODEL,
      plan,
      promptTokens: improveUsage?.prompt_tokens ?? 0,
      completionTokens: improveUsage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, improveUsage?.prompt_tokens ?? 0, improveUsage?.completion_tokens ?? 0),
    })

    // Fail-safe: if every version was dropped, fall back to the original body
    // so the frontend never receives invented content.
    if (cleanVersions.length === 0) {
      return { versions: [body.trim()], status: "already_optimized" }
    }
    return { versions: cleanVersions }
  }
}
