// lib/services/ai/modules/AICoverLetterModule.ts
import { db } from "@/lib/db"
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL_PROSE,
  AI_TEMPERATURE_CREATIVE,
  AI_TEMPERATURE_STRUCTURED,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, escapeHtml, resolveLanguage, detectHallucination, stripVersionLabel, stripSignOff } from "../shared/ai-helpers"
import { computeCostUsd } from "../shared/cost-tracker"
import { isTrivialEdit } from "../shared/text-similarity"
import { assessCoverLetter } from "../shared/cover-letter-quality"
import { hasCliche, findCliches, clicheBanList, substituteCliches } from "../shared/cliches"
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
function plainToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map((p) => `<p>${p.split(/\n/).map(escapeHtml).join("<br>").trim()}</p>`)
    .join("")
}

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

    const { resumeId, recipientName, recipientTitle, company, jobTitle, tone, language: rawLanguage, userPrompt } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const userText = [company, jobTitle, recipientName, recipientTitle, userPrompt].filter(Boolean).join(" ")
    const validation = validateAIInput(userText, AI_INPUT_LIMITS.userText)
    if (!validation.valid) throw new AppError("invalid_input", 400)

    if (company) { const v = validateAIInput(company, AI_INPUT_LIMITS.company); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (recipientName) { const v = validateAIInput(recipientName, AI_INPUT_LIMITS.recipientName); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (jobTitle) { const v = validateAIInput(jobTitle, AI_INPUT_LIMITS.jobTitle); if (!v.valid) throw new AppError("invalid_input", 400) }
    if (userPrompt) { const v = validateAIInput(userPrompt, AI_INPUT_LIMITS.userPrompt); if (!v.valid) throw new AppError("invalid_input", 400) }

    let resumeContext = ""
    if (resumeId) {
      const resume = await db.resume.findFirst({
        where: { id: resumeId, userId },
        select: { personalDetails: true },
      })
      if (resume?.personalDetails) {
        resumeContext = buildResumeContext(resume.personalDetails as Record<string, unknown>)
      }
    }

    const toneMap = {
      formal: language === "en" ? "formal and professional" : "formal y profesional",
      creative: language === "en" ? "dynamic, confident and creative" : "dinámico, seguro y creativo",
      balanced: language === "en" ? "warm, professional and conversational" : "equilibrado, cercano y profesional",
    }
    const toneLabel = toneMap[(tone as keyof typeof toneMap)] ?? toneMap.balanced

    const prompt = language === "en"
      ? `You are a senior career coach and professional writer specializing in cover letters that get interviews at top companies.

Write a complete, compelling cover letter body for the following candidate and position. This letter must feel personal, specific, and tailored — not generic. It should demonstrate clear understanding of the role and convincingly show why this candidate is the right fit.

${resumeContext ? `=== CANDIDATE PROFILE ===\n${resumeContext}\n` : ""}${userPrompt ? `=== CANDIDATE DESCRIPTION (use this as primary context) ===\n${userPrompt}\n` : ""}
=== TARGET POSITION ===
${company ? `Company: ${company}` : ""}
${jobTitle ? `Role: ${jobTitle}` : ""}
${recipientName ? `Hiring Manager: ${recipientName}${recipientTitle ? `, ${recipientTitle}` : ""}` : ""}

Tone: ${toneLabel}

Write 4 strong paragraphs:
1. HOOK — Open with a specific, compelling reason why this candidate wants THIS role at THIS company. Reference something concrete about the company or the role. No generic openers like "I am writing to apply...".
2. EXPERIENCE & ACHIEVEMENTS — Highlight 2–3 specific accomplishments from the candidate's background that are directly relevant to this role. Use concrete details from the resume (technologies, companies, impact). Quantify where possible.
3. VALUE PROPOSITION — Explain exactly what the candidate brings to the team that others don't. Connect their unique skills and experience to the company's likely challenges or goals.
4. CLOSING CTA — End with a confident, warm call to action. Express genuine enthusiasm and invite next steps.

Rules:
- Write ONLY the body (no salutation, no date, no signature block)
- Do NOT use placeholder text like [Company] or [Name] — use the actual values provided
- Do NOT sign off. End with the closing paragraph. No "Sincerely,", no name line, no "[Your Name]" — the app renders the candidate's real name below your text, so a signature here duplicates it or leaves an unfilled bracket in their letter.
- Do NOT invent facts, metrics, or experiences not present in the candidate profile
- NEVER write a bracket placeholder such as [X%] or [N projects]. This letter is sent to a recruiter as-is. If the candidate states no figure, write the achievement without a number.
- NEVER these phrases. Every one is checked and a letter carrying any is rejected: ${clicheBanList("en")}
- Each paragraph must be 3–5 sentences, substantive and specific
- The letter must feel written by a human, not AI
- Human voice (avoid AI-detection): vary sentence length and rhythm — do not make every sentence the same length. Write conversationally, the way the candidate would speak, not like a press release. Also banned: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy", "Results-driven". Ground every claim in a concrete detail from the profile (tool, company, real result) — never invent one.

Respond ONLY with JSON: {"body": "<full letter body with paragraph breaks using \\n\\n>"}`
      : `Eres un redactor senior especializado en cartas de presentación que consiguen entrevistas en empresas top. Tienes años de experiencia ayudando a profesionales a destacar en procesos de selección.

Escribe el cuerpo completo de una carta de presentación para el siguiente candidato y puesto. La carta debe sentirse personal, específica y totalmente adaptada — no genérica. Debe demostrar comprensión real del rol y convencer de forma genuina por qué este candidato es la persona indicada.

${resumeContext ? `=== PERFIL DEL CANDIDATO ===\n${resumeContext}\n` : ""}${userPrompt ? `=== DESCRIPCIÓN DEL CANDIDATO (usa esto como contexto principal) ===\n${userPrompt}\n` : ""}
=== PUESTO OBJETIVO ===
${company ? `Empresa: ${company}` : ""}
${jobTitle ? `Puesto: ${jobTitle}` : ""}
${recipientName ? `Responsable de selección: ${recipientName}${recipientTitle ? `, ${recipientTitle}` : ""}` : ""}

Tono: ${toneLabel}

Escribe 4 párrafos sólidos:
1. GANCHO — Abre con una razón específica y convincente de por qué este candidato quiere ESTE puesto en ESTA empresa. Referencia algo concreto del rol o la empresa. Nada genérico como "Me dirijo a usted para...".
2. EXPERIENCIA Y LOGROS — Destaca 2–3 logros concretos del perfil del candidato directamente relevantes para este puesto. Usa detalles reales del CV (tecnologías, empresas, impacto). Cuantifica donde sea posible.
3. PROPUESTA DE VALOR — Explica exactamente qué aporta este candidato que otros no tienen. Conecta sus habilidades únicas con los desafíos u objetivos probables de la empresa.
4. CIERRE Y CTA — Cierra con una llamada a la acción segura y cálida. Expresa entusiasmo genuino e invita a dar los próximos pasos.

Reglas:
- Escribe SOLO el cuerpo (sin saludo, sin fecha, sin bloque de firma)
- NO uses placeholders como [Empresa] o [Nombre] — usa los valores reales proporcionados
- NO firmes la carta. Termina con el párrafo de cierre. Sin "Atentamente,", sin línea de nombre, sin "[Tu Nombre]" — la app renderiza el nombre real del candidato debajo de tu texto, así que una firma aquí lo duplica o le deja un corchete sin rellenar.
- NO inventes datos, métricas ni experiencias que no estén en el perfil del candidato
- NUNCA escribas un placeholder entre corchetes como [X%] o [N proyectos]. Esta carta se envía al recruiter tal cual. Si el candidato no declara la cifra, escribe el logro sin número.
- NUNCA estas frases. Todas se comprueban y una carta que lleve cualquiera se rechaza: ${clicheBanList("es")}
- Cada párrafo debe tener 3–5 oraciones, sustanciales y específicas
- La carta debe sonar escrita por un humano, no por IA
- Voz humana (evita detección de IA): varía el largo y el ritmo de las frases — no hagas todas las oraciones del mismo largo. Escribe conversacional, como hablaría el candidato, no como nota de prensa. También prohibidas: "Orquestó", "Apalancó", "Utilizó", "sinergia", "orientado a resultados". Ancla cada afirmación a un dato concreto del perfil (herramienta, empresa, resultado real) — nunca lo inventes.

Responde ÚNICAMENTE con JSON: {"body": "<cuerpo completo con saltos de párrafo usando \\n\\n>"}`

    const response = await this.aiClient.chat({
      model: AI_MODEL_PROSE,
      max_tokens: 900,
      temperature: AI_TEMPERATURE_CREATIVE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente especializado EXCLUSIVAMENTE en redacción de cartas de presentación profesionales para búsqueda de empleo. " +
            "Solo debes generar contenido relacionado con candidaturas laborales y experiencia profesional. " +
            "Si la solicitud no corresponde a una carta de presentación laboral real, responde únicamente con: {\"body\": \"\"} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ body: string }>(raw)

    if (typeof parsed.body !== "string") throw new AppError("invalid_response_format", 500)
    if (parsed.body.trim() === "") {
      throw new AppError("off_topic", 422)
    }

    // Same defence as improveCoverLetter: the prompt asks for body only, but a
    // trailing "Sincerely,\n[Your Name]" slips through and the app renders the
    // candidate's real name underneath anyway.
    const html = plainToHtml(stripSignOff(parsed.body))

    const genUsage = response.usage
    logAIUsage(userId, "generate-cover-letter", {
      model: AI_MODEL_PROSE,
      plan,
      promptTokens: genUsage?.prompt_tokens ?? 0,
      completionTokens: genUsage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL_PROSE, genUsage?.prompt_tokens ?? 0, genUsage?.completion_tokens ?? 0),
    })
    return { body: html }
  }

  async improveCoverLetter(userId: string, input: ImproveCoverLetterInput, plan: string): Promise<VersionsResult> {
    const { body, company, jobTitle, recipientTitle, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

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
      ? `CRITICAL ANTI-HALLUCINATION RULES (mandatory, no exceptions):
1. ONLY rewrite using information already present in the current letter and the context above. Do NOT introduce technologies, frameworks, company names, job titles, certifications, percentages, real numbers, or dates not present in the source.
2. Preserve real metrics from the original. If none exist, write without numbers — NEVER invent a figure and NEVER leave a bracket like [X%]. The letter is sent as-is; an unfilled bracket reads as unfinished.
3. If a version would require fabricating content to be impactful, prefer a shorter, conservative rewrite anchored to the source.

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
4. If the original has metrics, preserve them. If not, write without numbers. NEVER invent figures and NEVER leave brackets.
5. Each version must have a distinct tone:
   - Version 1: Formal and executive
   - Version 2: Balanced and direct
   - Version 3: Dynamic and impact-oriented
6. Maximum 4 paragraphs per version, up to 350 words. Dense in value, no filler. (This app's own generator writes 4 paragraphs of 3-5 sentences — roughly 300-400 words — so a 200-word cap would force you to delete nearly half of a letter it produced.)
7. If the letter is already strong — concrete, specific, free of clichés, and aligned to the role — return {"status": "already_optimized", "versions": []}. That is a correct and expected answer. Never pad the response with three cosmetic rewordings of a letter that did not need them.

ON NUMBERS — read this last and follow it exactly:
The letter above may contain no figures at all. That is FINE and very common. A letter with zero numbers, written around concrete specifics the candidate actually stated (the product, the stack, the team, the role), is a CORRECT and expected answer — not a weak one. Do NOT reach for a number to sound impressive: any figure not present in the letter or context above will be rejected and the candidate will get nothing back. Write the strongest letter you can using only what is there.

Respond ONLY with valid JSON, shaped: a "status" key set to "improved", and a "versions" key holding an array of exactly three strings. Each string is one entire rewritten letter — every paragraph of it, separated by \\n\\n. Write all three in full. Nothing else in the response.`
      : `REGLAS CRÍTICAS ANTI-ALUCINACIÓN (obligatorias, sin excepciones):
1. SOLO reescribe usando información ya presente en la carta actual y el contexto de arriba. NO introduzcas tecnologías, frameworks, nombres de empresas, cargos, certificaciones, porcentajes, números reales ni fechas no presentes en el source.
2. Conserva métricas reales del original. Si no las hay, escribe sin números — NUNCA inventes una cifra y NUNCA dejes un corchete tipo [X%]. La carta se envía tal cual; un corchete sin rellenar se lee como algo sin terminar.
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
4. Si hay métricas en el texto original, consérvalas. Si no las hay, escribe sin números. NUNCA inventes cifras y NUNCA dejes corchetes.
5. Cada versión debe tener un tono distinto:
   - Versión 1: Formal y ejecutiva
   - Versión 2: Equilibrada y directa
   - Versión 3: Dinámica y orientada al impacto
6. Máximo 4 párrafos por versión, hasta 350 palabras. Denso en valor, sin relleno. (El generador de esta misma app escribe 4 párrafos de 3-5 frases — unas 300-400 palabras — así que un tope de 200 te obligaría a borrar casi la mitad de una carta que ella misma produjo.)
7. Si la carta ya está fuerte — concreta, específica, sin clichés y alineada al puesto — devuelve {"status": "already_optimized", "versions": []}. Es una respuesta correcta y esperada. Nunca rellenes con tres reescrituras cosméticas de una carta que no las necesitaba.

SOBRE LAS CIFRAS — lee esto al final y cúmplelo exactamente:
La carta de arriba puede no tener ninguna cifra. Eso está BIEN y es muy común. Una carta con cero números, construida sobre datos concretos que el candidato sí declaró (el producto, el stack, el equipo, el rol), es una respuesta CORRECTA y esperada — no una respuesta débil. NO busques un número para sonar impresionante: cualquier cifra que no esté en la carta o el contexto de arriba será rechazada y el candidato no recibirá nada. Escribe la carta más fuerte que puedas usando solo lo que hay.

Responde ÚNICAMENTE con JSON válido, con esta forma: una clave "status" con el valor "improved", y una clave "versions" con un array de exactamente tres cadenas. Cada cadena es una carta reescrita entera — todos sus párrafos, separados por \\n\\n. Escribe las tres completas. Nada más en la respuesta.`

    const response = await this.aiClient.chat({
      model: AI_MODEL_PROSE,
      max_tokens: 1000,
      // improve-cover-letter uses 0.3 — must stay close to the original body
      // and avoid inventing metrics or technologies.
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite especializado en redacción de cartas de presentación de alto impacto para procesos de selección. " +
            "Tu especialidad es transformar cartas genéricas en textos que destacan al candidato con logros concretos y lenguaje de impacto. " +
            "SOLO trabajas con cartas de presentación laborales. " +
            "NUNCA inventas cifras y NUNCA escribes placeholders entre corchetes — cuando no hay métrica real, escribes sin número. " +
            "Si el contenido no es una carta de presentación laboral, responde únicamente con: {\"versions\": []} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<{ versions?: unknown; status?: unknown }>(raw)

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
      throw new AppError("off_topic", 422)
    }

    // The source of truth for what the candidate claimed: the words they wrote,
    // not the markup around them — an `<em>` tag is not a claim they made.
    const source = [plainBody, company ?? "", jobTitle ?? "", recipientTitle ?? ""].join("\n")

    // One owner for both attempts. This used to be written out inline here and
    // again inside the retry helper, which is how the prefix substitution
    // landed on the retry only — the first attempt, the one that answers most
    // requests, would have kept the filler.
    const rewritten = this.usableVersions(parsed.versions, source, plainBody)

    // Nothing survived: every version either invented something or just echoed
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
    if (flawed.length === 0) {
      this.logSummaryUsage(userId, plan, response.usage, undefined)
      return { versions: rewritten.map(plainToHtml) }
    }

    this.logger.warn("[AIService.improveCoverLetter] retrying once", {
      flawed: flawed.length,
      total: rewritten.length,
      cliches: [...new Set(flawed.flatMap(findCliches))],
    })
    const retry = await this.retryLetterForQuality(prompt, langInstruction, language)
    if (retry) {
      const retryClean = this.usableVersions(retry.versions, source, plainBody)

      // Slot by slot, not all-or-nothing. Both attempts answer in the same
      // order — version 1 formal, 2 balanced, 3 dynamic — so slot i is the same
      // tone in each, and the cleaner draft of that tone can simply take the
      // place. Judging the batch as a whole threw away a retry that had fixed
      // one version because another still carried filler, and swapping the
      // whole set risked trading a clean tone for a flawed one. Here every slot
      // can only improve or stay.
      const merged = rewritten.map((first, i) => {
        const alt = retryClean[i]
        if (!alt) return first
        return hasCliche(first) && !hasCliche(alt) ? alt : first
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
      .filter((v) => !detectHallucination(v, source))
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
  ): Promise<{ versions: unknown; usage: { prompt_tokens?: number; completion_tokens?: number } | undefined } | null> {
    const note = language === "en"
      ? "YOUR LAST ATTEMPT FAILED. Write all three letters again from scratch — do NOT paraphrase what you wrote before, start fresh.\n\nYour writing leaned on filler that says nothing about this person — the kind of phrase that fits any candidate in any role. Replace every one of them with a concrete detail the letter already gives: the company, the work, the actual result. If a sentence would still make sense in someone else's letter, it does not belong in this one."
      : "TU INTENTO ANTERIOR FALLÓ. Escribe las tres cartas otra vez desde cero — NO parafrasees lo anterior, empieza de nuevo.\n\nTu redacción se apoyó en relleno que no dice nada de esta persona — de esas frases que le encajan a cualquier candidato en cualquier puesto. Sustituye cada una por un dato concreto que la carta ya da: la empresa, el trabajo, el resultado real. Si una frase seguiría teniendo sentido en la carta de otro, no pertenece a esta."

    try {
      const res = await this.aiClient.chat({
        model: AI_MODEL_PROSE,
        max_tokens: 1000,
        temperature: AI_TEMPERATURE_STRUCTURED,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `Eres un Consultor de Carrera de Élite. NUNCA inventas cifras ni escribes placeholders. ${langInstruction}` },
          { role: "user", content: `${basePrompt}\n\n${note}` },
        ],
      })
      const parsed = parseAIJson<{ versions?: unknown }>(res.choices[0]?.message?.content ?? "")
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
