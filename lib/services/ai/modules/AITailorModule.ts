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
import { parseAIJson } from "../shared/ai-helpers"
import { computeCostUsd } from "../shared/cost-tracker"
import type { TailorCVInput, TailorCVResult } from "../shared/ai-types"

export class AITailorModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async tailorCV(userId: string, input: TailorCVInput, plan: string): Promise<TailorCVResult> {
    await enforceAIQuota(userId, "tailor-cv", plan)

    const { sectionData, jobDescription, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const jdValidation = validateAIInput(jobDescription, 6000)
    if (!jdValidation.valid) throw new AppError(jdValidation.error ?? "invalid_input", 400)

    const resumeContext = buildResumeContext(sectionData, language)
    const ctxValidation = validateAIInput(resumeContext, 5000)
    if (!ctxValidation.valid) throw new AppError("invalid_input", 400)

    const work = (sectionData.workExperience ?? []) as { id?: string; jobTitle?: string; employer?: string; description?: string }[]
    const workList = work.slice(0, 4).map((j) =>
      `ID:${j.id ?? "?"} | ${j.jobTitle ?? ""} at ${j.employer ?? ""}: ${(j.description ?? "").slice(0, 300)}`
    ).join("\n")

    const prompt = language === "en"
      ? `You are an expert resume strategist. Tailor the candidate's CV to this specific job description.

JOB DESCRIPTION:
${jobDescription.slice(0, 4000)}

CANDIDATE CV:
${resumeContext}

WORK EXPERIENCE DETAILS:
${workList}

Return a JSON object with this structure:
{
  "summaryVersion": "rewritten professional summary (3-4 sentences, 80-120 words) aligned to this job",
  "bulletSuggestions": [
    { "targetId": "work experience ID from the list", "jobTitle": "job title", "employer": "employer", "improved": "• Bullet 1 rewritten with CAR method\n• Bullet 2 rewritten\n• Bullet 3 if needed" }
  ],
  "missingSkills": ["skill1", "skill2"],
  "keywordsToAdd": ["keyword1", "keyword2"]
}

Rules:
- summaryVersion: mirror the job's language and keywords naturally; no exaggeration
- bulletSuggestions: only for work experiences where improvement would meaningfully help; max 3
- improved: MUST use • bullet format, one bullet per line separated by \n. Match the original number of bullets. Each bullet uses CAR method (Context/Action/Result). No markdown, no asterisks.
- missingSkills: skills required by the job that the candidate doesn't have (max 5)
- keywordsToAdd: ATS keywords from the job not present in the CV (max 8)
- Be specific and actionable; no generic advice
- Only return the JSON object`
      : `Eres un estratega experto en currículos. Adapta el CV del candidato a esta oferta de trabajo específica.

OFERTA DE TRABAJO:
${jobDescription.slice(0, 4000)}

CV DEL CANDIDATO:
${resumeContext}

DETALLES DE EXPERIENCIA LABORAL:
${workList}

Devuelve un objeto JSON con esta estructura:
{
  "summaryVersion": "resumen profesional reescrito (3-4 oraciones, 80-120 palabras) alineado a esta oferta",
  "bulletSuggestions": [
    { "targetId": "ID de la experiencia laboral", "jobTitle": "puesto", "employer": "empresa", "improved": "• Bullet 1 reescrito con método CAR\n• Bullet 2 reescrito\n• Bullet 3 si aplica" }
  ],
  "missingSkills": ["habilidad1", "habilidad2"],
  "keywordsToAdd": ["keyword1", "keyword2"]
}

Reglas:
- summaryVersion: refleja el lenguaje y palabras clave de la oferta de forma natural; sin exageraciones
- bulletSuggestions: solo para experiencias donde la mejora aporte valor real; máximo 3
- improved: DEBE usar formato • bullet, un bullet por línea separado por \n. Iguala el número de bullets del original. Cada bullet usa método CAR (Contexto/Acción/Resultado). Sin markdown, sin asteriscos.
- missingSkills: habilidades requeridas por la oferta que el candidato no tiene (máximo 5)
- keywordsToAdd: keywords ATS de la oferta no presentes en el CV (máximo 8)
- Sé específico y accionable; nada genérico
- Solo devuelve el objeto JSON`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 900,
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an elite career coach and ATS optimization specialist. You tailor resumes to specific job postings with surgical precision, identifying keyword gaps, aligning professional summaries, and rewriting experience bullets to maximize recruiter and ATS impact. You only work on real job postings — if the input is off-topic or nonsensical, return { "summaryVersion": "", "bulletSuggestions": [], "missingSkills": [], "keywordsToAdd": [] }. ${langInstruction}`,
        },
        { role: "user", content: prompt },
      ],
    })

    const content = response.choices[0]?.message?.content ?? "{}"
    const raw = parseAIJson<TailorCVResult>(content)

    if (!raw.summaryVersion && !raw.bulletSuggestions?.length && !raw.missingSkills?.length) {
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
    return {
      summaryVersion: raw.summaryVersion ?? "",
      bulletSuggestions: (raw.bulletSuggestions ?? []).slice(0, 3),
      missingSkills: (raw.missingSkills ?? []).slice(0, 5),
      keywordsToAdd: (raw.keywordsToAdd ?? []).slice(0, 8),
    }
  }
}
