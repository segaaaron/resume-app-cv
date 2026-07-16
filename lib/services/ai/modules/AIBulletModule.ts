// lib/services/ai/modules/AIBulletModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import { AI_MODEL, AI_TEMPERATURE_STRUCTURED, logAIUsage } from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, resolveLanguage, detectHallucination } from "../shared/ai-helpers"
import { computeCostUsd } from "../shared/cost-tracker"
import { parseBullets, renderBulletsForPrompt } from "../shared/bullets"
import { isTrivialEdit } from "../shared/text-similarity"
import { assessDescription } from "../shared/bullet-quality"
import {
  AI_INPUT_LIMITS,
  BulletImprovementSchema,
  type BulletImprovement,
  type BulletResult,
  type ImproveBulletInput,
} from "../shared/ai-types"

export class AIBulletModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async improveBullet(userId: string, input: ImproveBulletInput, plan: string): Promise<BulletResult> {
    await enforceAIQuota(userId, "improve-bullet", plan)

    const { text, jobTitle, employer, industry, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const validation = validateAIInput(text, AI_INPUT_LIMITS.bulletText)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    const context = [
      jobTitle ? `Puesto: ${jobTitle}` : "",
      employer ? `Empresa: ${employer}` : "",
      industry ? `Industria: ${industry}` : "",
    ].filter(Boolean).join(" | ")

    const originalBullets = parseBullets(text)
    const indexedBullets = renderBulletsForPrompt(originalBullets, { indent: "  " })

    // Which bullets state no figure is a regex, not a judgement call. Tell the
    // model the answer instead of making it guess — it only has to phrase the
    // question for the ones that need one.
    const quality = assessDescription(text)
    const missingList = quality.missingMetricIndices.join(", ")
    const metricHintEN = quality.missingMetricIndices.length
      ? `\nBullets with no figure of their own: [${missingList}]. These are the only ones you may ask a metricQuestion about. Every other bullet already states its number — never ask for one it already has.`
      : `\nEvery bullet already states a figure. Do NOT return metric_missing.`
    const metricHintES = quality.missingMetricIndices.length
      ? `\nBullets sin cifra propia: [${missingList}]. Son los únicos por los que puedes preguntar en metricQuestions. Todos los demás ya declaran su número — nunca pidas uno que ya está.`
      : `\nTodos los bullets ya declaran una cifra. NO devuelvas metric_missing.`

    const prompt = language === "en"
      ? `CRITICAL ANTI-HALLUCINATION RULES (mandatory, no exceptions):
1. ONLY rewrite using information present in the original bullets and the context above. Do NOT introduce technologies, frameworks, libraries, company names, job titles, certifications, percentages, real numbers, dates, or any metric not explicitly provided.
2. NEVER write a placeholder. No [X%], [N users], [$Z], <number>, or anything in brackets standing in for a figure. What you return is written straight into the candidate's CV, and a bracket left in it gets the CV rejected. If a bullet needs a number the source does not have, do NOT rewrite that bullet — omit it and ask for the figure via "metricQuestions" instead.
3. CAR method (Action-Context-Result) — the "Result" segment can only cite results EXPLICITLY present in the source.

TASK: Improve the bullets of this work experience for an executive resume.

${context ? `Position context: ${context}` : ""}

Original bullets (each addressed by its index):
${indexedBullets}
${metricHintEN}

TRANSFORMATION RULES:
1. CAR method per bullet: Action (strong verb) → Brief context (if applicable) → Result stated in the source.
2. Verb first, always. PROHIBITED openers/clichés: "Responsible for", "In charge of", "Assisted with", "Helped with", "Worked on", "Duties included", and empty buzzwords ("team player", "detail-oriented", "hard-working", "results-driven", "go-getter"). No personal pronouns (I, my).
3. Choose verbs based on role context:
   - Tech/Product: Architected, Developed, Automated, Migrated, Optimized, Deployed, Refactored, Scaled
   - Leadership/Management: Led, Mentored, Coordinated, Aligned, Consolidated, Transformed, Prioritized
   - Operations/Process: Reduced, Standardized, Implemented, Centralized, Increased, Structured
   - Sales/Business/Marketing: Grew, Closed, Negotiated, Expanded, Positioned, Captured, Generated
4. ATS: naturally incorporate 1-2 industry/role keywords within bullets.
5. HUMAN VOICE (avoid AI-detection): vary sentence length and structure — never a uniform rhythm. Write the way the candidate would speak in an interview, not like a press release. Banned AI-tell words: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy". Anchor each rewrite to a concrete detail already in the source (tool, product, team size, timeframe) when available — never invent one.
6. Each entry replaces exactly ONE original bullet: give its "index" and prefix the text with "• ". Never merge, split or reorder bullets.

WHAT TO RETURN — read this last and follow it exactly:
Include an entry in "improvements" ONLY for a bullet you can MATERIALLY improve using facts already in the source. Omit every other bullet. A bullet you would hand back nearly unchanged does not belong in the response — leaving it out is the correct move, not a failure.
- No bullet can be materially improved → {"status": "already_optimized", "improvements": []}. This is a correct and expected answer.
- The ONLY thing blocking an improvement is a figure the source lacks → {"status": "metric_missing", "improvements": [any bullets you COULD improve], "metricQuestions": ["short question naming the figure you need"]}. Max 3 questions.
- Otherwise → {"status": "improved", "improvements": [...]}.
- The text is not real professional work experience → {"status": "off_topic", "improvements": []}.

Respond ONLY with valid JSON (no markdown):
{"status": "improved", "improvements": [{"index": 0, "text": "• improved bullet"}], "metricQuestions": []}`
      : `REGLAS CRÍTICAS ANTI-ALUCINACIÓN (obligatorias, sin excepciones):
1. SOLO reescribe usando información presente en los bullets originales y el contexto de arriba. NO introduzcas tecnologías, frameworks, librerías, nombres de empresas, cargos, certificaciones, porcentajes, números reales, fechas, ni métricas no proporcionadas.
2. NUNCA escribas un placeholder. Ni [X%], ni [N usuarios], ni [$Z], ni <número>, ni nada entre corchetes que sustituya a una cifra. Lo que devuelves se escribe directo en el CV del candidato, y un corchete olvidado ahí hace que le rechacen el CV. Si un bullet necesita una cifra que el source no tiene, NO lo reescribas — omítelo y pide el dato en "metricQuestions".
3. Método CAR (Acción-Contexto-Resultado) — el "Resultado" solo puede citar resultados EXPLÍCITOS en el source.

TAREA: Mejora los bullets de esta experiencia laboral para un CV ejecutivo.

${context ? `Contexto del puesto: ${context}` : ""}

Bullets originales (cada uno con su índice):
${indexedBullets}
${metricHintES}

REGLAS DE TRANSFORMACIÓN:
1. Método CAR por bullet: Acción (verbo fuerte) → Contexto breve (si aplica) → Resultado presente en el source.
2. Verbo primero, siempre. PROHIBIDO aperturas/clichés: "Responsable de", "Encargado de", "Apoyé en", "Ayudé con", "Trabajé en", "Mis funciones incluían", y muletillas vacías ("trabajo en equipo", "orientado al detalle", "proactivo", "orientado a resultados"). Sin pronombres (yo, mi, mis).
3. Elige verbos según el contexto del puesto:
   - Tech/Producto: Arquitecté, Desarrollé, Automaticé, Migré, Optimicé, Desplegué, Refactoricé, Escalé
   - Liderazgo/Gestión: Lideré, Mentoré, Coordiné, Alineé, Consolidé, Transformé, Prioricé
   - Operaciones/Procesos: Reduje, Estandaricé, Implementé, Centralicé, Incrementé, Estructuré
   - Ventas/Negocio/Marketing: Crecí, Cerré, Negocié, Expandí, Posicioné, Capturé, Generé
4. ATS: incorpora 1-2 keywords del sector/puesto de forma natural dentro de los bullets.
5. VOZ HUMANA (evita detección de IA): varía el largo y la estructura de las frases — nunca un ritmo uniforme. Escribe como el candidato hablaría en una entrevista, no como nota de prensa. Palabras-IA prohibidas: "Orquestó", "Apalancó", "Utilizó", "sinergia", "orientado a resultados". Ancla cada reescritura a un dato concreto ya presente en el source (herramienta, producto, tamaño de equipo, plazo) cuando exista — nunca lo inventes.
6. Cada entrada reemplaza exactamente UN bullet original: da su "index" y prefija el texto con "• ". Nunca fusiones, dividas ni reordenes bullets.

QUÉ DEVOLVER — lee esto al final y cúmplelo exactamente:
Incluye una entrada en "improvements" SOLO para un bullet que puedas mejorar MATERIALMENTE usando datos ya presentes en el source. Omite todos los demás. Un bullet que devolverías casi sin cambios NO va en la respuesta — dejarlo fuera es lo correcto, no un fallo.
- Ningún bullet se puede mejorar materialmente → {"status": "already_optimized", "improvements": []}. Es una respuesta correcta y esperada.
- Lo ÚNICO que impide mejorar es una cifra que el source no tiene → {"status": "metric_missing", "improvements": [los bullets que SÍ pudiste mejorar], "metricQuestions": ["pregunta corta nombrando la cifra que necesitas"]}. Máximo 3 preguntas.
- En cualquier otro caso → {"status": "improved", "improvements": [...]}.
- El texto no es experiencia laboral profesional real → {"status": "off_topic", "improvements": []}.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"status": "improved", "improvements": [{"index": 0, "text": "• bullet mejorado"}], "metricQuestions": []}`

    const response = await this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 1200,
      // improve-bullet uses low temperature (0.3) to reduce hallucinations.
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite con expertise en optimización de CVs ejecutivos para empresas Fortune 500 y startups de alto crecimiento. " +
            "Tu especialidad: transformar descripciones genéricas en bullets de alto impacto que superan filtros ATS y capturan la atención de recruiters en los primeros 6 segundos de lectura. " +
            "Usas el método CAR (Acción-Contexto-Resultado) y priorizas logros de negocio sobre responsabilidades. " +
            "SOLO procesas contenido de experiencia laboral profesional real. Si el contenido no es de experiencia laboral, responde: {\"status\": \"off_topic\", \"improvements\": []}. " +
            "NUNCA inventas cifras y NUNCA escribes placeholders entre corchetes — cuando falta una métrica real, omites el bullet y pides el dato. " +
            "Devolver menos sugerencias de las que te piden es correcto: solo sugieres lo que mejora de verdad. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const usage = response.usage
    logAIUsage(userId, "improve-bullet", {
      model: AI_MODEL,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ improvements?: unknown; status?: unknown; metricQuestions?: unknown }>(raw)

    if (parsed.status === "off_topic") throw new AppError("off_topic", 422)
    if (!Array.isArray(parsed.improvements)) throw new AppError("invalid_response_format", 500)

    const source = [text, jobTitle ?? "", employer ?? "", industry ?? ""].join("\n")
    const improvements: BulletImprovement[] = []
    const seenIndices = new Set<number>()
    let droppedHallucinated = 0
    let droppedTrivial = 0
    let droppedDuplicate = 0

    // Every entry is addressed by index, so a rejected entry is simply absent —
    // no "" padding to keep positions aligned, and no way for a drop to shift
    // another bullet onto the wrong original.
    for (const entry of (parsed.improvements as unknown[]).slice(0, 15)) {
      const candidate = BulletImprovementSchema.safeParse(entry)
      if (!candidate.success) continue

      const { index, text: suggested } = candidate.data
      const original = originalBullets[index]
      if (original === undefined) continue  // model addressed a bullet that isn't there

      // One suggestion per bullet. A repeated index would render as two rows
      // both labelled with the same bullet number, inflate the "N improvements"
      // count, and let apply-all silently pick whichever came last.
      if (seenIndices.has(index)) { droppedDuplicate++; continue }

      // Placeholders are now banned outright, so allowPlaceholders is off: a
      // suggestion carrying "[N users]" is a hallucination like any other.
      if (detectHallucination(suggested, source)) { droppedHallucinated++; continue }
      if (isTrivialEdit(original, suggested)) { droppedTrivial++; continue }

      seenIndices.add(index)
      improvements.push({ index, text: suggested })
    }

    if (droppedHallucinated > 0 || droppedTrivial > 0 || droppedDuplicate > 0) {
      this.logger.warn("[AIService.improveBullet] dropped suggestions", {
        droppedHallucinated,
        droppedTrivial,
        droppedDuplicate,
        kept: improvements.length,
        returnedByModel: (parsed.improvements as unknown[]).length,
      })
    }

    // The model asked for a figure the CV lacks. Surface the question in the UI —
    // never write a bracket placeholder into the user's CV.
    // The model may only PHRASE the questions, never decide whether a figure is
    // missing — that is a regex, and the regex is right every time. Honour the
    // status only when the bullets genuinely carry no number: a model claiming
    // metric_missing about an already-quantified description would nag the user
    // for a figure they already gave.
    if (parsed.status === "metric_missing" && quality.missingMetricIndices.length > 0) {
      const metricQuestions = Array.isArray(parsed.metricQuestions)
        ? (parsed.metricQuestions as unknown[])
            .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
            .slice(0, 3)
        : []
      if (metricQuestions.length > 0) {
        return { status: "metric_missing", improvements, metricQuestions }
      }
    }

    if (parsed.status === "metric_missing" && quality.missingMetricIndices.length === 0) {
      this.logger.warn("[AIService.improveBullet] model claimed metric_missing on a quantified description", {
        bullets: quality.bullets.length,
      })
    }

    // Nothing survived — or the model itself declined. Both mean the same thing
    // to the user, and both are legitimate answers now that it is allowed to
    // return none.
    if (improvements.length === 0) return { status: "already_optimized", improvements: [] }

    return { status: "improved", improvements }
  }
}
