// lib/services/ai/modules/AIBulletModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import { AI_MODEL_PROSE, AI_TEMPERATURE_STRUCTURED, logAIUsage } from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, resolveLanguage, detectHallucination } from "../shared/ai-helpers"
import { computeCostUsd } from "../shared/cost-tracker"
import { parseBullets, renderBulletsForPrompt } from "../shared/bullets"
import { isTrivialEdit, isCosmeticReword, dropsContentWithoutGain } from "../shared/text-similarity"
import { assessDescription, isDescriptionOptimized, assessImprovability } from "../shared/bullet-quality"
import { hasCliche } from "../shared/cliches"
import {
  AI_INPUT_LIMITS,
  BulletImprovementSchema,
  type BulletImprovement,
  type BulletResult,
  type ImproveBulletInput,
} from "../shared/ai-types"


/**
 * Is the defect the caller declared actually still in this text?
 *
 * The panel's focus is a snapshot: it was true when the CV was analysed, and it
 * may have been repaired since — by us, on the previous press. Verifying it
 * turns "the user asked" into "the user asked and it is still broken".
 *
 * `metric` deliberately never counts: we refuse to invent figures, so a missing
 * number is not a defect an AI rewrite can repair, and treating it as one is
 * what kept the rewrite button live forever.
 */
function defectStillPresent(focus: string, text: string): boolean {
  const { bullets } = assessDescription(text)
  switch (focus) {
    case "weak_verb":
      return bullets.some((b) => b.weakOpener)
    case "cliche":
      return bullets.some((b) => hasCliche(b.text))
    case "metric":
      return false
    default:
      // An unknown focus is not evidence of anything.
      return false
  }
}

export class AIBulletModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async improveBullet(userId: string, input: ImproveBulletInput, plan: string): Promise<BulletResult> {
    await enforceAIQuota(userId, "improve-bullet", plan)

    const { text, jobTitle, employer, industry, language: rawLanguage, focus = [] } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const validation = validateAIInput(text, AI_INPUT_LIMITS.bulletText)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    /**
     * Stop BEFORE the call when there is nothing to fix.
     *
     * "already_optimized" used to be the model's decision, and a model asked to
     * improve text always finds another variant — it will not volunteer "leave
     * it alone". So the user improved a bullet, waited out the cooldown, pressed
     * again and got a fresh rewrite of our own output, forever.
     *
     * The judgement is deterministic and made here: weak opener, cliché, too
     * thin, too long. A missing figure is NOT in that list — we refuse to invent
     * numbers, so it is not something a rewrite can repair.
     *
     * `focus` is the exception: the panel diagnosed a specific defect and the
     * user pressed that button, so the request is honoured.
     */
    /**
     * "Nothing to do" has two reasons and the user deserves the right one.
     *
     * `needs_input` is the bullet that is well formed but never says what it
     * achieved ("Handled customer inquiries daily"). Measured across fields, 8
     * of 12 genuinely weak bullets look like this — telling them "already
     * optimized" is false, and rewriting them means inventing the result. The
     * honest answer names what is missing and hands it back.
     */
    if (assessImprovability(text) === "needs_input" && focus.length === 0) {
      return { status: "needs_your_input", improvements: [] }
    }

    if (isDescriptionOptimized(text)) {
      // `focus` is NOT a bypass. The panel sends one on every rewrite button —
      // sometimes a hardcoded pair rather than the real defect — so honouring it
      // blindly meant the ATS panel always reached the model, even on a bullet
      // it had just rewritten. That is the loop the user kept hitting.
      //
      // A focus is a CLAIM about this text, and it is checked against the same
      // deterministic signals: if the declared defect is no longer there, it was
      // already fixed and there is nothing to do.
      const stillTrue = focus.some((f) => defectStillPresent(f, text))
      if (!stillTrue) return { status: "already_optimized", improvements: [] }
    }

    const context = [
      jobTitle ? `Puesto: ${jobTitle}` : "",
      employer ? `Empresa: ${employer}` : "",
      industry ? `Industria: ${industry}` : "",
    ].filter(Boolean).join(" | ")

    const originalBullets = parseBullets(text)
    const indexedBullets = renderBulletsForPrompt(originalBullets, { indent: "  " })

    /**
     * The caller-declared defect, spelled out for the model.
     *
     * Without it the request was generic ("improve these bullets"), rule 8 told
     * the model to leave anything decent alone, and the panel's own verdict —
     * "weak opening", "no metric" — never reached the prompt. The user then saw
     * a bullet tagged WEAK come back as "this achievement is already well
     * written", and pressing again sometimes worked and sometimes did not,
     * because nothing but sampling luck separated the two runs.
     */
    const FOCUS_TEXT: Record<string, { en: string; es: string }> = {
      weak_verb: {
        en: "opens with a duty phrase / weak verb instead of a strong action verb — the rewrite MUST start with a strong action verb and keep every fact",
        es: "abre con una frase de tarea / verbo débil en vez de un verbo de acción fuerte — la reescritura DEBE empezar con un verbo de acción fuerte y conservar todos los datos",
      },
      cliche: {
        en: "contains a recruiter cliché / empty buzzword — the rewrite MUST drop it and state the concrete work instead",
        es: "contiene un cliché de reclutador / muletilla vacía — la reescritura DEBE quitarlo y decir el trabajo concreto en su lugar",
      },
      metric: {
        en: "states no result — sharpen the action and the outcome the source already contains. NEVER invent a number and never ask for one; if the source has no figure, improve the wording",
        es: "no expresa resultado — afila la acción y el resultado que el source YA contiene. NUNCA inventes una cifra ni la pidas; si el source no tiene número, mejora la redacción",
      },
    }
    const focusLines = focus.map((f) => FOCUS_TEXT[f]).filter(Boolean)
    const focusBlock = focusLines.length === 0
      ? ""
      : language === "en"
        ? `\n=== ALREADY DIAGNOSED — THIS IS NOT A JUDGEMENT CALL ===
This bullet was flagged by the resume analyzer for: \n${focusLines.map((l) => `- ${l.en}`).join("\n")}
You MUST return a rewrite for it. "already_optimized" is NOT an acceptable answer here — the defect above is real and the user asked for it to be fixed. Rule 8 ("leave strong bullets alone") does NOT apply to this bullet. Keep every fact, tool and number the original states.\n`
        : `\n=== YA DIAGNOSTICADO — ESTO NO ES OPINABLE ===
El analizador de CV marcó este bullet por: \n${focusLines.map((l) => `- ${l.es}`).join("\n")}
DEBES devolver una reescritura. "already_optimized" NO es una respuesta aceptable aquí — el defecto de arriba es real y el usuario pidió arreglarlo. La regla 8 ("deja en paz los bullets ya fuertes") NO aplica a este bullet. Conserva todos los datos, herramientas y cifras del original.\n`

    const prompt = language === "en"
      ? `CRITICAL ANTI-HALLUCINATION RULES (mandatory, no exceptions):
1. ONLY rewrite using information present in the original bullets and the context above. Do NOT introduce technologies, frameworks, libraries, company names, job titles, certifications, percentages, real numbers, dates, or any metric not explicitly provided.
2. NEVER write a placeholder. No [X%], [N users], [$Z], <number>, or anything in brackets standing in for a figure. What you return is written straight into the candidate's CV, and a bracket left in it gets the CV rejected. If a bullet has no number in the source, still improve its wording and impact WITHOUT a figure — stronger verb, clearer action and outcome. NEVER invent a number and NEVER ask the user for one.
3. CAR method (Action-Context-Result) — the "Result" segment can only cite results EXPLICITLY present in the source.

TASK: Improve the bullets of this work experience for an executive resume.

${context ? `Position context: ${context}` : ""}

Original bullets (each addressed by its index):
${indexedBullets}
${focusBlock}
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
7. END ON SUBSTANCE. Never close a bullet with a vague impact clause that names nothing concrete — banned tails: "to improve X", "to enhance/support/streamline/strengthen Y", "improving the experience", "strengthening performance", "ensuring smooth operations", and any "…to <verb> <abstract noun>" tacked on to sound impactful. Either end on a concrete result the source states (a number, a named system, a real outcome) or end on the concrete action itself. A shorter bullet that stops at the real work beats one padded with a hollow purpose clause.
8. LEAVE STRONG BULLETS ALONE. If a bullet already opens with a strong action verb AND names specific work (real tools, systems, or outcomes), it is already good — OMIT it. Do NOT reword it just to phrase it differently or "tighten" it: swapping "enhance"→"expand" or dropping "strengthen team performance" makes it DIFFERENT, not better, and quietly loses detail the candidate stated. Only rewrite such a bullet if you can ADD a concrete result, number, or keyword the source supports. When in doubt, leave it.

WHAT TO RETURN — read this last and follow it exactly:
Include an entry in "improvements" ONLY for a bullet you can MATERIALLY improve using facts already in the source. Omit every other bullet. A bullet you would hand back nearly unchanged does not belong in the response — leaving it out is the correct move, not a failure. A bullet with no number can still be improved by wording (stronger verb, clearer action/outcome) — improve it; never demand a figure.
- No bullet can be materially improved → {"status": "already_optimized", "improvements": []}. This is a correct and expected answer.
- Otherwise → {"status": "improved", "improvements": [...]}.
- The text is not real professional work experience → {"status": "off_topic", "improvements": []}.

Respond ONLY with valid JSON (no markdown):
{"status": "improved", "improvements": [{"index": 0, "text": "• improved bullet"}]}`
      : `REGLAS CRÍTICAS ANTI-ALUCINACIÓN (obligatorias, sin excepciones):
1. SOLO reescribe usando información presente en los bullets originales y el contexto de arriba. NO introduzcas tecnologías, frameworks, librerías, nombres de empresas, cargos, certificaciones, porcentajes, números reales, fechas, ni métricas no proporcionadas.
2. NUNCA escribas un placeholder. Ni [X%], ni [N usuarios], ni [$Z], ni <número>, ni nada entre corchetes que sustituya a una cifra. Lo que devuelves se escribe directo en el CV del candidato, y un corchete olvidado ahí hace que le rechacen el CV. Si un bullet no tiene cifra en el source, igual mejóralo por redacción e impacto SIN una cifra — verbo más fuerte, acción y resultado más claros. NUNCA inventes un número y NUNCA le pidas uno al usuario.
3. Método CAR (Acción-Contexto-Resultado) — el "Resultado" solo puede citar resultados EXPLÍCITOS en el source.

TAREA: Mejora los bullets de esta experiencia laboral para un CV ejecutivo.

${context ? `Contexto del puesto: ${context}` : ""}

Bullets originales (cada uno con su índice):
${indexedBullets}
${focusBlock}
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
7. TERMINA EN SUSTANCIA. Nunca cierres un bullet con una cola de impacto vaga que no nombra nada concreto — colas prohibidas: "para mejorar X", "para asegurar/garantizar/fortalecer Y", "contribuyendo a la eficiencia", "asegurando el desarrollo", "mejorando la experiencia", "optimizando el rendimiento", y cualquier "…para <verbo> <sustantivo abstracto>" añadido para sonar impactante. Termina en un resultado concreto que el source declare (una cifra, un sistema nombrado, un resultado real) o termina en la acción concreta misma. Un bullet más corto que se detiene en el trabajo real gana a uno rellenado con una cláusula de propósito hueca.
8. DEJA EN PAZ LOS BULLETS YA FUERTES. Si un bullet ya empieza con un verbo de acción fuerte Y nombra trabajo específico (herramientas, sistemas o resultados reales), ya está bien — OMÍTELO. NO lo reescribas solo para decirlo distinto o "condensarlo": cambiar "mejorar"→"ampliar" o eliminar "fortalecer el rendimiento del equipo" lo hace DIFERENTE, no mejor, y pierde en silencio detalle que el candidato declaró. Reescribe un bullet así SOLO si puedes AGREGAR un resultado concreto, cifra o keyword que el source respalde. Ante la duda, déjalo.

QUÉ DEVOLVER — lee esto al final y cúmplelo exactamente:
Incluye una entrada en "improvements" SOLO para un bullet que puedas mejorar MATERIALMENTE usando datos ya presentes en el source. Omite todos los demás. Un bullet que devolverías casi sin cambios NO va en la respuesta — dejarlo fuera es lo correcto, no un fallo. Un bullet sin número igual se puede mejorar por redacción (verbo más fuerte, acción/resultado más claros) — mejóralo; nunca exijas una cifra.
- Ningún bullet se puede mejorar materialmente → {"status": "already_optimized", "improvements": []}. Es una respuesta correcta y esperada.
- En cualquier otro caso → {"status": "improved", "improvements": [...]}.
- El texto no es experiencia laboral profesional real → {"status": "off_topic", "improvements": []}.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"status": "improved", "improvements": [{"index": 0, "text": "• bullet mejorado"}]}`

    const callModel = async (userContent: string) => await this.aiClient.chat({
      model: AI_MODEL_PROSE,
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
            "NUNCA inventas cifras y NUNCA escribes placeholders entre corchetes — cuando falta una métrica, mejoras la redacción del bullet sin inventar ni pedir un número. " +
            "Devolver menos sugerencias de las que te piden es correcto: solo sugieres lo que mejora de verdad. " +
            langInstruction,
        },
        { role: "user", content: userContent },
      ],
    })

    const response = await callModel(prompt)

    const usage = response.usage
    logAIUsage(userId, "improve-bullet", {
      model: AI_MODEL_PROSE,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL_PROSE, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
    })

    const source = [text, jobTitle ?? "", employer ?? "", industry ?? ""].join("\n")

    /** Model output → the improvements we are willing to show. Reused by the retry. */
    const harvest = (raw: string): BulletImprovement[] => {
      const parsed = parseAIJson<{ improvements?: unknown; status?: unknown }>(raw)
      if (parsed.status === "off_topic") throw new AppError("off_topic", 422)
      if (!Array.isArray(parsed.improvements)) throw new AppError("invalid_response_format", 500)

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
        // Same guard Review uses: a synonym-only swap ("enhance"→"improve") on an
        // otherwise-identical bullet reads the same on both sides — drop it rather
        // than sell a reword as an improvement. Spares spelling fixes + enrichments.
        //
        // Skipped when the caller named a defect: replacing a weak opener
        // ("Participé en…" → "Coordiné…") is a small textual change by every
        // similarity measure, and dropping it is exactly why the panel could flag
        // a bullet as weak and then refuse to fix it.
        if (focus.length === 0 && isCosmeticReword(original, suggested)) { droppedTrivial++; continue }
        // Lateral-rewrite guard: when the ORIGINAL is already strong (opens with a
        // verb — no weak "responsible for" opener — and carries no cliché), a rewrite
        // that STRIPS content it stated and adds nothing concrete is different, not
        // better ("…to enhance iOS app functionality" → "…into the iOS app"). Leave
        // the good bullet alone. A bullet the caller diagnosed is by definition not
        // "already strong", so the guard does not apply to it either.
        const originalIsStrong = focus.length === 0
          && assessDescription(original).weakOpenerIndices.length === 0
          && !hasCliche(original)
        if (originalIsStrong && dropsContentWithoutGain(original, suggested)) { droppedTrivial++; continue }

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
      return improvements
    }

    let improvements = harvest(response.choices[0]?.message?.content ?? "")

    // One retry, ONLY when the caller named a defect and the first pass came back
    // empty. The bullet is known-defective, so "nothing to improve" is a refusal,
    // not an answer — and the user pressing the same button twice and getting a
    // different result was exactly the reported behaviour. Costs a second call on
    // the rare path instead of leaving a labelled bullet unfixable.
    if (improvements.length === 0 && focus.length > 0) {
      const insist = language === "en"
        ? `${prompt}\n\nYOUR PREVIOUS ANSWER WAS EMPTY AND IS REJECTED. The bullet has the diagnosed defect above. Return exactly one entry for index 0 that fixes it, preserving every fact. Do not answer "already_optimized".`
        : `${prompt}\n\nTU RESPUESTA ANTERIOR VINO VACÍA Y SE RECHAZA. El bullet tiene el defecto diagnosticado arriba. Devuelve exactamente una entrada para el índice 0 que lo arregle, conservando todos los datos. No respondas "already_optimized".`
      const retry = await callModel(insist)
      const retryUsage = retry.usage
      logAIUsage(userId, "improve-bullet", {
        model: AI_MODEL_PROSE,
        plan,
        promptTokens: retryUsage?.prompt_tokens ?? 0,
        completionTokens: retryUsage?.completion_tokens ?? 0,
        costUsd: computeCostUsd(AI_MODEL_PROSE, retryUsage?.prompt_tokens ?? 0, retryUsage?.completion_tokens ?? 0),
      })
      improvements = harvest(retry.choices[0]?.message?.content ?? "")
    }

    // Nothing survived — or the model itself declined. Both mean the same thing
    // to the user: nothing to improve. No metric interrogation — a bullet without
    // a number is improved by wording, never by nagging the user for a figure.
    if (improvements.length === 0) return { status: "already_optimized", improvements: [] }

    return { status: "improved", improvements }
  }
}
