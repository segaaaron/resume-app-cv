// lib/services/ai/modules/AISkillsModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import { AI_MODEL, AI_TEMPERATURE_PRECISE, logAIUsage } from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, resolveLanguage } from "../shared/ai-helpers"
import { computeCostUsd } from "../shared/cost-tracker"
import { AI_INPUT_LIMITS, type SuggestSkillsInput, type SuggestSkillsResult } from "../shared/ai-types"

export class AISkillsModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async suggestSkills(userId: string, input: SuggestSkillsInput, plan: string): Promise<SuggestSkillsResult> {
    await enforceAIQuota(userId, "suggest-skills", plan)

    const { jobTitle, industry, existingSkills = [], language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const validation = validateAIInput(jobTitle)
    if (!validation.valid) throw new AppError(validation.error ?? "invalid_input", 400)

    if (industry) { const v = validateAIInput(industry, AI_INPUT_LIMITS.industry); if (!v.valid) throw new AppError("invalid_input", 400) }

    for (const skill of existingSkills) {
      const v = validateAIInput(skill, AI_INPUT_LIMITS.skill)
      if (!v.valid) throw new AppError("invalid_input", 400)
    }

    const en = language === "en"

    const existingList = existingSkills.length > 0
      ? en
        ? `The candidate already has these skills: ${existingSkills.join(", ")}. Do not repeat them.`
        : `El candidato ya tiene estas habilidades: ${existingSkills.join(", ")}. No las repitas.`
      : ""

    const prompt = en
      ? `Suggest the most relevant and high-value skills for a "${jobTitle}"${industry ? ` in the ${industry} industry` : ""} to include in a professional CV/resume.
${existingList}

Return a JSON object with this exact structure:
{
  "skills": [
    { "name": "skill name", "level": "beginner|intermediate|advanced|expert" },
    ...
  ]
}

Rules:
- Return exactly 8-10 skills
- ORDER by relevance: most critical/in-demand skill for this specific role FIRST
- Use SPECIFIC, precise skill names (not generic): prefer "React.js" over "React", "Python (Data Analysis)" over "Python", "Google Analytics 4" over "Analytics", "Scrum / Agile" over "Agile"
- Distribution: 60% hard/technical skills specific to the role, 40% soft/cross-functional skills
- Hard skills first in the list, soft skills at the end
- Assign realistic levels for a mid-level professional in this role (avoid all "expert" — be honest)
- Only return the JSON object, no other text
- If the job title is not a real profession or is off-topic, return { "skills": [] }`
      : `Sugiere las habilidades más relevantes y de mayor valor para un "${jobTitle}"${industry ? ` en la industria de ${industry}` : ""} para incluir en un CV profesional.
${existingList}

Devuelve un objeto JSON con esta estructura exacta:
{
  "skills": [
    { "name": "nombre de la habilidad", "level": "beginner|intermediate|advanced|expert" },
    ...
  ]
}

Reglas:
- Devuelve exactamente 8-10 habilidades
- ORDENA por relevancia: la habilidad más crítica/demandada para este puesto específico PRIMERO
- Usa nombres de habilidad ESPECÍFICOS y precisos (no genéricos): prefiere "React.js" sobre "React", "Python (Análisis de Datos)" sobre "Python", "Google Analytics 4" sobre "Analytics", "Scrum / Agile" sobre "Agile"
- Distribución: 60% habilidades técnicas/duras específicas del puesto, 40% habilidades blandas/transversales
- Habilidades duras primero en la lista, blandas al final
- Asigna niveles realistas para un profesional de nivel medio en este puesto (evita poner todo en "expert" — sé honesto)
- El campo "level" SIEMPRE en inglés (beginner/intermediate/advanced/expert); los nombres de habilidad en español
- Devuelve solo el objeto JSON, sin ningún otro texto
- Si el título del puesto no es una profesión real o está fuera de tema, devuelve { "skills": [] }`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 400,
      temperature: AI_TEMPERATURE_PRECISE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a senior career strategist and talent acquisition expert who knows exactly which skills recruiters search for in each role and industry. You suggest specific, high-value skills that differentiate candidates and pass ATS filters — never generic filler. Only suggest skills relevant to professional CV/resume contexts. If the input is off-topic or nonsensical, return { \"skills\": [] }. " + langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const content = response.choices[0]?.message?.content ?? "{}"
    const result = parseAIJson<{ skills?: { name: string; level: string }[] }>(content)

    if (!Array.isArray(result.skills) || result.skills.length === 0) {
      throw new AppError("off_topic", 422)
    }

    const validLevels = new Set(["beginner", "intermediate", "advanced", "expert"])
    const skills = result.skills
      .filter((s) => s.name && typeof s.name === "string")
      .map((s) => ({
        name: s.name.trim(),
        level: validLevels.has(s.level) ? s.level : "intermediate",
      }))

    const usage = response.usage
    logAIUsage(userId, "suggest-skills", {
      model: AI_MODEL,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
    })
    return { skills }
  }
}
