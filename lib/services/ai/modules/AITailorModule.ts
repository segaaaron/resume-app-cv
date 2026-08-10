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
import { parseAIJson, resolveLanguage, detectHallucination } from "../shared/ai-helpers"
import { isTrivialEdit, isCosmeticReword, dropsContentWithoutGain } from "../shared/text-similarity"
import { assessDescription, isDescriptionOptimized } from "../shared/bullet-quality"
import { hasCliche } from "../shared/cliches"
import { computeCostUsd } from "../shared/cost-tracker"
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
     * Nothing left to tailor → say so instead of calling the model.
     *
     * Same stopping problem as the other improve surfaces, with one difference:
     * tailoring is about a POSTING, so "the CV is well written" is not enough —
     * what matters is whether this CV still misses anything the posting asks
     * for. Two conditions, both already computed elsewhere:
     *
     *   · the ATS score found no missing keyword for this posting, AND
     *   · no bullet carries a defect a rewrite could fix
     *
     * Without this, applying a tailor result changed the CV, which invalidated
     * the client's "same input" guard, so the next run re-tailored our own
     * output — and a model always finds another phrasing.
     */
    // `undefined` means the caller did not run the ATS pass — that is "unknown",
    // NOT "nothing is missing". Only an actual empty array is evidence that this
    // CV already covers the posting.
    const nothingMissing = Array.isArray(atsMissingKeywords) && atsMissingKeywords.length === 0
    const jobs = (sectionData?.workExperience ?? []) as Array<{ description?: string }>
    const everyBulletClean = jobs.every((j) => !j.description?.trim() || isDescriptionOptimized(j.description))
    if (nothingMissing && everyBulletClean && jobs.length > 0) {
      return { summary: null, experiences: [], missingSkills: [], softSkillSuggestions: [] }
    }

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
      ? `CRITICAL ANTI-HALLUCINATION RULES (mandatory, no exceptions):
1. ONLY rewrite using information present in the CANDIDATE CV below. Do NOT introduce technologies, frameworks, libraries, company names, job titles, certifications, percentages, real numbers, or dates not present in the CV.
2. Bullet rewrites must apply the CAR method using ONLY results explicitly stated in the source. NEVER write a placeholder — no [X%], [N users], or anything in brackets standing in for a figure. What you return goes straight into the candidate's CV, and a bracket left in it gets the CV rejected. A bullet that would need a figure the CV lacks must be OMITTED from changedBullets.
3. missingSkills must list skills required by the JOB DESCRIPTION; do not invent skill names.
4. If you cannot improve a bullet without inventing content, OMIT it from changedBullets — never fabricate to fill space.

You are an expert resume strategist. Tailor the candidate's CV to this specific job description.

JOB DESCRIPTION:
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
- changedBullets: ONLY include bullets that need improvement. If a bullet already has a strong action verb and is relevant to this job → OMIT it. An empty array means every bullet is already good, which is a correct and expected answer — never pad it with cosmetic rewords.
- For each changed bullet: use • prefix, CAR method. If the bullet would need a figure the CV does not state, omit the bullet rather than invent one or leave a bracket
- Human voice (avoid AI-detection): vary sentence length/structure across bullets, natural not press-release tone. Banned AI-tell words: "Spearheaded", "Leveraged", "Orchestrated", "Utilized", "Synergy". Keep each rewrite anchored to a concrete detail already in the source
- NEVER add new bullets that don't exist in the original — only replace existing ones by index
- missingSkills: skills required by job not present in CV (max 5). Each MUST be a SHORT atomic skill or keyword (1-3 words, e.g. "GCD", "async/await", "App Store", "Kubernetes") — NEVER a full requirement sentence like "Knowledge of GCD, async/await, and concurrency concepts"
- softSkillSuggestions: SOFT skills the job asks for (communication, teamwork, leadership, adaptability, problem-solving, ownership…) that the CV does NOT yet evidence. Max 4. For each, "skill" is the short soft skill and "suggestion" is ONE actionable line telling the user HOW/WHERE to show it, anchored to their real experience — never invent a fact, and never claim they have it; you are advising them to demonstrate it. If the CV already shows the soft skills the job needs, return an empty array.
- If all bullets and summary are already well-optimized: return summary null, empty changedBullets for all experiences`
      : `REGLAS CRÍTICAS ANTI-ALUCINACIÓN (obligatorias, sin excepciones):
1. SOLO reescribe usando información presente en el CV DEL CANDIDATO. NO introduzcas tecnologías, frameworks, librerías, nombres de empresas, cargos, certificaciones, porcentajes, números reales ni fechas que no estén en el CV.
2. Las reescrituras de bullets aplican el método CAR usando ÚNICAMENTE resultados explícitos del source. NUNCA escribas un placeholder — ni [X%], ni [N usuarios], ni nada entre corchetes que sustituya a una cifra. Lo que devuelves se escribe directo en el CV del candidato, y un corchete olvidado ahí hace que le rechacen el CV. Un bullet que necesitaría una cifra que el CV no tiene debe OMITIRSE de changedBullets.
3. missingSkills debe listar habilidades requeridas por la OFERTA DE TRABAJO; no inventes nombres de habilidades.
4. Si no puedes mejorar un bullet sin inventar, OMÍTELO de changedBullets — nunca fabriques contenido para rellenar.

Eres un estratega experto en currículos. Adapta el CV del candidato a esta oferta de trabajo específica.

OFERTA DE TRABAJO:
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
- changedBullets: SOLO incluir bullets que necesitan mejora. Si un bullet ya tiene verbo de acción fuerte y es relevante → OMITIRLO. Un array vacío significa que todos los bullets ya están bien, y es una respuesta correcta y esperada — nunca lo rellenes con reescrituras cosméticas.
- Para cada bullet cambiado: usar prefijo •, método CAR. Si el bullet necesitaría una cifra que el CV no declara, omite el bullet en vez de inventarla o dejar un corchete
- Voz humana (evita detección de IA): varía el largo/estructura de las frases entre bullets, tono natural no nota de prensa. Palabras-IA prohibidas: "Orquestó", "Apalancó", "Utilizó", "sinergia". Mantén cada reescritura anclada a un dato concreto ya presente en el source
- NUNCA agregar bullets nuevos que no existen en el original — solo reemplazar existentes por índice
- missingSkills: habilidades requeridas por la oferta no presentes en el CV (máximo 5). Cada una DEBE ser una habilidad o keyword CORTA y atómica (1-3 palabras, ej.: "GCD", "async/await", "App Store", "Kubernetes") — NUNCA una frase de requisito completa como "Conocimiento de GCD, async/await y conceptos de concurrencia"
- softSkillSuggestions: habilidades BLANDAS que pide la oferta (comunicación, trabajo en equipo, liderazgo, adaptabilidad, resolución de problemas, ownership…) que el CV AÚN no evidencia. Máximo 4. Para cada una, "skill" es la blanda corta y "suggestion" es UNA línea accionable de CÓMO/DÓNDE mostrarla, anclada a su experiencia real — nunca inventes un dato, y nunca afirmes que ya la tiene; le estás aconsejando cómo demostrarla. Si el CV ya muestra las blandas que pide la oferta, devolvé un array vacío.
- Si todos los bullets y el resumen ya están bien optimizados: devolver summary null, changedBullets vacíos para todas las experiencias`

    const systemPrompt = `You are an elite career coach and ATS optimization specialist. You tailor resumes to specific job postings with surgical precision, identifying keyword gaps, aligning professional summaries, and rewriting experience bullets to maximize recruiter and ATS impact. You only work on real job postings — if the input is off-topic or nonsensical, return { "summary": null, "experiences": [], "missingSkills": [] }. A bullet is already good if it has: (1) a strong action verb at the start, (2) the metric the source states, IF the source states one — a bullet the CV gives no figure for is still "already good" once it has a strong verb and relevant context, and asking for a number the CV never mentioned would only force you to invent one, (3) relevant context for this specific job. You never invent figures and never write bracket placeholders. Leaving a bullet untouched is a correct, expected outcome — omitting it from changedBullets is how you say so. ${langInstruction}`

    // A rich CV (several jobs × several bullets) plus summary, skills and soft-skill
    // advice easily exceeds 900 tokens of JSON — at 900 the response was TRUNCATED
    // mid-object, so parseAIJson threw and the whole tailor 500'd (the "error when
    // applying tailor" report). 3000 fits the worst realistic case; nano is cheap.
    const doChat = () => this.aiClient.chat({
      model: AI_MODEL,
      max_tokens: 3000,
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    })

    // Parse with ONE retry: even at 3000 a huge CV or a rare malformed emission can
    // fail to parse. A fresh generation almost always completes cleanly; only a second
    // failure surfaces as a clean handled error instead of an unguarded crash.
    let response = await doChat()
    const parseUsages: Array<{ prompt_tokens?: number; completion_tokens?: number }> = []
    let raw: TailorCVResultV2
    try {
      raw = parseAIJson<TailorCVResultV2>(response.choices[0]?.message?.content ?? "{}")
    } catch {
      this.logger.warn("[AIService.tailorCV] unparseable JSON (likely truncated), retrying once")
      parseUsages.push(response.usage ?? {})
      response = await doChat()
      try {
        raw = parseAIJson<TailorCVResultV2>(response.choices[0]?.message?.content ?? "{}")
      } catch {
        throw new AppError("invalid_response_format", 500)
      }
    }

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
    const promptTokens = (response.usage?.prompt_tokens ?? 0) + parseUsages.reduce((s, u) => s + (u.prompt_tokens ?? 0), 0)
    const completionTokens = (response.usage?.completion_tokens ?? 0) + parseUsages.reduce((s, u) => s + (u.completion_tokens ?? 0), 0)
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
      const origBullets = origBulletsByJob.get(e.targetId ?? "") ?? []
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
          // No-op guard, unified with the other AIs: a rewrite ≥90% identical to
          // the original bullet is not a real improvement — omit it. Plus the
          // cosmetic-reword guard Review/bullets use: a synonym-only swap
          // ("enhance"→"improve") on an otherwise-identical bullet adds nothing.
          const orig = origBullets[b.index]
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
        targetId: e.targetId ?? "",
        jobTitle: e.jobTitle ?? "",
        employer: e.employer ?? "",
        changedBullets: cleanedBullets,
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
        (texts) => this.aiClient.embed(texts),
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
    const summaryOut = tailoredSummary && origSummary && (isTrivialEdit(origSummary, tailoredSummary) || isCosmeticReword(origSummary, tailoredSummary))
      ? null
      : tailoredSummary

    if (droppedBullets > 0 || droppedTrivial > 0) {
      this.logger.warn("[AIService.tailorCV] dropped bullets", { droppedBullets, droppedTrivial })
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
