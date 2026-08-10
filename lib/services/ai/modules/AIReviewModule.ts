// lib/services/ai/modules/AIReviewModule.ts
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
import { enforceAIQuota } from "../shared/quota-enforcer"
import { parseAIJson, safeParseAIJson, resolveLanguage, detectHallucination } from "../shared/ai-helpers"
import { parseBullets } from "../shared/bullets"
import { isCosmeticReword } from "../shared/text-similarity"
import { computeCostUsd } from "../shared/cost-tracker"
import {
  AI_INPUT_LIMITS,
  ATSExtractionSchema,
  CvAnalysisSchema,
  ProofreadSchema,
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
import { findSemanticMatches } from "../shared/semantic-match"
import { getTemplateAtsSafety, templateFormatScore, applyTemplatePenalty } from "@/lib/ats/template-ats-safety"
import { assessResumeContent } from "../shared/bullet-quality"
import { findNearMisses } from "@/lib/ats/near-miss"
import { dropSatisfiedYearRequirements } from "@/lib/ats/experience-years"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { groundFixAction } from "@/lib/ats/fix-actions"

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

export class AIReviewModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

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
  private async analyzeResume(
    userId: string,
    resumeText: string,
    jobContext: string,
    plan: string,
    en: boolean,
    langInstruction: string,
    sectionData: Record<string, unknown> = {},
  ): Promise<CvAnalysis | null> {
    const prompt = en
      ? `You are a senior technical recruiter and ATS specialist. You have screened 10,000+ resumes and know exactly how Workday, Greenhouse, Taleo, iCIMS and Lever parse a PDF and rank a candidate. You are blunt and specific, and you NEVER invent facts — every claim quotes the candidate's real text.

Judge this RESUME for the JOB below the way you would in a 7-second screen, then a deeper read.

=== JOB ===
${jobContext}

=== RESUME ===
${resumeText}

Return JSON with this exact shape:
{
  "verdict": "2 sentences: would this pass your screen for THIS job, and the single biggest risk.",
  "passRisk": "low | medium | high",
  "criticalFixes": [
    { "issue": "<what is wrong — quote the real resume text>",
      "why": "<why it costs the ATS match or the recruiter>",
      "fix": "<the exact change to make>",
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
  · fix_dates — dates are in inconsistent or non-machine-readable formats.
  · remove_duplicates — the same bullet text appears more than once.
  · manual — anything else (missing LinkedIn, an unexplained gap, a claim only the candidate can verify). Use it freely; a wrong action is worse than none.
- Respond ONLY with the JSON, no markdown.`
      : `Eres un reclutador técnico senior y especialista en ATS. Has filtrado más de 10.000 CVs y sabes exactamente cómo Workday, Greenhouse, Taleo, iCIMS y Lever parsean un PDF y rankean a un candidato. Eres directo y específico, y NUNCA inventas datos — cada afirmación cita el texto real del candidato.

Evalúa este CV para el PUESTO de abajo como lo harías en un escaneo de 7 segundos, y luego en una lectura a fondo.

=== PUESTO ===
${jobContext}

=== CV ===
${resumeText}

Devuelve JSON con esta forma exacta:
{
  "verdict": "2 oraciones: pasaría tu filtro para ESTE puesto, y el mayor riesgo.",
  "passRisk": "low | medium | high",
  "criticalFixes": [
    { "issue": "<qué está mal — cita el texto real del CV>",
      "why": "<por qué le cuesta el match ATS o al reclutador>",
      "fix": "<el cambio exacto a hacer>",
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
  · fix_dates — las fechas están en formatos inconsistentes o poco legibles por máquina.
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
      const a = parsed.data
      a.criticalFixes = a.criticalFixes.filter((f) => f.issue.trim()).slice(0, 8)
      // Every button is verified against the real CV before the user can press
      // it. A rewrite_bullet pointing at a job that isn't there, or past the end
      // of its bullets, would silently do nothing or edit the wrong line — so it
      // degrades to advice-only. add_skill without a skill is the same story.
      for (const f of a.criticalFixes) f.action = groundFixAction(f.action, sectionData)
      // Nothing usable → null, so the UI shows no empty analysis.
      if (!a.verdict.trim() && a.criticalFixes.length === 0 && a.strengths.length === 0) return null
      return a
    } catch (err) {
      this.logger.warn("[AIService.atsScore] recruiter analysis failed (non-fatal)", { err: err instanceof Error ? err.message : String(err) })
      return null
    }
  }

  async atsScore(userId: string, input: ATSScoreInput, plan: string): Promise<ATSScoreResult> {
    await enforceAIQuota(userId, "ats-score", plan)

    const { jobDescription, roleTitle, sectionData, language: rawLanguage, templateId } = input
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

    // Start the senior-recruiter analysis HERE — after the off-topic guard, so a
    // non-job input never triggers it (no wasted call), but before the embedding
    // recall pass + scoring below, so it overlaps that network work instead of
    // adding a serial roundtrip. Fail-closed inside → never rejects; awaited at end.
    const jobContext = useRole ? (roleTitle ?? "").trim() : jobDescriptionTruncated
    // analyzeResume already swallows its own errors (returns null), and the only
    // awaited work before we collect it (the embedding pass) fails closed too — so
    // this promise can never dangle or reject. The .catch is a belt against a future
    // edit adding a throwing call between here and the await.
    const analysisPromise = this.analyzeResume(userId, resumeText, jobContext, plan, en, langInstruction, sectionData ?? {}).catch(() => null)

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
    let match = computeATSMatch(keywords, atsHaystack, cvTitles, sections, evidenceText, undefined, recentTitles)

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
      const semanticMatches = await findSemanticMatches(
        match.missingKeywords,
        cvTerms,
        (texts) => this.aiClient.embed(texts),
        undefined,
        (err) => {
          semanticRecallFailed = true
          // Loud on purpose: this silently subtracts points. A user re-running
          // the same CV saw the score fall by tens of points with nothing in
          // the logs to explain it.
          this.logger.error("[AIService.atsScore] semantic recall failed — score is exact-match only", { missing: match.missingKeywords.length }, err)
        },
      )
      if (semanticMatches.size > 0) {
        semanticMatched = semanticMatches
        match = computeATSMatch(keywords, atsHaystack, cvTitles, sections, evidenceText, semanticMatches, recentTitles)
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
    const match = computeATSMatch(keywords, atsHaystack, cvTitles, sections, evidenceText, carried, buildRecentTitles(data))

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
      suggestions: [],
      subScores: { ...match.subScores, format: formatScore },
      templateSafety,
      extractedKeywords: keywords,
      contentQuality: assessResumeContent(data),
      gapPlan: buildGapPlan(match.gapLevers, match.score, finalScore, templateSafety),
      typoWarnings: findNearMisses([...keywords.hardSkills, ...keywords.mustHaves], atsHaystack),
      // Live re-score is deterministic/no-LLM — the critique from the last full
      // analyze still stands; the client preserves it (never overwrites with null).
      analysis: null,
      writingChecks: analyzeWriting(data),
    }
  }

  /**
   * Grammar and wording pass over the CV's prose.
   *
   * A dictionary can only ask "is this a word?". It cannot see "more then 7
   * years": `more` and `then` are both real words, and no amount of curated
   * pairs will cover the ways a sentence can be wrong. Checking the WORDS is
   * not checking the WRITING, so this reads the actual sentences.
   *
   * Every correction is verified against the CV before it is returned: the
   * wrong text must appear verbatim, or it is dropped. A proofreader that
   * "corrects" a line the user never wrote is worse than no proofreader — and
   * a model asked for corrections will always find some.
   */
  async proofread(userId: string, texts: string[], language: "es" | "en", plan: string): Promise<Array<{ wrong: string; correct: string; why: string }>> {
    // Its OWN quota, not review-cv's: the spelling card fires this by itself when
    // the panel opens, so charging it to review-cv silently spent a CV review the
    // user never asked for.
    await enforceAIQuota(userId, "proofread", plan)
    // Kept as separate units: joining them and validating against the join let
    // the model "correct" text that spans two bullets or two fields ("…processes
    // with" + "CocoaPods." → "with CocoaPods."). That text exists in the join and
    // nowhere in the CV, so the button could never apply it.
    const units = texts.map((t) => t.trim()).filter(Boolean)
    const corpus = units.join("\n")
    if (corpus.trim().length < 40) return []
    const en = language === "en"

    const prompt = `${en ? "Proofread this resume text" : "Corrige la redacción de este CV"}:

=== TEXT (each line is a SEPARATE field or bullet — never correct across two lines) ===
${corpus.slice(0, 8000)}
=== END ===

${en ? `Return JSON: {"corrections":[{"wrong":"<exact text copied verbatim from above>","correct":"<the fix>","why":"<max 8 words>"}]}

Rules:
- Report ONLY real errors: grammar, agreement, wrong preposition, wrong verb tense, a wrong word that is still a real word ("more then" → "more than", "advices" → "advice").
- "wrong" MUST be copied character-for-character from the text above, and must be SHORT — the few words that are wrong, never a whole sentence.
- NEVER rewrite for style, tone or impact. If it is grammatically correct, LEAVE IT. A stylistic "improvement" here is a false positive and worse than missing an error.
- "wrong" is at most 4 words. If the fix needs more, the sentence is not broken — skip it.
- "correct" must have the SAME number of words as "wrong". Never add a word, never drop one — fix the words that are there.
- Do NOT change singular/plural or add articles because it "reads better": "with different teams" is correct English.
- Do NOT touch commas. Serial/Oxford commas are house style, not errors.
- Do NOT touch proper nouns, product names, technologies or acronyms.
- Max 12 corrections. If the text is clean, return {"corrections":[]}.` : `Devuelve JSON: {"corrections":[{"wrong":"<texto exacto copiado literal de arriba>","correct":"<la corrección>","why":"<máx 8 palabras>"}]}

Reglas:
- Reporta SOLO errores reales: gramática, concordancia, preposición equivocada, tiempo verbal incorrecto, una palabra equivocada que igual existe ("mas" por "más", "haber" por "a ver").
- "wrong" DEBE estar copiado carácter por carácter del texto de arriba, y debe ser CORTO — las pocas palabras que están mal, nunca una oración entera.
- NUNCA reescribas por estilo, tono o impacto. Si es correcto, DÉJALO. Una "mejora" estilística acá es un falso positivo y es peor que no encontrar el error.
- "wrong" son 4 palabras como máximo. Si la corrección necesita más, la oración no está rota — sáltala.
- "correct" debe tener la MISMA cantidad de palabras que "wrong". Nunca agregues ni quites palabras — corrige las que están.
- NO cambies singular/plural ni agregues artículos porque "suena mejor".
- NO toques las comas. Son estilo, no errores.
- NO toques nombres propios, productos, tecnologías ni siglas.
- Máx 12 correcciones. Si el texto está limpio, devuelve {"corrections":[]}.`}

${en ? "Respond with JSON only." : "Responde solo con el JSON."}`

    try {
      const response = await this.aiClient.chat({
        model: AI_MODEL_PROSE,
        max_tokens: 1200,
        temperature: AI_TEMPERATURE_PRECISE,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: en ? "You are a meticulous proofreader. You only report errors you can point at." : "Eres un corrector meticuloso. Solo reportas errores que puedes señalar." },
          { role: "user", content: prompt },
        ],
      })
      const usage = response.usage
      logAIUsage(userId, "proofread", {
        model: AI_MODEL_PROSE,
        plan,
        promptTokens: usage?.prompt_tokens ?? 0,
        completionTokens: usage?.completion_tokens ?? 0,
        costUsd: computeCostUsd(AI_MODEL_PROSE, usage?.prompt_tokens ?? 0, usage?.completion_tokens ?? 0),
      })
      const parsed = ProofreadSchema.safeParse(safeParseAIJson<unknown>(response.choices[0]?.message?.content ?? ""))
      if (!parsed.success) {
        this.logger.warn("[AIService.proofread] rejected by schema")
        return []
      }
      const seen = new Set<string>()
      return parsed.data.corrections
        .map((c) => ({ wrong: c.wrong.trim(), correct: c.correct.trim(), why: c.why.trim() }))
        // Grounding: the text must actually be in the CV, and the fix must differ.
        .filter((c) => c.wrong && c.correct && c.wrong !== c.correct)
        // A correction may not span a line break: bullets live in one field
        // separated by newlines, and a fix stitching two of them together is not
        // a spelling fix — it is an edit the user never asked for.
        .filter((c) => !/[\n\r]/.test(c.wrong) && !/[\n\r]/.test(c.correct))
        // Must exist verbatim inside ONE field. Checking the concatenation is
        // what let cross-field fragments through.
        .filter((c) => units.some((u) => u.includes(c.wrong)))
        // Whitespace-only differences are not corrections either.
        .filter((c) => c.wrong.replace(/\s+/g, " ").trim() !== c.correct.replace(/\s+/g, " ").trim())
        // A correction FIXES words. It never adds or removes them.
        //
        // This is a proofreader, not an editor: "with" → "with CocoaPods." adds
        // text the user never wrote, and "lunch box" → "launch" deletes half a
        // module name. Both were produced by the model and both change what the
        // CV says. The only allowed change in word count is re-spacing the same
        // letters — "Swift UI" → "SwiftUI", "alot" → "a lot".
        .filter((c) => {
          const squash = (x: string) => x.toLowerCase().replace(/\s+/g, "")
          if (squash(c.wrong) === squash(c.correct)) return true
          return c.wrong.trim().split(/\s+/).length === c.correct.trim().split(/\s+/).length
        })
        // A real grammar fix is a few words: "more then", "would of", "usados",
        // "Swift UI". Anything longer is the model rewriting a sentence that was
        // already correct — measured: at 8 words it "fixed" a valid sentence
        // ("Worked on many projects with different teams." → "with a different
        // team."). Four is the width of the error itself.
        .filter((c) => c.wrong.split(/\s+/).length <= 4)
        // A correction that ends a sentence is aimed at the sentence, not a slip.
        .filter((c) => !/[.!?]$/.test(c.wrong))
        // Comma-only edits are house style, not errors — the model wanted to add
        // a serial comma to "gRPC and Objective-C". Apostrophes are NOT stripped
        // here: "Its" → "It's" changes the word, and that one is a real error.
        .filter((c) => c.wrong.replace(/[,;:]/g, "").trim() !== c.correct.replace(/[,;:]/g, "").trim())
        .filter((c) => (seen.has(c.wrong.toLowerCase()) ? false : (seen.add(c.wrong.toLowerCase()), true)))
        .slice(0, 12)
    } catch (err) {
      this.logger.warn("[AIService.proofread] failed (non-fatal)", { err: err instanceof Error ? err.message : String(err) })
      return []
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

function buildCVTitles(data: Record<string, unknown>): string {
  const pd = data.personalDetails as { jobTitle?: string } | undefined
  const work = (data.workExperience as Array<{ jobTitle?: string }> | undefined) ?? []
  return [pd?.jobTitle, ...work.map((w) => w?.jobTitle)].filter(Boolean).join(" ")
}

/**
 * The presence haystack for the exact keyword matcher. buildResumeContext caps the
 * Skills list at 12 (a token budget for the LLM prompt), but the matcher must see
 * EVERY listed skill — otherwise a skill past the 12th is invisible to termPresent
 * and gets reported as "missing" though the user already has it (the reported bug:
 * "tenía skills ya aplicadas y igual me lo sugirió"). Appending the full, deduped
 * skill list is free here: this string feeds computeATSMatch only, never the LLM.
 */
function buildAtsHaystack(data: Record<string, unknown>, resumeText: string): string {
  const names = ((data.skills as Array<{ name?: string }> | undefined) ?? [])
    .map((s) => (s?.name ?? "").trim())
    .filter(Boolean)
  if (names.length === 0) return resumeText
  return `${resumeText}\nSkills: ${[...new Set(names)].join(", ")}`
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
