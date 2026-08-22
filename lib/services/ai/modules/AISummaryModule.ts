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
import { askUntilAnswered, retryNudge } from "../shared/never-empty"
import { cvValueBar, noHardCodedFactsRule } from "../shared/cv-writing-doctrine"
import { buildModePrompt } from "./profile-modes"
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
      ? `${cvValueBar("en")}

${noHardCodedFactsRule("en")}

NEVER write a bracket placeholder. No [X years], [N projects], [X%] — this text goes into the candidate's CV as-is and a bracket reads as an unfinished resume.

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

${cvValueBar("en")}

${noHardCodedFactsRule("en")}

ABSOLUTE RULES:
• Impact verbs: Led, Developed, Transformed, Scaled, Optimized, Implemented, Drove, Designed. NEVER these clichés: ${clicheBanList("en")}. Every one of them is checked and rejected — a version carrying any is thrown away.
• No personal pronouns (I, My, I am), and NEVER the third person either ("Manages", "Handles", "Their experience positions them") — a summary written about the candidate reads as a reference letter somebody else wrote. Open with a NOUN PHRASE or the work itself: "Bank teller with…", "Day-to-day management of…", "Cash reconciliation and counter service across…".
• Never leave a bracket like [X%]: unfilled, in a CV it reads as unfinished.
• Each version must feel written by the candidate — personal and authentic, not AI-generated.
• Vary sentence length and structure between the 3 versions — avoid a uniform rhythm that reads as AI. Natural, conversational voice, not a press release. Also banned: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy". Anchor claims to concrete specifics from the profile (tools, sector, real achievement) rather than vague adjectives.


${numbersRuleEN}

Respond ONLY with valid JSON. Each entry is the complete text itself, not a label:
{"versions": ["<the complete executive summary>", "<the complete specialist summary>", "<the complete value-proposition summary>"]}`
      : `${cvValueBar("es")}

${noHardCodedFactsRule("es")}

NUNCA escribas un corchete. Ni [X años], ni [N proyectos], ni [X%] — este texto entra en el CV tal cual y un corchete se lee como un CV a medio hacer.

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

${cvValueBar("es")}

${noHardCodedFactsRule("es")}

REGLAS ABSOLUTAS:
• Verbos de impacto: Lideró, Desarrolló, Transformó, Escaló, Optimizó, Implementó, Impulsó, Diseñó. NUNCA estas frases, se comprueban y se rechazan: ${clicheBanList("es")}.
• Sin pronombres personales (Yo, Mi, Soy), y TAMPOCO tercera persona ("Atiende", "Gestiona", "Su experiencia la posiciona") — un resumen escrito SOBRE el candidato se lee como una carta de recomendación redactada por otro. Empezá con una FRASE NOMINAL o con el trabajo en sí: "Cajera con experiencia en…", "Gestión diaria de…", "Arqueo de caja y atención en ventanilla en…".
• Nunca dejes un corchete tipo [X%]: sin rellenar, en un CV se lee como algo sin terminar.
• Cada versión debe sonar escrita por el candidato — personal y auténtica, no genérica.
• Varía el largo y la estructura de las frases entre las 3 versiones — evita un ritmo uniforme que suena a IA. Voz natural y conversacional, no nota de prensa. También prohibidas: "Orquestó", "Apalancó", "Utilizó", "sinergia", "orientado a resultados". Ancla las afirmaciones a datos concretos del perfil (herramientas, sector, logro real) en vez de adjetivos vagos.


${numbersRuleES}

Responde ÚNICAMENTE con JSON válido. Cada entrada es el texto completo en sí, no una etiqueta:
{"versions": ["<el resumen ejecutivo completo>", "<el resumen especialista completo>", "<el resumen de propuesta de valor completo>"]}`

    // An empty answer here is a bad roll, not a verdict on the CV — and the
    // button that produced it already cost the user a use and a two-minute
    // cooldown. It is asked again before anyone is told "nothing came out".
    const askModel = (attempt: number) => this.aiClient.chat({
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
              ? "You ONLY respond to real professional profiles. You never write bracket placeholders. " +
                "If the data does not correspond to a real professional profile, respond only with: {\"versions\": []} and nothing else. "
              : "SOLO respondes con perfiles profesionales reales. NUNCA inventas cifras y NUNCA escribes placeholders entre corchetes — cuando no hay métrica, escribes sin número. " +
                "Si los datos no corresponden a un perfil profesional real, responde únicamente con: {\"versions\": []} sin texto adicional. ") +
            langInstruction,
        },
        { role: "user", content: attempt === 0 ? prompt : prompt + retryNudge(language) },
      ],
    })

    const readVersions = (r: Awaited<ReturnType<typeof askModel>>): string[] => {
      const parsed = parseAIJson<{ versions?: unknown }>(r.choices[0]?.message?.content ?? "")
      return Array.isArray(parsed.versions)
        ? parsed.versions.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        : []
    }

    const answered = await askUntilAnswered({
      ask: askModel,
      isAnswered: (r) => readVersions(r).length > 0,
      // No off-topic sentinel here: the input is the user's own CV, and there is
      // no such thing as a CV that is off-topic for its own summary.
      fallback: async () => {
        // The model came back empty twice on a real profile. Rather than an
        // error on a button that already cost a use, the role is enough to
        // write from — the same three positionings the assistant produces from
        // a job title alone, which measured 30/30 across trades.
        const role = (sectionData?.personalDetails as { jobTitle?: string } | undefined)?.jobTitle?.trim()
        if (!role) return null
        const { system, user, maxTokens } = buildModePrompt("seed", role, language)
        this.logger.warn("[AISummary] generate came back empty twice, writing from the role", { role })
        return await this.aiClient.chat({
          model: AI_MODEL_PROSE,
          max_tokens: maxTokens,
          temperature: AI_TEMPERATURE_GENERATIVE,
          response_format: { type: "json_object" },
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
        })
      },
      onFilled: (how) => this.logger.warn("[AISummary] generate-summary filled a hole", { how }),
    })

    // Null means there was nothing to write from at all — no answer and no role.
    if (!answered) throw new AppError("off_topic", 422)
    const response = answered
    // The seed fallback answers under "summaries"; the main path under "versions".
    const rawParsed = parseAIJson<{ versions?: unknown; summaries?: unknown }>(response.choices[0]?.message?.content ?? "")
    const list = (Array.isArray(rawParsed.versions) ? rawParsed.versions : rawParsed.summaries) as unknown
    const parsed = { versions: Array.isArray(list) ? list : [] }

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

    const criticalEN = `${cvValueBar("en")}

${noHardCodedFactsRule("en")}

Preserve every figure the original states. Never write a bracket placeholder like [X%] — it goes into the CV as-is and reads as unfinished.

HUMAN VOICE (avoid AI-detection): vary sentence length and structure; natural, conversational tone, not a press release. Banned AI-tell words: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy", "Results-driven". Anchor to concrete specifics from the source, not vague adjectives.

`
    const criticalES = `${cvValueBar("es")}

${noHardCodedFactsRule("es")}

Conservá cada cifra que el original declara. Nunca escribas un corchete tipo [X%] — entra en el CV tal cual y se lee como un CV sin terminar.

VOZ HUMANA (evita detección de IA): variá el largo y la estructura de las frases; tono natural y conversacional, no nota de prensa. Palabras-IA prohibidas: "Orquestó", "Apalancó", "Utilizó", "sinergia", "orientado a resultados". Anclá a datos concretos del source, no a adjetivos vagos.

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

${cvValueBar("en")}

${noHardCodedFactsRule("en")}

ABSOLUTE RULES:
• Preserve every metric the original states. Never leave a bracket.
• PROHIBITED — every one is checked and rejected; a version carrying any is discarded: ${clicheBanList("en")}.
• No personal pronouns (I, My, I am), and NEVER the third person either ("Manages", "Handles", "Their experience positions them") — a summary written about the candidate reads as a reference letter somebody else wrote. Open with a NOUN PHRASE or the work itself: "Bank teller with…", "Day-to-day management of…", "Cash reconciliation and counter service across…".
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
• Never leave a bracket standing in for a figure.
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

${cvValueBar("es")}

${noHardCodedFactsRule("es")}

REGLAS ABSOLUTAS:
• Conservá cada métrica que el original declara. Nunca dejes un corchete.
• PROHIBIDO — estas frases se comprueban y se rechazan; una versión que lleve cualquiera se descarta: ${clicheBanList("es")}.
• Sin pronombres personales (Yo, Mi, Soy), y TAMPOCO tercera persona ("Atiende", "Gestiona", "Su experiencia la posiciona") — un resumen escrito SOBRE el candidato se lee como una carta de recomendación redactada por otro. Empezá con una FRASE NOMINAL o con el trabajo en sí: "Cajera con experiencia en…", "Gestión diaria de…", "Arqueo de caja y atención en ventanilla en…".
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
• Nunca dejes un corchete en lugar de una cifra.
• Sin pronombres personales. Verbos de impacto al inicio. Nunca estas, se comprueban y se rechazan: ${clicheBanList("es")}.
• Cada versión debe sonar auténtica — personal, no genérica.

${numbersRule}

Responde ÚNICAMENTE con JSON válido. Cada entrada es el texto completo en sí, no una etiqueta:
{"versions": ["<el resumen ejecutivo completo>", "<el resumen especialista completo>", "<el resumen de propuesta de valor completo>"]}`

    // Same rule as generate: an empty answer is retried before anyone is told
    // the AI could not do it. What differs is the fallback — here the user
    // already HAS a summary, so the honest filling is to leave it alone and say
    // it is already fine, never to replace it with something weaker.
    const askImprove = (attempt: number) => this.aiClient.chat({
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
                "You never write bracket placeholders. " +
                "If the content is unrelated to a professional profile, respond only with: {\"versions\": []} and nothing else. "
              : "Eres un Consultor de Carrera de Élite especializado en redacción de resúmenes profesionales de alto impacto para CVs. " +
                "Transformas resúmenes genéricos en textos que destacan al candidato con logros concretos y lenguaje de impacto. " +
                "SOLO trabajas con resúmenes profesionales de CV y perfiles laborales reales. " +
                "Nunca escribís placeholders entre corchetes. " +
                "Si el contenido no tiene relación con un perfil profesional, responde únicamente con: {\"versions\": []} sin texto adicional. ") +
            langInstruction,
        },
        { role: "user", content: attempt === 0 ? prompt : prompt + retryNudge(language) },
      ],
    })

    const readImprove = (r: Awaited<ReturnType<typeof askImprove>>) =>
      parseAIJson<{ versions?: unknown; status?: unknown }>(r.choices[0]?.message?.content ?? "")

    const improved = await askUntilAnswered({
      ask: askImprove,
      isAnswered: (r) => {
        const p = readImprove(r)
        // "Already optimised" IS an answer: the model read the summary and
        // judged it good. Retrying that would spend a call to hear it again.
        if (p.status === "already_optimized") return true
        return Array.isArray(p.versions) && p.versions.some((v) => typeof v === "string" && v.trim())
      },
      fallback: () => null,
      onFilled: (how) => this.logger.warn("[AISummary] improve-summary filled a hole", { how }),
    })

    // Twice empty on a summary that exists. The user keeps what they have and is
    // told it needs no change — which is true, in the sense that matters to
    // them: we have nothing better to offer. An error here would take their use
    // and their two-minute cooldown and hand back a red toast.
    if (!improved) {
      this.logger.warn("[AISummary] improve came back empty twice, keeping the user's summary")
      return { status: "already_optimized", versions: [] }
    }
    const response = improved
    const parsed = readImprove(response)

    if (parsed.status === "already_optimized") {
      this.logSummaryUsage(userId, "improve-summary", plan, response.usage, null)
      return { status: "already_optimized", versions: [] }
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
