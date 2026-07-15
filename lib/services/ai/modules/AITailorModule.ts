// lib/services/ai/modules/AITailorModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL,
  AI_TEMPERATURE_STRUCTURED,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, resolveLanguage, detectHallucination } from "../shared/ai-helpers"
import { computeCostUsd } from "../shared/cost-tracker"
import { AI_INPUT_LIMITS, type TailorCVInput, type TailorCVResultV2, type TailorExperienceResult } from "../shared/ai-types"

export class AITailorModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async tailorCV(userId: string, input: TailorCVInput, plan: string): Promise<TailorCVResultV2> {
    await enforceAIQuota(userId, "tailor-cv", plan)

    const { sectionData, jobDescription, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const jdValidation = validateAIInput(jobDescription, AI_INPUT_LIMITS.jobDescription)
    if (!jdValidation.valid) throw new AppError(jdValidation.error ?? "invalid_input", 400)

    const resumeContext = buildResumeContext(sectionData, language)
    const ctxValidation = validateAIInput(resumeContext, AI_INPUT_LIMITS.resumeContext)
    if (!ctxValidation.valid) throw new AppError("invalid_input", 400)

    const work = (sectionData.workExperience ?? []) as { id?: string; jobTitle?: string; employer?: string; description?: string }[]
    const workList = work.slice(0, 4).map((j) => {
      const lines = (j.description ?? "").split("\n").map(l => l.trim()).filter(Boolean)
      const bulletLines = lines.map((l, i) => `  [${i}] ${l.slice(0, 80)}${l.length > 80 ? "..." : ""}`).join("\n")
      return `ID:${j.id ?? "?"} | ${j.jobTitle ?? ""} at ${j.employer ?? ""}:\n${bulletLines || "  (sin bullets)"}`
    }).join("\n\n")

    const prompt = language === "en"
      ? `CRITICAL ANTI-HALLUCINATION RULES (mandatory, no exceptions):
1. ONLY rewrite using information present in the CANDIDATE CV below. Do NOT introduce technologies, frameworks, libraries, company names, job titles, certifications, percentages, real numbers, or dates not present in the CV.
2. Bullet rewrites must apply the CAR method using ONLY results explicitly stated in the source. If a bullet has no real metric, keep the [X%] / [N users] placeholder — never replace a placeholder with an invented figure.
3. missingSkills must list skills required by the JOB DESCRIPTION; do not invent skill names. keywordsToAdd must come from the JOB DESCRIPTION verbatim.
4. If you cannot improve a bullet without inventing content, OMIT it from changedBullets — never fabricate to fill space.

You are an expert resume strategist. Tailor the candidate's CV to this specific job description.

JOB DESCRIPTION:
${jobDescription.slice(0, AI_INPUT_LIMITS.jobDescription)}

CANDIDATE CV:
${resumeContext}

WORK EXPERIENCE DETAILS (bullets indexed by position):
${workList}

Return a JSON object:
{
  "summary": "rewritten summary aligned to job OR null if already strong",
  "experiences": [
    {
      "targetId": "ID",
      "jobTitle": "title",
      "employer": "company",
      "changedBullets": [
        { "index": 1, "text": "• Improved bullet text using CAR method" }
      ]
    }
  ],
  "missingSkills": ["skill1"],
  "keywordsToAdd": ["keyword1"]
}

Rules:
- summary: rewrite if it lacks job keywords or impact metrics. Return null if it's already strong.
- experiences: include ALL jobs from the work experience list, even those with no changes
- changedBullets: ONLY include bullets that need improvement. If a bullet already has a strong action verb, metric/placeholder, and is relevant to this job → OMIT it (empty array = all bullets are good)
- For each changed bullet: use • prefix, CAR method, keep placeholder [X%] if no real metrics exist
- Human voice (avoid AI-detection): vary sentence length/structure across bullets, natural not press-release tone. Banned AI-tell words: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy". Keep each rewrite anchored to a concrete detail already in the source
- NEVER add new bullets that don't exist in the original — only replace existing ones by index
- missingSkills: skills required by job not present in CV (max 5)
- keywordsToAdd: ATS keywords from JD missing in CV (max 8)
- If all bullets and summary are already well-optimized: return summary null, empty changedBullets for all experiences`
      : `REGLAS CRÍTICAS ANTI-ALUCINACIÓN (obligatorias, sin excepciones):
1. SOLO reescribe usando información presente en el CV DEL CANDIDATO. NO introduzcas tecnologías, frameworks, librerías, nombres de empresas, cargos, certificaciones, porcentajes, números reales ni fechas que no estén en el CV.
2. Las reescrituras de bullets aplican el método CAR usando ÚNICAMENTE resultados explícitos del source. Si un bullet no tiene métrica real, conserva el placeholder [X%] / [N usuarios] — nunca lo sustituyas por una cifra inventada.
3. missingSkills debe listar habilidades requeridas por la OFERTA DE TRABAJO; no inventes nombres de habilidades. keywordsToAdd debe provenir literalmente de la OFERTA DE TRABAJO.
4. Si no puedes mejorar un bullet sin inventar, OMÍTELO de changedBullets — nunca fabriques contenido para rellenar.

Eres un estratega experto en currículos. Adapta el CV del candidato a esta oferta de trabajo específica.

OFERTA DE TRABAJO:
${jobDescription.slice(0, AI_INPUT_LIMITS.jobDescription)}

CV DEL CANDIDATO:
${resumeContext}

DETALLES DE EXPERIENCIA LABORAL (bullets indexados por posición):
${workList}

Devuelve un objeto JSON:
{
  "summary": "resumen reescrito alineado a la oferta O null si ya está bien",
  "experiences": [
    {
      "targetId": "ID",
      "jobTitle": "puesto",
      "employer": "empresa",
      "changedBullets": [
        { "index": 1, "text": "• Texto mejorado del bullet con método CAR" }
      ]
    }
  ],
  "missingSkills": ["habilidad1"],
  "keywordsToAdd": ["keyword1"]
}

Reglas:
- summary: reescribir si le faltan keywords de la oferta o métricas de impacto. Devolver null si ya está bien.
- experiences: incluir TODOS los puestos de la lista de experiencia, incluso los que no tienen cambios
- changedBullets: SOLO incluir bullets que necesitan mejora. Si un bullet ya tiene verbo de acción fuerte, métrica/placeholder y es relevante → OMITIRLO (array vacío = todos los bullets están bien)
- Para cada bullet cambiado: usar prefijo •, método CAR, mantener placeholder [X%] si no hay métricas reales
- Voz humana (evita detección de IA): varía el largo/estructura de las frases entre bullets, tono natural no nota de prensa. Palabras-IA prohibidas: "Orquestó", "Apalancó", "Utilizó", "sinergia". Mantén cada reescritura anclada a un dato concreto ya presente en el source
- NUNCA agregar bullets nuevos que no existen en el original — solo reemplazar existentes por índice
- missingSkills: habilidades requeridas por la oferta no presentes en el CV (máximo 5)
- keywordsToAdd: keywords ATS de la oferta no presentes en el CV (máximo 8)
- Si todos los bullets y el resumen ya están bien optimizados: devolver summary null, changedBullets vacíos para todas las experiencias`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 900,
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an elite career coach and ATS optimization specialist. You tailor resumes to specific job postings with surgical precision, identifying keyword gaps, aligning professional summaries, and rewriting experience bullets to maximize recruiter and ATS impact. You only work on real job postings — if the input is off-topic or nonsensical, return { "summary": null, "experiences": [], "missingSkills": [], "keywordsToAdd": [] }. A bullet is already good if it has: (1) strong action verb at start, (2) metric or explicit placeholder [X%], (3) relevant context for this specific job. Only mark as unchanged if it genuinely meets all three. ${langInstruction}`,
        },
        { role: "user", content: prompt },
      ],
    })

    const content = response.choices[0]?.message?.content ?? "{}"
    const raw = parseAIJson<TailorCVResultV2>(content)

    // off_topic = model returned no experiences at all (system prompt returns [] for nonsense input)
    // CV already optimized = experiences present but changedBullets empty → valid result, not off_topic
    const hasExperiences = (raw.experiences?.length ?? 0) > 0
    if (!raw.summary && !hasExperiences && !raw.missingSkills?.length && !raw.keywordsToAdd?.length) {
      throw new AppError("off_topic", 422)
    }

    const usage = response.usage
    logAIUsage(userId, "tailor-cv", {
      model: AI_MODEL,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
    })
    // Anti-hallucination sanitization: drop bullet rewrites that introduce
    // content not derivable from the resume context. Filter missingSkills /
    // keywordsToAdd so only items present in the JD survive (the model is
    // supposed to extract them — never invent).
    const jdLower = jobDescription.toLowerCase()
    const resumeLower = resumeContext.toLowerCase()
    let droppedBullets = 0

    const sanitizedExperiences = (raw.experiences ?? []).map((e) => {
      const cleanedBullets = (e.changedBullets ?? [])
        .map((b) => ({
          index: typeof b.index === "number" ? b.index : 0,
          text: typeof b.text === "string" ? b.text : "",
        }))
        .filter((b) => b.text)
        .filter((b) => {
          if (detectHallucination(b.text, resumeContext, { allowPlaceholders: true })) {
            droppedBullets++
            return false
          }
          return true
        })
      return {
        targetId: e.targetId ?? "",
        jobTitle: e.jobTitle ?? "",
        employer: e.employer ?? "",
        changedBullets: cleanedBullets,
      }
    })

    const cleanMissingSkills = (raw.missingSkills ?? [])
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .filter((s) => {
        const sl = s.toLowerCase().trim()
        // Must be referenced somewhere in JD or CV — never invent skill names.
        return jdLower.includes(sl) || resumeLower.includes(sl)
      })
      .slice(0, 5)

    const cleanKeywordsToAdd = (raw.keywordsToAdd ?? [])
      .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
      .filter((k) => jdLower.includes(k.toLowerCase().trim()))
      .slice(0, 8)

    if (droppedBullets > 0) {
      this.logger.warn("[AIService.tailorCV] dropped hallucinated bullets", { droppedBullets })
    }

    return {
      summary: raw.summary ?? null,
      experiences: sanitizedExperiences,
      missingSkills: cleanMissingSkills,
      keywordsToAdd: cleanKeywordsToAdd,
    } satisfies TailorCVResultV2
  }
}
