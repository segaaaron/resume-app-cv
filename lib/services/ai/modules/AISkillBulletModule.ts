// lib/services/ai/modules/AISkillBulletModule.ts
// Weave a skill the candidate ALREADY has into ONE new bullet of the best-fit job.
//
// The user is looking at a skill they own (it sits in their skills list) that no
// bullet mentions, and wants it surfaced in the experience where it best fits.
// This writes a single capability bullet — verb-first, no hard-coded metric, no
// bracket placeholder — and returns it for the user to confirm in the diff modal.
// The human-in-the-loop confirm is the honesty gate: an assertion the user never
// did is rejected by them, exactly like every other suggestion in the editor.
import { BULLETS_PER_ROLE_MAX } from "@/lib/ats/scoring-config"
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
import { normalizeTerm, termPresent } from "@/lib/ats/vocabulary"
import { parseAIJson, resolveLanguage, hasHardCodedFact } from "../shared/ai-helpers"
import { costOfChat } from "../shared/cost-tracker"
import { parseBullets, renderBulletsForPrompt } from "../shared/bullets"
import { isTrivialEdit } from "../shared/text-similarity"
import { bulletFloorMisses } from "@/lib/ats/output-floor"
import { AI_INPUT_LIMITS, type SkillBulletInput, type SkillBulletResult } from "../shared/ai-types"
import { noHardCodedFactsRule, proseRules } from "../shared/cv-writing-doctrine"

interface WorkRow { id?: string; jobTitle?: string; employer?: string; description?: string }

/**
 * True when the skill's significant signal already shows up in a bullet — so a
 * "new" bullet weaving it in would just duplicate what the CV states. Substring
 * first (atomic skill like "graphql"), then a loose token check for compound
 * skills ("async/await" → "async", "await").
 */
function bulletMentionsSkill(skill: string, haystackLower: string): boolean {
  const sl = skill.toLowerCase().trim()
  if (!sl) return false
  if (haystackLower.includes(sl)) return true
  const tokens = sl.split(/[^a-z0-9+#.]+/).filter((w) => w.length > 2)
  if (tokens.length === 0) return false
  // Compound skill is "present" only if EVERY significant token is there, so
  // "async/await" is not counted present just because a bullet says "await".
  return tokens.every((w) => haystackLower.includes(w))
}

export class AISkillBulletModule {
  constructor(
    private readonly aiClient: IAIClient,
    private readonly logger: ILogger,
  ) {}

  /**
   * Soft-skill variant. The candidate needs to EVIDENCE a behavior the job asks
   * for (teamwork, communication, leadership, adaptability, problem-solving,
   * ownership) in one real bullet. Unlike the hard variant, the bullet does not
   * name the skill — it shows the action that proves it, grounded in the chosen
   * job's real work. Every anti-hard-coded fact rule stays; only the "name the term"
   * requirement is dropped, because that is not how a soft skill reads on a CV.
   */
  private buildSoftPrompt(skill: string, resumeContext: string, workList: string, language: string): string {
    return language === "en"
      ? `${noHardCodedFactsRule("en")}

ADDITIONAL RULES:
1. Use ONLY facts already in the chosen job. Do NOT introduce any technology, framework, tool, company, certification, percentage, number, or date not already in that job.
2. The bullet asserts the candidate SHOWED "${skill}" at the chosen job. Place it only where the job's title/bullets make that credible; if no job is a credible home, return {"targetId": null}.

TASK: The job asks for the soft skill "${skill}" and the candidate's CV does not yet evidence it. Pick the ONE job below where it most credibly fits and write ONE new bullet that DEMONSTRATES "${skill}" through a concrete action — do NOT name the skill; show it (e.g. for "communication": "Presented release trade-offs to product and design so the team aligned on scope"; for "teamwork": "Coordinated with the backend and QA teams to unblock the mobile release").

CANDIDATE CONTEXT:
${resumeContext}

WORK EXPERIENCE (bullets indexed by job ID):
${workList}

${proseRules("en")}

RULES:
- Choose the single best-fit job by ID. If it fits none credibly, return {"targetId": null, "text": null}.
- Write exactly ONE bullet, prefixed with "• ". Do NOT write the word "${skill}" as a label; prove it through a real action anchored to that job.
- NARROWING FOR THIS ONE BULLET, not a contradiction of the rule above: do not propose a figure here. This line evidences a BEHAVIOUR, not a measured result, and a size attached to a behaviour is a claim about the candidate that nobody asked them to confirm.

Respond ONLY with valid JSON (no markdown):
{"targetId": "ID", "text": "• bullet that demonstrates ${skill}"}`
      : `${noHardCodedFactsRule("es")}

REGLAS ADICIONALES:
1. Usa SOLO datos que ya estén en el puesto elegido. NO introduzcas NINGUNA tecnología, framework, herramienta, empresa, certificación, porcentaje, número ni fecha que no esté ya en ese puesto.
2. El bullet afirma que el candidato DEMOSTRÓ "${skill}" en el puesto elegido. Colócalo solo donde el título/bullets del puesto lo hagan creíble; si ningún puesto es un hogar creíble, devuelve {"targetId": null}.

TAREA: La oferta pide la habilidad blanda "${skill}" y el CV del candidato aún no la evidencia. Elige el ÚNICO puesto de abajo donde encaje de forma más creíble y escribe UN bullet nuevo que DEMUESTRE "${skill}" mediante una acción concreta — NO nombres la habilidad; muéstrala (ej. para "comunicación": "Presenté las decisiones de release a producto y diseño para alinear el alcance con el equipo"; para "trabajo en equipo": "Coordiné con los equipos de backend y QA para desbloquear el release móvil").

CONTEXTO DEL CANDIDATO:
${resumeContext}

EXPERIENCIA LABORAL (bullets indexados por ID de puesto):
${workList}

${proseRules("es")}

REGLAS:
- Elige el único puesto que mejor encaje por ID. Si no encaja en ninguno de forma creíble, devuelve {"targetId": null, "text": null}.
- Escribe exactamente UN bullet, con prefijo "• ". NO escribas la palabra "${skill}" como etiqueta; demuéstrala mediante una acción real anclada a ese puesto.
- ACOTACIÓN SÓLO PARA ESTE BULLET, no una contradicción de la regla de arriba: acá no propongas cifra. Esta línea evidencia una CONDUCTA, no un resultado medido, y un tamaño pegado a una conducta es una afirmación sobre el candidato que nadie le pidió confirmar.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"targetId": "ID", "text": "• bullet que demuestre ${skill}"}`
  }

  async weaveSkillBullet(userId: string, input: SkillBulletInput, plan: string): Promise<SkillBulletResult> {
    await enforceAIQuota(userId, "skill-bullet", plan)

    const { skill: rawSkill, sectionData, language: rawLanguage, soft = false, targetId: chosenId } = input
    const { language, langInstruction } = resolveLanguage(rawLanguage)

    const skill = rawSkill.trim()
    const skillValidation = validateAIInput(skill, AI_INPUT_LIMITS.skillName)
    if (!skillValidation.valid || !skill) throw new AppError("invalid_input", 400)

    const work = ((sectionData.workExperience ?? []) as WorkRow[]).filter((j) => j.id)
    if (work.length === 0) return { status: "no_fit" }

    /**
     * The experience already shows this skill → nothing to write.
     *
     * Without this, pressing the button twice wrote a SECOND bullet about the
     * same skill: the first press proved it, and the second had no way to know.
     * The same stop rule as every other surface — do not spend a call producing
     * something the CV already says — and here it also prevents a duplicate the
     * user would have to delete by hand.
     *
     * Matched through the shared ATS vocabulary, so "k8s" counts as Kubernetes.
     * Only the work experience counts: a skill listed in the Skills section is a
     * claim, and proving it in a bullet is exactly the point of this endpoint.
     */
    const experienceText = normalizeTerm(work.map((j) => j.description ?? "").join(" \n "))
    if (termPresent(skill, experienceText)) {
      return { status: "already_demonstrated" }
    }

    // FULL bullets, indexed by targetId — the model needs to see each job's real
    // work to judge where the skill plausibly belongs. Bounded by job count (6),
    // never by bullet text (a truncated bullet reads as a different job).
    // When the user picked the role themselves (after the model found no natural
    // home), that role is the ONLY candidate: the choice is theirs to make, and
    // the model's job shrinks to writing the bullet for it.
    const chosenJob = chosenId ? work.find((j) => j.id === chosenId) : undefined
    if (chosenId && !chosenJob) return { status: "no_fit" }
    /**
     * Roles already carrying more lines than a recruiter reads are offered LAST.
     *
     * Reported, and it was a straight contradiction: the panel talked the user
     * into proving four skills, wrote all four bullets into the same role, and
     * the structure check below then asked them to delete lines from that role —
     * including the ones we had just written. Two of our own features working
     * against each other on the same screen.
     *
     * Not a hard exclusion: a skill belongs where it actually happened, and a
     * crowded role may be the only credible home. When the user picks the role
     * themselves this does not apply at all — their choice stands.
     */
    const roomy = work.filter((j) => parseBullets(j.description ?? "").length <= BULLETS_PER_ROLE_MAX.value)
    const crowded = work.filter((j) => parseBullets(j.description ?? "").length > BULLETS_PER_ROLE_MAX.value)
    const jobs = chosenJob ? [chosenJob] : [...roomy, ...crowded].slice(0, 6)
    const workList = jobs.map((j) => {
      const bulletLines = renderBulletsForPrompt(parseBullets(j.description ?? ""), {
        emptyLabel: "  (no bullets yet)",
      })
      return `ID:${j.id} | ${j.jobTitle ?? ""} at ${j.employer ?? ""}:\n${bulletLines}`
    }).join("\n\n")

    // Grounding for hasHardCodedFact: skills/education context + every job's
    // bullets + the skill itself. Including the skill is what lets the new bullet
    // name it without being flagged as a hard-coded technology; anything ELSE the
    // model introduces (a second framework, a metric) still trips the guard.
    //
    // Soft mode does NOT license the skill word — a soft skill is a behavior, not
    // a technology, so the bullet proves it through actions already in the CV and
    // never needs to name it. Leaving the term out of grounding keeps the guard
    // honest: a hard-coded tool/metric still trips, common prose verbs do not.
    const resumeContext = buildResumeContext(sectionData, language, { includeWorkExperience: false })
    const groundingSource = soft
      ? `${resumeContext}\n${workList}`
      : `${resumeContext}\n${workList}\n${skill}`

    const prompt = soft
      ? this.buildSoftPrompt(skill, resumeContext, workList, language)
      : language === "en"
      ? `${noHardCodedFactsRule("en")}

ADDITIONAL RULES:
1. Write about ONLY the skill "${skill}" and the job you place it in. Do NOT introduce any OTHER technology, framework, library, tool, company, certification, percentage, number, or date not already in that job.
2. NARROWING FOR THIS ONE BULLET, not a contradiction of the rule above: no figure and no bracket placeholder ([X%], [N users]) here. The rule above lets you PROPOSE a size as a range when the candidate described work that plainly has one — but this line is written from scratch, with no account from them to size, so any number would be yours, not theirs.
3. The bullet asserts the candidate USED this skill at the chosen job. Only place it where the job's title/bullets make that credible; if no job is a credible home, return {"targetId": null}.

TASK: The candidate already lists "${skill}" as one of their skills, but no bullet shows it. Pick the ONE job below where it most credibly fits and write ONE new bullet that demonstrates it.

CANDIDATE CONTEXT:
${resumeContext}

WORK EXPERIENCE (bullets indexed by job ID):
${workList}

RULES:
${proseRules("en")}

- Choose the single best-fit job by ID. If the skill fits none credibly, return {"targetId": null, "text": null}.
- Write exactly ONE bullet, prefixed with "• ". It must naturally contain "${skill}" and read like something the candidate would say in an interview — not a press release.

Respond ONLY with valid JSON (no markdown):
{"targetId": "ID", "text": "• bullet that uses ${skill}"}`
      : `${noHardCodedFactsRule("es")}

REGLAS ADICIONALES:
1. Escribe SOLO sobre la habilidad "${skill}" y el puesto donde la coloques. NO introduzcas NINGUNA otra tecnología, framework, librería, herramienta, empresa, certificación, porcentaje, número ni fecha que no esté ya en ese puesto.
2. ACOTACIÓN SÓLO PARA ESTE BULLET, no una contradicción de la regla de arriba: acá no va cifra ni placeholder entre corchetes ([X%], [N usuarios]). La regla de arriba te deja PROPONER un tamaño como rango cuando el candidato describió un trabajo que claramente lo tiene — pero esta línea se escribe de cero, sin relato suyo que medir, así que cualquier número sería tuyo y no de él.
3. El bullet afirma que el candidato USÓ esta habilidad en el puesto elegido. Colócala solo donde el título/bullets del puesto lo hagan creíble; si ningún puesto es un hogar creíble, devuelve {"targetId": null}.

TAREA: El candidato ya lista "${skill}" entre sus habilidades, pero ningún bullet la muestra. Elige el ÚNICO puesto de abajo donde encaje de forma más creíble y escribe UN bullet nuevo que la demuestre.

CONTEXTO DEL CANDIDATO:
${resumeContext}

EXPERIENCIA LABORAL (bullets indexados por ID de puesto):
${workList}

REGLAS:
${proseRules("es")}

- Elige el único puesto que mejor encaje por ID. Si no encaja en ninguno de forma creíble, devuelve {"targetId": null, "text": null}.
- Escribe exactamente UN bullet, con prefijo "• ". Debe contener "${skill}" de forma natural y sonar como algo que el candidato diría en una entrevista — no una nota de prensa.

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"targetId": "ID", "text": "• bullet que use ${skill}"}`

    const forcedTarget = chosenJob
      ? (language === "en"
        ? `\n\nTHE JOB IS ALREADY CHOSEN BY THE USER: ID:${chosenJob.id}. Write the bullet for THAT job and return its ID. Do NOT return {"targetId": null} — the user decided where this belongs.`
        : `\n\nEL PUESTO YA LO ELIGIÓ EL USUARIO: ID:${chosenJob.id}. Escribe el bullet para ESE puesto y devuelve su ID. NO devuelvas {"targetId": null} — el usuario ya decidió dónde va.`)
      : ""

    const response = await this.aiClient.chat({
      model: AI_MODEL_PROSE,
      max_tokens: 300,
      temperature: AI_TEMPERATURE_STRUCTURED,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an elite resume coach. You weave a skill the candidate already has into a single, credible experience bullet. " +
            "You never hard-code metrics, numbers, outcomes, or technologies not already present — you write a capability statement grounded in the chosen job. " +
            "Returning {\"targetId\": null} when no job is a credible fit is a correct, expected answer. " +
            langInstruction,
        },
        { role: "user", content: prompt + forcedTarget },
      ],
    })

    const usage = response.usage
    logAIUsage(userId, "skill-bullet", {
      model: AI_MODEL_PROSE,
      plan,
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: costOfChat(AI_MODEL_PROSE, usage),
    })

    const raw = parseAIJson<{ targetId?: unknown; text?: unknown }>(response.choices[0]?.message?.content ?? "{}")
    const targetId = chosenJob?.id ?? (typeof raw.targetId === "string" ? raw.targetId : "")
    const text = typeof raw.text === "string" ? raw.text.trim() : ""
    if (!targetId || !text) return { status: "no_fit" }

    const job = jobs.find((j) => j.id === targetId)
    if (!job) {
      // Model addressed a job that isn't in the list — cannot place it safely.
      this.logger.warn("[AIService.weaveSkillBullet] unknown targetId", { targetId })
      return { status: "no_fit" }
    }

    // Anti-hard-coded fact: the new bullet may only introduce the skill itself, no other
    // metric or technology absent from the CV.
    if (hasHardCodedFact(text, groundingSource)) {
      this.logger.warn("[AIService.weaveSkillBullet] dropped hard-coded bullet", {
        skill, previewSample: text.slice(0, 120),
      })
      return { status: "no_fit" }
    }

    // Hard mode only: the whole point is to surface the named skill, so a draft
    // that doesn't contain it is off-target noise. A soft skill is proven by the
    // action, not the word, so this check is skipped for it.
    if (!soft && !bulletMentionsSkill(skill, text.toLowerCase())) {
      this.logger.warn("[AIService.weaveSkillBullet] bullet omits the skill", { skill })
      return { status: "no_fit" }
    }

    // Don't re-state a bullet the job already has. In hard mode, also skip when the
    // job already showcases the named skill (nothing to add).
    const existing = parseBullets(job.description ?? "")
    if (!soft && bulletMentionsSkill(skill, (job.description ?? "").toLowerCase())) return { status: "no_fit" }
    if (existing.some((b) => isTrivialEdit(b, text))) return { status: "no_fit" }

    /**
     * EL PISO DE SALIDA — el mismo que el ejecutor, del mismo dueño.
     *
     * Esta línea nace de cero, así que no hay original contra la que medir
     * ganancia: quedan las tres condiciones que sí aplican —verbo de acción,
     * nada de frase vacía, y el mínimo de palabras de la doctrina—. Una línea
     * como «Trabajo en equipo en el puesto de Cajera» cumple todos los guards de
     * arriba (nada quemado, menciona la habilidad, no duplica) y no dice NADA: es
     * exactamente la respuesta básica que el CEO reportó.
     *
     * No se reintenta acá: `no_fit` ya es una salida honesta con su aviso en
     * pantalla, y un segundo intento por una sola línea gasta otro uso del plan.
     */
    const misses = bulletFloorMisses(text)
    if (misses.length > 0) {
      this.logger.warn("[AIService.weaveSkillBullet] bullet below the floor", { skill, misses, previewSample: text.slice(0, 120) })
      return { status: "no_fit" }
    }

    return {
      status: "written",
      targetId,
      jobTitle: job.jobTitle ?? "",
      employer: job.employer ?? "",
      text,
    }
  }
}
