// lib/services/ai/modules/AISummaryModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL_PROSE,
  AI_TEMPERATURE_GENERATIVE,
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
import { aiTellWords, cvValueBar, noHardCodedFactsRule } from "../shared/cv-writing-doctrine"
import { buildModePrompt } from "./profile-modes"
import { computeCostUsd } from "../shared/cost-tracker"
import { extractProfileMetrics } from "../shared/summary-quality"
import { clicheBanList } from "../shared/cliches"
import { readChat, truncatedNudge } from "@/lib/services/ai/shared/chat-result"
import { strictJsonFormat } from "@/lib/services/ai/shared/strict-schema"
import { SummaryVersionsShape } from "@/lib/services/ai/shared/ai-types"
import {
  AI_INPUT_LIMITS,
  type GenerateSummaryInput,
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
    const postingTerms = input.postingTerms ?? []
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

    /**
     * LAS KEYWORDS LAS DICE EL ATS, NO LAS DEDUCE EL MODELO.
     *
     * La fase 1 pedía «detectá las keywords ATS del sector»: el modelo elegía
     * nombres plausibles para el oficio, no los que ESTA vacante pide. Escribir
     * «Excel» donde la oferta dice «Power BI» no mueve un punto.
     */
    const atsLine = postingTerms.length > 0
      ? (language === "en"
        ? `Terms THIS posting asks for by name — use only the ones the profile genuinely backs: ${postingTerms.join(", ")}`
        : `Términos que ESTA vacante pide por nombre — usá sólo los que el perfil respalde de verdad: ${postingTerms.join(", ")}`)
      : (language === "en"
        ? "Key ATS keywords for the sector to include naturally"
        : "Keywords ATS del sector para incluir de forma natural")

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
• ${atsLine}

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
• Vary sentence length and structure between the 3 versions — avoid a uniform rhythm that reads as AI. Natural, conversational voice, not a press release. Also banned: ${aiTellWords("en")}. Anchor claims to concrete specifics from the profile (tools, sector, real achievement) rather than vague adjectives.


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
• Varía el largo y la estructura de las frases entre las 3 versiones — evita un ritmo uniforme que suena a IA. Voz natural y conversacional, no nota de prensa. También prohibidas: ${aiTellWords("es")}. Ancla las afirmaciones a datos concretos del perfil (herramientas, sector, logro real) en vez de adjetivos vagos.


${numbersRuleES}

Responde ÚNICAMENTE con JSON válido. Cada entrada es el texto completo en sí, no una etiqueta:
{"versions": ["<el resumen ejecutivo completo>", "<el resumen especialista completo>", "<el resumen de propuesta de valor completo>"]}`

    // An empty answer here is a bad roll, not a verdict on the CV — and the
    // button that produced it already cost the user a use and a two-minute
    // cooldown. It is asked again before anyone is told "nothing came out".
    // Una respuesta cortada por el techo da cero versiones, igual que una vacía,
    // y `askUntilAnswered` reintentaba diciéndole al modelo que no había escrito
    // nada — cuando el problema era el contrario: escribió de más y no entró.
    // Pedirle lo mismo otra vez sólo vuelve a cortarse.
    let seCorto = false
    const askModel = (attempt: number) => this.aiClient.chat({
      model: AI_MODEL_PROSE,
      max_tokens: 600,
      // generate-summary uses 0.6 to keep variety across the 3 versions while
      // staying anchored to the candidate profile.
      temperature: AI_TEMPERATURE_GENERATIVE,
      response_format: strictJsonFormat("summary_versions", SummaryVersionsShape),
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
              : "SOLO respondes con perfiles profesionales reales. NUNCA quemás cifras y NUNCA escribes placeholders entre corchetes — cuando no hay métrica, escribes sin número. " +
                "Si los datos no corresponden a un perfil profesional real, responde únicamente con: {\"versions\": []} sin texto adicional. ") +
            langInstruction,
        },
        { role: "user", content: attempt === 0 ? prompt : prompt + (seCorto ? truncatedNudge(language) : retryNudge(language)) },
      ],
    })

    const readVersions = (r: Awaited<ReturnType<typeof askModel>>): string[] => {
      const leido = readChat(r)
      seCorto = leido.truncated
      if (leido.refusal) {
        this.logger.warn("[AIService.summary] model refused", { refusal: leido.refusal.slice(0, 120) })
      }
      const parsed = parseAIJson<{ versions?: unknown }>(leido.text)
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
          response_format: strictJsonFormat("summary_versions", SummaryVersionsShape),
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
        })
      },
      onFilled: (how) => this.logger.warn("[AISummary] generate-summary filled a hole", { how }),
    })

    // Null means there was nothing to write from at all — no answer and no role.
    if (!answered) throw new AppError("off_topic", 422)
    const response = answered
    // The seed fallback answers under "summaries"; the main path under "versions".
    const rawParsed = parseAIJson<{ versions?: unknown; summaries?: unknown }>(readChat(response).text)
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
    // show its own empty-state — never surface hard-coded content.
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

}
