// lib/services/ai/modules/AIBulletModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import { AI_MODEL, AI_TEMPERATURE_STRUCTURED, logAIUsage } from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, resolveLanguage, detectHallucination } from "../shared/ai-helpers"
import { computeCostUsd } from "../shared/cost-tracker"
import { AI_INPUT_LIMITS, type BulletResult, type ImproveBulletInput } from "../shared/ai-types"

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

    const prompt = language === "en"
      ? `CRITICAL ANTI-HALLUCINATION RULES (mandatory, no exceptions):
1. ONLY rewrite using information present in the original description and context above. Do NOT introduce technologies, frameworks, libraries, company names, job titles, certifications, percentages, real numbers, dates, or any metric not explicitly provided.
2. When a real metric is missing, use ONLY the documented placeholders [X%], [N users], [$Z], [N months]. Never replace placeholders with invented figures.
3. CAR method (Action-Context-Result) — the "Result" segment can only cite results EXPLICITLY in the source. If a bullet would require inventing data to be improved, return it essentially unchanged (preserve the original meaning).
4. If you cannot improve a bullet without inventing content, prefer to keep the original wording over fabricating a new one.

STEP 0 — QUALITY CHECK: Evaluate if this description already has high-impact bullets (strong action verb + metric/placeholder + specific context). If YES for ALL bullets → return {"status": "already_optimized", "bullets": []} to avoid unnecessary token usage.

TASK: Transform this work experience description into high-impact professional bullets for an executive resume.

${context ? `Position context: ${context}` : ""}

Original description:
${text}

TRANSFORMATION RULES:
1. CAR method per bullet: Action (strong verb) → Brief context (if applicable) → Measurable result.
2. Verb first, always. PROHIBITED openers/clichés: "Responsible for", "In charge of", "Assisted with", "Helped with", "Worked on", "Duties included", and empty buzzwords ("team player", "detail-oriented", "hard-working", "results-driven", "go-getter"). No personal pronouns (I, my).
3. Impact order: highest business-impact bullet goes FIRST. Last bullet can be scope/reach.
4. Metrics: if not in the original, use PLACEHOLDERS: [X%], [N users], [$Z], [N months]. NEVER invent real figures.
5. Choose verbs based on role context:
   - Tech/Product: Architected, Developed, Automated, Migrated, Optimized, Deployed, Refactored, Scaled
   - Leadership/Management: Led, Mentored, Coordinated, Aligned, Consolidated, Transformed, Prioritized
   - Operations/Process: Reduced, Standardized, Implemented, Centralized, Increased, Structured
   - Sales/Business/Marketing: Grew, Closed, Negotiated, Expanded, Positioned, Captured, Generated
6. Bullet count: return EXACTLY one improved bullet per original bullet line, in the SAME order — never merge, drop, or reorder originals. Only exception: if the original is a single paragraph without bullet structure, split it into 3-5 bullets.
7. ATS: naturally incorporate 1-2 industry/role keywords within bullets.
8. HUMAN VOICE (avoid AI-detection): vary sentence length and structure across bullets — never a uniform rhythm. Write the way the candidate would speak in an interview, not like a press release. Banned AI-tell words: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy". Anchor each bullet to a concrete detail already in the source (tool, product, team size, timeframe) when available — never invent one.

Respond ONLY with valid JSON (no markdown):
{"bullets": ["• bullet1", "• bullet2", ...]}`
      : `REGLAS CRÍTICAS ANTI-ALUCINACIÓN (obligatorias, sin excepciones):
1. SOLO reescribe usando información presente en la descripción original y el contexto de arriba. NO introduzcas tecnologías, frameworks, librerías, nombres de empresas, cargos, certificaciones, porcentajes, números reales, fechas, ni métricas no proporcionadas.
2. Cuando falte una métrica real, usa ÚNICAMENTE los placeholders documentados [X%], [N usuarios], [$Z], [N meses]. Nunca sustituyas los placeholders por cifras inventadas.
3. Método CAR (Acción-Contexto-Resultado) — el "Resultado" solo puede citar resultados EXPLÍCITOS en el source. Si un bullet requiere inventar datos para mejorar, devuélvelo prácticamente sin cambios (preserva el significado original).
4. Si no puedes mejorar un bullet sin inventar contenido, prefiere conservar la redacción original antes que fabricar uno nuevo.

PASO 0 — EVALUACIÓN DE CALIDAD: Evalúa si esta descripción ya tiene bullets de alto impacto (verbo de acción fuerte + métrica/placeholder + contexto específico). Si SÍ para TODOS los bullets → devuelve {"status": "already_optimized", "bullets": []} para evitar consumo innecesario de tokens.

TAREA: Transforma esta descripción de experiencia laboral en bullets profesionales de alto impacto, listos para un CV ejecutivo.

${context ? `Contexto del puesto: ${context}` : ""}

Descripción original:
${text}

REGLAS DE TRANSFORMACIÓN:
1. Método CAR por bullet: Acción (verbo fuerte) → Contexto breve (si aplica) → Resultado medible.
2. Verbo primero, siempre. PROHIBIDO aperturas/clichés: "Responsable de", "Encargado de", "Apoyé en", "Ayudé con", "Trabajé en", "Mis funciones incluían", y muletillas vacías ("trabajo en equipo", "orientado al detalle", "proactivo", "orientado a resultados"). Sin pronombres (yo, mi, mis).
3. Orden de impacto: el bullet con mayor impacto de negocio va PRIMERO. El último puede ser de alcance/scope.
4. Métricas: si no existen en el original, usa PLACEHOLDERS: [X%], [N usuarios], [$Z], [N meses]. NUNCA inventes cifras reales.
5. Elige verbos según el contexto del puesto:
   - Tech/Producto: Arquitecté, Desarrollé, Automaticé, Migré, Optimicé, Desplegué, Refactoricé, Escalé
   - Liderazgo/Gestión: Lideré, Mentoré, Coordiné, Alineé, Consolidé, Transformé, Prioricé
   - Operaciones/Procesos: Reduje, Estandaricé, Implementé, Centralicé, Incrementé, Estructuré
   - Ventas/Negocio/Marketing: Crecí, Cerré, Negocié, Expandí, Posicioné, Capturé, Generé
6. Cantidad: devuelve EXACTAMENTE un bullet mejorado por cada línea/bullet original, en el MISMO orden — nunca fusiones, elimines ni reordenes los originales. Única excepción: si el original es un solo párrafo sin estructura de bullets, divídelo en 3-5 bullets.
7. ATS: incorpora 1-2 keywords del sector/puesto de forma natural dentro de los bullets.
8. VOZ HUMANA (evita detección de IA): varía el largo y la estructura de las frases entre bullets — nunca un ritmo uniforme. Escribe como el candidato hablaría en una entrevista, no como nota de prensa. Palabras-IA prohibidas: "Orquestó", "Apalancó", "Utilizó", "sinergia", "orientado a resultados". Ancla cada bullet a un dato concreto ya presente en el source (herramienta, producto, tamaño de equipo, plazo) cuando exista — nunca lo inventes.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"bullets": ["• bullet1", "• bullet2", ...]}`

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
            "SOLO procesas contenido de experiencia laboral profesional real. Si el contenido no es de experiencia laboral, responde: {\"bullets\": []}. " +
            "Cuando no hay métricas reales, usas SIEMPRE placeholders explícitos [X%], [N usuarios], [$Z] — NUNCA inventas cifras. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ bullets?: unknown; status?: unknown }>(raw)

    if (parsed.status === "already_optimized") {
      const usage = response.usage
      logAIUsage(userId, "improve-bullet", {
        model: AI_MODEL, plan,
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        costUsd: computeCostUsd(AI_MODEL, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
      })
      return { status: "already_optimized", bullets: [] }
    }

    if (!Array.isArray(parsed.bullets)) throw new AppError("invalid_response_format", 500)
    if (parsed.bullets.length === 0) {
      throw new AppError("off_topic", 422)
    }

    // Anti-hallucination sanitization: drop bullets that introduce data not
    // present in the original description / context (placeholders are allowed
    // because the prompt explicitly instructs the model to use them).
    const source = [text, jobTitle ?? "", employer ?? "", industry ?? ""].join("\n")
    const rawBullets = (parsed.bullets as string[]).slice(0, 15)
    const cleanBullets: string[] = []
    let droppedCount = 0
    for (const bullet of rawBullets) {
      // Push "" instead of skipping: the frontend pairs bullets with original
      // lines by index, so dropping an entry would shift every later pairing.
      if (typeof bullet !== "string" || !bullet.trim()) { cleanBullets.push(""); continue }
      if (detectHallucination(bullet, source, { allowPlaceholders: true })) {
        droppedCount++
        cleanBullets.push("")
        continue
      }
      cleanBullets.push(bullet)
    }

    if (droppedCount > 0) {
      this.logger.warn("[AIService.improveBullet] dropped hallucinated bullets", {
        droppedCount,
        keptCount: cleanBullets.length,
      })
    }

    const usage = response.usage
    logAIUsage(userId, "improve-bullet", {
      model: AI_MODEL,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
    })

    // Fail-safe: if every bullet was dropped as hallucinated, signal
    // "already_optimized" so the frontend preserves the original text rather
    // than showing invented content.
    if (cleanBullets.every((b) => !b.trim())) {
      return { status: "already_optimized", bullets: [] }
    }

    // Echo detection: anti-hallucination rule 4 tells the model to return a
    // bullet unchanged when it cannot improve it without inventing data. If
    // EVERY bullet came back unchanged, showing the suggestions modal would be
    // a no-op for the user — report "already_optimized" instead.
    //
    // The comparison also strips volatile tokens (bracket placeholders like
    // [X%]/[N usuarios]/[$Z] and bare numbers/percentages) BEFORE comparing:
    // when the only difference between the "improved" bullet and the original
    // is an inserted placeholder or a changed figure, it is not a real rewrite —
    // the user would just see near-identical suggestions. Treat that as
    // "already_optimized" too.
    const stripVolatile = (s: string) =>
      s
        .replace(/\[[^\]]*\]/g, " ")           // [X%], [N usuarios], [$Z], [N meses]
        .replace(/\d+(?:[.,]\d+)?\s*%?/g, " ")  // bare numbers and percentages
    const normalizeForCompare = (s: string) =>
      stripVolatile(s.toLowerCase().replace(/^[•\-*\s]+/, ""))
        .replace(/\s+/g, " ")
        .replace(/[.;]+$/, "")
        .trim()
    const originalLines = text.split("\n").map(normalizeForCompare).filter(Boolean)
    const allUnchanged = cleanBullets.every((b, i) =>
      !b.trim() || normalizeForCompare(b) === (originalLines[i] ?? "")
    )
    if (allUnchanged) {
      return { status: "already_optimized", bullets: [] }
    }
    return { bullets: cleanBullets }
  }
}
