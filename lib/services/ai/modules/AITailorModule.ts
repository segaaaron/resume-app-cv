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
import { untrustedDataRule } from "../shared/untrusted-input"
import { parseAIJson, resolveLanguage, detectHallucination, losesStatedFigure, resolveJobId } from "../shared/ai-helpers"
import { cvValueBar, neverInventRule, keepCandidateFactsRule, proseRules, alreadyGoodRule } from "../shared/cv-writing-doctrine"
import { askUntilAnswered, retryNudge } from "../shared/never-empty"
import { isTrivialEdit, isCosmeticReword, dropsContentWithoutGain } from "../shared/text-similarity"
import { assessDescription, isDescriptionOptimized, opensInThirdPersonEs } from "../shared/bullet-quality"
import { hasCliche } from "../shared/cliches"
import { computeCostUsd } from "../shared/cost-tracker"
import { EMBEDDING_MODEL } from "../OpenAIClientAdapter"
import { parseBullets, renderBulletsForPrompt } from "../shared/bullets"
import { findSemanticMatches } from "../shared/semantic-match"
import { normalizeTerm } from "@/lib/ats/vocabulary"
import { AI_INPUT_LIMITS, type TailorCVInput, type TailorCVResultV2 } from "../shared/ai-types"

// Filler words in requirement lines the model sometimes returns as "skills".
// Dropped before token-overlap so a phrase's real signal ("gcd", "async/await")
// decides coverage, not connective words shared with every CV.
const SKILL_STOPWORDS = new Set([
  "of", "and", "or", "the", "a", "an", "to", "in", "on", "with", "for", "using",
  "strong", "experience", "knowledge", "concepts", "concept", "ability", "abilities",
  "understanding", "familiarity", "proficiency", "proficient", "skills", "skill",
  "including", "related", "etc", "maintaining", "publishing",
])

/**
 * True when the CV already covers a required skill. Plain substring first (an atomic
 * skill like "kubernetes"); then token overlap for the case the model hands back a
 * whole requirement line — if ≥60% of its significant words already appear in the CV
 * it is covered, so it is not re-suggested as "missing".
 */
function resumeCoversSkill(skill: string, resumeLower: string): boolean {
  const sl = skill.toLowerCase().trim()
  if (!sl) return true
  if (resumeLower.includes(sl)) return true
  const tokens = sl.split(/[^a-z0-9/+#.]+/).filter((w) => w.length > 2 && !SKILL_STOPWORDS.has(w))
  if (tokens.length === 0) return false
  const present = tokens.filter((w) => resumeLower.includes(w)).length
  return present / tokens.length >= 0.6
}

export class AITailorModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  async tailorCV(userId: string, input: TailorCVInput, plan: string): Promise<TailorCVResultV2> {
    await enforceAIQuota(userId, "tailor-cv", plan)

    const { sectionData, jobDescription, language: rawLanguage, atsMissingKeywords } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const jdValidation = validateAIInput(jobDescription, AI_INPUT_LIMITS.jobDescription)
    if (!jdValidation.valid) throw new AppError(jdValidation.error ?? "invalid_input", 400)

    /**
     * NO GUARD CANCELS THE CALL — the CEO's rule, and this endpoint was the last
     * place still breaking it.
     *
     * What stood here returned an empty result without asking the model, on two
     * conditions: the ATS pass found no missing keyword, AND `isDescriptionOptimized`
     * found no formal defect in any bullet. The second half is the problem. A formal
     * check reads the first word; it cannot tell whether a line carries CV value,
     * and "Soldé piezas." passes it. So the user could press a button that costs a
     * use and a cooldown and be told there was nothing to do, about a CV whose every
     * line says nothing.
     *
     * The signal is not thrown away — it becomes FOCUS in the prompt below, which is
     * what a guard is for. The re-tailor loop this early return also prevented is
     * braked where it belongs, in the RESPONSE: isTrivialEdit, isCosmeticReword and
     * dropsContentWithoutGain drop a rewrite that changed nothing, so applying our
     * own output cannot produce another round of cosmetic edits.
     */
    // `undefined` means the caller did not run the ATS pass — that is "unknown",
    // NOT "nothing is missing". Only an actual empty array is evidence that this
    // CV already covers the posting.
    const nothingMissing = Array.isArray(atsMissingKeywords) && atsMissingKeywords.length === 0
    const jobs = (sectionData?.workExperience ?? []) as Array<{ description?: string }>
    const everyBulletClean = jobs.every((j) => !j.description?.trim() || isDescriptionOptimized(j.description))
    const focus = nothingMissing && everyBulletClean && jobs.length > 0
      ? (language === "en"
        ? "\n\nFOCUS (a check we ran, not a verdict): this CV already covers the posting's keywords and no bullet has a formal defect. Judge it against the bar instead — a line with a strong verb that still names nothing of the trade's work is exactly the kind this check cannot see. If every line genuinely clears the bar, return empty arrays and say so by omission."
        : "\n\nFOCO (una comprobación que hicimos, no un veredicto): este CV ya cubre las keywords de la oferta y ningún bullet tiene un defecto formal. Juzgalo contra la vara en su lugar — una línea con verbo fuerte que igual no nombra nada del trabajo del oficio es justo la que esta comprobación no ve. Si todas las líneas pasan la vara de verdad, devolvé arrays vacíos y decilo por omisión.")
      : ""

    // WORK EXPERIENCE DETAILS below is this prompt's source of truth for jobs —
    // full bullets, indexed. Letting buildResumeContext also emit its own,
    // 500-char-truncated copy of the same jobs would give the model two texts
    // for the same (ID, index).
    const resumeContext = buildResumeContext(sectionData, language, { includeWorkExperience: false })
    const ctxValidation = validateAIInput(resumeContext, AI_INPUT_LIMITS.resumeContext)
    if (!ctxValidation.valid) throw new AppError("invalid_input", 400)

    // FULL bullets, never elided. The model replaces a bullet wholesale by index,
    // so anything it cannot see, it destroys: at the old 80-char cap it read
    // "…cutting d…" and rewrote away the "40 minutes to under 6" it never saw.
    // If you must bound this, bound the number of bullets — never their text.
    const work = (sectionData.workExperience ?? []) as { id?: string; jobTitle?: string; employer?: string; description?: string }[]
    const workList = work.slice(0, 4).map((j) => {
      const bulletLines = renderBulletsForPrompt(parseBullets(j.description ?? ""), {
        emptyLabel: "  (sin bullets)",
      })
      return `ID:${j.id ?? "?"} | ${j.jobTitle ?? ""} at ${j.employer ?? ""}:\n${bulletLines}`
    }).join("\n\n")

    // What the model is allowed to have known. resumeContext no longer carries
    // the jobs, so the bullets must come from workList — otherwise every faithful
    // rewrite reads as invented content and detectHallucination bins it.
    const groundingSource = `${resumeContext}\n${workList}`

    const prompt = language === "en"
      ? `You are an expert resume strategist. Tailor the candidate's CV to this specific job description.

${cvValueBar("en")}

${neverInventRule("en")}

${keepCandidateFactsRule("en")}

${proseRules("en")}

${alreadyGoodRule("en")}${focus}

${untrustedDataRule(true)}

=== JOB DESCRIPTION ===
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
  "softSkillSuggestions": [{ "skill": "teamwork", "suggestion": "Show it in a bullet: name a project where you coordinated with other teams." }]
}

Rules:
- summary: rewrite if it lacks job keywords. Do NOT rewrite it just because it has no numbers — the CV may state none, and that is fine. Return null if it's already strong.
- experiences: include ALL jobs from the work experience list, even those with no changes
- changedBullets: include every bullet that does not clear the bar — judged by WHEN TO LEAVE A LINE ALONE above, never by whether it opens with a strong verb. An empty array is only correct when every line already names the content of the work; never pad it with cosmetic rewords, and never leave a line untouched while advising elsewhere that it be expanded.
- For each changed bullet: use • prefix. Name what the work consists of in this trade's words. If the bullet would need a figure the CV does not state, write it without the figure — never invent one and never leave a bracket
- Human voice (avoid AI-detection): vary sentence length/structure across bullets, natural not press-release tone. Banned AI-tell words: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy". Keep each rewrite anchored to a concrete detail already in the source
- NEVER add new bullets that don't exist in the original — only replace existing ones by index
- missingSkills: skills required by the JOB DESCRIPTION and not present in the CV (max 5). Never invent a skill name — it must appear in the posting. Each MUST be a SHORT atomic skill or keyword (1-3 words, e.g. "GCD", "async/await", "App Store", "Kubernetes") — NEVER a full requirement sentence like "Knowledge of GCD, async/await, and concurrency concepts"
- softSkillSuggestions: SOFT skills the job asks for (communication, teamwork, leadership, adaptability, problem-solving, ownership…) that the CV does NOT yet evidence. Max 4. For each, "skill" is the short soft skill and "suggestion" is ONE actionable line telling the user HOW/WHERE to show it, anchored to their real experience — never invent a fact, and never claim they have it; you are advising them to demonstrate it. If the CV already shows the soft skills the job needs, return an empty array.
- If all bullets and summary are already well-optimized: return summary null, empty changedBullets for all experiences`
      : `Eres un estratega experto en currículos. Adapta el CV del candidato a esta oferta de trabajo específica.

${cvValueBar("es")}

${neverInventRule("es")}

${keepCandidateFactsRule("es")}

${proseRules("es")}

${alreadyGoodRule("es")}${focus}

${untrustedDataRule(false)}

=== OFERTA DE TRABAJO ===
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
  "softSkillSuggestions": [{ "skill": "trabajo en equipo", "suggestion": "Mostralo en un bullet: nombrá un proyecto donde coordinaste con otros equipos." }]
}

Reglas:
- summary: reescribir si le faltan keywords de la oferta. NO lo reescribas solo porque no tenga cifras — puede que el CV no declare ninguna, y eso está bien. Devolver null si ya está bien.
- experiences: incluir TODOS los puestos de la lista de experiencia, incluso los que no tienen cambios
- changedBullets: incluí todo bullet que no pase la vara — juzgado por CUÁNDO DEJAR UNA LÍNEA COMO ESTÁ de arriba, nunca por si abre con verbo fuerte. Un array vacío sólo es correcto cuando todas las líneas ya nombran el contenido del trabajo; nunca lo rellenes con reescrituras cosméticas, y nunca dejes una línea intacta mientras en otra parte aconsejás ampliarla.
- Para cada bullet cambiado: usar prefijo •. Nombrá en qué consiste el trabajo con las palabras de ese oficio. Si el bullet necesitaría una cifra que el CV no declara, escribilo sin la cifra — nunca la inventes ni dejes un corchete
- Voz humana (evita detección de IA): varía el largo/estructura de las frases entre bullets, tono natural no nota de prensa. Palabras-IA prohibidas: "Orquestó", "Apalancó", "Utilizó", "sinergia". Mantén cada reescritura anclada a un dato concreto ya presente en el source
- NUNCA agregar bullets nuevos que no existen en el original — solo reemplazar existentes por índice
- missingSkills: habilidades requeridas por la OFERTA y no presentes en el CV (máximo 5). Nunca inventes un nombre de habilidad — tiene que aparecer en la oferta. Cada una DEBE ser una habilidad o keyword CORTA y atómica (1-3 palabras, ej.: "GCD", "async/await", "App Store", "Kubernetes") — NUNCA una frase de requisito completa como "Conocimiento de GCD, async/await y conceptos de concurrencia"
- softSkillSuggestions: habilidades BLANDAS que pide la oferta (comunicación, trabajo en equipo, liderazgo, adaptabilidad, resolución de problemas, ownership…) que el CV AÚN no evidencia. Máximo 4. Para cada una, "skill" es la blanda corta y "suggestion" es UNA línea accionable de CÓMO/DÓNDE mostrarla, anclada a su experiencia real — nunca inventes un dato, y nunca afirmes que ya la tiene; le estás aconsejando cómo demostrarla. Si el CV ya muestra las blandas que pide la oferta, devolvé un array vacío.
- Si todos los bullets y el resumen ya están bien optimizados: devolver summary null, changedBullets vacíos para todas las experiencias`

    const systemPrompt = `You are an elite career coach and ATS optimization specialist. You tailor resumes to specific job postings with surgical precision, identifying keyword gaps, aligning professional summaries, and rewriting experience bullets to maximize recruiter and ATS impact. You only work on real job postings — if the input is off-topic or nonsensical, return { "summary": null, "experiences": [], "missingSkills": [] }. Whether a bullet is already good is defined in the user message, by the bar and by WHEN TO LEAVE A LINE ALONE — apply that and nothing else. You never invent figures and never write bracket placeholders; a bullet the CV gives no number for is written without one. ${langInstruction}`

    // A rich CV (several jobs × several bullets) plus summary, skills and soft-skill
    // advice easily exceeds 900 tokens of JSON — at 900 the response was TRUNCATED
    // mid-object, so parseAIJson threw and the whole tailor 500'd (the "error when
    // applying tailor" report). 3000 fits the worst realistic case; nano is cheap.
    const doChat = (attempt: number) => this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 3000,
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        // The nudge goes on the retry only, and it says nothing new — it reports
        // that the last answer was empty. Adding rules on a retry is how prompts
        // end up contradicting themselves.
        { role: "user", content: attempt === 0 ? prompt : prompt + retryNudge(language) },
      ],
    })

    const usages: Array<{ prompt_tokens?: number; completion_tokens?: number }> = []

    /**
     * One ask, with ONE retry, for two different empties.
     *
     * Unparseable JSON was already retried here (a truncated emission at 3000
     * tokens). The other empty was not: valid JSON with `changedBullets: []` for
     * every job. Measured over 8 résumés whose bullets are three words each, that
     * was 5 of 8 — the user spent a use and a cooldown to be told there was
     * nothing to improve about "Soldé piezas.". Both are the same event from the
     * user's side, so both get the same single retry.
     */
    // The last parsed answer, whether or not it qualified as "answered". Kept
    // because a second empty must NOT cost a third call: what the model did send
    // (missing skills, soft-skill advice) is still the user's result.
    let lastParsed: TailorCVResultV2 | null = null
    const ask = async (attempt: number): Promise<TailorCVResultV2 | null> => {
      const response = await doChat(attempt)
      usages.push(response.usage ?? {})
      try {
        lastParsed = parseAIJson<TailorCVResultV2>(response.choices[0]?.message?.content ?? "{}")
        return lastParsed
      } catch {
        this.logger.warn("[AIService.tailorCV] unparseable JSON (likely truncated)")
        return null
      }
    }

    const answered = await askUntilAnswered<TailorCVResultV2 | null>({
      ask,
      // Skills and soft-skill advice alone are not an answer: the button the user
      // pressed rewrites their CV. A summary or at least one bullet is.
      isAnswered: (r) => !!r && (typeof r.summary === "string" && r.summary.trim().length > 0
        || (r.experiences ?? []).some((e) => (e.changedBullets?.length ?? 0) > 0)),
      // Nothing truthful can be manufactured here: a tailored bullet the model
      // declined to write cannot be written in code without inventing content.
      // What the second answer DID carry (missing skills, soft-skill advice) is
      // kept rather than discarded — that is the useful-and-true floor.
      fallback: () => null,
      onFilled: (what) => this.logger.warn("[AIService.tailorCV] empty answer filled", { what }),
    })

    // The fallback returns null, so `answered` null means both attempts came back
    // without a rewrite. Whatever the last attempt DID carry still stands — no
    // third call, and no 500 for an answer that simply had nothing to rewrite.
    const raw: TailorCVResultV2 | null = answered ?? lastParsed
    if (!raw) throw new AppError("invalid_response_format", 500)

    // The prompt tells the model to return null when the summary is already strong,
    // but a JSON model frequently emits the literal STRING "null"/"none"/"" instead of
    // a JSON null. Left as-is, the panel renders "null" as the adapted summary and — worse
    // — the truthy string passes the apply guard, writing "null" into the user's résumé.
    // Normalise here, once, so downstream only ever sees a real rewrite or a true null.
    raw.summary = ((): string | null => {
      if (typeof raw.summary !== "string") return null
      const t = raw.summary.trim()
      return !t || /^(null|none|n\/?a|undefined)$/i.test(t) ? null : t
    })()

    // off_topic ONLY when there is genuinely nothing to tailor: the CV itself has no
    // work experience AND the model surfaced nothing. A real CV the model left untouched
    // (already optimized) MUST return a valid "nothing to improve" result — never a 422.
    // That spurious error, thrown whenever the model played it safe, is what made the
    // first tailor attempt look broken. With real experience present, we never error.
    const hasExperiences = (raw.experiences?.length ?? 0) > 0
    if (work.length === 0 && !raw.summary && !hasExperiences && !raw.missingSkills?.length) {
      throw new AppError("off_topic", 422)
    }

    // Bill every call, including a parse retry — never let a retry's tokens go unrecorded.
    const promptTokens = usages.reduce((sum, u) => sum + (u.prompt_tokens ?? 0), 0)
    const completionTokens = usages.reduce((sum, u) => sum + (u.completion_tokens ?? 0), 0)
    logAIUsage(userId, "tailor-cv", {
      model: AI_MODEL,
      plan,
      promptTokens,
      completionTokens,
      costUsd: computeCostUsd(AI_MODEL, promptTokens, completionTokens),
    })
    // Anti-hallucination sanitization: drop bullet rewrites that introduce
    // content not derivable from the resume context. Filter missingSkills so
    // only items present in the JD survive (the model is supposed to extract
    // them — never invent).
    const jdLower = jobDescription.toLowerCase()
    const resumeLower = groundingSource.toLowerCase()
    let droppedBullets = 0
    let droppedTrivial = 0
    let droppedFigureLoss = 0

    // Original bullets per job, so a rewrite that barely changes the original can be
    // dropped with the same 90% threshold (isTrivialEdit) used by bullets/summary/cover.
    const origBulletsByJob = new Map(work.map((j) => [j.id ?? "?", parseBullets(j.description ?? "")]))

    // Identical rewrites, collapsed. A CV that states the same bullet twice (a
    // real and common copy-paste) makes the model return the same improved line
    // for both indexes, and the panel then listed "Reduje regresiones…" twice
    // with two Apply buttons. One rewrite per distinct text, first index wins.
    const rewriteKey = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim()

    const sanitizedExperiences = (raw.experiences ?? []).map((e) => {
      // Resolved, not trusted. The model answers "w1" or "ID:w1" depending on the
      // roll, and an unresolved id makes every guard below skip itself — each one
      // is written as `if (orig !== undefined)`, so a job we cannot find is a job
      // whose rewrites ship unexamined and unplaceable.
      const targetId = resolveJobId(e.targetId, work)
      const origBullets = targetId ? origBulletsByJob.get(targetId) ?? [] : []
      const seenRewrites = new Set<string>()
      const cleanedBullets = (e.changedBullets ?? [])
        .map((b) => ({
          index: typeof b.index === "number" ? b.index : 0,
          text: typeof b.text === "string" ? b.text : "",
        }))
        .filter((b) => b.text)
        .filter((b) => {
          // Placeholders are banned outright now, so they count as hallucinations:
          // a "[X%]" reaching the CV is exactly the bracket the prompt forbids.
          if (detectHallucination(b.text, groundingSource)) {
            droppedBullets++
            return false
          }
          /**
           * A rewrite that speaks ABOUT the candidate is dropped.
           *
           * Measured on the reported CV: "Ejecutó suites con Selenium…",
           * "Definió alcance…" — third person, inside the candidate's own work
           * history, where every other line is first person. It reads as a
           * reference someone else wrote, and it was the same defect already
           * fixed for summaries and never carried across to bullets.
           */
          if (language === "es" && opensInThirdPersonEs(b.text)) {
            droppedTrivial++
            return false
          }
          // No-op guard, unified with the other AIs: a rewrite ≥90% identical to
          // the original bullet is not a real improvement — omit it. Plus the
          // cosmetic-reword guard Review/bullets use: a synonym-only swap
          // ("enhance"→"improve") on an otherwise-identical bullet adds nothing.
          const orig = origBullets[b.index]
          /**
           * A rewrite that deleted the candidate's figure is dropped outright.
           *
           * This is the guard the doctrine run did not need and the well-written
           * résumés did: told to name the content of the work, the model rewrote
           * "Cut medication errors from 12 to 3 per month" into a fuller line
           * with no numbers in it, and every existing filter waved it through —
           * nothing was invented, the text grew, so the content-loss check saw a
           * gain. The prompt now forbids it; this makes it unrepresentable.
           *
           * Dropping means the user gets no rewrite for that bullet, which is the
           * correct trade: their line still says what they achieved, and a bullet
           * that came back empty-handed is retried once by never-empty above.
           */
          if (orig !== undefined && losesStatedFigure(orig, b.text)) {
            droppedFigureLoss++
            return false
          }
          if (orig !== undefined && (isTrivialEdit(orig, b.text) || isCosmeticReword(orig, b.text))) {
            droppedTrivial++
            return false
          }
          // Lateral-rewrite guard (same as improve-bullet): a rewrite of an already-
          // strong bullet that strips content and adds nothing concrete is different,
          // not better. A real JD-tailored rewrite ADDS a keyword, so it survives.
          if (orig !== undefined) {
            const origStrong = assessDescription(orig).weakOpenerIndices.length === 0 && !hasCliche(orig)
            if (origStrong && dropsContentWithoutGain(orig, b.text)) {
              droppedTrivial++
              return false
            }
          }
          const key = rewriteKey(b.text)
          if (key && seenRewrites.has(key)) { droppedTrivial++; return false }
          if (key) seenRewrites.add(key)
          return true
        })
      return {
        targetId: targetId ?? "",
        jobTitle: e.jobTitle ?? "",
        employer: e.employer ?? "",
        // A job we could not resolve gets no rewrites: they cannot be checked
        // against an original and the client cannot apply them anywhere.
        changedBullets: targetId ? cleanedBullets : [],
      }
    })

    const cleanMissingSkills = (raw.missingSkills ?? [])
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .filter((s) => {
        const sl = s.toLowerCase().trim()
        // A skill is "missing" only if the JOB requires it (anti-invention: the
        // name must appear in the JD, never fabricated) AND the CV does not
        // already cover it. `resumeCoversSkill` (token overlap, not a plain
        // substring) is what fixes the reported bug: the model sometimes returns a
        // whole JD requirement line ("Knowledge of GCD, async/await, and
        // concurrency concepts") instead of an atomic skill, so `resumeLower
        // .includes(phrase)` never matched the user's per-skill chips ("GCD",
        // "async/await") and the skill resurfaced as "missing" even after they
        // added it. Coverage now EXCLUDES a skill already demonstrated in the CV.
        return jdLower.includes(sl) && !resumeCoversSkill(sl, resumeLower)
      })
      .slice(0, 5)

    // Semantic dedup vs the ATS panel. The ATS score above already lists its own
    // missing keywords for this posting; a Tailor skill that means the same thing
    // ("k8s" vs "kubernetes", "async await" vs "async/await", cross-language pairs)
    // would show the gap twice. The exact vocabulary the client filters with can't
    // see those; embeddings can. ADD-only safety: this can only REMOVE a duplicate,
    // never invent one, and fails closed (embed error → the list stands untouched).
    let dedupedMissingSkills = cleanMissingSkills
    const atsKeywords = (atsMissingKeywords ?? []).map((k) => k.trim()).filter(Boolean).slice(0, 50)
    if (cleanMissingSkills.length > 0 && atsKeywords.length > 0) {
      const dupNorms = await findSemanticMatches(
        cleanMissingSkills,
        atsKeywords,
        // Los embeddings valían $0,02/1M y su costo terminaba en un log de texto que
        // nadie suma: cada análisis embebe el CV y las keywords, así que el gasto por
        // usuario salía por debajo del real. Barato no es gratis.
        (texts) => this.aiClient.embed(texts, (u) =>
          logAIUsage(userId, "tailor-cv:embeddings", {
            model: EMBEDDING_MODEL,
            plan,
            promptTokens: u.tokens,
            completionTokens: 0,
            costUsd: computeCostUsd(EMBEDDING_MODEL, u.tokens, 0),
          }),
        ),
      )
      if (dupNorms.size > 0) {
        dedupedMissingSkills = cleanMissingSkills.filter((s) => !dupNorms.has(normalizeTerm(s)))
      }
    }

    // No-op guard for the summary, unified with bullets/cover: a tailored summary
    // ≥90% identical to the current one is not a real improvement — showing an
    // "Apply" button that overwrites the summary with a near-copy is noise, so drop it.
    const origSummary = (typeof sectionData.summary === "string" ? sectionData.summary : "").trim()
    const tailoredSummary = raw.summary ?? null
    const summaryOut = tailoredSummary && origSummary && (
      isTrivialEdit(origSummary, tailoredSummary)
      || isCosmeticReword(origSummary, tailoredSummary)
      // A summary states the candidate's headline figures. Measured on a
      // well-written résumé, the tailored version dropped "30 patients per
      // shift" and "6 new hires" — the two things that made the summary worth
      // reading. Same rule as the bullets: keep them or keep the original.
      || losesStatedFigure(origSummary, tailoredSummary)
    ) ? null : tailoredSummary

    if (droppedBullets > 0 || droppedTrivial > 0 || droppedFigureLoss > 0) {
      this.logger.warn("[AIService.tailorCV] dropped bullets", { droppedBullets, droppedTrivial, droppedFigureLoss })
    }

    // Soft-skill advice: keep only well-formed {skill, suggestion} pairs — a short
    // skill and a real one-line suggestion — capped at 4. This is guidance the user
    // applies by hand, so there is nothing to write into the CV and nothing to invent.
    const softSkillSuggestions = (Array.isArray(raw.softSkillSuggestions) ? raw.softSkillSuggestions : [])
      .map((x) => ({ skill: typeof x?.skill === "string" ? x.skill.trim() : "", suggestion: typeof x?.suggestion === "string" ? x.suggestion.trim() : "" }))
      .filter((x) => x.skill.length > 0 && x.skill.length <= 40 && x.suggestion.length >= 8)
      .slice(0, 4)

    return {
      summary: summaryOut,
      experiences: sanitizedExperiences,
      missingSkills: dedupedMissingSkills,
      softSkillSuggestions,
    } satisfies TailorCVResultV2
  }
}
