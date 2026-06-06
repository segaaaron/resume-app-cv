// lib/services/ai/modules/AISummaryModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL,
  AI_TEMPERATURE,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, resolveLanguage } from "../shared/ai-helpers"
import { computeCostUsd } from "../shared/cost-tracker"
import {
  AI_INPUT_LIMITS,
  type GenerateSummaryInput,
  type ImproveSummaryInput,
  type VersionsResult,
} from "../shared/ai-types"

export class AISummaryModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async generateSummary(userId: string, input: GenerateSummaryInput, plan: string): Promise<VersionsResult> {
    await enforceAIQuota(userId, "generate-summary", plan)

    const { sectionData, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const resumeContext = buildResumeContext(sectionData ?? {}, language)
    if (!resumeContext.trim()) throw new AppError("not_enough_data", 400)

    const validation = validateAIInput(resumeContext, AI_INPUT_LIMITS.resumeContext)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    const prompt = language === "en"
      ? `TASK: Analyze this professional profile and generate 3 high-impact resume summaries, each with a different positioning.

=== CANDIDATE PROFILE ===
${resumeContext}

PHASE 1 — INTERNAL DIAGNOSIS (do not include in response, use to guide writing):
• Seniority level: detect from experience and responsibilities (Junior <2yr / Mid 2-5yr / Senior 5-10yr / Lead/Director 10yr+)
• Primary sector and industry
• 2-3 unique differentiators: what this candidate has that others in their role don't
• Most impactful achievement (with figure if exists, placeholder if not)
• Key ATS keywords for the sector to include naturally

PHASE 2 — GENERATE 3 VERSIONS (include in JSON response):

Version 1 — EXECUTIVE: Positions candidate as a senior expert. Emphasis on business impact, leadership and scale. Tone: authority, decisiveness, results. Exactly 3 sentences.

Version 2 — SPECIALIST: Emphasis on technical or functional expertise specific to the sector. Include key tools, methodologies or technologies if applicable. Tone: precise, competent, no filler. 2-3 sentences.

Version 3 — VALUE PROPOSITION: Focuses on what the candidate brings to their next team. Combines past achievement + differential skill + future value. Tone: dynamic, forward-looking, impact-oriented. 3 sentences.

ABSOLUTE RULES:
• Impact verbs: Led, Developed, Transformed, Scaled, Optimized, Implemented, Drove, Designed. NEVER: "Responsible for", "Passionate about", "Looking for new challenges", "Experienced in", "Team player".
• No personal pronouns (I, My, I am). Third person or impersonal form.
• If no metrics in profile: use [X years], [N projects], [X%], [N teams] as placeholders. NEVER invent real figures.
• Each version must feel written by the candidate — personal and authentic, not AI-generated.

Respond ONLY with valid JSON (no markdown, no explanations):
{"versions": ["version1", "version2", "version3"]}`
      : `TAREA: Analiza este perfil profesional y genera 3 resúmenes de CV de alto impacto, cada uno con posicionamiento diferente.

=== PERFIL DEL CANDIDATO ===
${resumeContext}

FASE 1 — DIAGNÓSTICO INTERNO (no incluir en respuesta, solo usar para informar la escritura):
• Nivel de seniority: detecta según años de experiencia y responsabilidades (Junior <2 años / Mid 2-5 / Senior 5-10 / Lead/Director 10+)
• Sector e industria principal del candidato
• 2-3 diferenciadores únicos: qué tiene este candidato que otros en su rol no tienen
• Logro más impactante del perfil (con cifra si existe, con placeholder si no)
• Keywords ATS clave del sector para incluir de forma natural

FASE 2 — GENERA 3 VERSIONES (incluir en respuesta JSON):

Versión 1 — EJECUTIVA: Posiciona al candidato como experto de alto nivel. Énfasis en impacto de negocio, liderazgo y escala. Tono: autoridad, decisión y resultados. Exactamente 3 oraciones.

Versión 2 — ESPECIALISTA: Énfasis en expertise técnico o funcional específico del sector. Si aplica: incluye herramientas, metodologías o tecnologías clave. Tono: preciso, competente, sin relleno. 2-3 oraciones.

Versión 3 — PROPUESTA DE VALOR: Enfoca en lo que el candidato aporta a su próximo equipo. Combina logro pasado + habilidad diferencial + valor futuro. Tono: dinámico, propositivo, orientado al impacto. 3 oraciones.

REGLAS ABSOLUTAS:
• Verbos de impacto: Lideró, Desarrolló, Transformó, Escaló, Optimizó, Implementó, Impulsó, Diseñó. NUNCA: "Responsable de", "Apasionado por", "Con experiencia en", "Busca", "Está interesado en".
• Sin pronombres personales (Yo, Mi, Soy). Tercera persona o forma impersonal.
• Si no hay métricas en el perfil: usa [X años], [N proyectos], [X%], [N equipos] como placeholders. NUNCA inventes cifras reales.
• Cada versión debe sonar escrita por el candidato — personal y auténtica, no genérica.

Responde ÚNICAMENTE con JSON válido (sin markdown, sin explicaciones):
{"versions": ["version1", "version2", "version3"]}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 600,
      temperature: AI_TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite especializado en escritura de resúmenes profesionales que consiguen entrevistas en empresas top. " +
            "Tu método: analizar el perfil completo del candidato, identificar su nivel real de seniority, extraer sus diferenciadores únicos y construir resúmenes que posicionan al candidato como la opción ideal para su sector. " +
            "Cada resumen debe sonar personal y auténtico — escrito por el candidato, no generado por IA. " +
            "Usas la fórmula: [Título] con [logro clave] especializado en [área], que ha [verbo de logro] [resultado] mediante [diferenciador]. " +
            "SOLO respondes con perfiles profesionales reales. Cuando no hay métricas, usas placeholders explícitos entre corchetes ([X años], [X%]). NUNCA inventas cifras. " +
            "Si los datos no corresponden a un perfil profesional real, responde únicamente con: {\"versions\": []} sin texto adicional. " +
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

    const usage = response.usage
    logAIUsage(userId, "generate-summary", {
      model: AI_MODEL,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
    })
    return { versions: (parsed.versions as string[]).slice(0, 3) }
  }

  async improveSummary(userId: string, input: ImproveSummaryInput, plan: string): Promise<VersionsResult> {
    await enforceAIQuota(userId, "improve-summary", plan)

    const { summary, userDescription, sectionData, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const hasSummary = summary && typeof summary === "string" && summary.trim().length > 10
    const hasDescription = userDescription && typeof userDescription === "string" && userDescription.trim().length >= 5

    if (!hasSummary && !hasDescription) throw new AppError("missing_content", 400)

    if (hasSummary) {
      const validation = validateAIInput(summary!, AI_INPUT_LIMITS.summary)
      if (!validation.valid) throw new AppError("invalid_input", 400)
    }
    if (hasDescription) {
      const validation = validateAIInput(userDescription!, AI_INPUT_LIMITS.userDescription)
      if (!validation.valid) throw new AppError("invalid_input", 400)
    }

    const resumeContext = sectionData ? buildResumeContext(sectionData, language) : ""

    const prompt = language === "en"
      ? hasSummary
        ? `STEP 0 — QUALITY CHECK: Evaluate if this summary already has: (a) strong action verb or role title at start, (b) at least one metric or explicit placeholder [X%], (c) no clichés ("passionate", "team player", "looking for"), (d) 60-120 words, (e) no personal pronouns. If ALL criteria are met → return {"status": "already_optimized", "versions": []} immediately.

TASK: Analyze the current summary and identify its weaknesses. Generate 3 improved versions, each with a different positioning.

${hasDescription ? `Candidate instruction: "${userDescription!.trim()}"` : ""}
${resumeContext ? `\nResume context:\n${resumeContext}` : ""}

Current summary to improve:
"${summary!.trim()}"

DIAGNOSIS (use internally to guide writing):
• Detect: clichés, weak phrases, passive voice, low-impact verbs
• Identify: hidden achievements that can be amplified with metrics or placeholders
• Extract: candidate's real differentiator in their sector

GENERATE 3 IMPROVED VERSIONS:

Version 1 — EXECUTIVE (exactly 3 sentences): Emphasis on business impact, leadership and quantifiable results. Direct tone, no filler. Positions as senior expert.

Version 2 — SPECIALIST (2-3 sentences): Emphasis on technical/functional expertise specific to the sector. Includes key tools, methodologies or technologies from the CV or original summary.

Version 3 — VALUE PROPOSITION (3 sentences): Combines most impactful past achievement + differential skill + value the candidate will bring to the next company. Dynamic and forward-looking tone.

ABSOLUTE RULES:
• Preserve real metrics from the original. If none: use [X years], [N projects], [X%], [$Z]. NEVER invent figures.
• PROHIBITED: "Responsible for", "Passionate about", "Looking for new challenges", "Experienced in", "Team player".
• No personal pronouns (I, My, I am). Third person or impersonal.
• Impact verbs: Led, Developed, Transformed, Scaled, Optimized, Implemented, Drove.

Respond ONLY with valid JSON (no markdown):
{"versions": ["version1", "version2", "version3"]}`
        : `TASK: Create a high-impact professional summary from scratch based on the candidate's description. Return 3 distinct versions.

Candidate description: "${userDescription!.trim()}"
${resumeContext ? `\nResume context:\n${resumeContext}` : ""}

GENERATE 3 VERSIONS:

Version 1 — EXECUTIVE (3 sentences): Positioning as a senior expert in their area. Emphasis on impact and leadership.

Version 2 — SPECIALIST (2-3 sentences): Emphasis on technical/functional stack or the most specific area of expertise the candidate mentions.

Version 3 — VALUE PROPOSITION (3 sentences): Focuses on what the candidate brings to their next team. Combines skills + vision of future value.

RULES:
• If the candidate didn't specify metrics: use [X years], [N projects], [X%] as placeholders. NEVER invent figures.
• No personal pronouns. No clichés. Impact verbs first.
• Each version must sound authentic — personal, not generic.

Respond ONLY with valid JSON (no markdown):
{"versions": ["version1", "version2", "version3"]}`
      : hasSummary
        ? `PASO 0 — EVALUACIÓN DE CALIDAD: Evalúa si este resumen ya tiene: (a) verbo de acción fuerte o título de rol al inicio, (b) al menos una métrica o placeholder explícito [X%], (c) sin clichés ("apasionado", "trabajo en equipo", "busco"), (d) 60-120 palabras, (e) sin pronombres personales. Si TODOS los criterios se cumplen → devuelve {"status": "already_optimized", "versions": []} inmediatamente.

TAREA: Analiza el resumen actual e identifica sus debilidades. Genera 3 versiones mejoradas, cada una con posicionamiento diferente.

${hasDescription ? `Instrucción del candidato: "${userDescription!.trim()}"` : ""}
${resumeContext ? `\nContexto del CV:\n${resumeContext}` : ""}

Resumen actual a mejorar:
"${summary!.trim()}"

DIAGNÓSTICO (usa internamente para guiar las versiones):
• Detecta: clichés, frases débiles, voz pasiva, verbos sin impacto
• Identifica: logros ocultos que pueden amplificarse con métricas o placeholders
• Extrae: diferenciador real del candidato en su sector

GENERA 3 VERSIONES MEJORADAS:

Versión 1 — EJECUTIVA (3 oraciones exactas): Énfasis en impacto de negocio, liderazgo y resultados cuantificables. Tono directo, sin relleno. Posiciona como experto senior.

Versión 2 — ESPECIALISTA (2-3 oraciones): Énfasis en expertise técnico/funcional específico del sector. Incluye herramientas, metodologías o tecnologías clave mencionadas en el CV o resumen original.

Versión 3 — PROPUESTA DE VALOR (3 oraciones): Combina logro más impactante del pasado + habilidad diferencial + valor que aportará a la próxima empresa. Tono dinámico y propositivo.

REGLAS ABSOLUTAS:
• Conserva métricas reales del original. Si no hay: usa [X años], [N proyectos], [X%], [$Z]. NUNCA inventes cifras.
• PROHIBIDO: "Responsable de", "Apasionado por", "Busco nuevos retos", "Con experiencia en", "Equipo de trabajo".
• Sin pronombres personales (Yo, Mi, Soy). Tercera persona o impersonal.
• Verbos de impacto: Lideró, Desarrolló, Transformó, Escaló, Optimizó, Implementó, Impulsó.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"versions": ["version1", "version2", "version3"]}`
        : `TAREA: Crea un resumen profesional de alto impacto desde cero, basado en la descripción del candidato. Devuelve 3 versiones distintas.

Descripción del candidato: "${userDescription!.trim()}"
${resumeContext ? `\nContexto del CV:\n${resumeContext}` : ""}

GENERA 3 VERSIONES:

Versión 1 — EJECUTIVA (3 oraciones): Posicionamiento como experto senior en su área. Énfasis en impacto y liderazgo.

Versión 2 — ESPECIALISTA (2-3 oraciones): Énfasis en stack técnico/funcional o área de expertise más específica que menciona el candidato.

Versión 3 — PROPUESTA DE VALOR (3 oraciones): Enfoca en qué aporta el candidato a su próximo equipo. Combina habilidades + visión de valor futuro.

REGLAS:
• Si el candidato no especificó métricas: usa [X años], [N proyectos], [X%] como placeholders. NUNCA inventes cifras.
• Sin pronombres personales. Sin clichés. Verbos de impacto al inicio.
• Cada versión debe sonar auténtica — personal, no genérica.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"versions": ["version1", "version2", "version3"]}`

    const response = await this.aiClient.chat({
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
    const parsed = parseAIJson<{ versions?: unknown; status?: unknown }>(raw)

    if (parsed.status === "already_optimized") {
      const usage = response.usage
      logAIUsage(userId, "improve-summary", {
        model: AI_MODEL,
        plan,
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        costUsd: computeCostUsd(AI_MODEL, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
      })
      return { status: "already_optimized", versions: [] }
    }

    if (!Array.isArray(parsed.versions)) throw new AppError("invalid_response_format", 500)
    if (parsed.versions.length === 0) {
      throw new AppError("off_topic", 422)
    }

    const usage = response.usage
    logAIUsage(userId, "improve-summary", {
      model: AI_MODEL,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
    })
    return { versions: (parsed.versions as string[]).slice(0, 3) }
  }
}
