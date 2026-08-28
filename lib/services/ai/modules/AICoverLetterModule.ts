// lib/services/ai/modules/AICoverLetterModule.ts
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL_PROSE,
  AI_TEMPERATURE_STRUCTURED,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { untrustedDataRule } from "../shared/untrusted-input"
import { cleanGeneratedText } from "../shared/clean-output"
import { parseAIJson, escapeHtml, resolveLanguage, hasHardCodedFact, stripVersionLabel, stripSignOff, losesStatedFigure } from "../shared/ai-helpers"
import { LETTER_ONE_PAGE_WORDS } from "@/components/cover-letter/templates/_metrics"
// The letter takes the BAR and the never-hard-code list, and not `proseRules`:
// those describe how a CV BULLET opens and how long it runs ("• ", one tense,
// 16-28 words, a past-tense verb first), which is the wrong shape for a letter
// and would fight the paragraph structure below. The two that do apply are the
// two that are about content rather than form.
import { cvValueBar, noHardCodedFactsRule, aiTellWords } from "../shared/cv-writing-doctrine"
import { computeCostUsd } from "../shared/cost-tracker"
import { isTrivialEdit } from "../shared/text-similarity"
import { assessCoverLetter } from "../shared/cover-letter-quality"
import { buildCoverLetterBrief, type CoverLetterBrief } from "@/lib/ats/cover-letter-brief"
import { detectCvLanguageOrNull } from "@/lib/resume/cv-language"
import { detectLanguage } from "../shared/translate-fields"
import { analyzeCoverLetterAts } from "@/lib/ats/cover-letter-ats"
import { hasCliche, findCliches, clicheBanList, substituteCliches } from "../shared/cliches"
import { readChat } from "@/lib/services/ai/shared/chat-result"
import { strictJsonFormat } from "@/lib/services/ai/shared/strict-schema"
import { CoverBodyShape, CoverVersionsShape } from "@/lib/services/ai/shared/ai-types"
import {
  AI_INPUT_LIMITS,
  type CoverLetterResult,
  type GenerateCoverLetterInput,
  type ImproveCoverLetterInput,
  type VersionsResult,
} from "../shared/ai-types"

/**
 * The letter body is HTML, both on the way out and on the way in.
 *
 * The editor stores what TipTap emits (`editor.getHTML()`) and the templates
 * render it with dangerouslySetInnerHTML, styling `[&>p]` for the paragraph
 * gaps. The model, though, only ever speaks plain text with blank lines between
 * paragraphs — the prompts literally ask for "paragraph breaks using \n\n".
 *
 * generate-cover-letter did this conversion inline and improve-cover-letter did
 * not, which stayed invisible only because nothing ever called improve. Wiring
 * it up surfaced both halves at once: the model was handed raw `<p>` tags, and
 * its plain-text answer went straight into a field rendered as HTML, where the
 * blank lines collapse and the whole letter lands as one block. Worse, the echo
 * filter compared an HTML original against plain-text rewrites, so nothing ever
 * looked like an echo and already_optimized could not fire at all.
 */
// Stand-in employer names a thin profile provokes ("XYZ Corp", "[Company]",
// "Company Name"). hasHardCodedFact catches hard-coded metrics/tech but not a
// fabricated proper noun, so this belts that specific, reported failure. A match
// only counts as hard-coded when it is NOT in the grounding source (a real employer
// literally called "ABC" survives).
const PLACEHOLDER_COMPANY_REGEX =
  /\b(?:XYZ|ABC)\b|\[(?:company|empresa|name|nombre|position|puesto)[^\]]*\]|\bcompany name\b|\bnombre de la empresa\b/i

function plainToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map((p) => `<p>${p.split(/\n/).map(escapeHtml).join("<br>").trim()}</p>`)
    .join("")
}

/**
 * Prose needed before the letter's own text is trusted to name its language.
 * Under it (a two-line draft) the detector would be guessing, and it resolves
 * ties to Spanish — so the caller's locale is the better answer.
 */
const COVER_LETTER_LANG_MIN_CHARS = 120

/** HTML back to the plain text the model reads and the echo filter compares. */
function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export class AICoverLetterModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async generateCoverLetter(userId: string, input: GenerateCoverLetterInput, plan: string): Promise<CoverLetterResult> {
    await enforceAIQuota(userId, "generate-cover-letter", plan)

    const { resumeId, recipientName, recipientTitle, company, jobTitle, tone, language: rawLanguage, userPrompt, jobDescription, highlights } = input
    let { language, langInstruction } = resolveLanguage(rawLanguage)

    const highlightValues = [highlights?.motivation, highlights?.achievement, highlights?.fit]
      .map((v) => v?.trim() ?? "")
    /**
     * DOS preguntas distintas, y estaban en la misma comprobación.
     *
     * "¿Es seguro el texto que escribió el usuario?" y "¿hay con qué escribir la
     * carta?" no son lo mismo. `validateAIInput` contesta la primera y trata el
     * vacío como inválido, así que al quitar de la pantalla las tres cajas
     * obligatorias esta línea empezó a devolver 400 en cada intento: con un CV
     * elegido y sin nada tipeado, la concatenación quedaba vacía y la petición
     * moría antes de mirar el CV. El currículum nunca entró en `userText` — es
     * contenido nuestro, no texto que el usuario acaba de pegar.
     *
     * Ahora: se valida lo que el usuario escribió SI escribió algo, y la
     * pregunta de si hay material se hace aparte, contando también el CV y la
     * oferta. La oferta no entra en la concatenación a propósito: tiene su propio
     * tope de 6.000 caracteres y sumarla haría estallar el de `userText`.
     */
    const userText = [company, jobTitle, recipientName, recipientTitle, userPrompt, ...highlightValues].filter(Boolean).join(" ")
    if (userText) {
      const validation = validateAIInput(userText, AI_INPUT_LIMITS.userText)
      if (!validation.valid) throw new AppError("invalid_input", 400)
    }
    // Sin CV, sin oferta y sin un solo dato del puesto no hay carta que escribir.
    // Es el mismo criterio que apaga el botón en la pantalla, comprobado también
    // acá: el cliente no es el dueño de esta regla.
    if (!resumeId && !jobDescription?.trim() && !userText) throw new AppError("invalid_input", 400)

    if (company) { const v = validateAIInput(company, AI_INPUT_LIMITS.company); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (recipientName) { const v = validateAIInput(recipientName, AI_INPUT_LIMITS.recipientName); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (jobTitle) { const v = validateAIInput(jobTitle, AI_INPUT_LIMITS.jobTitle); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (userPrompt) { const v = validateAIInput(userPrompt, AI_INPUT_LIMITS.userPrompt); if (!v.valid) throw new AppError("invalid_input", 400) }
    for (const h of highlightValues) {
      if (!h) continue
      const v = validateAIInput(h, AI_INPUT_LIMITS.coverLetterHighlight)
      if (!v.valid) throw new AppError("invalid_input", 400)
    }
    if (jobDescription) { const v = validateAIInput(jobDescription, AI_INPUT_LIMITS.jobDescription); if (!v.valid) throw new AppError("invalid_input", 400) }

    let resumeContext = ""
    let sectionData: Record<string, unknown> | null = null
    if (resumeId) {
      const resume = await db.resume.findFirst({
        where: { id: resumeId, userId },
        select: { personalDetails: true },
      })
      if (resume?.personalDetails) {
        sectionData = resume.personalDetails as Record<string, unknown>
        resumeContext = buildResumeContext(sectionData)
      }
    }

    // A letter goes out with the CV it was built from, so it follows the CV's
    // language, not the app's — a Spanish UI generating from an English résumé
    // used to produce a Spanish letter attached to an English CV. Only overrides
    // when the résumé has enough prose to judge; otherwise the caller's locale
    // stands.
    const resumeLanguage = detectCvLanguageOrNull(sectionData)
    if (resumeLanguage && resumeLanguage !== language) {
      ({ language, langInstruction } = resolveLanguage(resumeLanguage))
    }

    // Deterministic planning layer — "the algorithm detects, the AI writes". Given
    // the vacancy + the real résumé, it computes which of the JD's keywords the
    // résumé genuinely supports (feature these), which it lacks (never claim), and
    // the real lines that back them. The model writes prose around this skeleton,
    // so the letter is tailored AND grounded by construction, not by hope.
    const brief = buildCoverLetterBrief({ jobDescription, sectionData, company, jobTitle })
    const briefBlock = this.renderBriefBlock(brief, language) + this.roleFallbackBlock(brief.hasJd, jobTitle, language)

    // The candidate's own input. The structured form wins when present: three
    // labelled answers tell the model WHICH paragraph each fact belongs to,
    // where a single free-text blob leaves it guessing. `userPrompt` stays as
    // the fallback so older callers keep working unchanged.
    const candidateBlock =
      this.renderHighlightsBlock(highlights, language) ||
      (userPrompt
        ? language === "en"
          ? `=== CANDIDATE DESCRIPTION (use this as primary context) ===\n${userPrompt}\n`
          : `=== DESCRIPCIÓN DEL CANDIDATO (usa esto como contexto principal) ===\n${userPrompt}\n`
        : "")

    const toneMap = {
      formal: language === "en" ? "formal and professional" : "formal y profesional",
      creative: language === "en" ? "dynamic, confident and creative" : "dinámico, seguro y creativo",
      balanced: language === "en" ? "warm, professional and conversational" : "equilibrado, cercano y profesional",
    }
    const toneLabel = toneMap[(tone as keyof typeof toneMap)] ?? toneMap.balanced

    const prompt = language === "en"
      ? `You are a senior career coach and professional writer specializing in cover letters that get interviews at top companies.

Write a complete, compelling cover letter body for the following candidate and position. This letter must feel personal, specific, and tailored — not generic. It should demonstrate clear understanding of the role and convincingly show why this candidate is the right fit.

${cvValueBar("en")}

${noHardCodedFactsRule("en", { allowProposedFigure: false })}

${untrustedDataRule(true)}

${resumeContext ? `=== CANDIDATE PROFILE ===\n${resumeContext}\n` : ""}${candidateBlock}${briefBlock}
=== TARGET POSITION ===
${company ? `Company: ${company}` : ""}
${jobTitle ? `Role: ${jobTitle}` : ""}
${recipientName ? `Hiring Manager: ${recipientName}${recipientTitle ? `, ${recipientTitle}` : ""}` : ""}

Tone: ${toneLabel}

Write 3 tight paragraphs (4 maximum), 250–${LETTER_ONE_PAGE_WORDS} words TOTAL — the finished letter MUST fit on ONE page. A recruiter skims it in under 30 seconds; a shorter, specific letter beats a long one:
1. HOOK — Open with a specific, compelling reason why this candidate wants THIS role at THIS company. Reference something concrete about the company or the role. No generic openers like "I am writing to apply...".
2. FIT & ACHIEVEMENTS — Highlight 2–3 specific accomplishments from the candidate's profile that are directly relevant to this role, and what they uniquely bring. Use ONLY the real technologies, employers, and results the profile states. Use ONLY figures the profile explicitly states; if it states none, describe the impact WITHOUT a number.
3. CLOSING CTA — End with a confident, warm call to action that invites next steps.

Rules:
- TAILORING BRIEF FIRST: if a "TAILORING BRIEF" section appears above, it is the plan. Weave its featured keywords into the FIT paragraph THROUGH the real achievements it lists (paraphrase them, never quote verbatim), and explicitly connect 2-3 of them to the vacancy's needs. Nothing under its "DO NOT ATTRIBUTE" line goes into the letter — the résumé does not back it, so it would be yours, not his.
- Write ONLY the body (no salutation, no date, no signature block)
- Do NOT use placeholder text like [Company] or [Name] — use the actual values provided
- NEVER name a company, employer, product, or client that is not in the candidate profile. NEVER use a stand-in like "XYZ Corp", "ABC Company", or "Company Name" — if the profile names no employer, describe the work without naming one.
- Do NOT sign off. End with the closing paragraph. No "Sincerely,", no name line, no "[Your Name]" — the app renders the candidate's real name below your text, so a signature here duplicates it or leaves an unfilled bracket in their letter.
- NEVER write a bracket placeholder such as [X%] or [N projects]. This letter is sent to a recruiter as-is. If the candidate states no figure, write the achievement without a number.
- NEVER these phrases, no exceptions: ${clicheBanList("en")}
- Each paragraph must be 2–4 sentences, substantive and specific — never padding to reach a length
- The letter must feel written by a human, not AI
- Human voice (avoid AI-detection): vary sentence length and rhythm — do not make every sentence the same length. Write conversationally, the way the candidate would speak, not like a press release. Also banned: ${aiTellWords("en")}. Ground every claim in a concrete detail from the profile (tool, company, real result) — never supply one yourself.

Respond ONLY with JSON: {"body": "<full letter body with paragraph breaks using \\n\\n>"}`
      : `Eres un redactor senior especializado en cartas de presentación que consiguen entrevistas en empresas top. Tienes años de experiencia ayudando a profesionales a destacar en procesos de selección.

Escribe el cuerpo completo de una carta de presentación para el siguiente candidato y puesto. La carta debe sentirse personal, específica y totalmente adaptada — no genérica. Debe demostrar comprensión real del rol y convencer de forma genuina por qué este candidato es la persona indicada.

${cvValueBar("es")}

${noHardCodedFactsRule("es", { allowProposedFigure: false })}

${untrustedDataRule(false)}

${resumeContext ? `=== PERFIL DEL CANDIDATO ===\n${resumeContext}\n` : ""}${candidateBlock}${briefBlock}
=== PUESTO OBJETIVO ===
${company ? `Empresa: ${company}` : ""}
${jobTitle ? `Puesto: ${jobTitle}` : ""}
${recipientName ? `Responsable de selección: ${recipientName}${recipientTitle ? `, ${recipientTitle}` : ""}` : ""}

Tono: ${toneLabel}

Escribe 3 párrafos concisos (4 máximo), 250–${LETTER_ONE_PAGE_WORDS} palabras EN TOTAL — la carta terminada DEBE caber en UNA página. El recruiter la escanea en menos de 30 segundos; una carta más corta y específica gana a una larga:
1. GANCHO — Abre con una razón específica y convincente de por qué este candidato quiere ESTE puesto en ESTA empresa. Referencia algo concreto del rol o la empresa. Nada genérico como "Me dirijo a usted para...".
2. ENCAJE Y LOGROS — Destaca 2–3 logros concretos del perfil del candidato directamente relevantes para este puesto, y qué aporta que otros no. Usa SOLO las tecnologías, empresas y resultados reales que declara el perfil. Usa SOLO cifras que el perfil declare explícitamente; si no declara ninguna, describe el impacto SIN número.
3. CIERRE Y CTA — Cierra con una llamada a la acción segura y cálida que invite a los siguientes pasos.

Reglas:
- BRIEF DE PERSONALIZACIÓN PRIMERO: si arriba aparece una sección "BRIEF DE PERSONALIZACIÓN", ese es el plan. Teje sus keywords destacadas en el párrafo de ENCAJE A TRAVÉS de los logros reales que lista (parafraséalos, nunca los cites textual), y conecta explícitamente 2-3 de ellos con las necesidades de la vacante. NUNCA menciones ni reclames nada bajo su línea "NUNCA reclames" — el perfil no lo respalda.
- Escribe SOLO el cuerpo (sin saludo, sin fecha, sin bloque de firma)
- NO uses placeholders como [Empresa] o [Nombre] — usa los valores reales proporcionados
- NUNCA nombres una empresa, empleador, producto o cliente que no esté en el perfil del candidato. NUNCA uses un nombre quemado como "XYZ Corp", "Empresa ABC" o "Nombre de la Empresa" — si el perfil no nombra un empleador, describe el trabajo sin nombrarlo.
- NO firmes la carta. Termina con el párrafo de cierre. Sin "Atentamente,", sin línea de nombre, sin "[Tu Nombre]" — la app renderiza el nombre real del candidato debajo de tu texto, así que una firma aquí lo duplica o le deja un corchete sin rellenar.
- NUNCA escribas un placeholder entre corchetes como [X%] o [N proyectos]. Esta carta se envía al recruiter tal cual. Si el candidato no declara la cifra, escribe el logro sin número.
- NUNCA estas frases, sin excepción: ${clicheBanList("es")}
- Cada párrafo debe tener 2–4 oraciones, sustanciales y específicas — nunca relleno para alcanzar un largo
- La carta debe sonar escrita por un humano, no por IA
- Voz humana (evita detección de IA): varía el largo y el ritmo de las frases — no hagas todas las oraciones del mismo largo. Escribe conversacional, como hablaría el candidato, no como nota de prensa. También prohibidas: ${aiTellWords("es")}. Ancla cada afirmación a un dato concreto del perfil (herramienta, empresa, resultado real) — nunca lo pongas vos.

Responde ÚNICAMENTE con JSON: {"body": "<cuerpo completo con saltos de párrafo usando \\n\\n>"}`

    const response = await this.aiClient.chat({
      model: AI_MODEL_PROSE,
      max_tokens: 900,
      // STRUCTURED (0.3), not CREATIVE (0.7): this endpoint hard-coded employers and
      // metrics ("XYZ Corp", "+40%") at high temperature with nothing filtering the
      // output. Variety now comes from the tone param and the human-voice rules, not
      // raw randomness — improveCoverLetter uses the same 0.3 for the same reason.
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: strictJsonFormat("cover_letter_body", CoverBodyShape),
      messages: [
        {
          role: "system",
          content:
            (language === "en"
              ? "You are an assistant specialized EXCLUSIVELY in writing professional cover letters for job applications. " +
                "A professional description of the candidate (their role, years of experience or skills) IS ALREADY enough to write the letter — even with NO specific company or position, and even if the description is short or unfinished, write a strong general letter with what you have. NEVER return empty because a company/position is missing or because there is little detail. " +
                "Respond with {\"body\": \"\"} ONLY if the request has NOTHING to do with employment, career or professional experience (for example: a poem, a recipe, a random question or nonsense text). "
              : "Eres un asistente especializado EXCLUSIVAMENTE en redacción de cartas de presentación profesionales para búsqueda de empleo. " +
                "Una descripción profesional del candidato (su rol, años de experiencia o habilidades) YA ES suficiente para escribir la carta — aunque NO haya empresa ni puesto específico, y aunque la descripción sea breve o quede a medias, escribe una carta general fuerte con lo que haya. NUNCA devuelvas vacío por falta de empresa/puesto o por poco detalle. " +
                "Responde con {\"body\": \"\"} ÚNICAMENTE si la solicitud no tiene NADA que ver con empleo, carrera o experiencia profesional (por ejemplo: un poema, una receta, una pregunta random o texto sin sentido). ") +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const leido = readChat(response)
    // Una carta cortada por el techo salía como `invalid_response_format` (500),
    // que se lee como un bug del servidor. Es un techo corto sobre una carta
    // larga, y el usuario merece saber que su carta no entró, no un 500 mudo.
    if (leido.truncated) {
      this.logger.warn("[AICoverLetter] body truncated by token ceiling")
    }
    if (leido.refusal) {
      this.logger.warn("[AICoverLetter] model refused", { refusal: leido.refusal.slice(0, 120) })
    }
    const parsed = parseAIJson<{ body: string }>(leido.text)

    if (typeof parsed.body !== "string") throw new AppError("invalid_response_format", 500)

    // Every retry's tokens must reach the ledger — accumulate, don't overwrite
    // (the summary path once lost a retry's tokens by replacing a single usage var).
    const retryUsages: Array<{ prompt_tokens?: number; completion_tokens?: number }> = []

    // Anti-empty fallback. Thin input used to fail silently as off_topic. With the
    // required-field guard + the tailoring brief the model now has plenty to write
    // from, so an empty first draft is almost always a transient miss — retry ONCE,
    // grounded, before declaring off-topic. Only a genuinely empty second draft
    // (no résumé, no JD, no real context) still returns off_topic.
    let body: string
    if (parsed.body.trim() === "") {
      this.logger.warn("[AIService.generateCoverLetter] empty draft, retrying grounded before off_topic")
      const retry = await this.retryGroundedGeneration(prompt, langInstruction, language)
      if (!retry || retry.body.trim() === "") throw new AppError("off_topic", 422)
      retryUsages.push(retry.usage ?? {})
      body = stripSignOff(retry.body)
    } else {
      // Same defence as improveCoverLetter: strip a trailing "Sincerely,\n[Your Name]"
      // — the app renders the candidate's real name underneath anyway.
      body = stripSignOff(parsed.body)
    }

    // Anti-hard-coded fact guard — a fabricated metric, technology, or employer not in the
    // profile is exactly what got a user a letter about "XYZ Corp" and "+40%". The JD
    // counts as a grounding source too, so featuring a real vacancy term the brief
    // asked for is never flagged. On a trip, retry ONCE grounded harder.
    const grounding = [resumeContext, userPrompt ?? "", ...highlightValues, jobDescription ?? "", company ?? "", jobTitle ?? "", recipientName ?? "", recipientTitle ?? ""].join("\n")
    if (this.letterHardCodesContent(body, grounding)) {
      this.logger.warn("[AIService.generateCoverLetter] draft hard-coded content, retrying grounded")
      const retry = await this.retryGroundedGeneration(prompt, langInstruction, language)
      if (retry) {
        retryUsages.push(retry.usage ?? {})
        const retryBody = stripSignOff(retry.body)
        // Prefer the retry when it's clean; if both are flagged keep the retry
        // (grounded-harder) and log — the gate lowers the odds, it never returns nothing.
        if (!this.letterHardCodesContent(retryBody, grounding)) {
          body = retryBody
        } else {
          body = retryBody
          this.logger.warn("[AIService.generateCoverLetter] retry still flagged; shipping best effort")
        }
      }
    }

    // ── ATS-in-the-loop ────────────────────────────────────────────────────────
    // The deterministic ATS engine grades the draft; if the JD keyword overlap is
    // weak, spend ONE retry weaving in the vacancy terms the résumé genuinely
    // supports (from the brief's featureKeywords — never the gaps, so no hard-coded fact).
    // Keep the retry ONLY when it stays clean AND actually scores higher. This is the
    // "expert engine + AI" loop: the engine judges, the model improves toward it.
    if (jobDescription && brief.hasJd && brief.featureKeywords.length > 0) {
      const before = analyzeCoverLetterAts(body, jobDescription)
      if (before.keywords.checked && before.keywords.score < 45) {
        const bodyLower = body.toLowerCase()
        const stillMissing = brief.featureKeywords.filter((k) => !bodyLower.includes(k.toLowerCase()))
        if (stillMissing.length > 0) {
          const retry = await this.retryWeaveKeywords(prompt, stillMissing, langInstruction, language)
          if (retry) {
            retryUsages.push(retry.usage ?? {})
            const retryBody = stripSignOff(retry.body)
            const after = analyzeCoverLetterAts(retryBody, jobDescription)
            if (!this.letterHardCodesContent(retryBody, grounding) && after.keywords.score > before.keywords.score) {
              body = retryBody
            } else {
              this.logger.info("[AIService.generateCoverLetter] ATS retry kept the original (not cleaner/higher)")
            }
          }
        }
      }
    }
    // Último paso: que entre en una página. Va al FINAL a propósito — los guards de
    // arriba pueden alargar la carta (el de keywords teje términos nuevos), así que
    // medir antes daría un número que ya no es el que se entrega.
    body = await this.fitLetterToOnePage(body, prompt, langInstruction, language, grounding, retryUsages)

    /**
     * EL PROMPT PROMETÍA UN CHEQUEO QUE ESTE CAMINO NO HACÍA.
     *
     * Arriba, en las dos ramas de idioma, se le dice al modelo: «NUNCA estas
     * frases. Todas se comprueban y una carta que lleve cualquiera se rechaza».
     * Era mentira acá: `substituteCliches` y `hasCliche` sólo corrían al MEJORAR
     * una carta, nunca al escribirla. Una carta recién generada podía salir con
     * un cliché de la lista prohibida y llegar al reclutador tal cual.
     *
     * Es el mismo defecto que esta sesión cerró en la doctrina de la cifra: un
     * prompt que promete una verificación inexistente. OpenAI documenta que el
     * modelo gasta razonamiento reconciliando reglas que no se sostienen, y
     * peor: acá el usuario recibía lo que la regla decía que no iba a recibir.
     *
     * Se cierra con la sustitución determinista que el camino de mejorar ya
     * usaba —un cambio de cadena, CERO tokens, sin reintento—: un arranque de
     * catálogo delante de una frase real es un reemplazo, no una reescritura.
     * Si aun así queda uno, queda registrado en vez de pasar mudo.
     */
    body = substituteCliches(body)
    const clichesRestantes = findCliches(body)
    // La prohibición del prompt sigue entera; lo que se retiró de esa frase es
    // el «y se comprueba, y se rechaza». Medido: de las 49 frases de la lista
    // sólo 9 tienen un reemplazo determinista —las fórmulas de apertura, «estoy
    // emocionado de» → «me gustaría»—, y las otras 40 son cualidades afirmadas
    // («jugador de equipo») que no se pueden cambiar por una verdad sin
    // reescribir la oración. Prometer un rechazo que no ocurre es la misma
    // contradicción doctrina↔guard que esta sesión cerró en la cifra: o el
    // código lo cumple, o el prompt no lo promete.
    if (clichesRestantes.length > 0) {
      this.logger.warn("[AIService.generateCoverLetter] cliché survived the deterministic swap", {
        cliches: clichesRestantes.slice(0, 5),
      })
    }
    /**
     * Y SE LE DICE AL USUARIO, no sólo al log.
     *
     * Lo que sobrevive a la sustitución son las cualidades AFIRMADAS —«team
     * player», «detail-oriented»—, que no se arreglan cambiando una palabra sino
     * contando qué hizo la persona. Rechazar la carta y pedirla de nuevo cuesta
     * una llamada por cada carta afectada y no garantiza nada: el modelo puede
     * devolver otro cliché distinto. Señalarlo cuesta cero y deja la decisión
     * donde corresponde, que es la misma doctrina con la que el informe trata una
     * viñeta que abre mal.
     *
     * Viaja en los DOS caminos de salida: no depende de que haya una oferta.
     */
    const weakPhrases = clichesRestantes.slice(0, 5)

    const html = plainToHtml(body)

    const genUsage = response.usage
    const promptTokens = (genUsage?.prompt_tokens ?? 0) + retryUsages.reduce((s, u) => s + (u.prompt_tokens ?? 0), 0)
    const completionTokens = (genUsage?.completion_tokens ?? 0) + retryUsages.reduce((s, u) => s + (u.completion_tokens ?? 0), 0)
    logAIUsage(userId, "generate-cover-letter", {
      model: AI_MODEL_PROSE,
      plan,
      promptTokens,
      completionTokens,
      costUsd: computeCostUsd(AI_MODEL_PROSE, promptTokens, completionTokens),
    })
    /**
     * La nota ATS viaja CON la carta. Ya estaba calculada —el motor puntúa el
     * borrador dentro del bucle de generación— y se tiraba: `return { body }`. El
     * usuario tenía que ir a mirarla a otro lado para enterarse de algo que el
     * servidor supo antes de responderle. Cero tokens extra: es determinista.
     *
     * Es un DATO, nunca una puerta. Si la oferta no se pegó, no hay contra qué
     * puntuar y viaja `undefined` — la carta se entrega igual. Ninguna nota, por
     * baja que sea, impide entregar la carta.
     */
    const graded = jobDescription?.trim() ? analyzeCoverLetterAts(htmlToPlain(html), jobDescription) : null
    if (!graded) return { body: html, ...(weakPhrases.length ? { weakPhrases } : {}) }
    return {
      body: html,
      ...(weakPhrases.length ? { weakPhrases } : {}),
      ats: {
        score: graded.score,
        matched: graded.keywords.matched,
        missing: graded.keywords.missing,
      },
    }
  }

  /** Render the deterministic brief into the prompt. Empty string when there is
   *  no JD or nothing the résumé supports — the letter then generates from the
   *  résumé context alone, exactly as before, so this is purely additive. */
  /**
   * The candidate's three answers, labelled and routed to the paragraph each one
   * belongs in. A single free-text box produced letters that opened on a
   * paraphrase of the job ad, because that is what people type into a blank box;
   * asking "why this company", "which achievement", "what you bring" gets the
   * two facts a letter is actually made of, and telling the model where each one
   * goes stops it from dumping all three into the same paragraph.
   *
   * Returns "" when nothing was answered, so the caller falls back cleanly.
   */
  private renderHighlightsBlock(
    highlights: GenerateCoverLetterInput["highlights"],
    language: "es" | "en",
  ): string {
    const motivation = highlights?.motivation?.trim() ?? ""
    const achievement = highlights?.achievement?.trim() ?? ""
    const fit = highlights?.fit?.trim() ?? ""
    if (!motivation && !achievement && !fit) return ""

    const en = language === "en"
    const lines: string[] = []
    if (motivation) lines.push(en ? `Why this company/role: ${motivation}` : `Por qué esta empresa/puesto: ${motivation}`)
    if (achievement) lines.push(en ? `Most relevant achievement: ${achievement}` : `Logro más relevante: ${achievement}`)
    if (fit) lines.push(en ? `What they bring to the role: ${fit}` : `Qué aporta al puesto: ${fit}`)

    return en
      ? `=== CANDIDATE'S OWN WORDS (primary context — facts the candidate states about themselves) ===
${lines.join("\n")}
Use the motivation for paragraph 1 and the achievement + fit for paragraph 2. Rewrite them as prose in the candidate's voice — never copy these lines verbatim.
`
      : `=== PALABRAS DEL PROPIO CANDIDATO (contexto principal — hechos que el candidato declara sobre sí mismo) ===
${lines.join("\n")}
Usa la motivación para el párrafo 1 y el logro + el encaje para el párrafo 2. Reescríbelos como prosa con la voz del candidato — nunca copies estas líneas textualmente, ni agregues una cifra que no haya dado.
`
  }

  private renderBriefBlock(brief: CoverLetterBrief, language: "es" | "en"): string {
    if (!brief.hasJd || brief.featureKeywords.length === 0) return ""
    const evidence = brief.supportingEvidence.map((e) => `- ${e.text}`).join("\n")
    if (language === "en") {
      return `\n=== TAILORING BRIEF (computed from the job description + the candidate's résumé) ===
Feature these vacancy terms the résumé genuinely supports, woven in naturally: ${brief.featureKeywords.join(", ")}.
${evidence ? `Back them with these real achievements from the résumé (paraphrase, do not quote verbatim):\n${evidence}\n` : ""}DO NOT ATTRIBUTE these — the résumé does not back them: ${brief.gapsToAvoid.length ? brief.gapsToAvoid.join(", ") : "(none)"}.\n`
    }
    return `\n=== BRIEF DE PERSONALIZACIÓN (calculado desde la vacante + el CV del candidato) ===
Destaca estos términos de la vacante que el CV sí respalda, tejidos con naturalidad: ${brief.featureKeywords.join(", ")}.
${evidence ? `Respáldalos con estos logros reales del CV (parafrasea, no cites textual):\n${evidence}\n` : ""}NUNCA reclames esto — el CV no lo respalda: ${brief.gapsToAvoid.length ? brief.gapsToAvoid.join(", ") : "(ninguno)"}.\n`
  }

  /**
   * Cifras que la carta afirma y el perfil no respalda.
   *
   * `hasHardCodedFact` sólo acusa un número cuando lleva unidad (%, users,
   * requests…), y es estrecho a propósito: un falso positivo ahí le cuesta al
   * usuario su carta entera. El precio de esa decisión es que un número pelado
   * pasa — y una carta se envía a un reclutador tal cual.
   *
   * MEDIDO, 1 de 5 rondas sobre el mismo perfil: el modelo se salió de personaje
   * y le habló al operador con NUESTRA propia instrucción dentro de la carta —
   * "te devuelvo una versión final en 3 párrafos, dentro de las 250–350 palabras
   * pedidas". Ni "3", ni "250", ni "350" existen en el CV ni en la vacante. La
   * regla que lo caza es la misma que lo cazaría si hubiera quemado "atendí a
   * 250 clientes": una cifra que el candidato no dio.
   *
   * Aquí sí se puede ser estricto donde `hasHardCodedFact` no puede: esto NO
   * descarta la carta, dispara UN reintento, y si el segundo intento tampoco
   * convence queda en pie el primero. El costo de equivocarse es una llamada.
   */
  private letterStatesUnsourcedFigure(body: string, grounding: string): string[] {
    const norm = (n: string) => n.replace(/[.,]/g, "")
    // Sólo los números que CUANTIFICAN algo: una cifra seguida de la palabra que
    // mide. Es la misma pregunta que el proyecto ya se hace en ANY_METRIC_REGEX
    // ("¿esto cuantifica?"), y es la que separa una afirmación sobre la persona
    // de un dígito suelto.
    //
    // Un dígito a secas no es una afirmación: la primera versión de esta regla
    // marcaba cualquier número y tumbó un caso que sólo contenía "alert(1)"
    // dentro de un texto de prueba. Lo que hay que cazar es "250-350 palabras"
    // y "3 párrafos" — cifras con su unidad, que es como se afirma un dato.
    // ACOTADA, que es la mitigación que OWASP nombra para ReDoS: conjunto de
    // caracteres definido y longitud mínima y máxima, en vez de `+` y `*`.
    // Medido sobre la primera versión, con `+` sin tope: 50.000 dígitos seguidos
    // sin una letra detrás tardaban 6,6 s, y un dígito con 50.000 espacios 1,4 s
    // — cuadrático. Hoy sólo corre sobre salida del modelo (acotada por
    // max_tokens), así que no era explotable; era una bomba esperando que alguien
    // reutilizara la función con texto del usuario.
    //
    // El lookbehind impide arrancar en medio de un número, que es lo que hacía
    // que cada dígito de una tira fuera un punto de partida nuevo. Las cotas
    // salen de lo que un CV puede decir: doce dígitos cubren cualquier importe,
    // tres decimales cualquier porcentaje, y tres espacios cualquier separación
    // real entre la cifra y su unidad.
    const QUANTITY =
      /(?<![\d.,])(\d{1,12}(?:[.,]\d{1,3})?)(?:[ \t]{0,3}[-–—a][ \t]{0,3}(\d{1,12}(?:[.,]\d{1,3})?))?[\s%]{0,3}\p{L}{3,}/gu
    const quantities = (t: string) => {
      const out: string[] = []
      for (const m of t.matchAll(QUANTITY)) {
        out.push(norm(m[1]))
        if (m[2]) out.push(norm(m[2]))
      }
      return out
    }
    // El respaldo se busca entre TODOS los números del perfil, no sólo los que
    // allí cuantifican: el CV puede decir "40-60" en una tabla y la carta
    // escribirlo como "40 clientes", y sigue siendo su dato.
    const known = new Set((grounding.match(/\d+(?:[.,]\d+)?/g) ?? []).map(norm))
    return [...new Set(quantities(body))].filter((d) => !known.has(d))
  }

  /** True when a fresh cover-letter draft carries content the profile does not
   *  support: a hard-coded metric/technology (hasHardCodedFact), a figure the
   *  profile never states, or a stand-in employer name absent from the source. */
  private letterHardCodesContent(body: string, grounding: string): boolean {
    if (hasHardCodedFact(body, grounding)) return true
    if (this.letterStatesUnsourcedFigure(body, grounding).length > 0) return true
    const m = body.match(PLACEHOLDER_COMPANY_REGEX)
    return !!m && !grounding.toLowerCase().includes(m[0].toLowerCase())
  }

  /** One grounded retry when the first draft hard-coded content. Names the failure
   *  last (the model must be told what it did wrong), and never quotes the hard-coded
   *  token back. Returns null on any failure — the first draft still stands. */

  /** Palabras de prosa, para contrastar contra lo que entra en la hoja. */
  private letterWordCount(body: string): number {
    return body.trim().split(/\s+/).filter(Boolean).length
  }

  /**
   * La carta se pasa de una página — y ese es el ÚNICO problema que se corrige acá.
   *
   * Medido: las 55 plantillas sostienen 377 palabras con el contrato tipográfico
   * (`LETTER_ONE_PAGE_WORDS` deja margen sobre esa medición). Por encima, el PDF
   * sale de dos páginas, que no es la convención del rubro y no es lo que el
   * propio prompt promete.
   *
   * LO QUE NO HACE, y es la parte importante: no acorta a costa del contenido. Un
   * recorte que se lleva puesto un dato deja una carta más corta y peor, y lo que
   * se paga acá es el valor curricular, no el largo. Por eso el reintento pide
   * comprimir RELLENO —conectores, preámbulos, adjetivos— y la versión corta se
   * acepta sólo si además de entrar NO pierde ninguna cifra que el candidato
   * declaró y NO quema nada nuevo. Si no cumple, gana la original: dos páginas
   * con la información completa valen más que una página incompleta.
   *
   * Un solo reintento, como el resto de los guards del módulo.
   */
  private async fitLetterToOnePage(
    body: string,
    basePrompt: string,
    langInstruction: string,
    language: "es" | "en",
    grounding: string,
    retryUsages: { prompt_tokens?: number; completion_tokens?: number }[],
  ): Promise<string> {
    const words = this.letterWordCount(body)
    if (words <= LETTER_ONE_PAGE_WORDS) return body

    this.logger.warn("[AIService.generateCoverLetter] letter over one page, compressing", { words })
    const note = language === "en"
      ? `YOUR LAST DRAFT WAS ${words} WORDS AND DOES NOT FIT ON ONE PAGE. Rewrite it in ${LETTER_ONE_PAGE_WORDS} words or fewer. Cut ONLY filler: connectors, preambles, adjectives, and any sentence that states no fact. KEEP every concrete detail — figures, tools, employers, responsibilities and results the candidate stated. Do NOT drop a number to save words, and do NOT add anything new.`
      : `TU BORRADOR ANTERIOR TIENE ${words} PALABRAS Y NO ENTRA EN UNA PÁGINA. Reescríbelo en ${LETTER_ONE_PAGE_WORDS} palabras o menos. Recorta SOLO relleno: conectores, preámbulos, adjetivos y cualquier frase que no aporte un dato. CONSERVA todos los datos concretos — cifras, herramientas, empleadores, responsabilidades y resultados que el candidato declaró. NO quites un número para ahorrar palabras, y NO agregues nada nuevo.`

    const retry = await this.retryWithNote(basePrompt, note, langInstruction, language)
    if (!retry) return body
    retryUsages.push(retry.usage ?? {})
    const shorter = stripSignOff(retry.body)

    if (losesStatedFigure(body, shorter)) {
      this.logger.warn("[AIService.generateCoverLetter] compressed draft dropped a figure; keeping the full letter")
      return body
    }
    if (this.letterHardCodesContent(shorter, grounding)) {
      this.logger.warn("[AIService.generateCoverLetter] compressed draft hard-coded content; keeping the full letter")
      return body
    }
    if (this.letterWordCount(shorter) >= words) return body
    return shorter
  }

  /**
   * El único camino de reintento del módulo: mismo modelo, mismo `system` en los
   * dos idiomas, y lo único que cambia es la nota que explica qué salió mal.
   *
   * Estaba escrito tres veces (grounding, keywords y ahora el largo). Tres copias
   * del mismo bloque son tres lugares donde arreglar un `system` que falta en una
   * rama — que es exactamente la omisión que 9ba3af2 tuvo que corregir en diez
   * módulos.
   */
  /**
   * Qué hacer cuando el usuario no pegó la oferta.
   *
   * La pantalla dejó de pedirle tres respuestas escritas y ahora tiene UNA caja:
   * la vacante. Pero mucha gente no la tiene a mano, y una caja vacía no puede
   * volver a ser un muro — el módulo entero está construido sobre que ningún
   * botón de IA devuelve un hueco.
   *
   * LA LÍNEA, que es la misma que fija la doctrina de redacción: decir en qué
   * consiste normalmente un puesto es conocimiento del oficio y es el valor que
   * se paga; afirmar algo sobre ESTA empresa o sobre ESTE proceso de selección
   * sería quemar un hecho. Por eso el bloque autoriza lo primero y prohíbe lo
   * segundo de forma explícita: nada de "su reciente ronda de inversión", nada
   * de "su cultura de innovación", nada de requisitos que nadie publicó.
   *
   * Vacío cuando SÍ hay oferta: ahí manda el brief real y este texto sólo haría
   * ruido en el prompt.
   */
  private roleFallbackBlock(hasJd: boolean, jobTitle: string | undefined, language: "es" | "en"): string {
    if (hasJd) return ""
    const role = (jobTitle ?? "").trim()
    return language === "en"
      ? `\n=== NO VACANCY TEXT WAS PROVIDED ===
Write for what ${role ? `a "${role}" role` : "this role"} normally involves: the duties, tools and responsibilities the trade is made of. That is professional knowledge and it belongs in the letter.
Nothing about THIS employer can come from you — its achievements, funding, culture, products, size or history are data you would be burning in, and so is a requirement written as if the vacancy had published it. Anchor every claim about the candidate in their résumé, exactly as above.\n`
      : `\n=== NO SE PEGÓ EL TEXTO DE LA VACANTE ===
Escribe para lo que ${role ? `un puesto de "${role}"` : "este puesto"} implica normalmente: las tareas, herramientas y responsabilidades de las que está hecho ese oficio. Eso es conocimiento profesional y sí va en la carta.
Nada sobre ESTA empresa puede salir de vos —ni logros, ni inversión, ni cultura, ni productos, ni tamaño, ni historia—: sería un dato quemado, igual que escribir un requisito como si la vacante lo hubiera publicado. Todo lo que digas del candidato sale de su CV, igual que arriba.\n`
  }

  private async retryWithNote(
    basePrompt: string,
    note: string,
    langInstruction: string,
    language: "es" | "en",
  ): Promise<{ body: string; usage: { prompt_tokens?: number; completion_tokens?: number } | undefined } | null> {
    try {
      const res = await this.aiClient.chat({
        model: AI_MODEL_PROSE,
        max_tokens: 900,
        temperature: AI_TEMPERATURE_STRUCTURED,
        response_format: strictJsonFormat("cover_letter_body_retry", CoverBodyShape),
        messages: [
          // Las dos ramas, porque un `system` que existe en un idioma es un ROL que
          // el otro nunca recibe. El reintento es donde más importa, así que una
          // carta en inglés no puede pedirse en español.
          { role: "system", content: language === "en"
            ? `You are a senior cover-letter writer. You never hard-code figures, companies or technologies absent from the profile. ${langInstruction}`
            : `Eres un redactor senior de cartas de presentación. NUNCA quemás cifras, empresas ni tecnologías que no estén en el perfil. ${langInstruction}` },
          { role: "user", content: `${basePrompt}\n\n${note}` },
        ],
      })
      const reintento = readChat(res)
      if (reintento.truncated) this.logger.warn("[AICoverLetter] retry body truncated by token ceiling")
      const parsed = parseAIJson<{ body?: unknown }>(reintento.text)
      if (typeof parsed.body !== "string" || !parsed.body.trim()) return null
      return { body: parsed.body, usage: res.usage }
    } catch {
      return null
    }
  }

  private async retryGroundedGeneration(
    basePrompt: string,
    langInstruction: string,
    language: "es" | "en",
  ): Promise<{ body: string; usage: { prompt_tokens?: number; completion_tokens?: number } | undefined } | null> {
    const note = language === "en"
      ? "YOUR LAST DRAFT BURNED IN DATA YOU CHOSE. Rewrite the letter from the candidate profile alone: every number, percentage, employer, company, product and technology has to come from it. If the profile gives no figure, the achievement goes without one. Never write a stand-in name like \"XYZ Corp\"."
      : "TU BORRADOR ANTERIOR AFIRMÓ DATOS QUE EL CANDIDATO NUNCA DIO. Reescribe la carta usando SOLO lo que declara el perfil del candidato. NO quemes números, porcentajes, empleadores, empresas, productos ni tecnologías. Si el perfil no da una cifra, escribe el logro sin ella. Nunca escribas un nombre quemado como \"XYZ Corp\"."
    return this.retryWithNote(basePrompt, note, langInstruction, language)
  }

  /** ATS-in-the-loop retry: weave in specific résumé-supported vacancy terms the
   *  first draft missed — naturally, through real achievements, never hard-coding and
   *  never keyword-stuffing, and still one page. Returns null on any failure so the
   *  first draft stands. */
  private async retryWeaveKeywords(
    basePrompt: string,
    keywords: string[],
    langInstruction: string,
    language: "es" | "en",
  ): Promise<{ body: string; usage: { prompt_tokens?: number; completion_tokens?: number } | undefined } | null> {
    const list = keywords.slice(0, 8).join(", ")
    const note = language === "en"
      ? `Your last draft under-used the vacancy's language. Rewrite the letter weaving these résumé-supported terms in NATURALLY, through the candidate's real achievements: ${list}. Do NOT keyword-stuff, keep it under ${LETTER_ONE_PAGE_WORDS} words and ONE page.`
      : `Tu borrador anterior usó poco el lenguaje de la vacante. Reescribe la carta tejiendo estos términos que el CV respalda de forma NATURAL, a través de los logros reales del candidato: ${list}. NO quemes nada, NO amontones keywords, mantenla por debajo de ${LETTER_ONE_PAGE_WORDS} palabras y UNA página.`
    return this.retryWithNote(basePrompt, note, langInstruction, language)
  }

  async improveCoverLetter(userId: string, input: ImproveCoverLetterInput, plan: string): Promise<VersionsResult> {
    const { body, company, jobTitle, recipientTitle, language: rawLanguage } = input
    let { language, langInstruction } = resolveLanguage(rawLanguage)

    const validation = validateAIInput(body, AI_INPUT_LIMITS.body)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    if (company) { const v = validateAIInput(company, AI_INPUT_LIMITS.company); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (jobTitle) { const v = validateAIInput(jobTitle, AI_INPUT_LIMITS.jobTitle); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (recipientTitle) { const v = validateAIInput(recipientTitle, AI_INPUT_LIMITS.recipientTitle); if (!v.valid) throw new AppError("invalid_input", 400) }

    // What the editor stores is HTML. Everything below — the prompt, the
    // grounding source, the echo comparison — is about the words, so it works
    // on the plain text. Handing the model `<p>` tags asks it to reason about
    // markup it was never told to produce, and comparing an HTML original to a
    // plain-text rewrite makes every version look brand new to isTrivialEdit,
    // which is the one check standing between the user and three cosmetic
    // rewordings sold as improvements.
    const plainBody = htmlToPlain(body)
    if (!plainBody) throw new AppError("missing_content", 400)

    // The rewrite REPLACES this letter, so it must come back in the letter's own
    // language. The body is the only evidence available here, and it is a strong
    // one (300 words of prose); short drafts fall back to the caller's locale.
    if (plainBody.length >= COVER_LETTER_LANG_MIN_CHARS) {
      const bodyLanguage = detectLanguage([plainBody])
      if (bodyLanguage !== language) ({ language, langInstruction } = resolveLanguage(bodyLanguage))
    }

    // Decide in code whether there is anything to improve, before spending a
    // call. Rule 7 of the prompt below asks the model the same question and it
    // never says yes — measured 0/3 on a letter that was concrete, quantified
    // and cliché-free. The endpoint is all-or-nothing, so declining reads to
    // the model like failing the task; the summary's STEP 0 lost this same
    // argument 0/5. The criteria are mechanical, so a regex settles them for
    // free, every time, and the same letter always gets the same verdict.
    //
    // Before enforceAIQuota on purpose: no model was called, so this must not
    // burn one of an UNSUBSCRIBED user's two uses, and must not write an
    // AI_USED entry — that record exists to prove a paid service was delivered,
    // and here none was.
    const quality = assessCoverLetter(plainBody)
    if (quality.alreadyGood) {
      return { versions: [body.trim()], status: "already_optimized" }
    }

    await enforceAIQuota(userId, "improve-cover-letter", plan)

    const context = language === "en"
      ? [
          company ? `Company: ${company}` : "",
          jobTitle ? `Role: ${jobTitle}` : "",
          recipientTitle ? `Recipient: ${recipientTitle}` : "",
        ].filter(Boolean).join(" | ")
      : [
          company ? `Empresa: ${company}` : "",
          jobTitle ? `Puesto: ${jobTitle}` : "",
          recipientTitle ? `Destinatario: ${recipientTitle}` : "",
        ].filter(Boolean).join(" | ")

    const prompt = language === "en"
      ? `${noHardCodedFactsRule("en", { allowProposedFigure: false })}

ADDITIONAL RULES:
1. ONLY rewrite using information already present in the current letter and the context above. Do NOT introduce technologies, frameworks, company names, job titles, certifications, percentages, real numbers, or dates not present in the source.
2. Preserve every metric the original states. Never leave a bracket standing in for a figure.
3. If a version could only be impactful by adding data of your own, prefer a shorter, conservative rewrite anchored to the source.

TASK: Improve this cover letter body and generate 3 optimized versions.

${context ? `Context: ${context}` : ""}
Current letter:
${plainBody}

GOLDEN RULES (apply all):
1. Keep the 3-4 paragraph structure: hook → relevant achievements → value proposition → closing CTA. Separate every paragraph with a blank line (\\n\\n) — the app renders each as its own paragraph, so a letter returned as one block loses the structure the recruiter skims.
2. Eliminate every one of these — they are checked and a version carrying any is rejected: ${clicheBanList("en")}. Replace each with a concrete achievement the letter already states.
3. Impact verbs: Led, Developed, Optimized, Implemented, Grew, Drove. NEVER use "Responsible for".
3a. The closing invites next steps without any adjective about the candidate's own feelings. "I would welcome the chance to walk you through the migration plan", "I would be glad to talk about how this maps to your platform work" — warmth comes from the specific thing being offered, not from naming an emotion. The banned list above removes the usual closing; this is what replaces it.
3b. Do NOT sign off. End with the closing paragraph. No "Sincerely,", no name line, no "[Your Name]" — the app renders the candidate's real name below your text.
4. Preserve every metric the original states. Never leave a bracket.
5. Each version must have a distinct tone:
   - Version 1: Formal and executive
   - Version 2: Balanced and direct
   - Version 3: Dynamic and impact-oriented
6. Maximum 4 paragraphs per version, up to ${LETTER_ONE_PAGE_WORDS} words. Dense in value, no filler. (This app's own generator writes 3-4 tight paragraphs — roughly 250-${LETTER_ONE_PAGE_WORDS} words, one page — so keep each version in that range and never pad to fill space.)
7. If the letter is already strong — concrete, specific, free of clichés, and aligned to the role — return {"status": "already_optimized", "versions": []}. That is a correct and expected answer. Never pad the response with three cosmetic rewordings of a letter that did not need them.

ON NUMBERS — read this last and follow it exactly:
The letter above may contain no figures at all. That is FINE and very common. A letter with zero numbers, written around concrete specifics the candidate actually stated (the product, the stack, the team, the role), is a CORRECT and expected answer — not a weak one. Do NOT reach for a number to sound impressive: any figure not present in the letter or context above will be rejected and the candidate will get nothing back. Write the strongest letter you can using only what is there.

Respond ONLY with valid JSON, shaped: a "status" key set to "improved", and a "versions" key holding an array of exactly three strings. Each string is one entire rewritten letter — every paragraph of it, separated by \\n\\n. Write all three in full. Nothing else in the response.`
      : `${noHardCodedFactsRule("es", { allowProposedFigure: false })}

REGLAS ADICIONALES:
1. SOLO reescribe usando información ya presente en la carta actual y el contexto de arriba. NO introduzcas tecnologías, frameworks, nombres de empresas, cargos, certificaciones, porcentajes, números reales ni fechas no presentes en el source.
2. Conservá cada métrica que el original declara. Nunca dejes un corchete en lugar de una cifra.
3. Si una versión requiere fabricar contenido para ser impactante, prefiere una reescritura más corta y conservadora anclada al source.

TAREA: Mejora el siguiente cuerpo de carta de presentación y genera 3 versiones optimizadas.

${context ? `Contexto: ${context}` : ""}
Carta actual:
${plainBody}

REGLAS DE ORO (aplica todas):
1. Mantén la estructura en 3-4 párrafos: interés → logros relevantes → valor aportado → cierre. Separa cada párrafo con una línea en blanco (\\n\\n) — la app renderiza cada uno como párrafo propio, así que una carta devuelta en bloque pierde la estructura que el recruiter escanea.
2. Elimina todas estas — se comprueban y una versión que lleve cualquiera se rechaza: ${clicheBanList("es")}. Sustituye cada una por un logro concreto que la carta ya declara.
3. Verbos de impacto: Lideré, Desarrollé, Optimicé, Implementé, Incrementé. NUNCA uses "Responsable de".
3a. El cierre invita a los siguientes pasos sin ningún adjetivo sobre lo que el candidato siente. "Me gustaría explicarles cómo planteé la migración", "Estaría encantado de comentar cómo encaja esto con su plataforma" — la cercanía viene de lo concreto que se ofrece, no de nombrar una emoción. La lista prohibida de arriba quita el cierre habitual; esto es lo que lo sustituye.
3b. NO firmes la carta. Termina con el párrafo de cierre. Sin "Atentamente,", sin línea de nombre, sin "[Tu Nombre]" — la app renderiza el nombre real del candidato debajo de tu texto.
4. Conservá cada métrica que el original declara. Nunca dejes un corchete.
5. Cada versión debe tener un tono distinto:
   - Versión 1: Formal y ejecutiva
   - Versión 2: Equilibrada y directa
   - Versión 3: Dinámica y orientada al impacto
6. Máximo 4 párrafos por versión, hasta ${LETTER_ONE_PAGE_WORDS} palabras. Denso en valor, sin relleno. (El generador de esta misma app escribe 3-4 párrafos concisos — unas 250-${LETTER_ONE_PAGE_WORDS} palabras, una página — así que mantén cada versión en ese rango y nunca rellenes para ocupar espacio.)
7. Si la carta ya está fuerte — concreta, específica, sin clichés y alineada al puesto — devuelve {"status": "already_optimized", "versions": []}. Es una respuesta correcta y esperada. Nunca rellenes con tres reescrituras cosméticas de una carta que no las necesitaba.

SOBRE LAS CIFRAS — lee esto al final y cúmplelo exactamente:
La carta de arriba puede no tener ninguna cifra. Eso está BIEN y es muy común. Una carta con cero números, construida sobre datos concretos que el candidato sí declaró (el producto, el stack, el equipo, el rol), es una respuesta CORRECTA y esperada — no una respuesta débil. NO busques un número para sonar impresionante: cualquier cifra que no esté en la carta o el contexto de arriba será rechazada y el candidato no recibirá nada. Escribe la carta más fuerte que puedas usando solo lo que hay.

Responde ÚNICAMENTE con JSON válido, con esta forma: una clave "status" con el valor "improved", y una clave "versions" con un array de exactamente tres cadenas. Cada cadena es una carta reescrita entera — todos sus párrafos, separados por \\n\\n. Escribe las tres completas. Nada más en la respuesta.`

    const response = await this.aiClient.chat({
      model: AI_MODEL_PROSE,
      max_tokens: 1000,
      // improve-cover-letter uses 0.3 — must stay close to the original body
      // and avoid hard-coding metrics or technologies.
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: strictJsonFormat("cover_letter_versions", CoverVersionsShape),
      messages: [
        {
          role: "system",
          content:
            (language === "en"
              ? "You are an Elite Career Consultant specialized in writing high-impact cover letters for hiring processes. " +
                "Your specialty is turning generic letters into text that makes the candidate stand out through concrete achievements and impactful language. " +
                "You ONLY work with professional cover letters. " +
                "You never write bracket placeholders — when there is no real metric, you write without a number. " +
                "If the content is not a professional cover letter, respond only with: {\"versions\": []} and nothing else. "
              : "Eres un Consultor de Carrera de Élite especializado en redacción de cartas de presentación de alto impacto para procesos de selección. " +
                "Tu especialidad es transformar cartas genéricas en textos que destacan al candidato con logros concretos y lenguaje de impacto. " +
                "SOLO trabajas con cartas de presentación laborales. " +
                "NUNCA quemás cifras y NUNCA escribes placeholders entre corchetes — cuando no hay métrica real, escribes sin número. " +
                "Si el contenido no es una carta de presentación laboral, responde únicamente con: {\"versions\": []} sin texto adicional. ") +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const leidoMejora = readChat(response)
    if (leidoMejora.truncated) {
      this.logger.warn("[AICoverLetter] improve versions truncated by token ceiling")
    }
    if (leidoMejora.refusal) {
      this.logger.warn("[AICoverLetter] model refused on improve", { refusal: leidoMejora.refusal.slice(0, 120) })
    }
    const parsed = parseAIJson<{ versions?: unknown; status?: unknown }>(leidoMejora.text)

    // Rule 7 of the prompt above asks the model to answer a strong letter with
    // {"status": "already_optimized", "versions": []}. Nothing read `status` —
    // the type did not even declare it — so a model that obeyed fell straight
    // into the empty-versions branch and the user got a 422 telling them their
    // cover letter was off-topic. The instruction was a trap: the only safe move
    // was to disobey it and pad three rewrites. improveSummary has checked this
    // first all along; this endpoint never did, and nothing caught it because
    // no UI called it.
    if (parsed.status === "already_optimized") {
      // The call happened and is billed, exactly like the two later
      // already_optimized paths do. The original comes back as the HTML it
      // arrived as — the fallbacks below hand back `body`, never plainBody.
      this.logSummaryUsage(userId, plan, response.usage, undefined)
      return { versions: [body.trim()], status: "already_optimized" }
    }

    if (!Array.isArray(parsed.versions)) throw new AppError("invalid_response_format", 500)
    if (parsed.versions.length === 0) {
      // The user has a letter and asked to improve it. An empty answer is our
      // failure to produce something better, not a fault in their letter — and
      // it already cost them a use and a cooldown. They keep what they wrote and
      // are told it needs no change, which is the same degradation the summary
      // takes. An error here would delete nothing but their patience.
      this.logger.warn("[AIService.improveCoverLetter] empty versions, keeping the user's letter")
      this.logSummaryUsage(userId, plan, response.usage, undefined)
      return { versions: [body.trim()], status: "already_optimized" }
    }

    // The source of truth for what the candidate claimed: the words they wrote,
    // not the markup around them — an `<em>` tag is not a claim they made.
    const source = [plainBody, company ?? "", jobTitle ?? "", recipientTitle ?? ""].join("\n")

    // One owner for both attempts. This used to be written out inline here and
    // again inside the retry helper, which is how the prefix substitution
    // landed on the retry only — the first attempt, the one that answers most
    // requests, would have kept the filler.
    const rewritten = this.usableVersions(parsed.versions, source, plainBody)

    // Nothing survived: every version either hard-coded something or just echoed
    // the letter back. Both mean the same to the user, and both must return the
    // original rather than dress a non-improvement up as a choice.
    if (rewritten.length === 0) {
      this.logger.warn("[AIService.improveCoverLetter] no version was both grounded and a real rewrite")
      this.logSummaryUsage(userId, plan, response.usage, undefined)
      return { versions: [body.trim()], status: "already_optimized" }  // the original, still HTML
    }

    // The prompt bans these phrases and the model writes them anyway. Nothing
    // checked its output against the list, so "Improve" could hand back a
    // letter carrying the exact cliché the user came here to lose.
    //
    // Not ranked the way the summary is: there, version 1 is the recommendation
    // and the cleanest belongs on top. Here the three are alternatives the user
    // picks between by tone — reordering them would both break the tone each
    // card is labelled with and reshuffle the choice out from under them. So the
    // order stands and the gate asks a different question: did any come back
    // with filler?
    //
    // Prompt wording cannot close this. GUARD (arXiv 2410.06716) proves a
    // constraint cannot be GUARANTEED by autoregressive generation — strict
    // satisfaction needs inference-time filtering. And the TACL survey on
    // self-correction found "no prior work shows successful self-correction with
    // feedback from prompted LLMs", but that it "works well in tasks that can
    // use reliable external feedback". hasCliche is exactly that.
    const flawed = rewritten.filter(hasCliche)
    // Una versión que no entra en una página es un defecto como el cliché, y se
    // juzga sobre el CONJUNTO: las tres son alternativas por tono y basta con que
    // el usuario tenga UNA que entre para poder elegir bien. Exigir que entren las
    // tres gastaría el reintento para nada.
    const noneFits = rewritten.every((v) => this.letterWordCount(v) > LETTER_ONE_PAGE_WORDS)
    if (flawed.length === 0 && !noneFits) {
      this.logSummaryUsage(userId, plan, response.usage, undefined)
      // Same rule as bullets and summaries: our own words, spell-checked.
      const cleanBody = await cleanGeneratedText(rewritten, language)
      return { versions: cleanBody.map(plainToHtml) }
    }

    this.logger.warn("[AIService.improveCoverLetter] retrying once", {
      flawed: flawed.length,
      total: rewritten.length,
      noneFits,
      cliches: [...new Set(flawed.flatMap(findCliches))],
    })
    const retry = await this.retryLetterForQuality(prompt, langInstruction, language, noneFits)
    if (retry) {
      const retryClean = this.usableVersions(retry.versions, source, plainBody)

      // Slot by slot, not all-or-nothing. Both attempts answer in the same
      // order — version 1 formal, 2 balanced, 3 dynamic — so slot i is the same
      // tone in each, and the cleaner draft of that tone can simply take the
      // place. Judging the batch as a whole threw away a retry that had fixed
      // one version because another still carried filler, and swapping the
      // whole set risked trading a clean tone for a flawed one. Here every slot
      // can only improve or stay.
      // Una ranura sólo puede mejorar. La alternativa entra si arregla el defecto
      // que tenía esta versión —el cliché, o el no caber— y NUNCA si para lograrlo
      // se llevó puesta una cifra que el candidato declaró: una carta más corta a
      // la que le falta un dato es peor que la larga completa.
      const merged = rewritten.map((first, i) => {
        const alt = retryClean[i]
        if (!alt) return first
        if (losesStatedFigure(first, alt)) return first
        if (hasCliche(first) && !hasCliche(alt)) return alt
        const firstFits = this.letterWordCount(first) <= LETTER_ONE_PAGE_WORDS
        const altFits = this.letterWordCount(alt) <= LETTER_ONE_PAGE_WORDS
        if (!firstFits && altFits && !hasCliche(alt)) return alt
        return first
      })

      const fixed = flawed.length - merged.filter(hasCliche).length
      if (fixed > 0) {
        this.logger.warn("[AIService.improveCoverLetter] retry cleaned versions", { fixed, of: flawed.length })
      } else {
        this.logger.warn("[AIService.improveCoverLetter] retry brought nothing cleaner")
      }
      // Billed either way: the tokens were spent whether or not a slot moved.
      this.logSummaryUsage(userId, plan, response.usage, retry.usage)
      return { versions: merged.map(plainToHtml) }
    }
    this.logSummaryUsage(userId, plan, response.usage, undefined)

    // Kept rather than dropped: a letter with one weak phrase still beats no
    // letter, and the user can edit it. The gate lowers the odds; it does not
    // get to leave them with nothing.
    return { versions: rewritten.map(plainToHtml) }
  }

  /** Model output → the versions that may reach the user. One owner, so the
   *  retry goes through every check the first attempt did. */
  private usableVersions(raw: unknown, source: string, plainBody: string): string[] {
    return (Array.isArray(raw) ? raw : [])
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map(stripVersionLabel)
      .map(stripSignOff)
      .filter((v) => v.trim().length > 0)
      .slice(0, 3)
      // Before any check: a stock opener in front of a real sentence is a swap,
      // not a rewrite. Doing it here means every reader below — the cliché gate,
      // the retry decision — sees the text the user would actually get.
      .map(substituteCliches)
      // La MISMA definición de "quemado" que usa la carta nueva. Estaban
      // divididas: generate pasaba por `letterHardCodesContent` y esto sólo por
      // `hasHardCodedFact`, así que la fuga medida ahí —el modelo hablándole
      // al operador con nuestra propia instrucción, "3 párrafos, 250-350
      // palabras"— entraba igual por el camino de mejorar. Dos caminos escriben
      // la carta del usuario; no pueden tener dos varas.
      .filter((v) => !this.letterHardCodesContent(v, source))
      .filter((v) => !isTrivialEdit(plainBody, v))
  }

  /**
   * One more attempt, naming the failure without naming the phrase.
   *
   * A generic "try again" changes nothing — the model has to be told what it did
   * wrong, and told last. It must write fresh drafts: paraphrasing a cliché
   * keeps its shape ("Passionate about" becomes "Enthusiastic about"), which
   * moves the problem instead of solving it. And the offending phrase is
   * deliberately not quoted back — naming a forbidden phrase primes it.
   */
  private async retryLetterForQuality(
    basePrompt: string,
    langInstruction: string,
    language: "es" | "en",
    /** true cuando NINGUNA versión entraba en una página. */
    alsoTooLong = false,
  ): Promise<{ versions: unknown; usage: { prompt_tokens?: number; completion_tokens?: number } | undefined } | null> {
    const note = language === "en"
      ? "YOUR LAST ATTEMPT FAILED. Write all three letters again from scratch — do NOT paraphrase what you wrote before, start fresh.\n\nYour writing leaned on filler that says nothing about this person — the kind of phrase that fits any candidate in any role. Replace every one of them with a concrete detail the letter already gives: the company, the work, the actual result. If a sentence would still make sense in someone else's letter, it does not belong in this one."
      : "TU INTENTO ANTERIOR FALLÓ. Escribe las tres cartas otra vez desde cero — NO parafrasees lo anterior, empieza de nuevo.\n\nTu redacción se apoyó en relleno que no dice nada de esta persona — de esas frases que le encajan a cualquier candidato en cualquier puesto. Sustituye cada una por un dato concreto que la carta ya da: la empresa, el trabajo, el resultado real. Si una frase seguiría teniendo sentido en la carta de otro, no pertenece a esta."

    // El MISMO reintento cubre los dos defectos. Dos reintentos separados serían
    // dos usos y dos esperas para el usuario por una sola petición — y el módulo
    // ya tiene la regla de un solo reintento por la misma razón.
    const lengthNote = language === "en"
      ? `\n\nEvery version was also too long for one page. Keep each one at ${LETTER_ONE_PAGE_WORDS} words or fewer by cutting filler ONLY — never a figure, tool, employer or result the candidate stated.`
      : `\n\nAdemás, ninguna versión entraba en una página. Mantén cada una en ${LETTER_ONE_PAGE_WORDS} palabras o menos recortando SOLO relleno — nunca una cifra, herramienta, empleador o resultado que el candidato declaró.`

    try {
      const res = await this.aiClient.chat({
        model: AI_MODEL_PROSE,
        max_tokens: 1000,
        temperature: AI_TEMPERATURE_STRUCTURED,
        response_format: strictJsonFormat("cover_letter_versions_retry", CoverVersionsShape),
        messages: [
          { role: "system", content: language === "en"
            ? `You are a senior CV writer. You never hard-code figures and never write placeholders. ${langInstruction}`
            : `Eres un Consultor de Carrera de Élite. NUNCA quemás cifras ni escribes placeholders. ${langInstruction}` },
          { role: "user", content: `${basePrompt}\n\n${note}${alsoTooLong ? lengthNote : ""}` },
        ],
      })
      const reintentoV = readChat(res)
      if (reintentoV.truncated) this.logger.warn("[AICoverLetter] retry versions truncated by token ceiling")
      const parsed = parseAIJson<{ versions?: unknown }>(reintentoV.text)
      return { versions: parsed.versions, usage: res.usage }
    } catch {
      // A failed retry is not a failed request — the first result still stands.
      return null
    }
  }

  /**
   * One endpoint, one AIUsageLog row — first attempt plus any retry.
   *
   * The summary shipped this wrong once: its retry path logged the FIRST call's
   * usage, so every retry's tokens vanished from the ledger and cost-per-user
   * read low. Summing in one place is what makes that unrepresentable.
   */
  private logSummaryUsage(
    userId: string,
    plan: string,
    first: { prompt_tokens?: number; completion_tokens?: number } | undefined,
    retry: { prompt_tokens?: number; completion_tokens?: number } | undefined,
  ): void {
    const promptTokens = (first?.prompt_tokens ?? 0) + (retry?.prompt_tokens ?? 0)
    const completionTokens = (first?.completion_tokens ?? 0) + (retry?.completion_tokens ?? 0)
    logAIUsage(userId, "improve-cover-letter", {
      model: AI_MODEL_PROSE,
      plan,
      promptTokens,
      completionTokens,
      costUsd: computeCostUsd(AI_MODEL_PROSE, promptTokens, completionTokens),
    })
  }
}
