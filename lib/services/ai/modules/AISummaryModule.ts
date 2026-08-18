// lib/services/ai/modules/AISummaryModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL_PROSE,
  AI_TEMPERATURE_GENERATIVE,
  AI_TEMPERATURE_STRUCTURED,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { cleanGeneratedText } from "../shared/clean-output"
import { parseAIJson, resolveLanguage } from "../shared/ai-helpers"
import { buildMetricGuidance, gateSummaryVersions, type GatedVersion, type SummaryGateUsage } from "../shared/summary-gate"
import { computeCostUsd } from "../shared/cost-tracker"
import { isTrivialEdit } from "../shared/text-similarity"
import { assessSummary, extractProfileMetrics, extractMetricsFromText } from "../shared/summary-quality"
import { clicheBanList } from "../shared/cliches"
import {
  AI_INPUT_LIMITS,
  type GenerateSummaryInput,
  type ImproveSummaryInput,
  type SummaryVersionType,
  type VersionsResult,
} from "../shared/ai-types"

/** The order the prompts ask for. sourceIndex maps back to the positioning. */
const VERSION_TYPES: SummaryVersionType[] = ["executive", "specialist", "value_prop"]

/** Ranked versions -> the wire shape, each keeping the label it was written as. */
function toVersionsResult(versions: GatedVersion[]): VersionsResult {
  return {
    versions: versions.map((v) => v.text),
    types: versions.map((v) => VERSION_TYPES[v.sourceIndex] ?? "executive"),
  }
}

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

    // Find the candidate's real figures in code and hand them over. Told only
    // "include the figure if the profile states one", the model went looking
    // through prose and gave up: a CV with "cutting deploy time from 40 minutes
    // to under 6" and "cut crash rate 20%" came back as "significantly enhanced
    // deployment efficiency" three times over. The strongest thing on the CV is
    // exactly what it dropped.
    const metrics = extractProfileMetrics(sectionData)
    const { block: metricBlockEN, rule: numbersRuleEN } = buildMetricGuidance(metrics, "en")
    const { block: metricBlockES, rule: numbersRuleES } = buildMetricGuidance(metrics, "es")

    const prompt = language === "en"
      ? `CRITICAL ANTI-HALLUCINATION RULES (mandatory, no exceptions):
1. ONLY use information present in the CANDIDATE PROFILE below. Do NOT introduce technologies, frameworks, company names, job titles, certifications, percentages, real numbers, or dates not present in the profile.
2. NEVER write a placeholder. No [X years], [N projects], [X%], [N teams], or anything in brackets standing in for a figure. This text is written straight into the candidate's CV and goes to recruiters as-is; a bracket left in it reads as an unfinished resume. When the profile states no figure, write the sentence WITHOUT a number — a specific, concrete claim with no metric beats a bracket.
3. If a version would require fabricating content to be impactful, prefer a shorter, more conservative version anchored to the actual profile.

TASK: Analyze this professional profile and generate 3 high-impact resume summaries, each with a different positioning.

=== CANDIDATE PROFILE ===
${resumeContext}
${metricBlockEN}

PHASE 1 — INTERNAL DIAGNOSIS (do not include in response, use to guide writing):
• Seniority level: detect from experience and responsibilities (Junior <2yr / Mid 2-5yr / Senior 5-10yr / Lead/Director 10yr+)
• Primary sector and industry
• 2-3 unique differentiators: what this candidate has that others in their role don't
• Most impactful achievement (include the figure only if the profile states one; otherwise describe the achievement without a number)
• Key ATS keywords for the sector to include naturally

PHASE 2 — GENERATE 3 VERSIONS (include in JSON response):

Version 1 — EXECUTIVE: Positions candidate as a senior expert. Emphasis on business impact, leadership and scale. Tone: authority, decisiveness, results. Exactly 3 sentences.

Version 2 — SPECIALIST: Emphasis on technical or functional expertise specific to the sector. Include key tools, methodologies or technologies if applicable. Tone: precise, competent, no filler. 2-3 sentences.

Version 3 — VALUE PROPOSITION: Focuses on what the candidate brings to their next team. Combines past achievement + differential skill + future value. Tone: dynamic, forward-looking, impact-oriented. 3 sentences.

ABSOLUTE RULES:
• Impact verbs: Led, Developed, Transformed, Scaled, Optimized, Implemented, Drove, Designed. NEVER these clichés: ${clicheBanList("en")}. Every one of them is checked and rejected — a version carrying any is thrown away.
• No personal pronouns (I, My, I am). Third person or impersonal form.
• If no metrics in profile: write without numbers. NEVER invent figures and NEVER leave a bracket like [X%] — an unfilled bracket in a CV reads as unfinished.
• Each version must feel written by the candidate — personal and authentic, not AI-generated.
• Vary sentence length and structure between the 3 versions — avoid a uniform rhythm that reads as AI. Natural, conversational voice, not a press release. Also banned: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy". Anchor claims to concrete specifics from the profile (tools, sector, real achievement) rather than vague adjectives.


${numbersRuleEN}

Respond ONLY with valid JSON. Each entry is the complete text itself, not a label:
{"versions": ["<the complete executive summary>", "<the complete specialist summary>", "<the complete value-proposition summary>"]}`
      : `REGLAS CRÍTICAS ANTI-ALUCINACIÓN (obligatorias, sin excepciones):
1. SOLO usa información presente en el PERFIL DEL CANDIDATO de abajo. NO introduzcas tecnologías, frameworks, nombres de empresas, cargos, certificaciones, porcentajes, números reales ni fechas que no estén en el perfil.
2. NUNCA escribas un placeholder. Ni [X años], ni [N proyectos], ni [X%], ni [N equipos], ni nada entre corchetes que sustituya a una cifra. Este texto se escribe directo en el CV del candidato y llega al recruiter tal cual; un corchete olvidado ahí se lee como un CV a medio hacer. Si el perfil no declara la cifra, escribe la frase SIN número — una afirmación concreta sin métrica vale más que un corchete.
3. Si una versión requiere fabricar contenido para ser impactante, prefiere una versión más corta y conservadora, anclada al perfil real.

TAREA: Analiza este perfil profesional y genera 3 resúmenes de CV de alto impacto, cada uno con posicionamiento diferente.

=== PERFIL DEL CANDIDATO ===
${resumeContext}
${metricBlockES}

FASE 1 — DIAGNÓSTICO INTERNO (no incluir en respuesta, solo usar para informar la escritura):
• Nivel de seniority: detecta según años de experiencia y responsabilidades (Junior <2 años / Mid 2-5 / Senior 5-10 / Lead/Director 10+)
• Sector e industria principal del candidato
• 2-3 diferenciadores únicos: qué tiene este candidato que otros en su rol no tienen
• Logro más impactante del perfil (incluye la cifra solo si el perfil la declara; si no, describe el logro sin número)
• Keywords ATS clave del sector para incluir de forma natural

FASE 2 — GENERA 3 VERSIONES (incluir en respuesta JSON):

Versión 1 — EJECUTIVA: Posiciona al candidato como experto de alto nivel. Énfasis en impacto de negocio, liderazgo y escala. Tono: autoridad, decisión y resultados. Exactamente 3 oraciones.

Versión 2 — ESPECIALISTA: Énfasis en expertise técnico o funcional específico del sector. Si aplica: incluye herramientas, metodologías o tecnologías clave. Tono: preciso, competente, sin relleno. 2-3 oraciones.

Versión 3 — PROPUESTA DE VALOR: Enfoca en lo que el candidato aporta a su próximo equipo. Combina logro pasado + habilidad diferencial + valor futuro. Tono: dinámico, propositivo, orientado al impacto. 3 oraciones.

REGLAS ABSOLUTAS:
• Verbos de impacto: Lideró, Desarrolló, Transformó, Escaló, Optimizó, Implementó, Impulsó, Diseñó. NUNCA estas frases, se comprueban y se rechazan: ${clicheBanList("es")}.
• Sin pronombres personales (Yo, Mi, Soy). Tercera persona o forma impersonal.
• Si no hay métricas en el perfil: escribe sin números. NUNCA inventes cifras y NUNCA dejes un corchete tipo [X%] — un corchete sin rellenar en un CV se lee como algo sin terminar.
• Cada versión debe sonar escrita por el candidato — personal y auténtica, no genérica.
• Varía el largo y la estructura de las frases entre las 3 versiones — evita un ritmo uniforme que suena a IA. Voz natural y conversacional, no nota de prensa. También prohibidas: "Orquestó", "Apalancó", "Utilizó", "sinergia", "orientado a resultados". Ancla las afirmaciones a datos concretos del perfil (herramientas, sector, logro real) en vez de adjetivos vagos.


${numbersRuleES}

Responde ÚNICAMENTE con JSON válido. Cada entrada es el texto completo en sí, no una etiqueta:
{"versions": ["<el resumen ejecutivo completo>", "<el resumen especialista completo>", "<el resumen de propuesta de valor completo>"]}`

    const response = await this.aiClient.chat({
      model: AI_MODEL_PROSE,
      max_tokens: 600,
      // generate-summary uses 0.6 to keep variety across the 3 versions while
      // staying anchored to the candidate profile.
      temperature: AI_TEMPERATURE_GENERATIVE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            (language === "en"
              ? "You are an Elite Career Consultant specialized in writing professional summaries that land interviews at top companies. " +
                "Your method: analyse the candidate's full profile, identify their real seniority level, extract their unique differentiators and build summaries that position them as the ideal fit for their sector. " +
                "Every summary must sound personal and authentic — written by the candidate, not generated by AI. "
              : "Eres un Consultor de Carrera de Élite especializado en escritura de resúmenes profesionales que consiguen entrevistas en empresas top. " +
                "Tu método: analizar el perfil completo del candidato, identificar su nivel real de seniority, extraer sus diferenciadores únicos y construir resúmenes que posicionan al candidato como la opción ideal para su sector. " +
                "Cada resumen debe sonar personal y auténtico — escrito por el candidato, no generado por IA. ") +
            // Aquí vivía una fórmula-plantilla llena de corchetes ("[Título] con
            // [logro clave]...") dos líneas antes de prohibir los corchetes. El
            // modelo recibía el patrón y la prohibición a la vez, y hacían falta
            // 24 repeticiones de NUNCA para suprimir una contradicción que
            // bastaba con borrar. La fórmula además imponía un esqueleto único,
            // chocando con "varía la estructura entre las 3 versiones".
            (language === "en"
              ? "You ONLY respond to real professional profiles. You NEVER invent figures and NEVER write bracket placeholders — when there is no metric, you write without a number. " +
                "If the data does not correspond to a real professional profile, respond only with: {\"versions\": []} and nothing else. "
              : "SOLO respondes con perfiles profesionales reales. NUNCA inventas cifras y NUNCA escribes placeholders entre corchetes — cuando no hay métrica, escribes sin número. " +
                "Si los datos no corresponden a un perfil profesional real, responde únicamente con: {\"versions\": []} sin texto adicional. ") +
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

    const gated = await gateSummaryVersions(this.aiClient, this.logger, {
      rawVersions: parsed.versions,
      source: resumeContext,
      metrics,
      basePrompt: prompt,
      langInstruction,
      language,
      temperature: AI_TEMPERATURE_GENERATIVE,
      maxTokens: 600,
      endpoint: "generate-summary",
    })

    this.logSummaryUsage(userId, "generate-summary", plan, response.usage, gated.retryUsage)

    // No previous summary to fall back to in generate-summary. If every version
    // was dropped, return empty array with a status flag so the frontend can
    // show its own empty-state — never surface invented content.
    if (gated.versions.length === 0) {
      return { versions: [], status: "already_optimized" }
    }
    // Spell-checked before it reaches the CV: this is our text, not the
    // user's, so a typo here is ours to fix rather than to report back at them.
    const cleanText = await cleanGeneratedText(gated.versions.map((v) => v.text), language)
    return toVersionsResult(gated.versions.map((v, i) => ({ ...v, text: cleanText[i] ?? v.text })))
  }

  /**
   * One endpoint, one AIUsageLog row — first attempt plus any retry.
   *
   * Split across two call sites this was already wrong once: the retry path
   * logged the FIRST response's usage, so every retry's tokens vanished from
   * the ledger and cost-per-user read low. Summing in one place is what makes
   * that unrepresentable.
   */
  private logSummaryUsage(
    userId: string,
    endpoint: "generate-summary" | "improve-summary",
    plan: string,
    usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
    retryUsage: SummaryGateUsage | null,
  ): void {
    const promptTokens = (usage?.prompt_tokens ?? 0) + (retryUsage?.promptTokens ?? 0)
    const completionTokens = (usage?.completion_tokens ?? 0) + (retryUsage?.completionTokens ?? 0)
    logAIUsage(userId, endpoint, {
      model: AI_MODEL_PROSE,
      plan,
      promptTokens,
      completionTokens,
      costUsd: computeCostUsd(AI_MODEL_PROSE, promptTokens, completionTokens),
    })
  }

  async improveSummary(userId: string, input: ImproveSummaryInput, plan: string): Promise<VersionsResult> {
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

    // Decide in code whether there is anything to improve, before spending a
    // call. The prompt's STEP 0 asks the model this same question and the model
    // never says yes — measured 0/5 on a summary meeting every criterion it
    // lists. This endpoint returns 3 versions or nothing, and "nothing" reads to
    // the model like failing the task, so it always writes three. The criteria
    // are mechanical; a regex answers them exactly, for free, every time.
    // Only when the user is polishing an existing summary — a userDescription
    // means they are asking for a rewrite from new input, which is not a
    // quality question.
    //
    // The figures are the candidate's wherever they typed them: the CV, the
    // summary in front of them, or the box they described themselves in. This
    // used to read sectionData alone, so a user with no CV who wrote "cut churn
    // 30%" stated a figure the check could not see.
    const metrics = [
      ...extractProfileMetrics(sectionData),
      ...extractMetricsFromText(summary),
      ...extractMetricsFromText(userDescription),
    ]

    if (hasSummary && !hasDescription) {
      const quality = assessSummary(summary!, metrics.length > 0)
      if (quality.alreadyGood) {
        // Deliberately before enforceAIQuota: no model was called, so this must
        // not burn one of an UNSUBSCRIBED user's two uses, and must not write an
        // AI_USED audit entry — that record exists to prove a paid service was
        // delivered, and here none was.
        return { versions: [summary!.trim()], status: "already_optimized" }
      }
    }

    await enforceAIQuota(userId, "improve-summary", plan)

    const resumeContext = sectionData ? buildResumeContext(sectionData, language) : ""
    // Same treatment generate-summary gets: hand the model the figures the
    // algorithm found instead of leaving it to hunt through prose. Measured
    // live, without this the first attempt dropped them and the retry had to
    // rescue it in 5 of 6 runs.
    const { block: metricBlock, rule: numbersRule } = buildMetricGuidance(metrics, language)

    const criticalEN = `CRITICAL ANTI-HALLUCINATION RULES (mandatory, no exceptions):
1. ONLY rewrite using information already present in the original summary, candidate instruction, or resume context above. Do NOT introduce technologies, frameworks, company names, job titles, certifications, percentages, real numbers, or dates not stated by the user.
2. Preserve real metrics from the original. If none exist, write without numbers — NEVER invent a figure and NEVER leave a bracket like [X%] or [N projects]. This text goes into the candidate's CV as-is; an unfilled bracket reads as an unfinished resume.
3. If you cannot improve a version without inventing content, return a conservative rewording that stays anchored to the source.
4. HUMAN VOICE (avoid AI-detection): vary sentence length and structure; natural, conversational tone, not a press release. Banned AI-tell words: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy", "Results-driven". Anchor to concrete specifics from the source, not vague adjectives.

`
    const criticalES = `REGLAS CRÍTICAS ANTI-ALUCINACIÓN (obligatorias, sin excepciones):
1. SOLO reescribe usando información ya presente en el resumen original, la instrucción del candidato o el contexto del CV. NO introduzcas tecnologías, frameworks, nombres de empresas, cargos, certificaciones, porcentajes, números reales ni fechas no aportadas por el usuario.
2. Conserva métricas reales del original. Si no las hay, escribe sin números — NUNCA inventes una cifra y NUNCA dejes un corchete tipo [X%] o [N proyectos]. Este texto entra en el CV del candidato tal cual; un corchete sin rellenar se lee como un CV sin terminar.
3. Si no puedes mejorar una versión sin inventar contenido, devuelve una reescritura conservadora anclada al source.
4. VOZ HUMANA (evita detección de IA): varía el largo y la estructura de las frases; tono natural y conversacional, no nota de prensa. Palabras-IA prohibidas: "Orquestó", "Apalancó", "Utilizó", "sinergia", "orientado a resultados". Ancla a datos concretos del source, no a adjetivos vagos.

`

    const prompt = language === "en"
      ? hasSummary
        ? criticalEN + `STEP 0 — QUALITY CHECK: Evaluate if this summary already has: (a) a strong action verb or role title at the start, (b) the profile's metrics, IF the profile states any — a summary with no numbers still passes this check when the profile gives none, (c) no clichés ("passionate", "team player", "looking for"), (d) no personal pronouns. If ALL applicable criteria are met → return {"status": "already_optimized", "versions": []} immediately. A summary that is already good is a correct and expected outcome.

TASK: Analyze the current summary and identify its weaknesses. Generate 3 improved versions, each with a different positioning.

${hasDescription ? `Candidate instruction: "${userDescription!.trim()}"` : ""}
${resumeContext ? `\nResume context:\n${resumeContext}` : ""}
${metricBlock}

Current summary to improve:
"${summary!.trim()}"

DIAGNOSIS (use internally to guide writing):
• Detect: clichés, weak phrases, passive voice, low-impact verbs
• Identify: hidden achievements that can be amplified using only figures the profile already states
• Extract: candidate's real differentiator in their sector

GENERATE 3 IMPROVED VERSIONS:

Version 1 — EXECUTIVE (exactly 3 sentences): Emphasis on business impact, leadership and quantifiable results. Direct tone, no filler. Positions as senior expert.

Version 2 — SPECIALIST (2-3 sentences): Emphasis on technical/functional expertise specific to the sector. Includes key tools, methodologies or technologies from the CV or original summary.

Version 3 — VALUE PROPOSITION (3 sentences): Combines most impactful past achievement + differential skill + value the candidate will bring to the next company. Dynamic and forward-looking tone.

ABSOLUTE RULES:
• Preserve real metrics from the original. If none: write without numbers. NEVER invent figures, NEVER leave brackets.
• PROHIBITED — every one is checked and rejected; a version carrying any is discarded: ${clicheBanList("en")}.
• No personal pronouns (I, My, I am). Third person or impersonal.
• Impact verbs: Led, Developed, Transformed, Scaled, Optimized, Implemented, Drove.

${numbersRule}

Respond ONLY with valid JSON. Each entry is the complete text itself, not a label:
{"versions": ["<the complete executive summary>", "<the complete specialist summary>", "<the complete value-proposition summary>"]}`
        : criticalEN + `TASK: Create a high-impact professional summary from scratch based on the candidate's description. Return 3 distinct versions.

Candidate description: "${userDescription!.trim()}"
${resumeContext ? `\nResume context:\n${resumeContext}` : ""}
${metricBlock}

GENERATE 3 VERSIONS:

Version 1 — EXECUTIVE (3 sentences): Positioning as a senior expert in their area. Emphasis on impact and leadership.

Version 2 — SPECIALIST (2-3 sentences): Emphasis on technical/functional stack or the most specific area of expertise the candidate mentions.

Version 3 — VALUE PROPOSITION (3 sentences): Focuses on what the candidate brings to their next team. Combines skills + vision of future value.

RULES:
• If the candidate didn't specify metrics: write without numbers. NEVER invent figures, NEVER leave brackets.
• No personal pronouns. Impact verbs first. Never these, they are checked and rejected: ${clicheBanList("en")}.
• Each version must sound authentic — personal, not generic.

${numbersRule}

Respond ONLY with valid JSON. Each entry is the complete text itself, not a label:
{"versions": ["<the complete executive summary>", "<the complete specialist summary>", "<the complete value-proposition summary>"]}`
      : hasSummary
        ? criticalES + `PASO 0 — EVALUACIÓN DE CALIDAD: Evalúa si este resumen ya tiene: (a) verbo de acción fuerte o título de rol al inicio, (b) las métricas del perfil, SI el perfil declara alguna — un resumen sin números pasa igual este check cuando el perfil no da ninguna, (c) sin clichés ("apasionado", "trabajo en equipo", "busco"), (d) sin pronombres personales. Si TODOS los criterios aplicables se cumplen → devuelve {"status": "already_optimized", "versions": []} inmediatamente. Que el resumen ya esté bien es una respuesta correcta y esperada.

TAREA: Analiza el resumen actual e identifica sus debilidades. Genera 3 versiones mejoradas, cada una con posicionamiento diferente.

${hasDescription ? `Instrucción del candidato: "${userDescription!.trim()}"` : ""}
${resumeContext ? `\nContexto del CV:\n${resumeContext}` : ""}
${metricBlock}

Resumen actual a mejorar:
"${summary!.trim()}"

DIAGNÓSTICO (usa internamente para guiar las versiones):
• Detecta: clichés, frases débiles, voz pasiva, verbos sin impacto
• Identifica: logros ocultos que pueden amplificarse usando solo cifras que el perfil ya declara
• Extrae: diferenciador real del candidato en su sector

GENERA 3 VERSIONES MEJORADAS:

Versión 1 — EJECUTIVA (3 oraciones exactas): Énfasis en impacto de negocio, liderazgo y resultados cuantificables. Tono directo, sin relleno. Posiciona como experto senior.

Versión 2 — ESPECIALISTA (2-3 oraciones): Énfasis en expertise técnico/funcional específico del sector. Incluye herramientas, metodologías o tecnologías clave mencionadas en el CV o resumen original.

Versión 3 — PROPUESTA DE VALOR (3 oraciones): Combina logro más impactante del pasado + habilidad diferencial + valor que aportará a la próxima empresa. Tono dinámico y propositivo.

REGLAS ABSOLUTAS:
• Conserva métricas reales del original. Si no hay: escribe sin números. NUNCA inventes cifras, NUNCA dejes corchetes.
• PROHIBIDO — estas frases se comprueban y se rechazan; una versión que lleve cualquiera se descarta: ${clicheBanList("es")}.
• Sin pronombres personales (Yo, Mi, Soy). Tercera persona o impersonal.
• Verbos de impacto: Lideró, Desarrolló, Transformó, Escaló, Optimizó, Implementó, Impulsó.

${numbersRule}

Responde ÚNICAMENTE con JSON válido. Cada entrada es el texto completo en sí, no una etiqueta:
{"versions": ["<el resumen ejecutivo completo>", "<el resumen especialista completo>", "<el resumen de propuesta de valor completo>"]}`
        : criticalES + `TAREA: Crea un resumen profesional de alto impacto desde cero, basado en la descripción del candidato. Devuelve 3 versiones distintas.

Descripción del candidato: "${userDescription!.trim()}"
${resumeContext ? `\nContexto del CV:\n${resumeContext}` : ""}
${metricBlock}

GENERA 3 VERSIONES:

Versión 1 — EJECUTIVA (3 oraciones): Posicionamiento como experto senior en su área. Énfasis en impacto y liderazgo.

Versión 2 — ESPECIALISTA (2-3 oraciones): Énfasis en stack técnico/funcional o área de expertise más específica que menciona el candidato.

Versión 3 — PROPUESTA DE VALOR (3 oraciones): Enfoca en qué aporta el candidato a su próximo equipo. Combina habilidades + visión de valor futuro.

REGLAS:
• Si el candidato no especificó métricas: escribe sin números. NUNCA inventes cifras, NUNCA dejes corchetes.
• Sin pronombres personales. Verbos de impacto al inicio. Nunca estas, se comprueban y se rechazan: ${clicheBanList("es")}.
• Cada versión debe sonar auténtica — personal, no genérica.

${numbersRule}

Responde ÚNICAMENTE con JSON válido. Cada entrada es el texto completo en sí, no una etiqueta:
{"versions": ["<el resumen ejecutivo completo>", "<el resumen especialista completo>", "<el resumen de propuesta de valor completo>"]}`

    const response = await this.aiClient.chat({
      model: AI_MODEL_PROSE,
      max_tokens: 700,
      // improve-summary uses 0.3 — must stay close to the existing summary and
      // avoid inventing metrics or technologies.
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            (language === "en"
              ? "You are an Elite Career Consultant specialized in writing high-impact professional summaries for résumés. " +
                "You turn generic summaries into text that makes the candidate stand out through concrete achievements and impactful language. " +
                "You ONLY work with professional résumé summaries and real work profiles. " +
                "You NEVER invent figures and NEVER write bracket placeholders — when there is no real metric, you write without a number. " +
                "If the content is unrelated to a professional profile, respond only with: {\"versions\": []} and nothing else. "
              : "Eres un Consultor de Carrera de Élite especializado en redacción de resúmenes profesionales de alto impacto para CVs. " +
                "Transformas resúmenes genéricos en textos que destacan al candidato con logros concretos y lenguaje de impacto. " +
                "SOLO trabajas con resúmenes profesionales de CV y perfiles laborales reales. " +
                "NUNCA inventas cifras y NUNCA escribes placeholders entre corchetes — cuando no hay métrica real, escribes sin número. " +
                "Si el contenido no tiene relación con un perfil profesional, responde únicamente con: {\"versions\": []} sin texto adicional. ") +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ versions?: unknown; status?: unknown }>(raw)

    if (parsed.status === "already_optimized") {
      this.logSummaryUsage(userId, "improve-summary", plan, response.usage, null)
      return { status: "already_optimized", versions: [] }
    }

    if (!Array.isArray(parsed.versions)) throw new AppError("invalid_response_format", 500)
    if (parsed.versions.length === 0) {
      throw new AppError("off_topic", 422)
    }

    // The same gate generate-summary goes through. Source = everything the
    // candidate stated: the summary they wrote, how they described themselves,
    // and the CV. Anything outside it is invented.
    const gated = await gateSummaryVersions(this.aiClient, this.logger, {
      rawVersions: parsed.versions,
      source: [summary ?? "", userDescription ?? "", resumeContext].join("\n"),
      metrics,
      basePrompt: prompt,
      langInstruction,
      language,
      temperature: AI_TEMPERATURE_STRUCTURED,
      maxTokens: 700,
      endpoint: "improve-summary",
    })

    this.logSummaryUsage(userId, "improve-summary", plan, response.usage, gated.retryUsage)

    // Fail-safe: if every version was dropped, fall back to the original
    // summary unchanged when we have one. Otherwise return empty + already_optimized.
    if (gated.versions.length === 0) {
      if (hasSummary && summary) {
        return { versions: [summary.trim()], status: "already_optimized" }
      }
      return { versions: [], status: "already_optimized" }
    }

    // Echo detection unified with bullets and cover letter: drop any version that
    // barely changes the original (≥90% similar via the same TRIVIAL_EDIT_SIMILARITY
    // threshold). If none survive → already_optimized; otherwise return only the
    // versions that are a real improvement — never a near-copy of the original.
    if (hasSummary && summary) {
      const meaningful = gated.versions.filter((v) => !isTrivialEdit(summary, v.text))
      if (meaningful.length === 0) {
        return { versions: [], status: "already_optimized" }
      }
      return toVersionsResult(meaningful)
    }
    // Spell-checked before it reaches the CV: this is our text, not the
    // user's, so a typo here is ours to fix rather than to report back at them.
    const cleanText = await cleanGeneratedText(gated.versions.map((v) => v.text), language)
    return toVersionsResult(gated.versions.map((v, i) => ({ ...v, text: cleanText[i] ?? v.text })))
  }
}
