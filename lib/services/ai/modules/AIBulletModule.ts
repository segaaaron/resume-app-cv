// lib/services/ai/modules/AIBulletModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import { AI_MODEL, AI_TEMPERATURE_CREATIVE, logAIUsage } from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson } from "../shared/ai-helpers"
import { logAICost } from "../shared/cost-tracker"
import type { BulletResult, ImproveBulletInput } from "../shared/ai-types"

export class AIBulletModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async improveBullet(userId: string, input: ImproveBulletInput, plan: string): Promise<BulletResult> {
    await enforceAIQuota(userId, "improve-bullet", plan)

    const { text, jobTitle, employer, industry, language: rawLanguage } = input
    const language = rawLanguage === "en" ? "en" : "es"
    const langInstruction = language === "en" ? "Always respond in English." : "Responde siempre en español."

    const validation = validateAIInput(text, 2000)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    const context = [
      jobTitle ? `Puesto: ${jobTitle}` : "",
      employer ? `Empresa: ${employer}` : "",
      industry ? `Industria: ${industry}` : "",
    ].filter(Boolean).join(" | ")

    const prompt = language === "en"
      ? `TASK: Transform this work experience description into high-impact professional bullets for an executive resume.

${context ? `Position context: ${context}` : ""}

Original description:
${text}

TRANSFORMATION RULES:
1. CAR method per bullet: Action (strong verb) → Brief context (if applicable) → Measurable result.
2. Verb first, always. PROHIBITED: "Responsible for", "In charge of", "Assisted with", personal pronouns (I, my).
3. Impact order: highest business-impact bullet goes FIRST. Last bullet can be scope/reach.
4. Metrics: if not in the original, use PLACEHOLDERS: [X%], [N users], [$Z], [N months]. NEVER invent real figures.
5. Choose verbs based on role context:
   - Tech/Product: Architected, Developed, Automated, Migrated, Optimized, Deployed, Refactored, Scaled
   - Leadership/Management: Led, Mentored, Coordinated, Aligned, Consolidated, Transformed, Prioritized
   - Operations/Process: Reduced, Standardized, Implemented, Centralized, Increased, Structured
   - Sales/Business/Marketing: Grew, Closed, Negotiated, Expanded, Positioned, Captured, Generated
6. Quantity based on content richness:
   - Basic (1-2 generic responsibilities): 3-4 dense bullets
   - Medium (several responsibilities, some achievements): 4-6 bullets
   - Rich (concrete achievements, projects, metrics, leadership): 6-8 bullets
7. ATS: naturally incorporate 1-2 industry/role keywords within bullets.

Respond ONLY with valid JSON (no markdown):
{"bullets": ["• bullet1", "• bullet2", ...]}`
      : `TAREA: Transforma esta descripción de experiencia laboral en bullets profesionales de alto impacto, listos para un CV ejecutivo.

${context ? `Contexto del puesto: ${context}` : ""}

Descripción original:
${text}

REGLAS DE TRANSFORMACIÓN:
1. Método CAR por bullet: Acción (verbo fuerte) → Contexto breve (si aplica) → Resultado medible.
2. Verbo primero, siempre. PROHIBIDO: "Responsable de", "Encargado de", "Apoyé en", pronombres (yo, mi, mis).
3. Orden de impacto: el bullet con mayor impacto de negocio va PRIMERO. El último puede ser de alcance/scope.
4. Métricas: si no existen en el original, usa PLACEHOLDERS: [X%], [N usuarios], [$Z], [N meses]. NUNCA inventes cifras reales.
5. Elige verbos según el contexto del puesto:
   - Tech/Producto: Arquitecté, Desarrollé, Automaticé, Migré, Optimicé, Desplegué, Refactoricé, Escalé
   - Liderazgo/Gestión: Lideré, Mentoré, Coordiné, Alineé, Consolidé, Transformé, Prioricé
   - Operaciones/Procesos: Reduje, Estandaricé, Implementé, Centralicé, Incrementé, Estructuré
   - Ventas/Negocio/Marketing: Crecí, Cerré, Negocié, Expandí, Posicioné, Capturé, Generé
6. Cantidad según riqueza del contenido:
   - Básico (1-2 responsabilidades genéricas): 3-4 bullets densos
   - Medio (varias responsabilidades, algún logro): 4-6 bullets
   - Rico (logros concretos, proyectos, métricas, liderazgo): 6-8 bullets
7. ATS: incorpora 1-2 keywords del sector/puesto de forma natural dentro de los bullets.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"bullets": ["• bullet1", "• bullet2", ...]}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 600,
      temperature: AI_TEMPERATURE_CREATIVE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite con expertise en optimización de CVs ejecutivos para empresas Fortune 500 y startups de alto crecimiento. " +
            "Tu especialidad: transformar descripciones genéricas en bullets de alto impacto que superan filtros ATS y capturan la atención de recruiters en los primeros 6 segundos de lectura. " +
            "Usas el método CAR (Acción-Contexto-Resultado) y priorizas logros de negocio sobre responsabilidades. " +
            "SOLO procesas contenido de experiencia laboral profesional real. Si el contenido no es de experiencia laboral, responde: {\"bullets\": []}. " +
            "Cuando no hay métricas reales, usas SIEMPRE placeholders explícitos [X%], [N usuarios], [$Z] — NUNCA inventas cifras. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ bullets?: unknown }>(raw)

    if (!Array.isArray(parsed.bullets)) throw new AppError("invalid_response_format", 500)
    if (parsed.bullets.length === 0) {
      throw new AppError("off_topic", 422)
    }

    logAIUsage(userId, "improve-bullet")
    logAICost(this.logger, userId, "improve-bullet", plan)
    return { bullets: (parsed.bullets as string[]).slice(0, 10) }
  }
}
