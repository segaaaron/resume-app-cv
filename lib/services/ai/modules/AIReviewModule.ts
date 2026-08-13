// lib/services/ai/modules/AIReviewModule.ts
import { createHash } from "node:crypto"
import { stripJobMarkers, stripJobMarkersDeep } from "../shared/strip-markers"
import { z } from "zod"
import { validateAIInput } from "@/lib/ai-safety"
import {
  AI_MODEL,
  AI_MODEL_PROSE,
  AI_TEMPERATURE_PRECISE,
  AI_TEMPERATURE_STRUCTURED,
  buildResumeContext,
  logAIUsage,
} from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import type { IAIClient } from "@/lib/interfaces/IAIClient"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { enforceAIQuota, refundDailyQuota } from "../shared/quota-enforcer"
import { parseAIJson, safeParseAIJson, resolveLanguage, detectHallucination } from "../shared/ai-helpers"
import { parseBullets } from "../shared/bullets"
import { isCosmeticReword } from "../shared/text-similarity"
import { computeCostUsd } from "../shared/cost-tracker"
import {
  AI_INPUT_LIMITS,
  ATSExtractionSchema,
  CvAnalysisSchema,
  type CvAnalysis,
  ReviewItemSchema,
  ReviewResponseSchema,
  type ATSScoreInput,
  type ATSScoreResult,
  type ATSRescoreInput,
  type GapLever,
  type ReviewCVInput,
  type ReviewResult,
  type ReviewCVResult,
} from "../shared/ai-types"
import { computeResumeScore } from "../shared/resume-score"
import { computeATSMatch, scoreLabel, type SectionPresence } from "../shared/ats-matcher"
import { findSemanticCandidates } from "../shared/semantic-match"
import { confirmEquivalences } from "../shared/skill-equivalence"
import { findDemonstratedSoftSkills } from "../shared/soft-skill-evidence"
import { answerHash, readAnswer, writeAnswer } from "../shared/answer-cache"
import { getTemplateAtsSafety, templateFormatScore, applyTemplatePenalty } from "@/lib/ats/template-ats-safety"
import { assessResumeContent } from "../shared/bullet-quality"
import { findNearMisses } from "@/lib/ats/near-miss"
import { normalizeTerm } from "@/lib/ats/vocabulary"
import { dropSatisfiedYearRequirements } from "@/lib/ats/experience-years"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { groundFixAction } from "@/lib/ats/fix-actions"
import { splitFixText } from "@/lib/ats/fix-text"

/**
 * Hard requirements this CV provably meets, normalized for the matcher.
 *
 * Deterministic: it reads the real date span of the work history, exactly like
 * the check that decides which requirements to PRINT as gaps. Both now read the
 * same answer — the number and the list used to disagree, and the number was the
 * one that was wrong.
 */
function metMustHaves(mustHaves: string[], sectionData: Record<string, unknown>): Set<string> {
  const stillMissing = new Set(dropSatisfiedYearRequirements(mustHaves, sectionData))
  return new Set(mustHaves.filter((m) => !stillMissing.has(m)).map((m) => normalizeTerm(m)))
}

/** A bracketed blank, or several — the shape of a form, not of an example. */
const PLACEHOLDER_MENU = /\[[^\]]{0,80}\]|\{[^}]{0,80}\}/

/**
 * The user's real question — "I'm at 63, what do I DO to reach 90/100?" — answered
 * with a ranked, points-attributed plan. The matcher already computed the scored
 * levers (`gapLevers`) from the exact score weights; this only adds the template
 * layout lever (recoverable = the penalty the caution layout took) and ranks the
 * whole set by impact. Deterministic, no LLM — flows through both atsScore and the
 * live atsRescore, so the plan updates the instant a fix moves the score.
 */
function buildGapPlan(
  gapLevers: GapLever[],
  matchScore: number,
  finalScore: number,
  templateSafety: "safe" | "caution",
): GapLever[] {
  const levers = [...gapLevers]
  if (templateSafety === "caution") {
    const points = Math.max(0, matchScore - finalScore)
    if (points > 0) levers.push({ key: "template", points, currentPct: null })
  }
  return levers.sort((a, b) => b.points - a.points)
}


/** Analyses remembered per process — a CV is re-read a handful of times. */
const ANALYSIS_CACHE_MAX = 100

/**
 * Version of the ANALYSIS QUESTION: the prompt, the action catalogue and the
 * schema the model answers with. Not the model id — answerHash already carries
 * that. Bump on any change to what we ask.
 */
const ANALYSIS_REVISION = "v2-dates"

export class AIReviewModule {
  /**
   * Whether THIS request reached the model at all.
   *
   * The analysis is cached by content, so re-running it on an unchanged résumé
   * and posting makes zero calls — and still burned a daily slot, because the
   * quota is charged before the work starts. Charging for a cache hit is charging
   * for something nobody bought, and it is what put a day of honest testing into
   * "you have reached today's limit".
   */
  private spentAModelCall = false

  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  /**
   * The recruiter analysis for a (resume, posting) pair, so re-running over
   * unchanged text returns the SAME findings.
   *
   * The number was already pinned — the posting's keywords are cached for exactly
   * this reason — but the written half was not, and that is the half the user
   * reads. Pressing Analyze twice on an untouched CV produced a different set of
   * critical fixes each time, which makes the report impossible to work through:
   * you cannot tell "I fixed that" from "it stopped mentioning it". `temperature`
   * cannot solve it either — reasoning models drop the parameter (see
   * model-params), so the request the code thinks it is sending never arrives.
   *
   * Keyed by content, so any edit invalidates it by construction: the user gets a
   * fresh read the moment the CV changes, and the same read when it does not.
   */
  private readonly analysisCache = new Map<string, CvAnalysis>()

  /**
   * The senior-recruiter analysis — the voice of the unified report. A keyword
   * matcher scores; this JUDGES, the way a recruiter does in a 7-second screen and
   * then a deeper read: is this CV a pass for THIS job, and what are the ranked,
   * most-damaging problems (layout risk, weak metrics, a Spanish phrase left in an
   * English CV, a missing summary heading, the same bullet pasted across roles).
   *
   * Runs on AI_MODEL_PROSE, not the cheap extraction model. That was a wrong
   * call, held for months on the theory that "the lever is the prompt, not the
   * model tier": the prompt fix was real, but a nano-class model still returns
   * shallow, generic judgement next to what a mid-tier model writes about the
   * same CV — which is exactly the gap users see when they paste their CV into a
   * frontier chat model and get a sharper read than this panel gave them.
   * Extraction (pulling keyword lists out of a posting) stays on the cheap model:
   * that is mechanical, and a bigger model buys nothing there.
   * Spelling typos (findNearMisses) and missing keywords (the deterministic match)
   * are handled elsewhere and told to stay out of here, so the unified report never
   * says the same thing twice. Fail-closed: any error returns null, score intact.
   */

  /**
   * Binds a cached analysis to the resume in front of us, on a COPY.
   *
   * Two defects made this necessary, and both were found by asking what a cache
   * keyed on TEXT means when two resumes can share it:
   *
   * 1. Duplicating a CV is a feature of this product, and a duplicate has the same
   *    text with different job ids. The stored actions carried the ORIGINAL
   *    resume's ids, so on the copy every "Apply" button silently failed to draw —
   *    the finding was there, the fix was not. Grounding is per-resume, so it
   *    cannot be done once and stored; it has to run on every read.
   *
   * 2. The caller prunes criticalFixes to avoid repeating what the deterministic
   *    layer already shows, and it was pruning the object held IN the cache. Each
   *    read therefore returned fewer findings than the last, on a CV nobody had
   *    touched. Handing out a copy ends that whole class of bug.
   */
  private groundForThisResume(analysis: CvAnalysis, sectionData: Record<string, unknown>): CvAnalysis {
    const copy = structuredClone(analysis)
    for (const f of copy.criticalFixes) f.action = groundFixAction(f.action, sectionData)
    return copy
  }

  private async analyzeResume(
    userId: string,
    resumeText: string,
    jobContext: string,
    plan: string,
    en: boolean,
    langInstruction: string,
    sectionData: Record<string, unknown> = {},
    /** Scopes the cached answer to the résumé, so deleting the CV deletes it. */
    resumeId?: string,
  ): Promise<CvAnalysis | null> {
    // Same resume, same posting, same language → the answer we already gave.
    // No call, no tokens, no quota: it is the identical question.
    // ANALYSIS_REVISION is part of the key on purpose. The cache answers "same
    // resume, same posting → same answer", and that is exactly right until the
    // QUESTION changes. When the prompt was corrected to stop the model inventing
    // date problems, every CV already analysed kept serving the old verdict from
    // the database — the fix shipped and the user still saw the bug, with no way
    // to tell which. Bump this whenever the prompt or the schema changes; the old
    // rows stay for audit and are simply never read again.
    const cacheKey = `${ANALYSIS_REVISION}:${en ? "en" : "es"}:${createHash("sha256").update(`${resumeText}\u0000${jobContext}`).digest("hex")}`
    const cachedAnalysis = this.analysisCache.get(cacheKey)
    if (!cachedAnalysis) this.spentAModelCall = true
    if (cachedAnalysis) {
      this.logger.info("[AIService.analyzeResume] cache hit (memory)")
      return this.groundForThisResume(cachedAnalysis, sectionData)
    }
    // Then the durable one. The in-memory map held only until the page was
    // reloaded or the container restarted, so re-running the analysis on an
    // untouched CV produced a DIFFERENT set of critical fixes — and the user
    // could not tell "I fixed that" from "it stopped mentioning it". The question
    // is identical, so the answer has to be.
    const storedAnalysis = await readAnswer("analysis", cacheKey)
    if (storedAnalysis) {
      const restored = CvAnalysisSchema.safeParse(storedAnalysis)
      if (restored.success) {
        // Served from the durable cache after all: the flag set above was
        // pessimistic, and a request that reaches here made no call.
        this.spentAModelCall = false
        this.logger.info("[AIService.analyzeResume] cache hit (stored)")
        this.analysisCache.set(cacheKey, restored.data)
        return this.groundForThisResume(restored.data, sectionData)
      }
    }

    /**
     * The achievement gap, measured in code and handed to the analyst.
     *
     * Reviewed by hand, the single most useful thing to tell this candidate was
     * "your CV says which technologies you used, never what you achieved with
     * them" — and the panel never said it. It reported typos, missing keywords
     * and bullets without a figure, all true and all smaller. The model will not
     * reliably surface it on its own, so the ratio is computed here and the
     * prompt is told to lead with it when it is bad.
     */
    const cq = assessResumeContent(sectionData)
    const outcomeBlock = cq.totalBullets === 0 ? "" : (() => {
      const withOutcome = cq.quantifiedBullets
      const pct = cq.quantificationPct
      // Framed as a fact FOR the analyst, never as text to echo: the first
      // version handed the model a "MEASURED: …" line and it published that
      // verbatim as the finding, which reads like internal tooling.
      const line = en
        ? `[fact for you, do not quote this line] ${withOutcome} of ${cq.totalBullets} bullets state a measurable result (${pct}%).`
        : `[dato para ti, no cites esta línea] ${withOutcome} de ${cq.totalBullets} bullets declaran un resultado medible (${pct}%).`
      if (pct >= 50) return line
      return en
        ? `${line}\nThis is the candidate's BIGGEST problem and it must be criticalFixes[0]. Write it in YOUR OWN words, addressed to the candidate — never repeat the bracketed line above. The resume lists what they DID, not what it ACHIEVED. Quote ONE real bullet as the example, explain that a recruiter cannot tell a good iOS developer from an average one without outcomes, and name exactly what to add (scale, impact, time saved, people led). Do NOT invent a number — ask for theirs.`
        : `${line}\nEste es el problema MÁS GRANDE del candidato y debe ser criticalFixes[0]. Escríbelo con TUS palabras, dirigido al candidato — nunca repitas la línea entre corchetes de arriba. El CV enumera lo que HIZO, no lo que LOGRÓ. Cita UN bullet real como ejemplo, explica que un reclutador no puede distinguir a un buen desarrollador de uno promedio sin resultados, y dile exactamente qué agregar (escala, impacto, tiempo ahorrado, personas a cargo). NO inventes una cifra — pídele la suya.`
    })()

    const prompt = en
      ? `You are a senior technical recruiter and ATS specialist. You have screened 10,000+ resumes and know exactly how Workday, Greenhouse, Taleo, iCIMS and Lever parse a PDF and rank a candidate. You are blunt and specific, and you NEVER invent facts — every claim quotes the candidate's real text.

Judge this RESUME for the JOB below the way you would in a 7-second screen, then a deeper read.

=== JOB ===
${jobContext}

=== RESUME ===
${resumeText}

${outcomeBlock}

Return JSON with this exact shape:
{
  "verdict": "2 sentences: would this pass your screen for THIS job, and the single biggest risk.",
  "passRisk": "low | medium | high",
  "criticalFixes": [
    { "issue": "<what is wrong — quote the real resume text>",
      "why": "<why it costs the ATS match or the recruiter>",
      "fix": "<the exact change to make>",
      "needsFromYou": "<optional: ONE example sentence showing the finished line with an illustrative figure — never a bracket placeholder, never a menu of options>",
      "severity": "high | medium",
      "action": { "kind": "rewrite_bullet | rewrite_summary | replace_text | add_skill | fix_dates | remove_duplicates | manual",
                  "targetId": "<job ID, rewrite_bullet only>",
                  "index": 0,
                  "value": "<skill, add_skill only>" } }
  ],
  "strengths": ["<a real, specific strength for THIS job>"]
}

Review the resume against ALL of the following and report every real problem you find (quote the text):
1. SPELLING & GRAMMAR in the prose — quote the exact error and the correction ("more then" → "more than", "Debeloper" → "Developer"). Never skip this.
2. QUANTIFICATION — bullets that state a duty with no result; metrics too small to impress ("by 3%", "50 users"); or figures so large they read as invented ("by 50%") the candidate must be ready to defend.
3. WEAK WRITING — bullets opening with a duty phrase ("Responsible for", "Helped with") or a weak/passive verb instead of a strong action verb.
4. ATS PARSEABILITY — dates not in a machine-friendly format (prefer MM/YYYY over a bare year); non-standard section headings; a name/contact line a parser could garble; anything a layout hides from the parser.
5. STRUCTURE — no explicit "Professional Summary" heading; more than 2 pages; missing LinkedIn/GitHub for a senior technical candidate; illogical section order.
6. CONSISTENCY — a stated number of years that does not match the dates; mixed verb tense; first-person leakage ("I", "my").
7. LANGUAGE — any phrase left in a different language than the rest of the resume; orphan/stray fragments.
8. REPETITION — the same bullet or phrase reused across multiple roles.
9. FIT FOR THIS JOB — whether the experience actually EVIDENCES the job's core requirements (not just lists the skill), and the single most important thing missing for THIS specific role.

Hard rules:
- DEPTH IS THE POINT. "issue" quotes the candidate's actual line. "why" names the concrete consequence for THIS posting (which requirement goes unmatched, what the recruiter concludes) — never a generic platitude. "fix" is the REPLACEMENT TEXT, ready to paste, written in the candidate's voice — not a description of what they should do. A fix the user cannot copy straight into their CV is a wasted fix.
- WHEN THE LINE NEEDS A NUMBER THE CANDIDATE HAS NOT GIVEN: write "fix" as the sentence WITHOUT the number, ending naturally, and put the request in "needsFromYou" as ONE concrete example sentence showing what a finished version looks like — using an obviously illustrative figure. Write it as a single example, never as a menu: "e.g. 'reducing crash rate from 2.1% to 0.4% across 50k users'". NEVER emit bracket placeholders like [insert metric] or [timeframe] anywhere: a list of options inside brackets is not an example, it is homework, and if it reaches the CV a recruiter reads it verbatim.
- Ground EVERYTHING in the real resume text — quote it. Never invent a fact, metric or percentage.
- Do NOT list which job-description keywords are missing — that is reported separately.
- No generic filler ("use action verbs" with no example) — always tie the advice to the candidate's actual line.
- The verdict MUST plainly state whether the resume is strong enough for THIS job and name the single biggest thing holding it back.
- Return up to 8 critical fixes, most damaging first. Empty array only if the resume is genuinely clean.
- EVERY fix carries an "action" naming the tool that repairs it, because the user gets a working button from it:
  · rewrite_bullet — one specific bullet is weak/duty-phrased/unquantified. Give the job's ID (shown as "ID:x" in the resume above) and the bullet's 0-based index within that job. Only use an ID and index that actually exist above.
  · rewrite_summary — the summary's CONTENT is weak and the whole paragraph should be rewritten.
  · replace_text — a wording slip: a typo, a grammar error, a wrong word. Put the exact wrong text in "value" (copied verbatim from the resume above) and the corrected text in "replacement". PREFER THIS over rewrite_summary/rewrite_bullet whenever the defect is a few words: rewriting a whole paragraph to fix "more then" changes sentences that were fine.
  · add_skill — a skill the candidate demonstrates in their experience but never lists. Put the exact skill in "value".
  · fix_dates — dates are in inconsistent or non-machine-readable FORMATS (e.g. "Jan 2023" next to "03/2024"). Nothing else. Never raise a finding about a date being in the future, a role's end year, a gap between roles or how long a tenure is: a deterministic check with the real calendar already reports those, and it is right where you are guessing. In particular NEVER propose changing an end date to "Present" — whether someone still works somewhere is a fact only they know.
  · remove_duplicates — the same bullet text appears more than once.
  · manual — anything else (missing LinkedIn, an unexplained gap, a claim only the candidate can verify). Use it freely; a wrong action is worse than none.
- Respond ONLY with the JSON, no markdown.`
      : `Eres un reclutador técnico senior y especialista en ATS. Has filtrado más de 10.000 CVs y sabes exactamente cómo Workday, Greenhouse, Taleo, iCIMS y Lever parsean un PDF y rankean a un candidato. Eres directo y específico, y NUNCA inventas datos — cada afirmación cita el texto real del candidato.

Evalúa este CV para el PUESTO de abajo como lo harías en un escaneo de 7 segundos, y luego en una lectura a fondo.

=== PUESTO ===
${jobContext}

=== CV ===
${resumeText}

${outcomeBlock}

Devuelve JSON con esta forma exacta:
{
  "verdict": "2 oraciones: pasaría tu filtro para ESTE puesto, y el mayor riesgo.",
  "passRisk": "low | medium | high",
  "criticalFixes": [
    { "issue": "<qué está mal — cita el texto real del CV>",
      "why": "<por qué le cuesta el match ATS o al reclutador>",
      "fix": "<el cambio exacto a hacer>",
      "needsFromYou": "<opcional: UN ejemplo concreto de cómo queda la línea terminada con una cifra ilustrativa — nunca un marcador entre corchetes, nunca un menú de opciones>",
      "severity": "high | medium",
      "action": { "kind": "rewrite_bullet | rewrite_summary | replace_text | add_skill | fix_dates | remove_duplicates | manual",
                  "targetId": "<ID del puesto, solo rewrite_bullet>",
                  "index": 0,
                  "value": "<habilidad, solo add_skill>" } }
  ],
  "strengths": ["<una fuerza real y específica para ESTE puesto>"]
}

Revisa el CV contra TODO lo siguiente y reporta cada problema real que encuentres (cita el texto):
1. ORTOGRAFÍA Y GRAMÁTICA de la prosa — cita el error exacto y la corrección ("more then" → "more than", "Debeloper" → "Developer"). Nunca lo saltes.
2. CUANTIFICACIÓN — bullets que expresan una tarea sin resultado; métricas demasiado chicas para impresionar ("by 3%", "50 users"); o cifras tan grandes que parecen inventadas ("by 50%") que el candidato debe poder defender.
3. ESCRITURA DÉBIL — bullets que abren con una frase de tarea ("Responsible for", "Helped with") o un verbo débil/pasivo en vez de un verbo de acción fuerte.
4. PARSEABILIDAD ATS — fechas no en formato máquina (prefiere MM/YYYY sobre solo el año); encabezados de sección no estándar; una línea de nombre/contacto que un parser pueda romper; cualquier cosa que el layout esconda del parser.
5. ESTRUCTURA — sin encabezado explícito de "Resumen Profesional"; más de 2 páginas; falta LinkedIn/GitHub para un candidato técnico senior; orden de secciones ilógico.
6. CONSISTENCIA — un número de años declarado que no cuadra con las fechas; tiempos verbales mezclados; primera persona ("yo", "mi").
7. IDIOMA — cualquier frase en un idioma distinto al resto del CV; fragmentos huérfanos/sueltos.
8. REPETICIÓN — el mismo bullet o frase reusado entre varios puestos.
9. ENCAJE PARA ESTE PUESTO — si la experiencia realmente EVIDENCIA los requisitos centrales del puesto (no solo lista la skill), y lo único más importante que falta para ESTE rol.

Reglas duras:
- LA PROFUNDIDAD ES EL PUNTO. "issue" cita la línea real del candidato. "why" nombra la consecuencia concreta para ESTA vacante (qué requisito queda sin cubrir, qué concluye el reclutador) — nunca una generalidad. "fix" es el TEXTO DE REEMPLAZO, listo para pegar, escrito en la voz del candidato — no una descripción de lo que debería hacer. Un arreglo que el usuario no puede copiar tal cual a su CV es un arreglo desperdiciado.
- CUANDO LA LÍNEA NECESITA UN NÚMERO QUE EL CANDIDATO NO DIO: escribe "fix" como la oración SIN el número, terminada de forma natural, y pon el pedido en "needsFromYou" como UN ejemplo concreto que muestre cómo se ve la versión terminada, con una cifra obviamente ilustrativa. Escríbelo como un solo ejemplo, nunca como un menú: "ej.: 'reduciendo los crashes de 2,1% a 0,4% en 50.000 usuarios'". NUNCA uses marcadores entre corchetes como [inserta métrica] o [plazo]: una lista de opciones entre corchetes no es un ejemplo, es tarea, y si llega al CV el reclutador la lee tal cual.
- Ancla TODO en el texto real del CV — cítalo. Nunca inventes un dato, métrica ni porcentaje.
- NO listes qué keywords de la vacante faltan — eso se reporta aparte.
- Sin relleno genérico ("usa verbos de acción" sin ejemplo) — siempre atá el consejo a la línea real del candidato.
- El veredicto DEBE decir claramente si el CV es lo bastante fuerte para ESTE puesto y nombrar lo único más grande que lo frena.
- Devuelve hasta 8 arreglos críticos, el más dañino primero. Array vacío solo si el CV está genuinamente limpio.
- CADA arreglo lleva una "action" que nombra la herramienta que lo repara, porque de ahí sale un botón real para el usuario:
  · rewrite_bullet — un bullet concreto es débil / lista funciones / no tiene resultado. Da el ID del puesto (aparece como "ID:x" en el CV de arriba) y el índice 0-based del bullet dentro de ese puesto. Usa solo IDs e índices que existan arriba.
  · rewrite_summary — el CONTENIDO del resumen es débil y hay que reescribir el párrafo entero.
  · replace_text — un desliz de redacción: un typo, un error de gramática, una palabra equivocada. Pon el texto exacto equivocado en "value" (copiado literal del CV de arriba) y el corregido en "replacement". PREFIERE ESTA sobre rewrite_summary/rewrite_bullet cuando el defecto son unas pocas palabras: reescribir un párrafo entero para arreglar "more then" cambia frases que estaban bien.
  · add_skill — una habilidad que el candidato demuestra en su experiencia pero nunca lista. Pon la habilidad exacta en "value".
  · fix_dates — las fechas están en FORMATOS inconsistentes o poco legibles por máquina (ej. "ene 2023" junto a "03/2024"). Nada más. Nunca plantees un hallazgo sobre una fecha futura, el año de fin de un puesto, un hueco entre puestos o la duración de una antigüedad: una verificación determinista con el calendario real ya reporta eso, y acierta donde tú adivinas. En particular NUNCA propongas cambiar una fecha de fin a "Actualidad" — si alguien sigue trabajando ahí es un dato que solo esa persona conoce.
  · remove_duplicates — el mismo bullet aparece más de una vez.
  · manual — cualquier otra cosa (falta LinkedIn, un hueco sin explicar, algo que solo el candidato puede verificar). Úsalo sin miedo; una acción equivocada es peor que ninguna.
- Responde ÚNICAMENTE con el JSON, sin markdown.`

    try {
      const response = await this.aiClient.chat({
        model: AI_MODEL_PROSE,
        // 1200 truncated the JSON mid-object on a rich CV — the prompt asks for
        // up to 8 fixes, each with issue + why + fix, plus a verdict and
        // strengths, and in Spanish that overruns easily. The parse then threw
        // and the whole recruiter analysis vanished from the panel with only a
        // warn line in the logs (observed in production, 2026-08-05). Same
        // failure and same fix as tailor-cv in 4e0bed5.
        // 8 fixes, each with a quoted issue, a concrete why and a ready-to-paste
        // fix, plus verdict and strengths — in Spanish. At 3000 the model wrote
        // telegraphically to fit, which read as shallow advice.
        max_tokens: 4500,
        temperature: AI_TEMPERATURE_PRECISE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a senior technical recruiter and ATS specialist. You are blunt, specific, and only report problems grounded in the actual resume text — you never invent them. " + langInstruction },
          { role: "user", content: prompt },
        ],
      })
      const usage = response.usage
      logAIUsage(userId, "ats-score", {
        model: AI_MODEL_PROSE,
        plan,
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        costUsd: computeCostUsd(AI_MODEL_PROSE, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
      })
      const raw = response.choices[0]?.message?.content ?? "{}"
      const parsed = CvAnalysisSchema.safeParse(parseAIJson<unknown>(raw))
      if (!parsed.success) {
        // Was a bare `return null`: the analysis disappeared from the panel with
        // no log line anywhere, so the failure was invisible in production AND
        // undiagnosable after the fact. Length is logged because truncation is
        // the failure this call actually has.
        this.logger.warn("[AIService.atsScore] recruiter analysis rejected by schema", {
          issues: parsed.error.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`),
          rawLength: raw.length,
          finishReason: response.choices[0]?.finish_reason ?? "unknown",
        })
        return null
      }
      // Our own job marker, out of every string the user will read — before any
      // other processing, so nothing downstream sees or stores it.
      const a = stripJobMarkersDeep(parsed.data)
      a.criticalFixes = a.criticalFixes.filter((f) => f.issue.trim()).slice(0, 8)
      // Every button is verified against the real CV before the user can press
      // it. A rewrite_bullet pointing at a job that isn't there, or past the end
      // of its bullets, would silently do nothing or edit the wrong line — so it
      // degrades to advice-only. add_skill without a skill is the same story.
      // The analyst hinges from replacement text into an order to the candidate in
      // the same string ("…improving reliability; add the release volume you can
      // defend"). Pressing "Apply this text" wrote that order into the resume. Split
      // here, once, server-side: `fix` keeps only what may be pasted, and the order
      // moves to `needsFromYou`, which the panel shows and never applies.
      for (const f of a.criticalFixes) {
        const { replacement, instruction } = splitFixText(f.fix)
        if (instruction) {
          f.fix = replacement
          f.needsFromYou = instruction
        }
        /**
         * A bracket menu is not an example.
         *
         * The model answers the "what is missing" slot with a list of options —
         * "improving [insert your actual metric: crash rate, conversion,
         * retention, latency, or adoption] for [insert scale: users/orders/
         * markets] in [insert timeframe]" — and the user is left decoding a form
         * instead of reading a sentence. Reported verbatim: "pones muchas cosas,
         * las cuales suelen ser confusas".
         *
         * Stripping the brackets leaves "improving for in", so the text is
         * REPLACED rather than cleaned. Ours is one plain sentence, and it never
         * invents a figure — that is still the candidate's to supply.
         */
        /**
         * A rewrite with no figure in it always owes the candidate a figure.
         *
         * The loop this closes: the analyst rewrites a metric-less bullet into
         * another metric-less bullet without saying anything is missing, the user
         * presses Apply, and the deterministic content check immediately flags the
         * same line again — the report asking for the exact thing it just wrote.
         * Nothing in the model's reply is required to admit this, so it is decided
         * here, in code: no digit in the replacement means the number is still
         * outstanding, and the panel says so instead of pretending the fix is done.
         */
        if (f.action?.kind === "rewrite_bullet" && f.fix?.trim() && !/\d/.test(f.fix) && !f.needsFromYou?.trim()) {
          f.needsFromYou = en
            ? "This still has no number. Add the result you can defend: what changed, by how much, and over what."
            : "Esto todavía no tiene número. Agregá el resultado que puedas defender: qué cambió, cuánto y sobre qué."
        }

        if (f.needsFromYou && PLACEHOLDER_MENU.test(f.needsFromYou)) {
          f.needsFromYou = en
            ? "Add the result you can defend: what changed, by how much, and over what — e.g. \"cutting crash rate from 2.1% to 0.4% across 50k users\"."
            : "Agregá el resultado que puedas defender: qué cambió, cuánto y sobre qué — ej.: \"bajando los crashes de 2,1% a 0,4% en 50.000 usuarios\"."
        }
      }
      // Nothing usable → null, so the UI shows no empty analysis.
      if (!a.verdict.trim() && a.criticalFixes.length === 0 && a.strengths.length === 0) return null
      // Remembered only once it survived every guard: a failed or empty read must
      // never freeze into "this is what your CV says".
      this.analysisCache.set(cacheKey, a)
      if (this.analysisCache.size > ANALYSIS_CACHE_MAX) {
        // Oldest first — Map preserves insertion order.
        this.analysisCache.delete(this.analysisCache.keys().next().value as string)
      }
      // Stored AFTER every guard, so a reload re-serves the answer the user
      // actually saw — not the raw model reply a guard had already rejected.
      await writeAnswer("analysis", cacheKey, a, AI_MODEL_PROSE, resumeId)
      return this.groundForThisResume(a, sectionData)
    } catch (err) {
      this.logger.warn("[AIService.atsScore] recruiter analysis failed (non-fatal)", { err: err instanceof Error ? err.message : String(err) })
      return null
    }
  }

  async atsScore(userId: string, input: ATSScoreInput, plan: string): Promise<ATSScoreResult> {
    await enforceAIQuota(userId, "ats-score", plan)
    // Every model call this request makes flips this. A request that ends with it
    // still false spent nothing, and the daily slot goes back — the cap exists to
    // stop spending, not to charge for cache hits.
    this.spentAModelCall = false

    const { jobDescription, roleTitle, sectionData, language: rawLanguage, templateId, resumeId } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)
    const en = language === "en"

    // Two entry points into the SAME deterministic engine:
    //  · a real job description (precise), or
    //  · just the target role (low friction) — the AI infers the standard
    //    requirements for that role. Flagged so the UI marks it approximate.
    const useRole = !!roleTitle?.trim() && (!jobDescription || jobDescription.trim().length < 20)
    if (useRole) {
      const rt = roleTitle!.trim()
      if (rt.length < 3 || rt.length > 120) throw new AppError("invalid_input", 400)
    } else {
      const validation = validateAIInput(jobDescription ?? "", AI_INPUT_LIMITS.jobDescription)
      if (!validation.valid) throw new AppError("invalid_input", 400)
    }

    // Truncate to 6000 chars — covers 95%+ of real job descriptions without quality loss
    const jobDescriptionTruncated = (jobDescription ?? "").slice(0, AI_INPUT_LIMITS.jobDescription)

    const data = sectionData ?? {}
    // A large CV must be analyzed, not rejected. Truncate it (same 12000 budget
    // Review CV already allows) exactly like the job description is truncated below,
    // instead of erroring with "too_long" — which surfaced as a misleading
    // "add more info to your CV" message for a CV that was actually too long.
    const resumeText = buildResumeContext(data, language).slice(0, AI_INPUT_LIMITS.resumeContext)
    if (!resumeText.trim()) throw new AppError("not_enough_resume_data", 400)
    const resumeTextValidation = validateAIInput(resumeText, AI_INPUT_LIMITS.resumeContext)
    if (!resumeTextValidation.valid) throw new AppError("invalid_input", 400)

    // ── LLM call #1: EXTRACT requirements from the JD (no scoring). The score is
    // computed deterministically in code below so it is reproducible and the
    // "missing keywords" are verified against the actual CV text. The model only
    // extracts keyword lists + writes a short summary and actionable suggestions.
    const jdPrompt = en
      ? `Extract the hiring requirements from this job description. Do NOT score or rate anything — only extract and advise.

=== JOB DESCRIPTION ===
${jobDescriptionTruncated}

=== CANDIDATE RESUME (context only) ===
${resumeText}

Return JSON with this exact shape:
{
  "hardSkills": ["<technical skill / tool / technology the job requires>", ...],
  "softSkills": ["<soft skill the job requires>", ...],
  "jobTitle": "<the role title from the job description>",
  "mustHaves": ["<hard requirement: years of experience, degree, certification, license>", ...],
  "summary": "<1-2 sentence qualitative summary of how the resume fits — do NOT state a numeric score>",
}

Rules:
- hardSkills/softSkills/mustHaves: write each item exactly as it would appear on a resume (canonical form, e.g. "JavaScript", "Project Management"). Max ~12 hard skills.
- Extract ONLY what the job description actually asks for. Do not invent requirements.
- WRITE EVERY ITEM IN THE RESUME'S LANGUAGE, not the posting's. If the posting is in another language, TRANSLATE each requirement — the candidate reads this report in their own language, and an untranslated requirement also never matches their resume text.
- Every suggestion carries an "action" — the tool that performs it, which the user gets as a working button: add_skill (put the exact skill in "value"), rewrite_bullet (give the job ID shown as "ID:x" in the resume and the bullet's 0-based index), rewrite_summary, fix_dates, remove_duplicates, or manual when nothing in the editor can do it in one click. A wrong action is worse than manual.
- If the text is NOT a real job description, return: {"jobTitle":"","hardSkills":[],"softSkills":[],"mustHaves":[],"summary":"","label":"off_topic"}
- Respond ONLY with the JSON, no markdown.`
      : `Extrae los requisitos de contratación de esta descripción de puesto. NO puntúes ni califiques nada — solo extrae y aconseja.

=== DESCRIPCIÓN DEL PUESTO ===
${jobDescriptionTruncated}

=== CV DEL CANDIDATO (contexto solo para sugerencias) ===
${resumeText}

Devuelve JSON con esta forma exacta:
{
  "hardSkills": ["<habilidad técnica / herramienta / tecnología que pide el puesto>", ...],
  "softSkills": ["<habilidad blanda que pide el puesto>", ...],
  "jobTitle": "<el título del puesto según la descripción>",
  "mustHaves": ["<requisito duro: años de experiencia, título, certificación, licencia>", ...],
  "summary": "<resumen cualitativo de 1-2 oraciones sobre el encaje del CV — NO indiques un número de score>",
}

Reglas:
- hardSkills/softSkills/mustHaves: escribe cada ítem tal como aparecería en un CV (forma canónica, ej. "JavaScript", "Gestión de Proyectos"). Máx ~12 hard skills.
- Extrae SOLO lo que la descripción realmente pide. No inventes requisitos.
- ESCRIBE CADA ÍTEM EN EL IDIOMA DEL CV, no en el de la oferta. Si la oferta está en otro idioma, TRADUCE cada requisito — el candidato lee este informe en su idioma, y un requisito sin traducir tampoco matchea nunca con el texto de su CV.
- Cada sugerencia lleva una "action" — la herramienta que la ejecuta, que el usuario recibe como botón real: add_skill (pon la habilidad exacta en "value"), rewrite_bullet (da el ID del puesto que aparece como "ID:x" en el CV y el índice 0-based del bullet), rewrite_summary, fix_dates, remove_duplicates, o manual cuando nada en el editor pueda hacerlo en un clic. Una acción equivocada es peor que manual.
- Si el texto NO es una descripción de puesto real, devuelve: {"jobTitle":"","hardSkills":[],"softSkills":[],"mustHaves":[],"summary":"","label":"off_topic"}
- Responde ÚNICAMENTE con el JSON, sin markdown.`

    // Role-only mode: infer the STANDARD requirements for the target role (no
    // real posting). Same JSON shape → same deterministic engine. Honest about
    // scope: standard expectations only, never invented company-specific asks.
    const rolePrompt = en
      ? `Infer the STANDARD hiring requirements for the target role below — the hard skills, soft skills, must-haves and canonical job title a typical posting for this role would list. Base it ONLY on common, well-established expectations for this role. Do NOT invent niche, company-specific or unusual requirements. If the role is too vague or is not a real job role, return off_topic.

=== TARGET ROLE ===
${roleTitle ?? ""}

=== CANDIDATE RESUME (context only) ===
${resumeText}

Return JSON with this exact shape:
{
  "hardSkills": ["<technical skill / tool / technology the role standardly requires>", ...],
  "softSkills": ["<soft skill the role standardly requires>", ...],
  "jobTitle": "<canonical title for this role>",
  "mustHaves": ["<standard hard requirement: typical years, degree, certification, license>", ...],
  "summary": "<1-2 sentence qualitative summary of how the resume fits this role — do NOT state a numeric score>",
}

Rules:
- Only STANDARD requirements for this role. Max ~12 hard skills.
- Do NOT invent niche/company-specific requirements — only what a typical posting for this role lists.
- If the role is too vague to infer, return {"jobTitle":"","hardSkills":[],"softSkills":[],"mustHaves":[],"summary":"","label":"off_topic"}
- Respond ONLY with the JSON, no markdown.`
      : `Infiere los requisitos ESTÁNDAR de contratación para el rol objetivo de abajo — las habilidades técnicas, blandas, requisitos duros y el título canónico que una oferta típica de este rol listaría. Básate SOLO en expectativas comunes y bien establecidas de este rol. NO inventes requisitos de nicho, específicos de una empresa ni inusuales. Si el rol es demasiado vago o no es un rol real, devuelve off_topic.

=== ROL OBJETIVO ===
${roleTitle ?? ""}

=== CV DEL CANDIDATO (contexto solo para sugerencias) ===
${resumeText}

Devuelve JSON con esta forma exacta:
{
  "hardSkills": ["<habilidad técnica / herramienta / tecnología que el rol pide estándarmente>", ...],
  "softSkills": ["<habilidad blanda que el rol pide estándarmente>", ...],
  "jobTitle": "<título canónico de este rol>",
  "mustHaves": ["<requisito duro estándar: años típicos, título, certificación, licencia>", ...],
  "summary": "<resumen cualitativo de 1-2 oraciones sobre el encaje del CV con este rol — NO indiques un número de score>",
}

Reglas:
- Solo requisitos ESTÁNDAR de este rol. Máx ~12 hard skills.
- NO inventes requisitos de nicho/específicos de empresa — solo lo que una oferta típica del rol lista.
- Si el rol es demasiado vago para inferir, devuelve {"jobTitle":"","hardSkills":[],"softSkills":[],"mustHaves":[],"summary":"","label":"off_topic"}
- Responde ÚNICAMENTE con el JSON, sin markdown.`

    const prompt = useRole ? rolePrompt : jdPrompt

    // Same posting as the last run → reuse its keywords instead of asking the
    // model again. The scoring engine was always deterministic; the extraction
    // was not (temperature is dropped for reasoning models, see model-params),
    // so an unchanged CV could score differently twice in a row and the number
    // could not answer "did my edit help?". Pinning the posting side makes any
    // movement attributable to the CV — and saves one LLM call per re-run.
    let extraction: z.infer<typeof ATSExtractionSchema> | null = null
    /**
     * True when the requirement list did not come from us.
     *
     * `cachedKeywords` is whatever the client sent. Reusing it for THIS request is
     * the point — it pins the posting side within a session. Writing it to a store
     * keyed by the posting TEXT is a different matter entirely: the next person who
     * pastes the same posting would be scored against a list a stranger supplied.
     * Only an extraction this server produced is allowed to become the shared
     * answer.
     */
    let extractionFromClient = false
    const cached = input.cachedKeywords
    if (cached && (cached.hardSkills.length > 0 || cached.mustHaves.length > 0 || cached.jobTitle.trim())) {
      extraction = {
        jobTitle: cached.jobTitle,
        hardSkills: cached.hardSkills,
        softSkills: cached.softSkills,
        mustHaves: cached.mustHaves,
        summary: cached.summary ?? "",
        label: "ok",
      }
      extractionFromClient = true
    }

    /**
     * The posting side, pinned across reloads — not just within one page.
     *
     * The client already reuses the keywords while the panel stays mounted, and
     * that ref dies on reload. So a user who re-opened the editor got the posting
     * RE-EXTRACTED by a model, came back with a slightly different requirement
     * list, and watched the same resume score 80 and then 71 with soft skills
     * falling from 100% to 80%. Nothing they did explained it. The posting has not
     * changed, so the requirements must not either: the answer is stored against
     * the posting text itself, and only editing the posting buys a fresh read.
     */
    /**
     * The CV is part of the key because the CV is part of the INPUT.
     *
     * This prompt receives the candidate's résumé (lines 529/553/582/604: "=== CANDIDATE
     * RESUME ===") and its answer depends on it — the summary describes THIS CV's
     * fit, and every item is written in THIS CV's language. Keyed on the posting
     * alone, the second person to analyse the same posting was served the reading
     * of someone else's résumé: a "fit" sentence about a document they never
     * wrote, and requirements translated into a language they may not use.
     *
     * Nobody would have seen it as an error — the list looks plausible either way
     * — which is exactly why it had to be found by reading the key against the
     * prompt rather than by using the product.
     *
     * The rule, and it is not negotiable: a cache key must cover every input the
     * answer depends on. Reuse is what is left over after correctness, never
     * before it. The cost is real and accepted — the same posting with a different
     * CV now costs a call — and the refund below still covers the case that
     * actually repeats: the same CV analysed again.
     */
    const keywordsKey = answerHash(
      AI_MODEL,
      en ? "en" : "es",
      useRole ? "role" : "jd",
      useRole ? (roleTitle ?? "").trim() : jobDescriptionTruncated,
      createHash("sha256").update(resumeText).digest("hex"),
    )
    let keywordsFromStore = false
    if (!extraction) {
      const storedKeywords = await readAnswer("job-keywords", keywordsKey)
      if (!storedKeywords) this.spentAModelCall = true
      if (storedKeywords) {
        const parsed = ATSExtractionSchema.safeParse(storedKeywords)
        if (parsed.success) { extraction = parsed.data; keywordsFromStore = true }
      }
    }

    const response = extraction ? null : await this.aiClient.chat({
      model: AI_MODEL,
      // 700 truncated the JSON and surfaced as "Error analyzing ATS
      // compatibility" (parse_error 500, seen in production 2026-08-09): the
      // body carries a title, up to 12 hard skills, soft skills, must-haves and
      // a summary, in Spanish. Dropping the suggestions block shrank it further;
      // the headroom stays so a long posting cannot cut the JSON again.
      max_tokens: 1600,
      temperature: AI_TEMPERATURE_PRECISE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            (useRole
              ? // Role mode: we feed a job TITLE, not a posting. The system prompt
                // must license inferring standard requirements — otherwise the
                // "only real job descriptions" rule would off_topic a valid title.
                "Eres un experto en los requisitos ESTÁNDAR de roles profesionales para análisis de compatibilidad ATS. " +
                "Dado un título de puesto, infieres los requisitos típicos y bien establecidos de ese rol (sin inventar requisitos de nicho ni específicos de una empresa). NUNCA asignas un puntaje numérico — solo extraes keywords y das consejos. "
              : "Eres un extractor experto de requisitos de vacantes para análisis de compatibilidad ATS. " +
                "Solo procesas descripciones de puestos de trabajo reales. NUNCA asignas un puntaje numérico — solo extraes keywords y das consejos. ") +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    if (response) {
      const atsUsage = response.usage
      logAIUsage(userId, "ats-score", {
        model: AI_MODEL,
        plan,
        promptTokens: atsUsage?.prompt_tokens ?? 0,
        completionTokens: atsUsage?.completion_tokens ?? 0,
        costUsd: computeCostUsd(AI_MODEL, atsUsage?.prompt_tokens ?? 0, atsUsage?.completion_tokens ?? 0),
      })
    }

    const raw = response?.choices[0]?.message?.content ?? ""
    // One retry before failing the whole analysis. Extraction is mechanical, so
    // a bad body is a sampling accident, not a wrong request — and the user
    // getting "something went wrong" on a valid posting is the worst outcome.
    const firstParse = ATSExtractionSchema.safeParse(safeParseAIJson<unknown>(raw))
    if (extraction) {
      // reused — nothing to parse
    } else if (firstParse.success) {
      extraction = firstParse.data
    } else {
      this.logger.warn("[AIService.atsScore] extraction unparseable, retrying once", {
        rawLength: raw.length,
        finishReason: response?.choices[0]?.finish_reason ?? "unknown",
      })
      const retry = await this.aiClient.chat({
        model: AI_MODEL,
        max_tokens: 1600,
        temperature: AI_TEMPERATURE_PRECISE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return ONLY valid, complete JSON matching the requested shape. No markdown." },
          { role: "user", content: prompt },
        ],
      })
      const retryParsed = ATSExtractionSchema.safeParse(
        safeParseAIJson<unknown>(retry.choices[0]?.message?.content ?? ""),
      )
      if (!retryParsed.success) throw new AppError("invalid_response_format", 500)
      extraction = retryParsed.data
    }

    // Off-topic guard: explicit label, or the model extracted nothing usable.
    const nothingExtracted =
      extraction.hardSkills.length === 0 &&
      extraction.softSkills.length === 0 &&
      extraction.mustHaves.length === 0 &&
      !extraction.jobTitle.trim()
    if (extraction.label === "off_topic" || nothingExtracted) {
      throw new AppError("off_topic", 422)
    }

    // Remembered only once it survived the off-topic guard: storing an empty or
    // rejected extraction would pin the failure and every later run would inherit
    // it without ever calling the model again. Skipped when it came from the store
    // — the row is already there, and a duplicate insert per analysis is noise.
    if (!keywordsFromStore && !extractionFromClient) {
      await writeAnswer("job-keywords", keywordsKey, extraction, AI_MODEL, resumeId)
    }

    // Start the senior-recruiter analysis HERE — after the off-topic guard, so a
    // non-job input never triggers it (no wasted call), but before the embedding
    // recall pass + scoring below, so it overlaps that network work instead of
    // adding a serial roundtrip. Fail-closed inside → never rejects; awaited at end.
    const jobContext = useRole ? (roleTitle ?? "").trim() : jobDescriptionTruncated
    // analyzeResume already swallows its own errors (returns null), and the only
    // awaited work before we collect it (the embedding pass) fails closed too — so
    // this promise can never dangle or reject. The .catch is a belt against a future
    // edit adding a throwing call between here and the await.
    const analysisPromise = this.analyzeResume(userId, resumeText, jobContext, plan, en, langInstruction, sectionData ?? {}, resumeId).catch(() => null)

    // ── Deterministic scoring in code ──────────────────────────────────────────
    const cvTitles = buildCVTitles(data)
    const recentTitles = buildRecentTitles(data)
    const sections = buildSectionPresence(data)
    const evidenceText = buildEvidenceText(data)
    const keywords = {
      hardSkills: extraction.hardSkills,
      softSkills: extraction.softSkills,
      jobTitle: extraction.jobTitle,
      mustHaves: extraction.mustHaves,
    }
    // Match against a haystack carrying ALL listed skills, not the 12 the LLM prompt
    // caps — see buildAtsHaystack. resumeText itself keeps feeding the LLM prompt above.
    const atsHaystack = buildAtsHaystack(data, resumeText)

    // ── Soft skills, measured as behaviour instead of as a string ──────────────
    // A posting asks for "comfortable working with ambiguity"; no CV contains that
    // sentence, so string presence held this sub-score at 0% for every user no
    // matter what they wrote — while the panel told them a bullet would count.
    // The bullets are read and judged instead. Fails closed: no evidence found
    // scores exactly as it does today.
    const bulletLines = collectBulletLines(data)
    const softDemonstrated = keywords.softSkills.length > 0 && bulletLines.length > 0
      ? await findDemonstratedSoftSkills(keywords.softSkills, bulletLines, {
          aiClient: this.aiClient,
          onFailure: (err: Error) =>
            this.logger.error("[AIService.atsScore] soft-skill evidence pass failed — soft score is literal-match only", {}, err),
        }, resumeId)
      : new Set<string>()

    const mustMet = metMustHaves(keywords.mustHaves, sectionData ?? {})
    let match = computeATSMatch(keywords, atsHaystack, cvTitles, sections, evidenceText, undefined, recentTitles, softDemonstrated, mustMet)

    // ── Semantic recall pass (embeddings) ──────────────────────────────────────
    // The exact matcher misses a required skill the CV phrases differently
    // ("REST APIs" vs "APIs REST", "leadership" vs "liderazgo"). Embed the still-
    // missing requirements + the candidate's own skill/title terms and re-run the
    // match crediting the ones that are semantically equivalent. ADD-only: it can
    // never lower the exact score, and it fails closed on any embed error.
    // Capped so a CV with hundreds of skills can't blow up the embed batch.
    const cvTerms = [
      ...((data.skills as { name?: string }[] | undefined)?.map((s) => s.name ?? "") ?? []),
      ...((data.workExperience as { jobTitle?: string }[] | undefined)?.map((w) => w.jobTitle ?? "") ?? []),
      (data.personalDetails as { jobTitle?: string } | undefined)?.jobTitle ?? "",
    ].filter(Boolean).slice(0, 60)
    let semanticRecallFailed = false
    let semanticMatched = new Set<string>()
    if (match.missingKeywords.length > 0 && cvTerms.length > 0) {
      const onFailure = (err: Error) => {
        semanticRecallFailed = true
        // Loud on purpose: this silently subtracts points. A user re-running
        // the same CV saw the score fall by tens of points with nothing in
        // the logs to explain it.
        this.logger.error("[AIService.atsScore] semantic recall failed — score is exact-match only", { missing: match.missingKeywords.length }, err)
      }
      // Cosine proposes, the judge disposes. Cosine alone credited "backend" to a
      // CV that only says "frontend" (0.684) while missing "cuentas por cobrar" ↔
      // "accounts receivable" (0.516) — measured, and no threshold separates the
      // two. The pre-filter now only decides what is worth ASKING about; the
      // verdict comes from skill-equivalence.ts and is stored, so the same CV
      // scores the same tomorrow.
      const candidates = await findSemanticCandidates(
        match.missingKeywords,
        cvTerms,
        (texts) => this.aiClient.embed(texts),
        undefined,
        onFailure,
      )
      if (candidates.length > 0) {
        const semanticMatches = await confirmEquivalences(candidates, {
          aiClient: this.aiClient,
          onFailure,
        })
        if (semanticMatches.size > 0) {
          semanticMatched = semanticMatches
          match = computeATSMatch(keywords, atsHaystack, cvTitles, sections, evidenceText, semanticMatches, recentTitles, softDemonstrated, mustMet)
        }
      }
    }

    // Template parseability. A multi-column / sidebar layout can be reordered by
    // strict ATS parsers, so it must not score identically to a clean single-column
    // one. "caution" takes a modest, honest ding; "safe" is neutral (no inflation).
    const templateSafety = getTemplateAtsSafety(templateId)
    const formatScore = templateFormatScore(templateSafety)
    const finalScore = applyTemplatePenalty(match.score, templateSafety)

    const label = localizedLabel(scoreLabel(finalScore), en)
    const summary = extraction.summary.trim() || defaultSummary(finalScore, en)

    // Typos that break exact ATS matching, checked against the requirement set.
    const typoWarnings = findNearMisses([...keywords.hardSkills, ...keywords.mustHaves], atsHaystack)

    // Collect the recruiter analysis started in parallel above (null on failure).
    const analysis = await analysisPromise
    // ENFORCE (not just prompt) the no-redundancy rule — but ONLY against the
    // specific keywords/typos the deterministic layer already shows. A fix is dropped
    // only when it NAMES one of those exact terms AND is an add/missing/spelling note
    // about it. Everything else survives — critically, a PROSE spelling fix like
    // "'more then' → 'more than'" (which is not a job keyword, so the typo detector
    // never sees it) stays, and so does a generic structural fix ("add a summary").
    if (analysis) {
      const dupContext = /\b(add|include|missing|list|falta|falt[ae]n|a[ñn]ad[ae]|incluye|agrega|typos?|misspell\w*|spelling|ortograf)\b/i
      const dupTerms = [
        ...typoWarnings.flatMap((w) => [w.typed.toLowerCase(), w.keyword.toLowerCase()]),
        ...match.missingKeywords.map((k) => k.toLowerCase()),
      ].filter((t) => t.length > 2)
      analysis.criticalFixes = analysis.criticalFixes.filter((f) => {
        const text = `${f.issue} ${f.fix}`.toLowerCase()
        const namesDupTerm = dupTerms.some((t) => text.includes(t))
        return !(namesDupTerm && dupContext.test(text))
      })
    }

    // Nothing was spent: give the slot back before returning. Best-effort — a
    // failed refund costs one slot, never the response.
    if (!this.spentAModelCall) {
      await refundDailyQuota(userId, "ats-score", plan).catch(() => {})
    }
    return {
      score: finalScore,
      label,
      summary,
      // Strengths / gaps are derived from the deterministic match so they can
      // never contradict the score. A strength is a skill the CV DEMONSTRATES:
      // one that only appears in a list is a claim, and listing it does not make
      // it a strength — that is what let a bare keyword dump look strong.
      strengths: match.demonstratedKeywords,
      // A years-of-experience requirement the CV already clears is not a gap.
      // The matcher can only look for the requirement's words, and no CV writes
      // "5+ years of experience as an iOS developer" — so a 7-year candidate was
      // told 5 years was missing.
      gaps: dropSatisfiedYearRequirements(match.missingMustHaves, sectionData ?? {}),
      matchedKeywords: match.matchedKeywords,
      missingKeywords: match.missingKeywords,
      listedOnlyKeywords: match.listedOnlyKeywords,
      missingSoftSkills: match.missingSoftSkills,
      semanticRecallFailed,
      // Published so the instant re-score credits the same synonym matches.
      semanticMatches: [...semanticMatched],
      // The cost of the layout, in the same units as the score the user is reading.
      templatePenaltyPoints: match.score - finalScore,
      // Published for the same reason the synonym set is: the live re-score has no
      // model call, so without carrying this the soft lever would collapse back to
      // 0% the moment the user typed a character.
      demonstratedSoftSkills: [...softDemonstrated],
      // Always empty: the findings live in ONE list now (the recruiter analysis).
      // Kept on the result shape so a tab left open across the deploy does not
      // crash on a missing field.
      suggestions: [],
      subScores: { ...match.subScores, format: formatScore },
      templateSafety,
      extractedKeywords: {
        hardSkills: extraction.hardSkills,
        softSkills: extraction.softSkills,
        summary: extraction.summary,
        jobTitle: extraction.jobTitle,
        mustHaves: extraction.mustHaves,
      },
      contentQuality: assessResumeContent(data),
      gapPlan: buildGapPlan(match.gapLevers, match.score, finalScore, templateSafety),
      scoreBreakdown: match.breakdown,
      typoWarnings,
      analysis,
      // Says out loud that a part of the report is missing. Before, a failed
      // recruiter pass just left the section absent and the user read a shorter
      // report as if it were the whole one — a silent downgrade of the product
      // they paid for. Everything else in the response is deterministic, so the
      // rest of the report is still valid; only this piece is gone.
      analysisUnavailable: !analysis,
      writingChecks: analyzeWriting(data),
      inferredFromRole: useRole,
    }
  }

  /**
   * Deterministic re-score — NO LLM call, NO quota. Reuses the JD keywords a prior
   * ats-score already extracted, and re-runs the same in-code match against the
   * (now edited) CV so the user sees the score move the instant they apply a fix.
   * Same computeATSMatch + template factor as atsScore → identical scoring, zero drift.
   */
  atsRescore(input: ATSRescoreInput): ATSScoreResult {
    const { keywords, sectionData, language: rawLanguage, templateId } = input
    const { language } = resolveLanguage(rawLanguage)
    const en = language === "en"
    const data = sectionData ?? {}

    const resumeText = buildResumeContext(data, language).slice(0, AI_INPUT_LIMITS.resumeContext)
    if (!resumeText.trim()) throw new AppError("not_enough_resume_data", 400)

    const cvTitles = buildCVTitles(data)
    const sections = buildSectionPresence(data)
    const evidenceText = buildEvidenceText(data)
    // Recency weight here too, so the instant re-score stays identical to atsScore.
    // Same full-skills haystack as atsScore so a skill past the 12th is not falsely "missing".
    const atsHaystack = buildAtsHaystack(data, resumeText)
    // The synonym matches the full analysis found, carried in. Passing `undefined`
    // here scored exact-match-only while the analysis had scored WITH synonyms,
    // so the number fell off a cliff the moment the user edited anything —
    // reported as "same CV, 70 became 33". Re-embedding per keystroke is not an
    // option; reusing the set is exact and free.
    const carried = input.semanticMatches?.length ? new Set(input.semanticMatches) : undefined
    // Same carry for the soft-skill evidence: judging bullets needs a model call,
    // which cannot run per keystroke. The analysis published what it found.
    const carriedSoft = input.demonstratedSoftSkills?.length ? new Set(input.demonstratedSoftSkills) : undefined
    const match = computeATSMatch(keywords, atsHaystack, cvTitles, sections, evidenceText, carried, buildRecentTitles(data), carriedSoft, metMustHaves(keywords.mustHaves, data))

    const templateSafety = getTemplateAtsSafety(templateId)
    const formatScore = templateFormatScore(templateSafety)
    const finalScore = applyTemplatePenalty(match.score, templateSafety)

    return {
      score: finalScore,
      label: localizedLabel(scoreLabel(finalScore), en),
      summary: defaultSummary(finalScore, en),
      strengths: match.demonstratedKeywords,
      // A years-of-experience requirement the CV already clears is not a gap.
      // The matcher can only look for the requirement's words, and no CV writes
      // "5+ years of experience as an iOS developer" — so a 7-year candidate was
      // told 5 years was missing.
      gaps: dropSatisfiedYearRequirements(match.missingMustHaves, sectionData ?? {}),
      matchedKeywords: match.matchedKeywords,
      missingKeywords: match.missingKeywords,
      listedOnlyKeywords: match.listedOnlyKeywords,
      missingSoftSkills: match.missingSoftSkills,
      // Carried through so successive re-scores keep crediting the same set.
      semanticMatches: input.semanticMatches ?? [],
      demonstratedSoftSkills: input.demonstratedSoftSkills ?? [],
      templatePenaltyPoints: match.score - finalScore,
      suggestions: [],
      subScores: { ...match.subScores, format: formatScore },
      templateSafety,
      extractedKeywords: keywords,
      contentQuality: assessResumeContent(data),
      gapPlan: buildGapPlan(match.gapLevers, match.score, finalScore, templateSafety),
      scoreBreakdown: match.breakdown,
      typoWarnings: findNearMisses([...keywords.hardSkills, ...keywords.mustHaves], atsHaystack),
      // Live re-score is deterministic/no-LLM — the critique from the last full
      // analyze still stands; the client preserves it (never overwrites with null).
      analysis: null,
      writingChecks: analyzeWriting(data),
    }
  }

  async reviewCV(userId: string, input: ReviewCVInput, plan: string): Promise<ReviewCVResult> {
    await enforceAIQuota(userId, "review-cv", plan)

    const { sectionData, question, language: rawLanguage } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    // Deterministic resume score — computed in code, independent of the LLM and of
    // any job description. Attached to every return path below.
    const resumeScore = computeResumeScore(sectionData)

    const resumeContext = buildResumeContext(sectionData, language)
    if (!resumeContext.trim()) throw new AppError("not_enough_data", 400)
    const resumeCtxValidation = validateAIInput(resumeContext, AI_INPUT_LIMITS.resumeContext)
    if (!resumeCtxValidation.valid) throw new AppError("invalid_input", 400)

    if (question) {
      const validation = validateAIInput(String(question), AI_INPUT_LIMITS.question)
      if (!validation.valid) throw new AppError("invalid_input", 400)
    }

    const userQuestion = language === "en"
      ? question?.trim()
        ? `Candidate's specific question: "${question.trim()}"`
        : "The candidate wants a general review of their resume."
      : question?.trim()
        ? `Pregunta específica del candidato: "${question.trim()}"`
        : "El candidato quiere una revisión general de su CV."

    const prompt = language === "en"
      ? `TASK: Analyze this resume and provide a detailed professional review.

=== CANDIDATE RESUME ===
${resumeContext}

=== REQUEST ===
${userQuestion}

INSTRUCTIONS:
1. Analyze the full resume: clarity, impact, structure, ATS keywords, coherence, completeness.
2. Answer the question directly if it is specific.
3. Be concrete — mention real sections or data from the resume.
4. Tone: professional consultant, direct and constructive.
5. SPELLING & GRAMMAR: proof-read every field. When you find a typo, misspelling or grammar error (e.g. "Objetive-C" → "Objective-C", "React Navite" → "React Native", "Web Debeloper" → "Web Developer", "more then" → "more than"), add an IMPROVEMENT whose "suggestion" corrects ONLY the error in the affected field. Rules: fix the typo, keep everything else byte-for-byte; NEVER "correct" a real technology/brand/proper name or change meaning; the preview is the full corrected field value. Correcting a typo is NOT inventing content — it is allowed and expected.
6. REVIEW WITH A SENIOR RECRUITER'S LENS. A recruiter spends 6-11 seconds on the first pass, 80% of it on the TOP of the resume. Apply these priorities, in order:
   a. TOP-THIRD FIRST: the current job title and the professional summary carry the most weight — a missing/weak current title or a vague summary is the #1 reason to reject on the first scan. Flag these before anything lower on the page.
   b. SENIORITY SIGNALS: reward scope and ownership — team size led, budget owned, cross-functional leadership, systems designed. If the target is a senior/lead role and the bullets read as individual-contributor tasks, say so.
   c. RED FLAGS a recruiter reacts to: unexplained employment gaps, a current title that does not match the target role, achievements with zero quantification, duty-listing ("responsible for…") instead of results, and inconsistent dates. Name the specific ones you see.
   d. RELEVANCE OVER COMPLETENESS: a shorter, sharper resume beats a long one padded with weak bullets — recommend cutting or tightening, not just adding.
   Keep every point grounded in this specific resume; do not give generic career advice.

For IMPROVEMENTS only: evaluate if there is a concrete fix the AI can generate. If so, include the "suggestion" field with:
- field: ONE of these exact values: "summary" | "personalDetails.jobTitle" | "skills" | "workExperience.description" | "workExperience.jobTitle" | "languages" | "certifications"
- type: "replace" (replace current content) or "append" (add to current content)
- preview: the IMPROVED, ENRICHED text — more specific, more impactful than the original. NEVER shorten or genericize existing content. NO markdown, NO asterisks, NO HTML. Max 1200 characters. It must read as human-written: natural voice (not a press release), and none of the AI-tell words ("Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy").
- reason: max 12 words explaining the change
- targetId: REQUIRED whenever field starts with "workExperience." — use the item's exact id (shown as ID:xxx in the resume above). Without it the suggestion is discarded, because we would not know which job to apply it to.

preview FORMAT FOR "workExperience.description" (critical):
The description is a LIST OF BULLETS, one per line. Your preview MUST stay a list of bullets:
- One bullet per line, separated by real newlines (\\n). NEVER merge the bullets into a paragraph.
- Return the SAME number of bullets the original has, in the same order. If the original has 4 bullets, your preview has 4 lines.
- Prefix each line with "• ".
- FORBIDDEN to drop a metric, figure, technology or concrete detail already in the original. Rewriting is NOT summarizing: if the original says "cut crashes by 20%", your version still says 20%.

For STRENGTHS: do NOT include suggestion. Strengths confirm what is already working well — never suggest replacing or rewriting them.

CRITICAL RULES FOR SUGGESTIONS (mandatory, no exceptions):
1. ONLY include "suggestion" if you can rewrite using ONLY information already present in the resume context above. Otherwise OMIT the "suggestion" field entirely.
2. DO NOT invent: technologies, frameworks, libraries, tools, company names, job titles, certifications, percentages, numbers, dates, or any metric not explicitly stated in the input.
3. DO NOT add bullets with new content. Only rewrite existing text to be clearer or more impactful.
4. If the improvement requires data the user did not provide, OMIT "suggestion" and use ONLY "text" to describe what the user should add manually (e.g., "Add measurable metrics to your achievements" — NOT "Achieved 80% reduction in load time").
5. NEVER use placeholders like [X%], [N users], <number>, or similar in the preview field. The preview must be production-ready text.
6. If in doubt, OMIT "suggestion". A descriptive "text"-only advice is always preferable to an invented preview.
7. For an ADVICE-ONLY improvement (no "suggestion"), STILL add a "location" object with the section it refers to, so the user knows WHERE to apply it: { "field": <one of the field values above>, "targetId": "<ID:xxx if the field starts with workExperience.>" }. e.g. advice about a skills typo → "location": { "field": "skills" }.

Respond ONLY with valid JSON (no markdown):
{
  "summary": "<general diagnosis in 2-3 sentences>",
  "strengths": [
    { "text": "<strength — no suggestion>" }
  ],
  "improvements": [
    { "text": "<improvement>", "suggestion": { "field": "workExperience.description", "type": "replace", "preview": "• <rewritten bullet 1>\\n• <rewritten bullet 2>", "reason": "<max 12 words>", "targetId": "<the job's ID:xxx>" } },
    { "text": "<improvement>", "suggestion": { "field": "summary", "type": "replace", "preview": "<enriched text>", "reason": "<max 12 words>" } },
    { "text": "<improvement without automatable action>", "location": { "field": "skills" } }
  ],
  "answer": "<direct answer to candidate's question, or empty string if general review>"
}`
      : `TAREA: Analiza el siguiente CV y proporciona una revisión profesional detallada.

=== CV DEL CANDIDATO ===
${resumeContext}

=== SOLICITUD ===
${userQuestion}

INSTRUCCIONES:
1. Analiza el CV completo: claridad, impacto, estructura, keywords ATS, coherencia, completitud.
2. Responde directamente a la pregunta si es específica.
3. Sé concreto — menciona secciones o datos reales del CV.
4. Tono: consultor profesional, directo y constructivo.
5. ORTOGRAFÍA Y GRAMÁTICA: revisa cada campo. Cuando encuentres una falta, error tipográfico o gramatical (ej.: "Objetive-C" → "Objective-C", "React Navite" → "React Native", "Analystical" → "Analytical", "Debeloper" → "Developer"), agrega una MEJORA cuyo "suggestion" corrija SOLO el error en el campo afectado. Reglas: corrige la falta, deja todo lo demás idéntico; NUNCA "corrijas" una tecnología/marca/nombre propio real ni cambies el significado; el preview es el valor completo corregido del campo. Corregir una falta NO es inventar contenido — está permitido y es esperado.
6. REVISA CON LA MIRADA DE UN RECLUTADOR SENIOR. Un reclutador dedica 6-11 segundos al primer vistazo, 80% al TERCIO SUPERIOR del CV. Aplica estas prioridades, en orden:
   a. TERCIO SUPERIOR PRIMERO: el puesto actual y el resumen profesional pesan más — un título actual débil/ausente o un resumen vago es la razón #1 de rechazo en el primer escaneo. Señálalos antes que nada de más abajo.
   b. SEÑALES DE SENIORITY: premia alcance y ownership — tamaño de equipo liderado, presupuesto gestionado, liderazgo cross-funcional, sistemas diseñados. Si el objetivo es un rol senior/lead y los bullets se leen como tareas de colaborador individual, dilo.
   c. RED FLAGS que un reclutador nota: gaps de empleo sin explicar, título actual que no coincide con el rol objetivo, logros sin ninguna cuantificación, listar funciones ("responsable de…") en vez de resultados, y fechas inconsistentes. Nombra las específicas que veas.
   d. RELEVANCIA SOBRE COMPLETITUD: un CV más corto y afilado gana a uno largo relleno de bullets débiles — recomienda recortar o apretar, no solo añadir.
   Mantén cada punto anclado a ESTE CV específico; no des consejos genéricos de carrera.

Solo para IMPROVEMENTS: evalúa si hay una corrección o mejora concreta que la IA pueda generar. Si la hay, incluye el campo "suggestion" con:
- field: UNO de estos valores exactos: "summary" | "personalDetails.jobTitle" | "skills" | "workExperience.description" | "workExperience.jobTitle" | "languages" | "certifications"
- type: "replace" (reemplazar el contenido actual) o "append" (agregar al contenido actual)
- preview: el texto MEJORADO y ENRIQUECIDO — más específico, más impactante que el original. NUNCA acortes ni hagas más genérico el contenido existente. SIN markdown, SIN asteriscos, SIN HTML. Máximo 1200 caracteres. Debe sonar escrito por una persona: voz natural (no nota de prensa), sin palabras-IA ("Orquestó", "Apalancó", "Utilizó", "sinergia").
- reason: máximo 12 palabras explicando el cambio
- targetId: OBLIGATORIO cuando field empieza por "workExperience." — usa el id exacto del item (lo ves como ID:xxx en el CV de arriba). Sin él la sugerencia se descarta, porque no sabríamos a qué trabajo aplicarla.

FORMATO DE preview PARA "workExperience.description" (crítico):
La descripción es una LISTA DE BULLETS, un bullet por línea. Tu preview DEBE seguir siendo una lista de bullets:
- Un bullet por línea, separados por saltos de línea reales (\\n). NUNCA fusiones los bullets en un párrafo.
- Devuelve el MISMO número de bullets que tiene el original, en el mismo orden. Si el original tiene 4 bullets, tu preview tiene 4 líneas.
- Prefija cada línea con "• ".
- PROHIBIDO eliminar una métrica, cifra, tecnología o dato concreto que ya esté en el original. Reescribir NO es resumir: si el original dice "reduje los crashes un 20%", tu versión sigue diciendo el 20%.

Para STRENGTHS: NO incluyas suggestion. Las fortalezas confirman lo que ya funciona bien — nunca sugieras reemplazar ni reescribir el contenido existente.

REGLAS CRÍTICAS PARA SUGGESTIONS (obligatorias, sin excepciones):
1. SOLO incluye "suggestion" si puedes reescribir usando ÚNICAMENTE información ya presente en el contexto del CV de arriba. Si no, OMITE el campo "suggestion" por completo.
2. NO inventes: tecnologías, frameworks, librerías, herramientas, nombres de empresas, cargos, certificaciones, porcentajes, números, fechas, ni ninguna métrica que no esté explícitamente declarada en el input.
3. NO añadas bullets con contenido nuevo. Solo reescribe texto existente para que sea más claro o impactante.
4. Si la mejora requiere datos que el usuario no proporcionó, OMITE "suggestion" y usa SOLO "text" para describir qué debe añadir manualmente (ej.: "Añade métricas medibles a tus logros" — NO "Logré reducir el tiempo de carga en un 80%").
5. NUNCA uses placeholders como [X%], [N usuarios], <número>, ni similares en el campo preview. El preview debe ser texto listo para producción.
6. Ante la duda, OMITE "suggestion". Un consejo descriptivo en "text" sin preview es siempre preferible a un preview inventado.
7. Para una mejora SOLO-CONSEJO (sin "suggestion"), IGUAL agrega un objeto "location" con la sección a la que se refiere, para que el usuario sepa DÓNDE aplicarla: { "field": <uno de los valores de field de arriba>, "targetId": "<ID:xxx si el field empieza por workExperience.>" }. ej.: consejo sobre un typo en skills → "location": { "field": "skills" }.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{
  "summary": "<diagnóstico general en 2-3 oraciones>",
  "strengths": [
    { "text": "<fortaleza — sin suggestion>" }
  ],
  "improvements": [
    { "text": "<mejora>", "suggestion": { "field": "workExperience.description", "type": "replace", "preview": "• <bullet 1 reescrito>\\n• <bullet 2 reescrito>", "reason": "<max 12 palabras>", "targetId": "<el ID:xxx del trabajo>" } },
    { "text": "<mejora>", "suggestion": { "field": "summary", "type": "replace", "preview": "<texto enriquecido>", "reason": "<max 12 palabras>" } },
    { "text": "<mejora sin acción automatizable>", "location": { "field": "skills" } }
  ],
  "answer": "<respuesta directa a la pregunta del candidato, o cadena vacía si fue revisión general>"
}`

    const response = await this.aiClient.chat({
      // Same reasoning as analyzeResume: this one writes the rewrite the user
      // applies to their CV, so it belongs on the prose model, not the extractor.
      model: AI_MODEL_PROSE,
      // Raised from 900: the review now also proof-reads for spelling/grammar and
      // returns per-error corrections, so the JSON is larger. Sized to the worst
      // case (5 strengths + 5 improvements, each with a full-field preview).
      max_tokens: 1300,
      // review-cv usa temperatura baja (0.3) para reducir alucinaciones en suggestions.preview.
      // No afecta a otros endpoints — cada módulo elige la suya.
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un Consultor de Carrera de Élite especializado en revisión y optimización de CVs. " +
            "SOLO respondes sobre el CV del candidato, perfil profesional, experiencia laboral o búsqueda de empleo. " +
            "Si la pregunta no tiene relación, responde únicamente con: " +
            "{\"summary\": \"\", \"strengths\": [], \"improvements\": [], \"answer\": \"off_topic\"} sin texto adicional. " +
            langInstruction,
        },
        { role: "user", content: prompt },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? ""
    const parsed = parseAIJson<ReviewResult & { answer: string }>(raw)

    if (parsed.answer === "off_topic") {
      throw new AppError("off_topic", 422)
    }

    // Strips markdown emphasis but NOT "•" or newlines: those carry the bullet
    // structure, and flattening them is how a multi-bullet description used to
    // come back as one paragraph.
    const sanitizePreview = (text: string) =>
      text.replace(/[_`#>]/g, "").replace(/^\s*\*\s+/gm, "• ").replace(/\n{3,}/g, "\n\n").trim()

    const sanitizeItem = (item: z.infer<typeof ReviewItemSchema>) => {
      item = { ...item, text: stripJobMarkers(item.text) }
      if (!item.suggestion) return { ...item, suggestion: undefined }
      const cleanedPreview = sanitizePreview(item.suggestion.preview)
      const { field, targetId } = item.suggestion
      // When a suggestion is stripped below, the item becomes advice-only — but it
      // still knows WHERE it applied, so preserve that as a location for the UI.
      const loc = item.location ?? { field, targetId }

      // A workExperience suggestion with no targetId cannot be placed. The client
      // used to fall back to item [0], silently overwriting whichever job happened
      // to be first — so drop it and keep the advisory text instead.
      if (field.startsWith("workExperience.") && !targetId) {
        this.logger.warn("[AIService.reviewCV] dropped suggestion with no targetId", { field })
        return { ...item, suggestion: undefined, location: loc }
      }

      // No-op guard: the model sometimes "suggests" replacing a field with text
      // identical to what is already there (e.g. re-running the review on a CV the
      // user already fixed). Exact-equality only — NOT a fuzzy 90% threshold —
      // so a spelling fix, which is nearly identical by design, still survives.
      const currentValue = getCurrentFieldValue(field, targetId, sectionData)
      const normEq = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase()
      if (currentValue && normEq(currentValue) === normEq(cleanedPreview)) {
        return { ...item, suggestion: undefined, location: loc }
      }

      // Cosmetic reword: a near-copy that only swaps synonyms ("improve"→"strengthen",
      // "helped reduce"→"reduced") adds nothing but a diff that reads the same on both
      // sides — the exact-equality guard above misses it because the words differ.
      // isCosmeticReword is built to spare genuine spelling fixes (small in-word edits)
      // and real enrichments (added keyword, nothing removed), so this only drops the
      // no-value rewords the user was complaining about.
      if (currentValue && isCosmeticReword(currentValue, cleanedPreview)) {
        this.logger.warn("[AIService.reviewCV] dropped cosmetic reword suggestion", {
          field,
          previewSample: cleanedPreview.slice(0, 120),
        })
        return { ...item, suggestion: undefined, location: loc }
      }

      // Fail-safe: if preview seems to have invented data not present in the
      // resume context, drop the suggestion and keep only the advisory text.
      if (detectHallucination(cleanedPreview, resumeContext)) {
        this.logger.warn("[AIService.reviewCV] dropped hallucinated suggestion", {
          field,
          previewSample: cleanedPreview.slice(0, 120),
        })
        return { ...item, suggestion: undefined, location: loc }
      }

      // Rewriting is not summarizing: a description preview that comes back with
      // fewer bullets than the original is destroying the user's content.
      if (field === "workExperience.description" && targetId) {
        const job = (sectionData.workExperience as { id?: string; description?: string }[] | undefined)
          ?.find((j) => j.id === targetId)
        if (job) {
          const before = parseBullets(job.description ?? "").length
          const after = parseBullets(cleanedPreview).length
          if (before > 1 && after < before) {
            this.logger.warn("[AIService.reviewCV] dropped suggestion that collapses bullets", {
              targetId, before, after,
            })
            return { ...item, suggestion: undefined, location: loc }
          }
        }
      }

      return {
        ...item,
        suggestion: { ...item.suggestion, preview: cleanedPreview },
      }
    }

    const reviewUsage = response.usage
    const reviewLogOpts = {
      model: AI_MODEL_PROSE,
      plan,
      promptTokens: reviewUsage?.prompt_tokens ?? 0,
      completionTokens: reviewUsage?.completion_tokens ?? 0,
      costUsd: computeCostUsd(AI_MODEL_PROSE, reviewUsage?.prompt_tokens ?? 0, reviewUsage?.completion_tokens ?? 0),
    }

    const validated = ReviewResponseSchema.safeParse(parsed)
    if (!validated.success) {
      this.logger.warn("[AIService.reviewCV] Zod validation failed, returning without suggestions", { error: validated.error.flatten() })
      logAIUsage(userId, "review-cv", reviewLogOpts)
      return {
        summary: parsed.summary ?? "",
        strengths: (parsed.strengths ?? []).slice(0, 5).map((s: unknown) =>
          typeof s === "string" ? { text: s } : { text: (s as { text?: string }).text ?? "" }
        ),
        improvements: (parsed.improvements ?? []).slice(0, 5).map((s: unknown) =>
          typeof s === "string" ? { text: s } : { text: (s as { text?: string }).text ?? "" }
        ),
        answer: parsed.answer ?? "",
        resumeScore,
      }
    }

    logAIUsage(userId, "review-cv", reviewLogOpts)
    return {
      summary: validated.data.summary,
      strengths: validated.data.strengths.map(sanitizeItem),
      improvements: validated.data.improvements.map(sanitizeItem),
      answer: validated.data.answer,
      resumeScore,
    }
  }
}

// ── ats-score helpers (module-level, pure) ────────────────────────────────────

/** Target role + past job titles, joined — feeds the title-match sub-score. */
/**
 * The work-experience text alone — job titles, employers and bullets. This is
 * the evidence half of the CV: a keyword here is demonstrated, the same keyword
 * only in the Skills list is a claim.
 */
function buildEvidenceText(data: Record<string, unknown>): string {
  const work = (data.workExperience as Array<{
    jobTitle?: string; employer?: string; description?: string
  }> | undefined) ?? []
  return work
    .map((w) => [w?.jobTitle, w?.employer, w?.description].filter(Boolean).join(" "))
    .join("\n")
}

/**
 * The work-history bullets as separate lines — the evidence a soft-skill judgement
 * is made from.
 *
 * Separate from buildEvidenceText on purpose: that one joins everything into one
 * haystack for string matching, and a judgement needs to point at WHICH bullet
 * shows the behaviour. Titles and employers are excluded deliberately — "Senior
 * Engineer at Xiobit" is not evidence of collaboration, and letting a title count
 * is how a soft-skill score turns into a participation trophy.
 */
function collectBulletLines(data: Record<string, unknown>): string[] {
  const work = (data.workExperience as Array<{ description?: string }> | undefined) ?? []
  return work
    .flatMap((w) => (w?.description ?? "").split(/\r?\n/))
    .map((line) => line.replace(/^\s*[•·▪‣*\-–—]\s*/, "").trim())
    .filter((line) => line.length > 10)
}

function buildCVTitles(data: Record<string, unknown>): string {
  const pd = data.personalDetails as { jobTitle?: string } | undefined
  const work = (data.workExperience as Array<{ jobTitle?: string }> | undefined) ?? []
  return [pd?.jobTitle, ...work.map((w) => w?.jobTitle)].filter(Boolean).join(" ")
}

/**
 * The presence haystack for the exact keyword matcher.
 *
 * buildResumeContext truncates EVERY section to fit the LLM's token budget — ten
 * roles, forty skills, six certifications, six projects, six education entries —
 * and that same truncated string was being reused to answer a completely different
 * question: does the candidate have this keyword? Anything past a cap was invisible
 * to termPresent and got reported as MISSING although the user had already written
 * it. That bug was found and fixed once, for skills alone ("tenía skills ya
 * aplicadas y igual me lo sugirió"), and the fix was never generalised — so the
 * same defect stayed alive in every other section.
 *
 * It bites hardest where it hurts most: a nurse, an accountant, an electrician —
 * professions where the CERTIFICATION is the credential — with more than six of
 * them would be told the seventh was missing.
 *
 * The full lists are appended here and nowhere else: this string feeds
 * computeATSMatch only, never a prompt, so completeness costs nothing. The prompt
 * keeps its caps, which is what they were for.
 */
function buildAtsHaystack(data: Record<string, unknown>, resumeText: string): string {
  const parts: string[] = [resumeText]

  const push = (label: string, values: string[]) => {
    const clean = [...new Set(values.map((v) => v.trim()).filter(Boolean))]
    if (clean.length > 0) parts.push(`${label}: ${clean.join(", ")}`)
  }

  push("Skills", ((data.skills as Array<{ name?: string }> | undefined) ?? []).map((s) => s?.name ?? ""))
  push(
    "Certifications",
    ((data.certifications as Array<{ name?: string; issuer?: string }> | undefined) ?? []).flatMap((c) => [
      c?.name ?? "",
      c?.issuer ?? "",
    ]),
  )
  push(
    "Projects",
    ((data.projects as Array<{ name?: string; description?: string }> | undefined) ?? []).flatMap((p) => [
      p?.name ?? "",
      p?.description ?? "",
    ]),
  )
  push(
    "Education",
    ((data.education as Array<{ degree?: string; fieldOfStudy?: string; school?: string }> | undefined) ?? []).flatMap(
      (e) => [e?.degree ?? "", e?.fieldOfStudy ?? "", e?.school ?? ""],
    ),
  )
  push("Languages", ((data.languages as Array<{ name?: string }> | undefined) ?? []).map((l) => l?.name ?? ""))
  // Roles past the prompt's tenth are still the candidate's experience.
  push(
    "Experience",
    ((data.workExperience as Array<{ jobTitle?: string; employer?: string; description?: string }> | undefined) ?? []).flatMap(
      (w) => [w?.jobTitle ?? "", w?.employer ?? "", w?.description ?? ""],
    ),
  )

  return parts.join("\n")
}

/** Current value of a suggestion's target field, so a no-op "improvement"
 *  (preview identical to what's already there) can be dropped. */
function getCurrentFieldValue(field: string, targetId: string | undefined, data: Record<string, unknown>): string {
  const findItem = <T extends { id?: string }>(arr: unknown): T | undefined => {
    const items = (arr ?? []) as T[]
    return targetId ? items.find((i) => i.id === targetId) : items[0]
  }
  switch (field) {
    case "summary":
      return typeof data.summary === "string" ? data.summary : ""
    case "personalDetails.jobTitle":
      return (data.personalDetails as { jobTitle?: string } | undefined)?.jobTitle ?? ""
    case "skills":
      return ((data.skills ?? []) as { name?: string }[]).map((s) => s.name ?? "").join(", ")
    case "workExperience.description":
      return findItem<{ id?: string; description?: string }>(data.workExperience)?.description ?? ""
    case "workExperience.jobTitle":
      return findItem<{ id?: string; jobTitle?: string }>(data.workExperience)?.jobTitle ?? ""
    case "languages":
      return ((data.languages ?? []) as { name?: string }[]).map((l) => l.name ?? "").join(", ")
    case "certifications":
      return ((data.certifications ?? []) as { name?: string }[]).map((c) => c.name ?? "").join(", ")
    default:
      return ""
  }
}

/** The candidate's CURRENT/target titles: their target role + most recent job
 *  title (by latest year). Feeds the title sub-score's recency weight. */
function buildRecentTitles(data: Record<string, unknown>): string {
  const pd = data.personalDetails as { jobTitle?: string } | undefined
  const work = (data.workExperience as Array<{ jobTitle?: string; startDate?: string; endDate?: string }> | undefined) ?? []
  const yearOf = (w: { startDate?: string; endDate?: string }) => {
    const years = `${w.endDate ?? ""} ${w.startDate ?? ""}`.match(/20\d{2}|19\d{2}/g)
    return years ? Math.max(...years.map(Number)) : 0
  }
  const mostRecent = [...work].sort((a, b) => yearOf(b) - yearOf(a))[0]?.jobTitle
  return [pd?.jobTitle, mostRecent].filter(Boolean).join(" ")
}

function buildSectionPresence(data: Record<string, unknown>): SectionPresence {
  const nonEmptyArray = (v: unknown) => Array.isArray(v) && v.length > 0
  return {
    summary: typeof data.summary === "string" && data.summary.trim().length > 0,
    work: nonEmptyArray(data.workExperience),
    skills: nonEmptyArray(data.skills),
    education: nonEmptyArray(data.education),
  }
}

function localizedLabel(bucket: "excellent" | "good" | "fair" | "low", en: boolean): string {
  const map = {
    excellent: en ? "Excellent" : "Excelente",
    good: en ? "Good" : "Bueno",
    fair: en ? "Fair" : "Regular",
    low: en ? "Low" : "Bajo",
  }
  return map[bucket]
}

function defaultSummary(score: number, en: boolean): string {
  if (score >= 80) return en ? "Strong match with the role's requirements." : "Fuerte coincidencia con los requisitos del puesto."
  if (score >= 60) return en ? "Good match — a few targeted additions will strengthen it." : "Buena coincidencia — algunos ajustes puntuales la reforzarán."
  if (score >= 40) return en ? "Partial match — several key requirements are missing." : "Coincidencia parcial — faltan varios requisitos clave."
  return en ? "Low match — the resume is missing most of the role's requirements." : "Baja coincidencia — al CV le faltan la mayoría de los requisitos del puesto."
}
