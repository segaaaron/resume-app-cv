// lib/services/ai/modules/AIBulletModule.ts
import { validateAIInput } from "@/lib/ai-safety"
import { AI_MODEL_PROSE, AI_TEMPERATURE_STRUCTURED, logAIUsage } from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { cleanGeneratedText } from "../shared/clean-output"
import { parseAIJson, resolveLanguage, hasHardCodedFact, hardCodedFactKind, proposesRangeFigure, losesStatedFigure } from "../shared/ai-helpers"
import { retryNudge } from "../shared/never-empty"
import { computeCostUsd } from "../shared/cost-tracker"
import { parseBullets, renderBulletsForPrompt } from "../shared/bullets"
import { isTrivialEdit, isCosmeticReword, addsNoInformation, dropsContentWithoutGain } from "../shared/text-similarity"
import { droppedPostingTerms } from "@/lib/ats/rewrite-keeps-match"
import { reportGuardDrops } from "../shared/guard-metrics"
import { assessDescription, isDescriptionOptimized, assessImprovability } from "../shared/bullet-quality"
import { cvValueBar, noHardCodedFactsRule, proseRules } from "../shared/cv-writing-doctrine"
import { hasCliche } from "../shared/cliches"
import {
  AI_INPUT_LIMITS,
  BulletImprovementSchema,
  type BulletImprovement,
  type BulletResult,
  type ImproveBulletInput,
} from "../shared/ai-types"
import { defectStillPresent } from "../shared/repairable-defects"



export class AIBulletModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  /**
   * LA REGLA DE KEYWORDS, DICHA POR EL ATS Y NO ADIVINADA POR EL MODELO.
   *
   * «El ATS manda: todo lo que tenga el ATS debe consultar al ATS» (CEO,
   * 2026-08-22, tercera vez). Este prompt decía «incorporá 1-2 keywords del
   * sector/puesto» y el modelo elegía cuáles mirando el título — nombres
   * plausibles para el oficio, no los que ESTA vacante pide por nombre. Tejer
   * «Excel» donde la oferta dice «Power BI» no mueve un solo punto.
   *
   * Con la lista, la instrucción deja de ser un consejo genérico y pasa a ser el
   * dato: éstas son las palabras que el filtro busca, usá las que el trabajo
   * descrito respalde. Sin ella —un CV que se edita sin haber pegado una
   * vacante— se conserva el texto de siempre: falla ABIERTO.
   */
  private atsKeywordRule(terms: readonly string[], en: boolean): string {
    if (terms.length === 0) {
      return en
        ? "naturally incorporate 1-2 industry/role keywords within bullets."
        : "incorpora 1-2 keywords del sector/puesto de forma natural dentro de los bullets."
    }
    const lista = terms.join(", ")
    return en
      ? `these are the terms THIS posting asks for by name — ${lista}. Weave in only the ones the described work genuinely supports, in the candidate's own words. Never add a term the source does not back, and never drop one the original line already had.`
      : `estos son los términos que ESTA vacante pide por nombre — ${lista}. Tejé sólo los que el trabajo descrito respalde de verdad, con las palabras del candidato. Nunca agregues uno que el source no respalde, y nunca saques uno que la línea original ya decía.`
  }

  async improveBullet(userId: string, input: ImproveBulletInput, plan: string): Promise<BulletResult> {
    await enforceAIQuota(userId, "improve-bullet", plan)

    const { text, jobTitle, employer, industry, language: rawLanguage, focus: rawFocus = [] } = input
    const focus = [...rawFocus]
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
     * thin, too long. A missing figure is NOT in that list — we refuse to hard-code
     * numbers, so it is not something a rewrite can repair.
     *
     * `focus` is the exception: the panel diagnosed a specific defect and the
     * user pressed that button, so the request is honoured.
     */
    /**
     * A bullet that states no result is a bullet for the AI to work on, not a
     * reason to refuse it.
     *
     * This used to RETURN before the model was ever called: the user pressed
     * "improve with AI", and the AI never saw their line. Measured on five
     * ordinary bullets from five trades, two of them ended there — "Atendí
     * pacientes en el área de emergencias" and "Desarrollé aplicaciones web con
     * React y Node" were both handed back untouched with "we need more from
     * you". Both can be improved: the verb, the specificity, the object of the
     * work. None of that needs a figure.
     *
     * The signal was right; blocking on it was wrong. It is passed to the model
     * as the `metric` focus, whose instruction already reads "never hard-code a
     * number and never ask for one; if the source has no figure, improve the
     * wording". The guard now sharpens the request instead of cancelling it.
     */
    // What the PANEL diagnosed, as opposed to what this function added below.
    // The distinction matters: a diagnosis suspends the "leave good bullets
    // alone" filters, because the defect is known and the rewrite is owed. A
    // hint we added ourselves must not suspend anything — otherwise asking the
    // model to polish a clean line would also switch off the filters that stop
    // a reword being sold as an improvement. That exact mistake was made here
    // and caught by no-improvement-loop.test.ts.
    const diagnosed = rawFocus.length > 0

    const statesNoResult = assessImprovability(text) === "needs_input"
    if (statesNoResult && !diagnosed) focus.push("metric")

    // THE STOP DECISION BELONGS TO THE ANSWER, NOT TO A RULE WRITTEN BEFOREHAND.
    //
    // This used to return "already optimised" WITHOUT CALLING THE MODEL, based on
    // four deterministic signals: weak opener, cliché, under six words, over
    // forty-five. Measured on four ordinary bullets, three never reached the AI
    // at all — "Desarrollé aplicaciones web con React y Node" is seven words,
    // opens with a verb and carries no cliché, so the rules called it finished
    // and the user who pressed "improve with AI" was answered by four ifs.
    //
    // A rule can tell whether a bullet has a FORMAL defect. It cannot tell
    // whether a professional writer could sharpen it, and that judgement is the
    // one the user is paying the model for. So the call happens.
    //
    // The loop this guarded against is still closed, one step later and by
    // better evidence: the filters below drop a rewrite that is trivial,
    // cosmetic, or that strips content without adding any — so a bullet that
    // truly cannot be improved comes back "already optimised" because every
    // suggestion for it was empty of value, which is a fact about the answer
    // rather than a guess made before asking.
    const formallyClean = isDescriptionOptimized(text)
    if (formallyClean && !diagnosed) {
      // Nothing diagnosed and no formal defect: the model is told to polish
      // rather than repair, so it does not manufacture a fault to fix.
      focus.push("polish")
    }

    const context = [
      jobTitle ? `Puesto: ${jobTitle}` : "",
      employer ? `Empresa: ${employer}` : "",
      industry ? `Industria: ${industry}` : "",
    ].filter(Boolean).join(" | ")

    const originalBullets = parseBullets(text)
    const indexedBullets = renderBulletsForPrompt(originalBullets, { indent: "  " })
    const bulletCount = originalBullets.length

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
      passive: {
        en: "is written in the passive voice — the work shows and the person who did it disappears. The rewrite MUST be first person, active, opening with the verb the work deserves, keeping every fact",
        es: "está escrita en voz pasiva — el trabajo aparece y quien lo hizo desaparece. La reescritura DEBE ir en primera persona, activa, abriendo con el verbo que le corresponde y conservando todos los datos",
      },
      metric: {
        en: "states no result — sharpen the action and the outcome the source already contains. When the work plainly has a measurable size they did not write down, propose it as a range for them to confirm; never hard-code a precise figure",
        es: "no expresa resultado — afilá la acción y el resultado que el source YA contiene. Cuando el trabajo tiene un tamaño medible evidente que él no escribió, proponelo como rango para que lo confirme; nunca quemes una cifra exacta",
      },
      // Not a defect: no rule fired on this bullet and the user asked anyway.
      // The request is to make it read as a professional wrote it — sharper verb,
      // the specific object of the work, the scope the source already implies —
      // NOT to manufacture a fault so there is something to fix. Returning the
      // same line with filler attached ("...para mantener su funcionamiento") is
      // what the filters below throw away, and rightly.
      polish: {
        en: "has no formal defect — this is a polish, not a repair. Sharpen the verb, name the specific object of the work and the scope the source already implies, and cut any word that carries no information. If you cannot make it genuinely sharper without adding facts, say so instead of padding it",
        es: "no tiene un defecto formal — esto es un pulido, no una reparación. Afilá el verbo, nombrá el objeto concreto del trabajo y el alcance que el source ya implica, y sacá cualquier palabra que no aporte información. Si no podés hacerlo genuinamente más filoso sin agregar datos, decilo en vez de rellenarlo",
      },
    }
    const focusLines = focus.map((f) => FOCUS_TEXT[f]).filter(Boolean)
    // A polish is not a diagnosis, so it does not get the "you MUST rewrite it"
    // block: ordering a rewrite of a bullet with nothing wrong is how a model
    // ends up padding a clean line to obey.
    const isPolishOnly = focus.length === 1 && focus[0] === "polish"
    const focusBlock = focusLines.length === 0
      ? ""
      : isPolishOnly
      ? language === "en"
        ? `\n=== WHAT IS BEING ASKED ===\nThis bullet ${focusLines[0].en}.\nKeep every fact, tool and number the original states.\n`
        : `\n=== QUÉ SE ESTÁ PIDIENDO ===\nEste bullet ${focusLines[0].es}.\nConservá todos los datos, herramientas y cifras del original.\n`
      : language === "en"
        ? `\n=== ALREADY DIAGNOSED — THIS IS NOT A JUDGEMENT CALL ===
This bullet was flagged by the resume analyzer for: \n${focusLines.map((l) => `- ${l.en}`).join("\n")}
You MUST return a rewrite for it. "already_optimized" is NOT an acceptable answer here — the defect above is real and the user asked for it to be fixed. Rule 8 ("leave strong bullets alone") does NOT apply to this bullet. Keep every fact, tool and number the original states.\n`
        : `\n=== YA DIAGNOSTICADO — ESTO NO ES OPINABLE ===
El analizador de CV marcó este bullet por: \n${focusLines.map((l) => `- ${l.es}`).join("\n")}
DEBES devolver una reescritura. "already_optimized" NO es una respuesta aceptable aquí — el defecto de arriba es real y el usuario pidió arreglarlo. La regla 8 ("deja en paz los bullets ya fuertes") NO aplica a este bullet. Conserva todos los datos, herramientas y cifras del original.\n`

    /**
     * Angles, and the reason they exist.
     *
     * One rewrite leaves a yes/no: dislike it and the only way forward is to ask
     * again — the loop this panel kept producing. Two more, argued differently,
     * turn that into a choice that ENDS.
     *
     * Only for a single-bullet request. Improving a whole role stays one line
     * each: three variants across ten bullets is a wall to read and a bill to pay,
     * and there the user wants a pass over the section, not a menu per line.
     */
    const wantsVariants = bulletCount === 1
    const variantsBlock = !wantsVariants
      ? ""
      : language === "en"
        ? `\n=== GIVE THE CANDIDATE A CHOICE ===
Return the strongest rewrite as "text", plus up to 2 "alternatives" that argue the SAME work from a different angle:
- "technical": the engineering — systems, tools, architecture, how it was built.
- "business": what it was worth — users, revenue, cost, risk, time.
- "leadership": people and process — who was aligned, what practice changed.
Every angle obeys the rules above: an angle the source does not support is simply omitted. Two honest options beat three where one is hard-coded.
Add "why" to each (max 20 words): what the candidate gains over their original wording. Name the concrete change, never "more impactful".\n`
        : `\n=== DALE A ELEGIR AL CANDIDATO ===
Devuelve la mejor reescritura en "text", más hasta 2 "alternatives" que defiendan el MISMO trabajo desde otro ángulo:
- "technical": la ingeniería — sistemas, herramientas, arquitectura, cómo se construyó.
- "business": cuánto valió — usuarios, ingresos, costo, riesgo, tiempo.
- "leadership": personas y proceso — a quién se alineó, qué práctica cambió.
Cada ángulo cumple las reglas de arriba: un ángulo que el source no respalda simplemente se omite. Dos opciones honestas valen más que tres con una quemada.
Agrega "why" a cada una (máx 20 palabras): qué gana el candidato frente a su redacción original. Nombra el cambio concreto, nunca "más impactante".\n`

    const postingTerms = input.postingTerms ?? []
    const atsRule = this.atsKeywordRule(postingTerms, true)
    const atsRuleEs = this.atsKeywordRule(postingTerms, false)

    const prompt = language === "en"
      ? `${cvValueBar("en")}

${noHardCodedFactsRule("en")}

${proseRules("en")}

TASK: Improve the bullets of this work experience.

${context ? `Position context: ${context}` : ""}

Original bullets (each addressed by its index):
${indexedBullets}
${focusBlock}${variantsBlock}
TRANSFORMATION RULES:
1. CAR method per bullet: Action (strong verb) → Brief context (if applicable) → Result stated in the source.
2. Verb first, always. PROHIBITED openers/clichés: "Responsible for", "In charge of", "Assisted with", "Helped with", "Worked on", "Duties included", and empty buzzwords ("team player", "detail-oriented", "hard-working", "results-driven", "go-getter"). No personal pronouns (I, my).
3. Choose verbs based on role context:
   - Tech/Product: Architected, Developed, Automated, Migrated, Optimized, Deployed, Refactored, Scaled
   - Leadership/Management: Led, Mentored, Coordinated, Aligned, Consolidated, Transformed, Prioritized
   - Operations/Process: Reduced, Standardized, Implemented, Centralized, Increased, Structured
   - Sales/Business/Marketing: Grew, Closed, Negotiated, Expanded, Positioned, Captured, Generated
4. ATS: ${atsRule}
5. HUMAN VOICE (avoid AI-detection): vary sentence length and structure — never a uniform rhythm. Write the way the candidate would speak in an interview, not like a press release. Anchor each rewrite to a concrete detail already in the source (tool, product, team size, timeframe) when available — never supply one yourself.
6. Each entry replaces exactly ONE original bullet: give its "index" and prefix the text with "• ". Never merge, split or reorder bullets.
7. END ON SUBSTANCE. Never close a bullet with a vague impact clause that names nothing concrete — banned tails: "to improve X", "to enhance/support/streamline/strengthen Y", "improving the experience", "strengthening performance", "ensuring smooth operations", and any "…to <verb> <abstract noun>" tacked on to sound impactful. Either end on a concrete result the source states (a number, a named system, a real outcome) or end on the concrete action itself. A shorter bullet that stops at the real work beats one padded with a hollow purpose clause.
8. LEAVE STRONG BULLETS ALONE. If a bullet already opens with a strong action verb AND names specific work (real tools, systems, or outcomes), it is already good — OMIT it. Do NOT reword it just to phrase it differently or "tighten" it: swapping "enhance"→"expand" or dropping "strengthen team performance" makes it DIFFERENT, not better, and quietly loses detail the candidate stated. Only rewrite such a bullet if you can ADD a concrete result, number, or keyword the source supports. When in doubt, leave it.

WHAT TO RETURN — read this last and follow it exactly:
Include an entry in "improvements" ONLY for a bullet you can MATERIALLY improve using facts already in the source. Omit every other bullet. A bullet you would hand back nearly unchanged does not belong in the response — leaving it out is the correct move, not a failure. A bullet with no number can still be improved by wording (stronger verb, clearer action/outcome) — improve it; never demand a figure.
- No bullet can be materially improved → {"status": "already_optimized", "improvements": []}. This is a correct and expected answer.
- Otherwise → {"status": "improved", "improvements": [...]}.
- The text is not real professional work experience → {"status": "off_topic", "improvements": []}.

Respond ONLY with valid JSON (no markdown):
{"status": "improved", "improvements": [{"index": 0, "text": "• improved bullet", "why": "names the system instead of the duty", "alternatives": [{"text": "• same work, business angle", "angle": "business", "why": "leads with what it was worth"}]}]}`
      : `${cvValueBar("es")}

${noHardCodedFactsRule("es")}

${proseRules("es")}

TAREA: Mejorá los bullets de esta experiencia laboral.

${context ? `Contexto del puesto: ${context}` : ""}

Bullets originales (cada uno con su índice):
${indexedBullets}
${focusBlock}${variantsBlock}
REGLAS DE TRANSFORMACIÓN:
1. Método CAR por bullet: Acción (verbo fuerte) → Contexto breve (si aplica) → Resultado presente en el source.
2. Verbo primero, siempre. PROHIBIDO aperturas/clichés: "Responsable de", "Encargado de", "Apoyé en", "Ayudé con", "Trabajé en", "Mis funciones incluían", y muletillas vacías ("trabajo en equipo", "orientado al detalle", "proactivo", "orientado a resultados"). Sin pronombres (yo, mi, mis).
3. Elige verbos según el contexto del puesto:
   - Tech/Producto: Arquitecté, Desarrollé, Automaticé, Migré, Optimicé, Desplegué, Refactoricé, Escalé
   - Liderazgo/Gestión: Lideré, Mentoré, Coordiné, Alineé, Consolidé, Transformé, Prioricé
   - Operaciones/Procesos: Reduje, Estandaricé, Implementé, Centralicé, Incrementé, Estructuré
   - Ventas/Negocio/Marketing: Crecí, Cerré, Negocié, Expandí, Posicioné, Capturé, Generé
4. ATS: ${atsRuleEs}
5. VOZ HUMANA (evita detección de IA): varía el largo y la estructura de las frases — nunca un ritmo uniforme. Escribe como el candidato hablaría en una entrevista, no como nota de prensa. Ancla cada reescritura a un dato concreto ya presente en el source (herramienta, producto, tamaño de equipo, plazo) cuando exista — nunca lo pongas vos.
6. Cada entrada reemplaza exactamente UN bullet original: da su "index" y prefija el texto con "• ". Nunca fusiones, dividas ni reordenes bullets.
7. TERMINA EN SUSTANCIA. Nunca cierres un bullet con una cola de impacto vaga que no nombra nada concreto — colas prohibidas: "para mejorar X", "para asegurar/garantizar/fortalecer Y", "contribuyendo a la eficiencia", "asegurando el desarrollo", "mejorando la experiencia", "optimizando el rendimiento", y cualquier "…para <verbo> <sustantivo abstracto>" añadido para sonar impactante. Termina en un resultado concreto que el source declare (una cifra, un sistema nombrado, un resultado real) o termina en la acción concreta misma. Un bullet más corto que se detiene en el trabajo real gana a uno rellenado con una cláusula de propósito hueca.
8. DEJA EN PAZ LOS BULLETS YA FUERTES. Si un bullet ya empieza con un verbo de acción fuerte Y nombra trabajo específico (herramientas, sistemas o resultados reales), ya está bien — OMÍTELO. NO lo reescribas solo para decirlo distinto o "condensarlo": cambiar "mejorar"→"ampliar" o eliminar "fortalecer el rendimiento del equipo" lo hace DIFERENTE, no mejor, y pierde en silencio detalle que el candidato declaró. Reescribe un bullet así SOLO si puedes AGREGAR un resultado concreto, cifra o keyword que el source respalde. Ante la duda, déjalo.

QUÉ DEVOLVER — lee esto al final y cúmplelo exactamente:
Incluye una entrada en "improvements" SOLO para un bullet que puedas mejorar MATERIALMENTE usando datos ya presentes en el source. Omite todos los demás. Un bullet que devolverías casi sin cambios NO va en la respuesta — dejarlo fuera es lo correcto, no un fallo. Un bullet sin número igual se puede mejorar por redacción (verbo más fuerte, acción/resultado más claros) — mejóralo; nunca exijas una cifra.
- Ningún bullet se puede mejorar materialmente → {"status": "already_optimized", "improvements": []}. Es una respuesta correcta y esperada.
- En cualquier otro caso → {"status": "improved", "improvements": [...]}.
- El texto no es experiencia laboral profesional real → {"status": "off_topic", "improvements": []}.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"status": "improved", "improvements": [{"index": 0, "text": "• bullet mejorado", "why": "nombra el sistema en vez de la función", "alternatives": [{"text": "• el mismo trabajo, ángulo de negocio", "angle": "business", "why": "abre con cuánto valió"}]}]}`

    const callModel = async (userContent: string) => await this.aiClient.chat({
      model: AI_MODEL_PROSE,
      // Three worded options plus their reasons do not fit the one-line budget,
      // and a truncated JSON is a parse error, not a shorter answer. Raised only
      // for the single-bullet request that asks for them.
      max_tokens: wantsVariants ? 1800 : 1200,
      // improve-bullet uses low temperature (0.3) to reduce hard-coded facts.
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          // El `system` va en el MISMO idioma que el CV. Estaba solo en español: un CV en
          // inglés recibía el rol y las restricciones duras en un idioma y la tarea en
          // otro, que es justo donde se cuelan los errores de una de las dos ramas.
          content: (language === "en"
            ? "You write CV bullets for the trade the candidate actually works in — a bank teller, a welder, a nurse, a lawyer, a farmer or a software engineer, and each one in the vocabulary of THEIR trade. " +
              "Turn a duty into a line that names the real work: Action → Context → Result, where the result is one the source states. " +
              "You ONLY process real professional work experience. If the content is not work experience, respond: {\"status\": \"off_topic\", \"improvements\": []}. " +
              "Returning fewer suggestions than requested is correct: you only suggest what genuinely improves. "
            : "Escribís viñetas de CV para el oficio en el que el candidato trabaja de verdad — un cajero de banco, un soldador, una enfermera, un abogado, un agricultor o un ingeniero de software, y cada uno en el vocabulario de SU oficio. " +
              "Convertís una tarea en una línea que nombra el trabajo real: Acción → Contexto → Resultado, y el resultado es uno que el source declara. " +
              "SOLO procesás contenido de experiencia laboral profesional real. Si el contenido no es de experiencia laboral, respondé: {\"status\": \"off_topic\", \"improvements\": []}. " +
              "Devolver menos sugerencias de las que te piden es correcto: solo sugerís lo que mejora de verdad. "
          ) + langInstruction,
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
      let droppedHardCoded = 0
      let droppedTrivial = 0
      let droppedDuplicate = 0
      // Separados del "trivial" a propósito: son los dos motivos CAROS. Meterlos
      // en la misma bolsa hacía imposible ver si el prompt empezó a comerse
      // cifras o términos de la vacante, que es lo que baja el puntaje.
      let droppedFigure = 0
      let droppedTerm = 0

      // Every entry is addressed by index, so a rejected entry is simply absent —
      // no "" padding to keep positions aligned, and no way for a drop to shift
      // another bullet onto the wrong original.
      for (const entry of (parsed.improvements as unknown[]).slice(0, 15)) {
        const candidate = BulletImprovementSchema.safeParse(entry)
        if (!candidate.success) continue

        const { index, text: suggested, why, alternatives: rawAlts } = candidate.data
        const original = originalBullets[index]
        if (original === undefined) continue  // model addressed a bullet that isn't there

        // One suggestion per bullet. A repeated index would render as two rows
        // both labelled with the same bullet number, inflate the "N improvements"
        // count, and let apply-all silently pick whichever came last.
        if (seenIndices.has(index)) { droppedDuplicate++; continue }

        /**
         * POSTURA A (ver «LA POLÍTICA DE LA CIFRA» en `ai-helpers`).
         *
         * Esto reescribe una viñeta que ESCRIBIÓ EL CANDIDATO, así que hay un
         * relato detrás y la doctrina autoriza proponer el tamaño como rango que
         * él confirma. Antes esto devolvía un booleano y tiraba la reescritura
         * entera: le pedíamos el rango en el prompt y le borrábamos la respuesta.
         *
         * Placeholder y marca no declarada se siguen descartando sin preguntar:
         * ésos no son una propuesta, son un dato falso sobre él.
         */
        const factKind = hardCodedFactKind(suggested, source)
        if (factKind === "placeholder" || factKind === "brand") { droppedHardCoded++; continue }
        /**
         * Y la cifra sólo sobrevive SI ES UN RANGO A CONFIRMAR.
         *
         * «Entre 50 y 100 transacciones por día» es una pregunta que él contesta;
         * «reduje las fallas un 40%» es una afirmación que nunca hizo. La
         * doctrina distingue las dos con esas palabras — el guard no lo hacía, y
         * por eso tenía que elegir entre tirar la propuesta legítima (lo que
         * hacía) o dejar pasar un resultado fabricado.
         */
        if (factKind === "figure" && !proposesRangeFigure(suggested)) { droppedHardCoded++; continue }
        if (isTrivialEdit(original, suggested)) { droppedTrivial++; continue }
        // Same guard Review uses: a synonym-only swap ("enhance"→"improve") on an
        // otherwise-identical bullet reads the same on both sides — drop it rather
        // than sell a reword as an improvement. Spares spelling fixes + enrichments.
        //
        // Skipped when the caller named a defect: replacing a weak opener
        // ("Participé en…" → "Coordiné…") is a small textual change by every
        // similarity measure, and dropping it is exactly why the panel could flag
        // a bullet as weak and then refuse to fix it.
        if (!diagnosed && isCosmeticReword(original, suggested)) { droppedTrivial++; continue }
        // Reordered words, or the same line with empty words bolted on. Both
        // used to reach the user as "improvements"; both are the sentence they
        // already had. Applies with or without a diagnosis: a rewrite that says
        // nothing new does not fix a defect either.
        if (addsNoInformation(original, suggested)) { droppedTrivial++; continue }
        // Lateral-rewrite guard: when the ORIGINAL is already strong (opens with a
        // verb — no weak "responsible for" opener — and carries no cliché), a rewrite
        // that STRIPS content it stated and adds nothing concrete is different, not
        // better ("…to enhance iOS app functionality" → "…into the iOS app"). Leave
        // the good bullet alone. A bullet the caller diagnosed is by definition not
        // "already strong", so the guard does not apply to it either.
        const originalIsStrong = !diagnosed
          && assessDescription(original).weakOpenerIndices.length === 0
          && !hasCliche(original)
        if (originalIsStrong && dropsContentWithoutGain(original, suggested)) { droppedTrivial++; continue }
        /**
         * Y NUNCA BORRAR LA CIFRA QUE EL CANDIDATO ESCRIBIÓ.
         *
         * ── EL HUECO, ENCONTRADO BARRIENDO LOS CUATRO PRODUCTORES ─────────
         *
         * Esta regla se midió y se cerró el 2026-08-19 en tailor (viñetas y
         * resumen), en review y en el ATS. `improve-bullet` escribe la misma
         * clase de prosa, va al mismo campo del CV, y quedó afuera.
         *
         * Ninguno de los cuatro guards de arriba lo ve, y está documentado en
         * el propio test de la regla: `hasHardCodedFact` caza cifras AÑADIDAS,
         * no borradas · `isTrivialEdit` y `isCosmeticReword` no aplican porque
         * la redacción SÍ cambió · `dropsContentWithoutGain` ve ganancia
         * porque el texto creció, y además sólo corre si la línea original era
         * fuerte.
         *
         * El caso medido entonces: «Cut medication errors from 12 to 3 per
         * month» volvía más rica y sin el 12 ni el 3. El usuario aprieta un
         * botón rotulado como mejora y pierde lo único de esa línea que un
         * reclutador puede pesar.
         */
        if (losesStatedFigure(original, suggested)) { droppedFigure++; continue }
        /**
         * NI DEJAR AFUERA UN TÉRMINO QUE LA VACANTE PIDE.
         *
         * La otra mitad de la regla 4: al modelo se le dice cuáles son, y acá se
         * verifica que no se haya llevado ninguno puesto. Medido en el ejecutor,
         * que tenía el mismo hueco: un CV entró con 23 y salió con 16 aplicando
         * lo que el panel ofrecía, porque la reescritura —más rica, con las
         * cifras intactas— se comía un término de la oferta.
         *
         * Se pregunta con `termPresent`, la misma función con la que el matcher
         * cuenta la cobertura: el guard y el puntaje no pueden discrepar.
         * Sin vacante analizada la lista viene vacía y esto no descarta nada.
         */
        if (droppedPostingTerms(original, suggested, postingTerms).length > 0) { droppedTerm++; continue }

        seenIndices.add(index)

        // Alternatives face the SAME gauntlet as the main rewrite. Offering a
        // second angle must not become a side door for a hard-coded figure or a
        // lossy reword: the user picks one of these with a click, so a variant
        // that fails a guard is worse than having no choice at all. Anything that
        // does not survive is simply not offered — fewer honest options beat more.
        const alternatives = (rawAlts ?? [])
          .map((a) => ({ ...a, text: a.text.trim() }))
          .filter((a) => a.text
            && a.text !== suggested
            // En las alternativas sí se descarta la cifra propuesta: el usuario
            // elige una de tres con un clic, y confirmar un rango por cada opción
            // convierte una decisión en tres. La recomendada ya trae esa puerta.
            && !hasHardCodedFact(a.text, source)
            && !isTrivialEdit(original, a.text)
            && !losesStatedFigure(original, a.text)
            && droppedPostingTerms(original, a.text, postingTerms).length === 0
            && !(originalIsStrong && dropsContentWithoutGain(original, a.text)))
          .slice(0, 2)

        improvements.push({
          ...(factKind === "figure" ? { needsFigureConfirm: true } : {}),
          index,
          text: suggested,
          why: why?.trim() || undefined,
          alternatives: alternatives.length > 0 ? alternatives : undefined,
        })
      }

      /**
       * LO QUE LOS GUARDS TIRAN, VISIBLE.
       *
       * ── EL HUECO (pase de QA, 2026-08-22) ────────────────────────────────
       *
       * Esto salía por `logger.warn`, que va a la consola del contenedor. El
       * propio comentario de `guard-metrics` lo dice: nadie los leyó nunca. El
       * instrumento que los pone en el panel de admin existe desde la sesión
       * pasada y estaba cableado a UNO de los cuatro endpoints que filtran.
       *
       * Sin esto, «el usuario ve menos sugerencias» y no hay forma de saber si
       * es porque su CV ya está bien o porque nos estamos comiendo su trabajo —
       * que es exactamente la pregunta que el CEO hizo.
       */
      reportGuardDrops({
        endpoint: "improve-bullet",
        offered: (parsed.improvements as unknown[]).length,
        kept: improvements.length,
        hardCoded: droppedHardCoded,
        figureLoss: droppedFigure,
        trivial: droppedTrivial + droppedDuplicate,
        termLoss: droppedTerm,
      })
      return improvements
    }

    let improvements = harvest(response.choices[0]?.message?.content ?? "")

    // One retry whenever the first pass came back empty.
    //
    // It used to run only when the panel had named a defect, on the reasoning
    // that "nothing to improve" is a legitimate answer otherwise. It is — but it
    // is also what an empty roll looks like, and the two are indistinguishable
    // from here. The user pressing a button and being told "nothing to improve",
    // then pressing it again and getting three suggestions, is the same bug in
    // both cases, and they paid a use for it either way.
    //
    // The insistence below is only truthful when a defect WAS diagnosed, so
    // without one the retry is a plain second ask.
    if (improvements.length === 0) {
      // Se RETIRA la licencia de devolver vacío en vez de contradecirla. Antes esto
      // pegaba "tu respuesta vacía se rechaza" a un prompt que unas líneas arriba decía
      // "dejarlo fuera es lo correcto": OpenAI documenta que ante reglas en conflicto el
      // modelo gasta tokens de razonamiento intentando reconciliarlas en lugar de elegir
      // una. Aquí no hay conflicto real — el defecto ya se diagnosticó en código, así que
      // en ESTE camino vaciar sí es una negativa.
      const licence = language === "en"
        ? "A bullet you would hand back nearly unchanged does not belong in the response — leaving it out is the correct move, not a failure. "
        : "Un bullet que devolverías casi sin cambios NO va en la respuesta — dejarlo fuera es lo correcto, no un fallo. "
      const withoutLicence = prompt.replace(licence, "")
      const insist = !diagnosed
        // No diagnosis to lean on: ask again, plainly. Claiming a defect the
        // panel never found would push the model to hard-code one and "fix" it.
        ? prompt + retryNudge(language)
        : language === "en"
          ? `${withoutLicence}\n\nThe bullet above has the diagnosed defect named in this request, so it CAN be improved. Return exactly one entry for index 0 that fixes it, preserving every fact.`
          : `${withoutLicence}\n\nEl bullet de arriba tiene el defecto diagnosticado que se nombra en esta petición, así que SÍ se puede mejorar. Devuelve exactamente una entrada para el índice 0 que lo arregle, conservando todos los datos.`
      /**
       * Y SI LO QUE FALLÓ FUE UN TÉRMINO, SE LE DICE CUÁL.
       *
       * Cazado en el pase de QA de esta sesión. El guard de términos descarta la
       * reescritura que deja afuera una palabra que la vacante pide, y este
       * reintento decía sólo «el bullet tiene el defecto diagnosticado, arreglalo».
       * El modelo no tenía forma de saber qué se le tiró: reescribía igual, el
       * guard lo descartaba otra vez, y el usuario recibía «ya está bien» sobre
       * una línea que SÍ se podía mejorar — con el uso ya gastado.
       *
       * Es la misma lección que el ejecutor ya había pagado con `rejectedNudge`:
       * un guard que descarta en silencio convierte el reintento en una segunda
       * moneda tirada a la basura.
       */
      const conTérminos = postingTerms.length > 0
        ? insist + (language === "en"
          ? `\n\nKeep every term the original line already had from this list: ${postingTerms.join(", ")}. Dropping one costs the candidate points.`
          : `\n\nConservá todos los términos de esta lista que la línea original ya decía: ${postingTerms.join(", ")}. Dejar uno afuera le cuesta puntos al candidato.`)
        : insist
      const retry = await callModel(conTérminos)
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

    // Our own words, spell-checked before they reach the CV. Handing the user a
    // rewritten bullet and then flagging a typo in it — in text they never
    // typed — is the fastest way to make the whole feature feel unreliable.
    const cleaned = await cleanGeneratedText(improvements.map((i) => i.text), language)
    return { status: "improved", improvements: improvements.map((i, idx) => ({ ...i, text: cleaned[idx] ?? i.text })) }
  }
}
