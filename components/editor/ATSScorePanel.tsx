"use client"

import { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { apiFetch } from "@/lib/apiFetch"
import { spliceSummary } from "@/lib/ats/summary-splice"
import { resolveBulletIndex } from "@/lib/ats/bullet-locate"
import { postingTermsLost } from "@/lib/ats/keyword-safety"
import { reportUxFailure } from "@/lib/client-error-reporter"
import { BULLETS_PER_ROLE_MAX } from "@/lib/ats/scoring-config"
import { parseBullets, formatBullet, serializeBullets, serializeBulletsReporting } from "@/lib/services/ai/shared/bullets"
import SummaryVersionModal, { type SummaryVersion } from "@/components/resume/sections/SummaryVersionModal"
import { useResumeStore } from "@/stores/resumeStore"
import { textSignature, matchesApplied } from "@/lib/ats/action-plan"
import { buildPanelReport } from "@/lib/ats/panel-report"
import { planSkillAdd } from "@/lib/ats/skill-add"
import { planRoleReorder } from "@/lib/ats/role-order"
import { tailorResolutions } from "@/lib/ats/tailor-resolutions"
import { allChecks } from "@/lib/ats/report"
import ReportRail from "./ats-report/ReportRail"
import { applyAllPlan, solvableChecks, tailorWorkload } from "@/lib/ats/report"
import TailorModal from "./ats-report/TailorModal"
import { appliedSignatures, rememberApplied } from "@/lib/ats/applied-memory"
import { useShallow } from "zustand/react/shallow"
// Same normalization the matcher used to decide "demonstrated", so an accented
// Spanish skill matches the stored verdict instead of silently missing it.
import { computeCredibility } from "@/lib/ats/credibility"
import { Target, Loader2, CheckCircle2, AlertCircle, Lightbulb, Check, MessageSquare, TrendingUp, Clock, FileSearch, Sparkles, ChevronRight, MessageSquareQuote } from "lucide-react"
import { useTailorCV } from "./hooks/useTailorCV"
import AtsSafeDownload from "./AtsSafeDownload"
import { getTemplateAtsSafety } from "@/lib/ats/template-ats-safety"
import { verifyGapCause, FAITHFUL_MAX_DELTA } from "@/lib/ats/verify-gap"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import SuggestionDiffModal, { type Suggestion } from "./SuggestionDiffModal"
import JobPickerModal from "./JobPickerModal"
import type { ResumeSections, WorkExperienceItem } from "@/types/resume"
import { useATSScore, isQuestion } from "./hooks/useATSScore"
import { applySuggestion, previewSuggestion } from "@/lib/services/ai/shared/apply-suggestion"
import { assessResumeContent } from "@/lib/services/ai/shared/bullet-quality"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { applySpellingFix } from "@/lib/ats/apply-spelling"
import { markContentOptimized } from "./hooks/useOptimizedGuard"
import { ATSErrorBlock } from "./ats-panel/presentational"
import { normalizeDates } from "@/lib/ats/normalize-dates"
import { useCooldownLabel } from "./hooks/useAICooldown"
import { useCvLanguage } from "./hooks/useCvLanguage"
import { AI_INPUT_LIMITS, ImproveBulletResponseSchema } from "@/lib/services/ai/shared/ai-types"

/** One colour per number, so the badge and the figure it refers to read as a pair. */
/**
 * Los pendientes de tailor, en orden.
 *
 * Se aplican de a uno y por el MISMO camino que un clic suelto: un aplicador
 * masivo con su propia escritura sería una segunda forma de escribir en el CV,
 * con su propia manera de perder datos.
 */

/**
 * El motivo, leído del id del hallazgo.
 *
 * El informe ya nombra la causa en la clave (`tips.near_dup.*`, `tips.dilutes.*`).
 * Derivarlo evita un campo más que mantener en sincronía, y si el id cambia sin
 * que esto cambie, el peor caso es una guía genérica — nunca una equivocada.
 */
function reasonOf(checkId: string): "no_metric" | "duplicate" | "dilutes" | "cliche" | "orphan" | "critical" | "tailored" {
  if (checkId.startsWith("tips.near_dup")) return "duplicate"
  if (checkId.startsWith("tips.dilutes")) return "dilutes"
  if (checkId.startsWith("tips.merge")) return "duplicate"
  if (checkId.startsWith("format.orphan")) return "orphan"
  if (checkId.startsWith("tips.recruiter")) return "critical"
  if (checkId.startsWith("tips.credibility.empty_lines")) return "cliche"
  return "no_metric"
}

export default function ATSScorePanel() {
  const t = useTranslations("editor.ats")
  /**
   * Which job the panel is doing right now.
   *
   * Opens on the application view: three actions that move the match with THIS
   * posting, and a stop rule. The full report is one click away and unchanged —
   * nothing was removed, it stopped competing for attention with the two things
   * that decide whether this application is worth sending.
   */
  /** What the one-press repair actually did, said afterwards instead of a toast. */

  /** Shared AI error copy — quota messages already live there, in both locales. */
  const tAi = useTranslations("editor.ai")
  // The figure hint rewrites the candidate's own sentence, so it has to agree
  // with the language the interface is speaking.
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({
      sectionData: s.sectionData,
      updateSectionData: s.updateSectionData,
    }))
  )
  const {
    input, setInput,
    loading,
    atsResult, reviewResult,
    offTopic,
    hasResult,
    upToDate,
    analyze,
    rescore,
    creditSoftSkill,
    verifyReal, verifyResult, verifyLoading,
    cooldownUntil,
  } = useATSScore()
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set())
  // El valor ya no se lee: lo aplicado sobrevive al re-análisis en `applied-memory`.
  const [, setAppliedItems] = useState<Set<string>>(new Set())
  /**
   * True once the user has applied any fix from this report.
   *
   * The findings below are a snapshot of the CV at analysis time, so the moment
   * one is applied the rest may describe text that no longer exists — that is
   * how a already-corrected typo kept being reported as a critical fix. The
   * score keeps updating live (runRescore is deterministic and free); the
   * recruiter findings need a new analysis, so we say so instead of pretending
   * they are current.
   */

  /**
   * Lo que el usuario ya aceptó en ESTE CV, entre corridas.
   *
   * `appliedItems` se vacía al re-analizar, y el problema aparece justo DESPUÉS:
   * el CV cambió, el modelo opina de cero y vuelve a proponer una variante del
   * párrafo que él mismo escribió. Esta memoria dura más que el análisis.
   */
  /** Cómo parsea la plantilla elegida: decide si hace falta ofrecer la copia plana. */
  const templateSafety = getTemplateAtsSafety(useResumeStore((st) => st.config?.templateId))

  const [appliedSigs, setAppliedSigs] = useState<string[]>([])
  // Por selector y no por `getState()`: así es reactivo si el editor cambia de
  // CV, y no depende de una API estática del store.
  const memoryResumeId = useResumeStore((st) => st.resumeId) ?? ""
  useEffect(() => {
    if (memoryResumeId) setAppliedSigs(appliedSignatures(memoryResumeId))
  }, [memoryResumeId])

  /** ¿Esto ya se lo ofrecimos y lo aceptó? Entonces no se vuelve a mostrar. */
  const alreadyAccepted = useCallback(
    (text?: string | null) => !!text && matchesApplied(text, appliedSigs),
    [appliedSigs],
  )

  /** The ONLY writer of applied-state, so nothing can mark a fix done silently. */
  function markFixApplied(key: string, appliedText?: string) {
    setAppliedItems((prev) => new Set(prev).add(key))
    // La firma, no el texto: alcanza para reconocerlo y no guarda frases del CV.
    const sig = appliedText ? textSignature(appliedText) : ""
    if (sig && memoryResumeId) {
      rememberApplied(memoryResumeId, sig)
      setAppliedSigs((prev) => (prev.includes(sig) ? prev : [sig, ...prev]))
    }
  }

  // Re-score deterministically after a fix. The hook owns the delta badge now,
  // so a plain edit that moves the score keeps it truthful too.
  /**
   * Re-puntúa y DICE cuánto se movió.
   *
   * El panel aplicaba un arreglo, el número cambiaba solo y el usuario no tenía
   * forma de atribuirlo a su clic. Peor con los que no mueven la nota: apretaba,
   * el número quedaba igual, y concluía que el botón no había hecho nada — el
   * mismo malentendido que el `0p` de cada chequeo vino a cerrar, dicho ahora en
   * el momento en que actúa.
   */
  async function runRescore(): Promise<number | null> {
    // Del INFORME, no del crudo. `report` se declara más abajo pero esta función
    // sólo corre en un clic, con el render ya cerrado.
    const before = report?.score ?? null
    const after = await rescore()
    if (before !== null && after !== null) {
      const delta = after - before
      if (delta !== 0) toast.success(t("score_moved", { delta: delta > 0 ? `+${delta}` : String(delta) }))
    }
    return after
  }
  const [modal, setModal] = useState<{ suggestion: Suggestion; currentValue: string; itemKey: string } | null>(null)
  const { inCooldown, label: cooldownLabel } = useCooldownLabel(cooldownUntil)
  // Everything the AI writes here is applied INTO the CV → the CV's language.
  const cvLanguage = useCvLanguage()

  // Inline "improve this weak bullet" — reuses the honest improve-bullet engine
  // (stronger verb / tighter phrasing, NEVER invents a number) and applies the
  // rewrite to the exact bullet by index, then re-scores.
  const [bulletFix, setBulletFix] = useState<{
    targetId: string
    index: number
    current: string
    improved: string
    /** Why this reads better — a rewrite you cannot judge should not ask for a click. */
    why?: string
    /** The model's own pick, kept so choosing another angle is reversible. */
    recommended: string
    recommendedWhy?: string
    /** The same work argued from another angle, so disliking one ends in a choice, not another call. */
    options?: Array<{ text: string; angle: string; why: string }>
    /**
     * A merge: the second line this replacement absorbs, deleted on confirm.
     *
     * Rides the SAME confirm path as every other bullet write rather than getting
     * its own — one owner of the serialization is what makes a duplicate
     * impossible to reintroduce, and a second writer would be a second chance to
     * get it wrong.
     */
    removeIndex?: number
    removeCurrent?: string
    /** Marked applied on confirm, so the same offer cannot appear twice. */
    appliedKey?: string
  } | null>(null)
  const [improvingKey, setImprovingKey] = useState<string | null>(null)

  /**
   * Fuse two thin bullets of one role into one solid line.
   *
   * WHICH two was decided in code before the button was drawn — a model asked to
   * pick a pair always picks one. This only pays for the writing, and the result
   * still goes through the same confirm modal: a merge deletes a line the user
   * wrote, so it is never applied without them seeing exactly what replaces both.
   */
  /**
   * The critical fix the user is completing right now.
   *
   * The analyst writes the sentence and then says what is missing from it — the
   * scale, the figure, the outcome. Applying the text as-is leaves a bullet that
   * still does not say what changed, and the panel used to send the user off to
   * another tab to add it, which nobody does. The field is here, with the sentence
   * already written: we supply the wording, the candidate supplies the number.
   */
  // El modal muestra el estado de ocupado; acá sólo se registra cuál par está
  // en vuelo, para que `runMerge` no dispare dos veces sobre el mismo.
  const [, setMergingKey] = useState<string | null>(null)

  async function runMerge(c: { targetId: string; indexes: [number, number]; texts: [string, string] }) {
    const key = `merge-${c.targetId}-${c.indexes[0]}-${c.indexes[1]}`
    setMergingKey(key)
    try {
      const res = await apiFetch("/api/ai/merge-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: c.targetId,
          indexes: c.indexes,
          sectionData,
          language: cvLanguage,
        }),
      })
      if (!res.ok) return
      const data: { status: "ok"; text: string } | { status: "not_mergeable" } = await res.json()
      if (data.status !== "ok") {
        // An honest no. The two lines turned out to be about different work, and
        // forcing them together would have distorted one of them.
        toast.info(t("merge_not_mergeable"))
        markFixApplied(key)
        return
      }
      setBulletFix({
        targetId: c.targetId,
        index: c.indexes[0],
        current: c.texts[0],
        improved: data.text,
        recommended: data.text,
        why: t("merge_why"),
        removeIndex: c.indexes[1],
        removeCurrent: c.texts[1],
        // Carried into the confirm modal so ACCEPTING is what retires the pair —
        // not merely asking for it. Cancelling must leave the offer standing.
        appliedKey: key,
      })
    } finally {
      setMergingKey(null)
    }
  }

  // Soft skills the job asks for that the CV doesn't demonstrate yet — hoisted up
  // from the Tailor run (§③) so ALL bullet work lives in the one list below (§②).

  const [weavingSoft, setWeavingSoft] = useState<string | null>(null)
  /**
   * The "where does this go?" step of weaving a soft skill.
   *
   * The analysis picks the role it finds most credible, but the candidate is the
   * one who knows where the behaviour actually happened — so the choice is always
   * theirs, with ours marked as the recommendation. `draft` is the bullet already
   * written for the recommended role: accepting that role costs no second call.
   */
  const [softPick, setSoftPick] = useState<
    { skill: string; recommendedId: string | null; draft: string | null; soft: boolean }
  | null>(null)

  async function improveMetricless(
    b: { text: string; targetId: string; jobTitle: string; index: number; reasons?: string[] },
    key: string,
  ) {
    if (improvingKey) return
    setImprovingKey(key)
    try {
      // The panel already KNOWS what is wrong with this bullet (weak opener,
      // cliché, no metric) — sending that with the request is what stops the
      // model from answering "already fine" to a bullet we just labelled weak.
      const focus = (b.reasons ?? []).filter((r) => r !== "duplicate")
      const res = await apiFetch("/api/ai/improve-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: b.text, jobTitle: b.jobTitle || undefined, language: cvLanguage, focus }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        const capped = body?.error === "daily_cap_reached" || res.status === 429
        // A cap is the product working as designed and the user is told why.
        // Anything else is a failure they cannot act on — record it.
        if (!capped) {
          reportUxFailure("improve_bullet_request_failed", {
            status: res.status,
            code: String(body?.error ?? "").slice(0, 40),
            focus: focus.join(",").slice(0, 40),
          })
        }
        toast.error(capped ? tAi("daily_cap_reached") : t("metricless_improve_error"))
        return
      }
      const data = await res.json().catch(() => null)
      const parsed = ImproveBulletResponseSchema.safeParse(data)
      if (!parsed.success) {
        // The endpoint answered 200 with a body the UI cannot read: a broken
        // contract between our own two halves, invisible until now.
        reportUxFailure("improve_bullet_bad_contract", { status: res.status })
        toast.error(t("metricless_improve_error")); return
      }
      const first = parsed.data.improvements[0]
      if (parsed.data.status === "already_optimized" || !first || first.text.trim() === b.text.trim()) {
        // Never claim "already well written" about a bullet this very panel
        // labelled weak — that contradiction is what made the button look broken.
        toast.info(focus.length > 0 ? t("metricless_no_rewrite") : t("metricless_already_good"))
        return
      }
      setBulletFix({
        targetId: b.targetId,
        index: b.index,
        current: b.text,
        improved: first.text,
        why: first.why,
        recommended: first.text,
        recommendedWhy: first.why,
        options: first.alternatives,
      })
    } catch {
      toast.error(t("metricless_improve_error"))
    } finally {
      setImprovingKey(null)
    }
  }

  /**
   * Collapses every repeated bullet in the CV, in one action.
   *
   * serializeBullets already makes a duplicate impossible to CREATE; this clears
   * the ones a CV arrived with. Offering "Remove" once per duplicated line was
   * the same chore the report was complaining about — the user should press one
   * button and have the CV be clean.
   */
  /** @returns true when a repeated line was actually removed. */
  function removeDuplicateBullets(): boolean {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    let removed = 0
    const updated = work.map((j) => {
      const bullets = parseBullets(j.description ?? "")
      if (bullets.length === 0) return j
      const deduped = serializeBullets(bullets)
      const after = parseBullets(deduped)
      if (after.length === bullets.length) return j
      removed += bullets.length - after.length
      return { ...j, description: deduped }
    })
    if (removed === 0) { toast.info(t("dedupe_none")); return false }
    updateSectionData("workExperience", updated)
    toast.success(t("dedupe_done", { count: removed }))
    void runRescore()
    return true
  }

  /**
   * One date format across the CV (MM/YYYY), in one action.
   *
   * Mixed formats confuse ATS tenure parsing — the check already said so and
   * then asked the user to retype every field by hand. Dates it cannot read with
   * certainty are left untouched; a wrong date is worse than a mixed one.
   */
  /** @returns true when at least one date was rewritten. */
  /**
   * How many dates the unify action could actually rewrite, right now.
   *
   * A bare year is left alone on purpose — writing "01/2015" over "2015" invents a
   * month, and inventing tenure is worse than a mixed format. But that is exactly
   * the case the finding complains about most, so on a CV whose dates are all bare
   * years the panel offered "Unify dates to MM/YYYY", the user pressed it, and
   * nothing happened. This product already ruled on that shape: a button that
   * cannot do anything is not drawn.
   */

  function fixDates(): boolean {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const edu = (sectionData.education ?? []) as { startDate?: string; endDate?: string }[]
    const w = normalizeDates(work)
    const e = normalizeDates(edu)
    if (w.changed + e.changed === 0) { toast.info(t("dates_none")); return false }
    if (w.changed > 0) updateSectionData("workExperience", w.rows)
    if (e.changed > 0) updateSectionData("education", e.rows as never)
    toast.success(t("dates_done", { count: w.changed + e.changed }))
    void runRescore()
    return true
  }

  /** Rewrites the summary through the same improve-summary engine the editor uses. */
  /** The three positionings, held until one is chosen. Empty = picker closed. */
  const [summaryVersions, setSummaryVersions] = useState<SummaryVersion[]>([])

  /** The confirm step every summary rewrite goes through, whoever chose the text. */
  function openSummaryDiff(text: string, current: string) {
    setModal({
      suggestion: { field: "summary", type: "replace", preview: text, reason: t("summary_fix_reason") },
      currentValue: current,
      itemKey: "fix-summary",
    })
  }


  /**
   * Turns one recruiter finding into the button that repairs it.
   *
   * Every action was validated server-side against the real CV (a bullet index
   * that does not exist arrives as "manual"), so a rendered button always does
   * something. "manual" renders nothing — advice with no false promise.
   */

  /**
   * Replace ONE bullet, whoever wrote the replacement.
   *
   * Extracted from confirmBulletFix so the user's own inline edit lands through
   * the same stale-index guard and the same serializer. A second write path is
   * how a duplicate or an overwritten neighbour gets reintroduced.
   *
   * `aiWritten` marks the text as ours: only then does the Content tab's guard
   * need to know not to offer improving it again. The user's own wording is not
   * AI output and must not be treated as already-optimised.
   */
  function writeBullet(targetId: string, index: number, current: string, next: string, aiWritten: boolean): boolean {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const job = work.find((j) => j.id === targetId)
    const bullets = parseBullets(job?.description ?? "")
    const at = job ? resolveBulletIndex(bullets, index, current) : -1
    if (at < 0) {
      // The line is not in the CV any more — deleted, or rewritten in another
      // tab. There is nothing to write and nothing the user can do about a red
      // error, so this is not one: say what happened, drop the stale row, and
      // let the score catch up. Recorded all the same, with facts only — never
      // the line itself, which is their résumé.
      reportUxFailure("bullet_write_line_gone", { jobFound: !!job, index, bullets: bullets.length, currentLen: current.length })
      toast.info(t("bullet_line_gone"))
      markFixApplied(`bullet-${targetId}-${index}`)
      void runRescore()
      return false
    }
    const written = serializeBulletsReporting(bullets.map((line, i) => (i === at ? next : line)))
    const nextDescription = written.text
    updateSectionData("workExperience", work.map((j) => (j.id === targetId ? { ...j, description: nextDescription } : j)))
    if (aiWritten) markContentOptimized(`opt_bullet_${targetId}`, nextDescription)
    // `next` es la línea que quedó escrita: su firma es lo que evita que la
    // próxima corrida vuelva a proponer una variante de ella.
    markFixApplied(`bullet-${targetId}-${index}`, next)
    toast.success(t("toast_change_applied"))
    if (written.removed > 0) toast.info(t("dedupe_done", { count: written.removed }))
    void runRescore()
    return true
  }

  /**
   * The bullet whose number the user is typing right now, and the text as edited.
   *
   * "Add your number — only you know it" used to be a dead end: the panel named
   * the gap and then sent the user to another tab to find the line among forty.
   * Nobody makes that trip. The figure gets typed where it is asked for.
   */
  /** Rows on screen at once — the rest are one click away. */

  function confirmBulletFix() {
    if (!bulletFix) return
    const { targetId, index, improved } = bulletFix
    try {
      const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      const job = work.find((j) => j.id === targetId)
      const bullets = parseBullets(job?.description ?? "")
      // Stale-index guard: if the description was edited between scoring and
      // applying, the bullet at `index` may no longer be the one we improved.
      // Aborting is safer than overwriting the wrong line.
      const at = job ? resolveBulletIndex(bullets, index, bulletFix.current) : -1
      if (at < 0) {
        reportUxFailure("bullet_fix_line_gone", { jobFound: !!job, index, bullets: bullets.length, currentLen: bulletFix.current.length })
        toast.info(t("bullet_line_gone"))
        markFixApplied(`bullet-${targetId}-${index}`)
        void runRescore()
        return
      }
      // A merge also deletes the second line. If that twin is no longer in the
      // CV, the merge does not fail — there is simply nothing left to delete, so
      // the rewrite lands on its own. Refusing the whole operation because the
      // easy half was already done would throw away the half that matters.
      // What we never do is delete a line we cannot identify: `rmAt` comes from
      // the same text match as everything else, and only a real hit deletes.
      let rmAt =
        bulletFix.removeIndex === undefined
          ? undefined
          : resolveBulletIndex(bullets, bulletFix.removeIndex, bulletFix.removeCurrent ?? "")
      if (rmAt !== undefined && (rmAt < 0 || rmAt === at)) {
        reportUxFailure("bullet_merge_twin_gone", { index, removeIndex: bulletFix.removeIndex ?? -1, bullets: bullets.length })
        rmAt = undefined
      }
      // Replace the one bullet; re-mark every bullet uniformly so the stored
      // description stays consistent (formatBullet strips then re-adds "• ").
      // Through the one owner of the convention, so this path cannot reintroduce
      // a duplicate the rest of the app has made impossible.
      const merged = bullets.map((line, i) => (i === at ? improved : line))
      const written = serializeBulletsReporting(
        rmAt !== undefined ? merged.filter((_, i) => i !== rmAt) : merged,
      )
      const nextDescription = written.text
      const updated = work.map((j) => (j.id === targetId ? { ...j, description: nextDescription } : j))
      updateSectionData("workExperience", updated)
      // Same key the Content tab's guard uses: this write IS AI output, so the
      // "improve" button over there must not come back offering to improve it.
      markContentOptimized(`opt_bullet_${targetId}`, nextDescription)
      markFixApplied(`bullet-${targetId}-${index}`)
      if (bulletFix.appliedKey) markFixApplied(bulletFix.appliedKey)
      toast.success(t("toast_change_applied"))
      if (written.removed > 0) toast.info(t("dedupe_done", { count: written.removed }))
      void runRescore()
    } catch {
      toast.error(t("metricless_improve_error"))
    } finally {
      setBulletFix(null)
    }
  }

  // Soft-skill weave: ask the model to DEMONSTRATE the skill inside a real bullet
  // of the best-fit job (never names the word), then confirm via the same diff
  // modal before it lands — the user is the honesty gate. Appends a new bullet.

  async function weaveSkill(skill: string, targetId?: string, soft = true) {
    if (weavingSoft) return
    setWeavingSoft(skill)
    try {
      const res = await apiFetch("/api/ai/skill-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, sectionData, language: cvLanguage, soft, targetId }),
      })
      if (!res.ok) {
        // "Try again" is the wrong advice when the answer is "not today". The
        // daily cap is a 429 with a code, and repeating the generic failure
        // message sent the user pressing every skill in the list — measured in
        // the error log: seven identical 429s in three seconds, each one
        // reported to them as if the write had simply glitched.
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        const code = body?.error ?? ""
        toast.error(
          code === "daily_cap_reached" || code === "quota_exceeded" || res.status === 429
            ? tAi("daily_cap_reached")
            : t("soft_skill_error"),
        )
        return
      }
      const data = (await res.json().catch(() => null)) as
        | { status: "written"; targetId: string; jobTitle: string; text: string }
        | { status: "no_fit" }
        | { status: "already_demonstrated" }
        | null
      const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      // No natural home — the model's call, not the last word. The candidate is
      // the only one who knows where this actually happened, so ask them instead
      // of ending on a toast with nothing to press.
      // The CV already proves this skill in a bullet. Say so and mark it done —
      // pressing again used to write a second bullet about the same thing.
      if (data?.status === "already_demonstrated") {
        markFixApplied(soft ? `soft-${skill}` : `prove-${skill}`)
        toast.info(t("skill_already_demonstrated", { skill }))
        return
      }
      if (!data || data.status === "no_fit") {
        if (!targetId && work.some((j) => j.id)) setSoftPick({ skill, recommendedId: null, draft: null, soft })
        else toast.info(t("soft_skill_no_fit"))
        return
      }
      const job = work.find((j) => j.id === data.targetId)
      if (!job) {
        if (!targetId && work.some((j) => j.id)) setSoftPick({ skill, recommendedId: null, draft: null, soft })
        else toast.info(t("soft_skill_no_fit"))
        return
      }
      // First pass: show WHERE it would go and let the user move it. Only the
      // user's confirmed role reaches the CV.
      if (!targetId) {
        setSoftPick({ skill, recommendedId: data.targetId, draft: data.text, soft })
        return
      }
      // El consejo de blandas ya no viene de tailor —no era suyo—; la razón es la
      // misma para las dos: mostrar la habilidad DENTRO de una línea con fecha,
      // que es lo único que la convierte en prueba.
      const reason = t("prove_skill_reason", { skill })
      // The role that is about to receive this line may already carry more than a
      // recruiter reads — and the structure check below will then ask the user to
      // cut lines from it, including this one. Reported twice, and it is a
      // contradiction between two of our own features. Said here, before the
      // write, while the choice is still theirs: the reason line carries the
      // warning and the picker is one press away.
      const crowded = parseBullets(job.description ?? "").length >= BULLETS_PER_ROLE_MAX.value
      setModal({
        suggestion: {
          field: "workExperience.description",
          type: "append",
          preview: data.text,
          reason: crowded ? `${reason} · ${t("weave_role_crowded", { jobTitle: job.jobTitle ?? "" })}` : reason,
          targetId: data.targetId,
        },
        currentValue: job.description ?? "",
        itemKey: soft ? `soft-${skill}` : `prove-${skill}`,
      })
    } catch {
      toast.error(t("soft_skill_error"))
    } finally {
      setWeavingSoft(null)
    }
  }

  const jobInputRef = useRef<HTMLTextAreaElement>(null)
  const roleMode = false // role-title mode removed — job description is the only input
  const inputIsQuestion = !roleMode && isQuestion(input)

  // Path-to-target: jump to the card that fixes a lever. title/sections have no
  // single place to send the user, so they stay informative (no jump button).
  // Class appended to a scroll-target card while it's the freshly-jumped-to one.

  const summary = (sectionData.summary as string) ?? ""
  const workExp = (sectionData.workExperience as unknown[]) ?? []
  const skills = (sectionData.skills as unknown[]) ?? []
  const cvReady = summary.trim().length > 0 && workExp.length > 0 && skills.length > 0

  // Deterministic health verdict (no LLM, no JD) — recomputes live as the CV is
  // edited. This is the honest "is my CV good or bad?" answer, shown always.

  /**
   * The writing checks, recomputed from the CV as it stands RIGHT NOW.
   *
   * They used to arrive inside the analysis and stay frozen there. ats-rescore
   * refreshes the score on every edit but returns neither of these, so the list
   * kept describing the resume as it was at the first analysis: a bullet the user
   * had just fixed stayed on the list, still labelled "no metric", and re-running
   * the analysis was the only way to clear it — a model call to learn something
   * the browser could already see. That is what made the work feel endless and
   * what made fixing one line look like it spawned three more.
   *
   * Both functions are pure and take sectionData, exactly like computeResumeScore
   * above, so this costs nothing: no request, no tokens, no quota. Fix a line and
   * it leaves the list on the spot; the list shortens as the CV improves.
   */
  const liveContentQuality = useMemo(
    () => assessResumeContent(sectionData as Record<string, unknown>),
    [sectionData],
  )
  /**
   * `result.mergePairs` — the merge proposals the last analysis found, fed back
   * in. They come from an embedding call, which cannot run on a keystroke; the
   * checks themselves stay pure and deterministic, exactly as before. Absent
   * before the first analysis, and the merge finder falls back to its own
   * deterministic pass there.
   */
  const liveWritingChecks = useMemo(
    () => analyzeWriting(sectionData as Record<string, unknown>, atsResult?.mergePairs ?? []),
    [sectionData, atsResult?.mergePairs],
  )

  /**
   * Lines the panel has decided to CUT, DEDUPE or REPAIR-AS-BROKEN.
   *
   * Computed once, here, because more than one card needs to know and every card
   * that answered this question for itself reached a different answer — which is
   * how one bullet ended up being told to be rewritten, deleted and adapted at the
   * same time. The full reconciliation (including the defect/tailor/metric slices)
   * happens where the bullet list is built; these three are the ones other cards
   * must respect to stay out of each other's way.
   */
  /**
   * One computation, two readers.
   *
   * The card and the ranked plan both need it, and each was calling it on every
   * render — twice per keystroke, and two call sites that could drift apart the
   * day someone passes a different input to one of them. The credibility number
   * the user reads and the one the plan ranks by have to be the same number by
   * construction, not by coincidence.
   */
  const credibility = useMemo(() => computeCredibility(liveWritingChecks), [liveWritingChecks])

  /**
   * EL INFORME. Un solo objeto, y es lo que el riel nuevo lee.
   *
   * Los ocho productores siguen calculando lo suyo —cada uno contesta una pregunta
   * distinta y algunos cuestan una llamada— pero dejan de llegar sueltos a la
   * pantalla para que cada tarjeta decida por su cuenta qué pintar. Se juntan acá,
   * una vez, con sección, dueño y salida.
   */
  const report = useMemo(
    () => (atsResult
      ? buildPanelReport({
          result: atsResult,
          writing: liveWritingChecks,
          content: liveContentQuality,
          sectionData: sectionData as Record<string, unknown>,
          jobDescription: input,
          credibility,
          // Lo que un parser REAL extrajo, cuando el usuario lo verificó. Es la
          // única fuente honesta para «¿parsea a dos columnas?» y «¿el contacto
          // sobrevivió?»: son preguntas sobre el archivo, no sobre los datos.
          verified: verifyResult
            ? {
                formatIssues: verifyResult.breakdown.format.issues,
                missingSections: verifyResult.breakdown.sections.missing,
                hasEmail: verifyResult.breakdown.contact.hasEmail,
                hasPhone: verifyResult.breakdown.contact.hasPhone,
                wordCount: verifyResult.wordCount,
              }
            : undefined,
          isAlreadyAccepted: alreadyAccepted,
        })
      : null),
    [atsResult, liveWritingChecks, liveContentQuality, sectionData, input, credibility, verifyResult, alreadyAccepted],
  )

  const [tailorOpen, setTailorOpen] = useState(false)
  const [focusCheckId, setFocusCheckId] = useState<string | null>(null)
  /** Con qué filtro abre el ejecutor. El veredicto entra directo a «opcionales». */
  const [tailorFilter, setTailorFilter] = useState<"all" | "tips">("all")
  const [appliedCheckIds, setAppliedCheckIds] = useState<Set<string>>(new Set())



  // Fusion: one "Analyze" = one full report. After a manual analysis against a
  // real job description, signal Tailor to run itself (rewrites appear inline in
  // ③ without a second click). Not fired for role-only or question inputs, nor on
  // the live rescore — only on an explicit JD analyze.
  const [autoTailorSignal, setAutoTailorSignal] = useState(0)

  /**
   * Tailor-to-posting, folded into this report instead of living in its own
   * section. It auto-runs after a full analysis and its output is merged into
   * the ONE list of fixes below: the rewritten summary reuses the summary
   * action, the rewritten bullets join the bullets list, and the missing skills
   * join the missing-keyword card. No second header, no second "apply" flow.
   */
  /**
   * LO QUE TAILOR RECIBE: el trabajo que el informe le asignó, no la oferta.
   *
   * Antes le mandábamos hasta 6.000 caracteres de vacante y un array de keywords,
   * y él volvía a interpretarla por su cuenta — devolviendo su propio diagnóstico
   * de habilidades, blandas, resumen y métricas, que después había que desempatar
   * contra el del análisis. Ahora recibe qué línea y por qué.
   */
  const tailorWork = useMemo(
    () => (report ? tailorWorkload(report) : []).flatMap((c) => {
      const a = c.action
      if (a?.kind !== "rewrite_bullet" || !a.targetId || typeof a.index !== "number") return []
      return [{ checkId: c.id, targetId: a.targetId, index: a.index, reason: reasonOf(c.id) }]
    }),
    [report],
  )
  const wantsSummary = useMemo(
    () => (report ? tailorWorkload(report) : []).some((c) => c.action?.kind === "rewrite_summary"),
    [report],
  )

  const tailor = useTailorCV({
    // LA VACANTE SALE DEL INFORME, no del crudo del servidor. Una sola puerta:
    // lo que el panel pinta y lo que el ejecutor recibe vienen del mismo sitio.
    posting: report?.posting ?? null,
    workload: tailorWork,
    rewriteSummary: wantsSummary,
    autoRunSignal: autoTailorSignal,
  })

  /** Lo que el ejecutor escribió, atado al hallazgo que cierra. */
  const resolutions = useMemo(
    () => (report
      ? tailorResolutions(
          report,
          {
            rewrites: tailor.rewrites,
            tailoredSummary: tailor.tailoredSummary,
            currentSummary: (sectionData.summary as string) ?? "",
          },
          // parseBullets, NO un split crudo: la descripción se guarda con "• " y
          // el índice del informe es el de parseBullets. Con el glifo pegado,
          // toda comparación contra la línea viva fallaba y el guard de escritura
          // rechazaba el cambio con un "no se pudo aplicar".
          (targetId, index) => {
            const job = ((sectionData.workExperience ?? []) as WorkExperienceItem[]).find((j) => j.id === targetId)
            return parseBullets(job?.description ?? "")[index] ?? ""
          },
        )
      : []),
    [report, tailor.rewrites, tailor.tailoredSummary, sectionData.summary, sectionData.workExperience],
  )

  /**
   * Aplica UN hallazgo, reusando los escritores que ya existen.
   *
   * NO reimplementa la escritura a propósito: `writeBullet` resuelve la línea por
   * TEXTO y no por índice —el índice es pista, el texto es identidad— y mapea
   * sobre el array completo, así que una línea que no toca sobrevive intacta. Un
   * escritor nuevo acá habría sido una segunda forma de escribir en el CV, con su
   * propia manera de perder datos.
   */
  function applyCheck(checkId: string): void {
    if (!report) return
    const check = allChecks(report).find((c) => c.id === checkId)
    const action = check?.action
    if (!check || !action) return

    // Fusionar no es reescribir: son DOS líneas que se vuelven una. Tiene su
    // propio camino desde antes y su propio guard —no se ofrece una fusión cuyo
    // texto pierda una palabra de las originales—, así que se rutea por id.
    if (checkId.startsWith("tips.merge.")) {
      const c = liveWritingChecks.mergeCandidates.find(
        (m) => `tips.merge.${m.targetId}.${m.indexes[0]}.${m.indexes[1]}` === checkId,
      )
      if (c) void runMerge(c)
      return
    }

    const resolution = resolutions.find((r) => r.checkId === checkId)

    /**
     * Tailor no escribió esta línea: se le pide ahora.
     *
     * Tailor reescribe contra la vacante y no toca todo; una viñeta señalada por
     * otro motivo —sin cifra, verbo débil, duplicada— queda sin texto. Antes eso
     * lo resolvía un botón del bloque de críticos; sin este camino, el hallazgo
     * llegaría al modal con el botón apagado y sin forma de resolverse, que es
     * un diagnóstico sin salida.
     */
    if (!resolution && action.kind === "rewrite_bullet" && action.targetId && typeof action.index === "number") {
      const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      const job = work.find((j) => j.id === action.targetId)
      const line = parseBullets(job?.description ?? "")[action.index] ?? ""
      if (!line) return
      void improveMetricless(
        { text: line, targetId: action.targetId, jobTitle: job?.jobTitle ?? "", index: action.index },
        `check-${checkId}`,
      )
      return
    }
    if (!resolution) return

    const done = () => setAppliedCheckIds((prev) => new Set(prev).add(checkId))

    if (action.kind === "rewrite_bullet" && action.targetId && typeof action.index === "number") {
      /**
       * Una reescritura no puede PERDER un término que la vacante busca.
       *
       * El guard vivía en el botón del bloque viejo; se mudó acá, al punto de
       * escritura, que es el único lugar por donde pasa todo lo que toca el CV.
       * Sin él, una línea más linda podía costar la coincidencia que la traía.
       */
      // Los términos que el CV YA dice, según el informe. Salían del crudo del
      // servidor; el informe los tiene con su conteo a los dos lados y es el que
      // se rehace cuando el CV cambia.
      const claimed = (report?.terms ?? []).filter((x) => x.cv > 0).map((x) => x.term)
      const lost = postingTermsLost(resolution.before ?? "", resolution.text, claimed)
      if (lost.length > 0) { toast.error(t("rewrite_loses_terms", { terms: lost.slice(0, 3).join(", ") })); return }
      if (writeBullet(action.targetId, action.index, resolution.before ?? "", resolution.text, true)) done()
      return
    }
    if (action.kind === "rewrite_summary") {
      // spliceSummary devuelve la frase reemplazada en su lugar cuando la
      // reescritura es de una sola oración: escribir el campo entero borraba el
      // resto del párrafo — medido, 56 palabras a 24.
      const current = (sectionData.summary as string) ?? ""
      updateSectionData("summary", spliceSummary(current, resolution.text) as never)
      markFixApplied("fix-summary", resolution.text)
      void runRescore()
      done()
    }
  }

  /**
   * Los arreglos deterministas: sin modelo, sin cuota y sin esperar.
   *
   * Cada uno reusa el escritor que ya existía. Un despachador que escribiera por
   * su cuenta sería una segunda forma de tocar el CV, con su propia manera de
   * perder datos — el defecto que este proyecto ya pagó una vez.
   */
  function fixCheck(checkId: string): void {
    if (!report) return
    const action = allChecks(report).find((c) => c.id === checkId)?.action
    if (!action) return
    const done = () => setAppliedCheckIds((prev) => new Set(prev).add(checkId))

    // Reordenar no es unificar fechas: comparte el tipo de acción para tener
    // botón, pero ejecuta otra cosa. Se rutea por id, como la fusión.
    if (checkId === "format.chronology") { reorderRoles(); done(); return }
    if (action.kind === "fix_dates") { if (fixDates()) done(); return }
    if (action.kind === "remove_duplicates") { if (removeDuplicateBullets()) done(); return }
    if (action.kind === "add_skill" && action.value) { if (addKeywordToSkills(action.value)) done(); return }
    // La errata: una palabra, y la keyword vuelve a contar. Escribe por el MISMO
    // camino que la tarjeta de ortografía — dos escritores sobre el mismo dato es
    // como la pareja se desincroniza, y acá hay uno solo.
    if (action.kind === "replace_text" && action.value && action.replacement) {
      if (applyTypoFix(action.value, action.replacement)) done()
      return
    }
    if (action.kind === "rewrite_bullet" && action.targetId && typeof action.index === "number") {
      // Fragmento partido al importar: la cola vuelve a la línea de arriba. No es
      // una reescritura — es reunir lo que un salto de página cortó.
      const orphan = liveWritingChecks.orphanFragments.find(
        (f) => f.targetId === action.targetId && f.index === action.index,
      )
      if (orphan && writeBullet(orphan.targetId, orphan.index - 1, orphan.previousText, `${orphan.previousText} ${orphan.text}`, false)) done()
    }
  }

  function undoCheck(checkId: string): void {
    setAppliedCheckIds((prev) => { const next = new Set(prev); next.delete(checkId); return next })
  }

  /**
   * Soft skills this posting asks for that no bullet demonstrates yet.
   *
   * Lives here rather than inside the skills card because it now feeds the
   * "bullets to improve" list: a soft skill is never a tag to add — it counts
   * only when a bullet shows the behaviour — so its action WRITES a bullet, and
   * that is the one thing in that list guaranteed to change the CV.
   *
   * Tailor's entries carry a written suggestion so they win a tie; the matcher's
   * plain list is there for when tailor is in cooldown.
   */
  async function handleSubmit() {
    setAddedKeywords(new Set())
    setAppliedItems(new Set())
    await analyze()
    if (!inputIsQuestion && input.trim().length >= 20) {
      setAutoTailorSignal((n) => n + 1)
    }
  }

  // Spelling FIX button — not just "you misspelled X", but one click that replaces
  // the wrong spelling with the right one everywhere in the CV (skills, summary,
  // work bullets), then re-scores. Deterministic word-boundary replace, case kept
  // from the correct term. This is a real solution, not a note.
  // Id of the scroll-target card a gap-plan lever just jumped to (flash highlight).

  function applyTypoFix(typed: string, correct: string): boolean {
    // Same writer as the spelling card — this used to be a second, narrower copy
    // that only touched skills, summary and bullet descriptions, so the identical
    // typo in an education or project line survived a fix that claimed to be
    // applied everywhere. Two write paths over the same user data is how the
    // pair drifts; there is one now.
    const { patch, changed } = applySpellingFix(
      sectionData as unknown as Record<string, unknown>,
      typed,
      correct,
      { includeSkills: true },
    )
    if (!changed) { toast.info(t("typo_not_found")); return false }
    for (const [key, value] of Object.entries(patch)) {
      updateSectionData(key as Parameters<typeof updateSectionData>[0], value as never)
    }
    toast.success(t("typo_fixed", { correct }))
    void runRescore()
    return true
  }

  // Remove a bullet that doesn't earn its place — a real solution, not a tweak.
  // Confirmed in a preview modal first (safety); the index is re-verified against
  // the live text so an edit between analyze and remove never deletes the wrong line.
  const [pendingRemove, setPendingRemove] = useState<{ targetId: string; index: number; text: string } | null>(null)
  function confirmRemoveBullet() {
    if (!pendingRemove) return
    const { targetId, index, text } = pendingRemove
    try {
      const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      const job = work.find((j) => j.id === targetId)
      const bullets = parseBullets(job?.description ?? "")
      const at = job ? resolveBulletIndex(bullets, index, text) : -1
      if (at < 0) {
        // Already gone is the outcome the user wanted. Not an error.
        reportUxFailure("bullet_remove_line_gone", { jobFound: !!job, index, bullets: bullets.length, textLen: text.length })
        toast.info(t("bullet_line_gone"))
        markFixApplied(`bullet-${targetId}-${index}`)
        void runRescore()
        return
      }
      const next = bullets.filter((_, i) => i !== at).map(formatBullet).join("\n")
      updateSectionData("workExperience", work.map((j) => (j.id === targetId ? { ...j, description: next } : j)))
      markFixApplied(`bullet-${targetId}-${index}`)
      toast.success(t("bullet_removed"))
      void runRescore()
    } catch {
      toast.error(t("toast_change_error"))
    } finally {
      setPendingRemove(null)
    }
  }


  function handleConfirmApply() {
    if (!modal) return
    const { suggestion, itemKey } = modal
    const { field, type, preview, targetId } = suggestion

    try {
      const result = applySuggestion(
        { field, type, preview, targetId },
        sectionData as unknown as ResumeSections,
      )

      if (result.status === "unplaceable") {
        reportUxFailure("suggestion_unplaceable", { field: String(field).slice(0, 40), type: String(type).slice(0, 40), hasTarget: !!targetId })
        toast.error(t("toast_change_error"))
        setModal(null)
        return
      }

      if (result.status === "manual") {
        toast.info(t(result.field === "languages" ? "toast_update_languages" : "toast_update_certifications"))
        markFixApplied(itemKey)
        setModal(null)
        return
      }

      updateSectionData(result.section, result.value)

      // El preview es el texto que acaba de entrar al CV: su firma es lo que
      // impide que el análisis siguiente proponga una variante de él.
      markFixApplied(itemKey, suggestion.preview)
      // The bullet we just wrote demonstrates the skill we asked it to
      // demonstrate. Credit it now; waiting for the next full analysis meant the
      // number ignored the work the panel had just talked the user into.
      if (itemKey.startsWith("soft-")) creditSoftSkill(itemKey.slice("soft-".length))
      toast.success(t("toast_change_applied"))
      // The same write also collapses a line the CV stated twice; say it.
      if (result.section === "workExperience" && (result.duplicatesRemoved ?? 0) > 0) {
        toast.info(t("dedupe_done", { count: result.duplicatesRemoved ?? 0 }))
      }
      void runRescore()
    } catch {
      toast.error(t("toast_change_error"))
    } finally {
      setModal(null)
    }
  }

  /**
   * Writes ONE skill into the skills section, in the shape the section uses.
   *
   * The analyst can phrase a suggestion as a sentence ("Crash Reporting and/or
   * the specific analytics tools you have used"); pasting that verbatim puts a
   * paragraph in a chip row. A skill is 1-4 words, and its casing comes from the
   * shared catalog so "objective-c" lands as "Objective-C" like the rest.
   *
   * @returns true when the CV actually gained a skill.
   */
  /**
   * La DECISIÓN vive en `lib/ats/skill-add.ts` y se ejecuta en sus tests; acá
   * queda lo que es del componente: avisar, escribir y volver a puntuar. Estaba
   * todo junto adentro, y ahí lo único que se podía testear era leer que la
   * línea existiera — el defecto que este proyecto ya pagó con `applyAllPlan`.
   */
  function addKeywordToSkills(keyword: string): boolean {
    const plan = planSkillAdd(keyword, sectionData as Record<string, unknown>, () => nanoid())
    if (plan.kind === "not_a_skill") {
      toast.info(t("keyword_not_a_skill"))
      return false
    }
    setAddedKeywords((prev) => new Set(prev).add(keyword))
    if (plan.kind === "already_there") {
      toast.info(t("keyword_already_added", { keyword: plan.name }))
      return false
    }
    updateSectionData("skills", plan.skills)
    toast.success(t("keyword_added", { keyword: plan.name }))
    void runRescore()
    return true
  }

  /**
   * Adds every missing keyword at once — through the SAME normalization the
   * one-by-one button uses. It used to write the raw strings straight into the
   * section, so "Add all" could land casing and near-duplicates that the single
   * add would have cleaned ("objective-c" beside "Objective-C").
   */

  /**
   * Reorder the work history, most recent first.
   *
   * Deterministic: the end date decides, an ongoing role outranks a finished one,
   * and a role with no readable date KEEPS ITS POSITION rather than being guessed
   * into place — inventing an order is the same class of harm as inventing a date.
   * Nothing is deleted and no text is touched; only the sequence changes.
   */


  /**
   * El PLAN vive en `lib/ats/role-order.ts` y se ejecuta en sus tests: mueve los
   * puestos del CV del usuario, y ahí adentro lo único testeable era leer que la
   * línea existiera. Acá queda avisar, escribir y volver a puntuar.
   */
  function reorderRoles(opts: { silent?: boolean } = {}) {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const next = planRoleReorder(work)
    if (!next) {
      if (!opts.silent && work.length >= 2) toast.info(t("cred_order_already"))
      return
    }
    updateSectionData("workExperience", next)
    if (!opts.silent) { toast.success(t("cred_order_done")); void runRescore() }
  }

  /** Drop one or more entries from Skills. Nothing else in the CV is touched. */


  return (
    <>
      <div className="flex flex-col gap-3 pb-4">
        {/* Section header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-dash-cyan to-[#0077B6] shadow-lg shadow-dash-cyan/30">
            <Target className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-slate-800">{t("title")}</span>
          </div>
          <span className="text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-dash-cyan to-[#00A8CC] text-white px-2.5 py-1 rounded-full shadow-sm">
            {t("pro_badge")}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{t("panel_description")}</p>

        {/* Incomplete CV warning */}
        {!cvReady && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 flex flex-col gap-2 mb-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-amber-800">{t("cv_incomplete_title")}</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">{t("cv_incomplete_desc")}</p>
            <div className="flex flex-col gap-1 mt-0.5">
              {[
                { label: t("cv_incomplete_summary"), done: summary.trim().length > 0 },
                { label: t("cv_incomplete_skills"), done: skills.length > 0 },
                { label: t("cv_incomplete_experience"), done: workExp.length > 0 },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-1.5 text-[11px]">
                  {done
                    ? <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                    : <span className="h-3 w-3 rounded-full border-2 border-amber-300 shrink-0 inline-block" />}
                  <span className={done ? "text-emerald-700 font-semibold" : "text-amber-700"}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CV health — the deterministic good/bad verdict, always visible once the
            CV has enough content. Answers "is my CV good?" without needing a job
            posting; the ATS match below then answers "good FOR THIS job?". */}


        {/* Job description is the ONLY input now. The role-title mode was removed:
            it inferred generic requirements and the real analysis needs the posting
            anyway, so it added a confusing half-answer. Paste the vacancy, period. */}

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={jobInputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={roleMode ? t("placeholder_role") : t("placeholder")}
            disabled={!cvReady}
            maxLength={roleMode ? 120 : AI_INPUT_LIMITS.jobDescription}
            className={`w-full resize-none rounded-2xl border border-cyan-100 bg-white/80 backdrop-blur-sm px-4 py-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${roleMode ? "min-h-[52px]" : "min-h-[110px]"}`}
          />
          {!roleMode && input.trim().length > 0 && (
            <span className={`absolute bottom-2.5 right-3 text-[9px] px-2 py-0.5 rounded-full font-bold ${
              inputIsQuestion
                ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200"
            }`}>
              {inputIsQuestion ? t("badge_consulta") : t("badge_ats")}
            </span>
          )}
        </div>

        {!inputIsQuestion && input.trim().length > 0 && (
          <p className="text-[10px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
            <Lightbulb className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
            {t("hint")}
          </p>
        )}

        {/* Analyze button — once a result is on screen and the job input is
            unchanged, it flips to an "up to date" state instead of a live button.
            The ATS score keeps refreshing on its own as the CV is edited (debounced
            rescore, deterministic/no-LLM), so re-running on the SAME posting adds
            nothing; the hint says so. Editing the posting reactivates "Re-analyze". */}
        {upToDate && !loading ? (
          <div className="flex flex-col gap-1.5">
            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t("analysis_up_to_date")}
            </div>
            {atsResult && (
              <p className="text-[10px] text-slate-400 text-center flex items-start justify-center gap-1 leading-relaxed px-2">
                <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" /> {t("live_score_hint")}
              </p>
            )}
          </div>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading || inCooldown || input.trim().length < (roleMode ? 3 : 15) || !cvReady}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-dash-cyan to-[#00A8CC] text-white text-xs font-bold shadow-lg shadow-dash-cyan/30 hover:shadow-dash-cyan/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : inCooldown ? <Clock className="h-3.5 w-3.5" /> : inputIsQuestion && input.trim().length > 0 ? <MessageSquare className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
            {loading ? t("analyzing") : inCooldown ? t("wait", { seconds: cooldownLabel }) : inputIsQuestion && input.trim().length > 0 ? t("button_consultar") : hasResult ? t("re_analyze") : t("analyze")}
          </button>
        )}

        {offTopic && (
          <ATSErrorBlock title={t("off_topic_title")} description={t("off_topic_description")} />
        )}

        {/* ── EL INFORME ────────────────────────────────────────────────────
            Reemplaza al encabezado viejo del puntaje, que imprimía «Excelente»
            —una función pura de `score >= 80`— justo encima de los arreglos
            críticos, y a dos dedos de un «Riesgo medio» que venía de otra
            llamada. Reportado con captura. El riel recibe los críticos, así que
            no puede construirse esa contradicción. */}
        {report && (
          <div className="-mx-1 mb-3 overflow-hidden rounded-2xl">
            <ReportRail
              report={report}
              onSolve={(checkId) => { setFocusCheckId(checkId ?? null); setTailorOpen(true) }}
              onFix={fixCheck}
              onAddTerm={(term) => { addKeywordToSkills(term) }}
              onWeaveTerm={(term) => { void weaveSkill(term, undefined, false) }}
              addedTerms={addedKeywords}
              busyTerm={weavingSoft}
              busy={tailor.loading}
            />
          </div>
        )}

        {/* ATS Results */}
        {atsResult && (
          <div className="space-y-3 pt-1">

            {/* EL ENCABEZADO VIEJO DEL PUNTAJE SE FUE ARRIBA, AL RIEL.

                Imprimía «Excelente» —una función pura de `score >= 80`— justo
                encima de los arreglos críticos y a dos dedos de un «Riesgo
                medio» que venía de otra llamada: tres veredictos, ninguno
                mirando al otro. Reportado con captura, y con razón.

                El riel recibe los críticos, así que esa contradicción ya no se
                puede construir. La verificación contra el PDF real se queda
                acá: es nuestra evidencia más fuerte y cuesta renderizar el
                archivo, así que no pertenece al encabezado. */}
            <div className="flex flex-col items-center gap-1 py-2">
              {/* The real-PDF verification is our strongest evidence and it costs a
                  render of the actual file — it belongs to the résumé pass, not to
                  the third posting of the afternoon. Kept whole, one click away. */}
              {(<>
              {/* Verify against your real PDF — the SAME ATS metric, measured on the
                  actual exported file instead of the structured estimate. Fused into
                  the score so the user sees ONE metric (estimated → verified), never
                  two competing numbers. The real parse is the truth of the file, and
                  nothing is hidden: the engine matrix + extracted text stay expandable. */}
              <div className="mt-2.5 w-full rounded-xl border p-3" style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}>
                {!verifyResult ? (
                  <div className="flex items-center gap-2">
                    <FileSearch className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <p className="text-[10.5px] text-slate-600 leading-snug flex-1 text-left">{t("verify_hint")}</p>
                    <button type="button" onClick={() => void verifyReal()} disabled={verifyLoading}
                      className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 rounded-full px-2.5 py-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {verifyLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <FileSearch className="h-2.5 w-2.5" />}
                      {verifyLoading ? t("verify_loading") : t("verify_button")}
                    </button>
                  </div>
                ) : (() => {
                  const delta = (report?.score ?? 0) - verifyResult.realScore
                  const faithful = delta < FAITHFUL_MAX_DELTA
                  /**
                   * DE QUÉ ES LA DIFERENCIA — y por qué no se puede afirmar.
                   *
                   * Los dos números NO salen del mismo motor: el de arriba es
                   * `computeATSMatch` sobre los datos estructurados, el de abajo es
                   * `analyzeAts` sobre el texto extraído del PDF. Son dos varas
                   * distintas a propósito (directiva en `ats-matcher.ts:9`), así que
                   * restarlas y llamar «lo que pierde tu diseño» al resultado es
                   * atribuir una causa que nadie midió.
                   *
                   * Reportado por el CEO el 2026-08-21 con una plantilla de UNA
                   * columna leyendo «cambiá a una plantilla de una columna». El
                   * mismo defecto ya se había arreglado en la copia en texto plano
                   * de veinte líneas más abajo — y quedó vivo acá.
                   *
                   * Ahora: el consejo del diseño sale SÓLO si el diseño penaliza, y
                   * si no, se nombra lo que el parser realmente no encontró.
                   */
                  const parseIssues = [
                    ...verifyResult.breakdown.format.issues,
                    ...verifyResult.breakdown.sections.missing,
                  ].slice(0, 3)
                  const cause = verifyGapCause({
                    estimated: report?.score ?? 0,
                    real: verifyResult.realScore,
                    templateSafety,
                    parseIssues,
                  })
                  const email = ((sectionData.personalDetails as { email?: string })?.email ?? "").trim().toLowerCase()
                  const contactLost = !!email && !!verifyResult.extractedText && !verifyResult.extractedText.toLowerCase().includes(email)
                  return (
                  <div className="space-y-2">
                    {/* SAME metric, two ways: estimated (from your data) → verified (real file). */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-center">
                        <div className="text-[8.5px] font-bold uppercase tracking-wide text-slate-400">{t("score_estimated")}</div>
                        <div className="text-[17px] font-black text-slate-400 tabular-nums leading-none mt-0.5">{report?.score ?? 0}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                      <div className="text-center">
                        <div className="text-[8.5px] font-bold uppercase tracking-wide text-indigo-500">{t("score_verified")}</div>
                        <div className={`text-[22px] font-black tabular-nums leading-none mt-0.5 ${faithful ? "text-emerald-600" : "text-amber-600"}`}>{verifyResult.realScore}</div>
                      </div>
                    </div>
                    <div className={`flex items-start gap-2 rounded-xl px-3 py-2 ${faithful ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-amber-50 ring-1 ring-amber-200"}`}>
                      {faithful ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />}
                      <p className={`text-[11px] leading-snug text-left ${faithful ? "text-emerald-800" : "text-amber-800"}`}>{cause === "faithful"
                        ? t("verify_faithful")
                        : cause === "layout"
                          ? t("verify_loss", { delta })
                          : cause === "parse"
                            ? t("verify_loss_reading")
                            : t("verify_loss_scale")}</p>
                    </div>
                    {cause === "parse" && (
                      <ul className="space-y-1 pl-1 text-left">
                        {parseIssues.map((x) => (
                          <li key={x} className="flex items-start gap-1.5 text-[10.5px] leading-snug text-amber-900/80">
                            <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                            {x}
                          </li>
                        ))}
                      </ul>
                    )}
                    {contactLost && (
                      <div className="flex items-start gap-2 rounded-xl bg-rose-50 ring-1 ring-rose-200 px-3 py-2">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-rose-800 leading-snug text-left">{t("verify_contact_lost")}</p>
                      </div>
                    )}
                    {/* Nothing hidden: per-engine parse + the exact extracted text, expandable. */}
                    <details className="group">
                      <summary className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:text-indigo-800 select-none text-left">{t("verify_detail_label")}</summary>
                      <div className="mt-2 space-y-2">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-1 text-left">{t("verify_extracted_label")}</p>
                          <pre className="text-[10px] leading-relaxed text-slate-600 bg-white/70 border border-indigo-100 rounded-lg p-2.5 max-h-52 overflow-auto whitespace-pre-wrap break-words text-left">{verifyResult.extractedText}</pre>
                        </div>
                        {/**
                          * La copia en texto plano se ofrece SÓLO a quien la
                          * necesita.
                          *
                          * Reportado: un usuario con una plantilla ATS —una
                          * columna, sin penalización alguna— igual veía "tu
                          * versión ATS para las máquinas" y un botón para
                          * descargar otra. Se lee como "la plantilla que elegiste
                          * no sirve para ATS", justo lo contrario de lo que el
                          * catálogo le vendió y de lo que el score calcula. El
                          * comentario del propio componente lo dice: fue escrito
                          * para quien usa DOS columnas.
                          *
                          * Con una plantilla que ya parsea limpio no hay nada que
                          * ofrecer: se lo decimos y listo.
                          */}
                        {templateSafety === "caution"
                          ? <AtsSafeDownload />
                          : (
                            <p className="text-[10px] leading-relaxed text-emerald-700 bg-emerald-50/60 border border-emerald-100 rounded-lg px-2.5 py-2 text-left">
                              {t("template_already_ats")}
                            </p>
                          )}
                      </div>
                    </details>
                    <button type="button" onClick={() => void verifyReal()} disabled={verifyLoading}
                      className="w-full inline-flex items-center justify-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-all disabled:opacity-50">
                      {verifyLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <FileSearch className="h-2.5 w-2.5" />} {t("verify_reverify")}
                    </button>
                  </div>
                  )
                })()}
              </div>
              </>)}
            </div>

            {/* The recruiter pass failed. Said plainly, with a way out — the
                alternative is a report that is quietly missing a section the
                user has no way of knowing existed. */}
            {atsResult.analysisUnavailable && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start gap-2.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] font-bold text-amber-900 leading-tight">{t("analysis_unavailable_title")}</p>
                  <p className="mt-0.5 text-[10.5px] text-amber-800/90 leading-relaxed">{t("analysis_unavailable_desc")}</p>
                </div>
              </div>
            )}

            {/* The recruiter's read and the arithmetic behind the number are the
                two things worth reading ONCE, carefully — not on every posting.
                Both kept in full, in the résumé pass. */}
            {(<>
            {/* ① Verdict — the recruiter's honest read: would this pass, and the
                biggest risk. The voice that ties the whole report together. */}
            {/* SIN LA INSIGNIA DE `passRisk`.
                Era un SEGUNDO veredicto, emitido por el modelo, pintado al lado
                del puntaje y sin que nadie los comparara: con la nota en 100 podía
                decir «riesgo alto». El mismo defecto del «CRÍTICO» reportado con
                captura, en otro sitio. El puntaje ya contesta si pasás el filtro,
                el dial ya dice si estás listo, y el párrafo de abajo da los
                matices — que es lo que este análisis sí aporta. */}
            {report?.verdict && (
              /**
               * ES UNA CITA, NO UN DATO — y por eso se ve distinta.
               *
               * Alrededor hay tarjetas de datos: números, conteos, chequeos con su
               * peso. Ésta es la única prosa del panel: la lectura de una persona
               * sobre el CV. Tratarla con la misma caja blanca de las demás la
               * hacía parecer otro dato más, y se leía en diagonal.
               *
               * EL ICONO ERA UN ESTETOSCOPIO. No dice nada de un reclutador —
               * decía «diagnóstico médico», que es de otro mundo. `MessageSquareQuote`
               * dice lo que esto es: alguien opinó sobre tu CV.
               *
               * La comilla grande no es decoración: ancla la lectura como cita y
               * es lo que separa esta tarjeta del resto de un vistazo. Va detrás
               * del texto, en violeta muy tenue, sin robarle contraste.
               */
              <div
                className="relative overflow-hidden rounded-xl border p-4"
                style={{
                  borderColor: "var(--a-ai-soft)",
                  background: "var(--a-surface)",
                  boxShadow: "var(--a-sh-sm)",
                }}
              >
                {/* La comilla de apertura, como marca de agua. `aria-hidden` porque
                    no aporta nada al lector de pantalla: el texto ya se lee. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-2 right-2 select-none font-serif text-[86px] leading-none"
                  style={{ color: "var(--a-ai-soft)" }}
                >
                  &rdquo;
                </span>

                <div className="relative">
                  <div className="mb-2.5 flex items-center gap-1.5">
                    <MessageSquareQuote className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--a-ai)" }} />
                    <p
                      className="flex-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: "var(--a-ai-ink)" }}
                    >
                      {t("verdict_title")}
                    </p>
                  </div>

                  {/* PROSA, NO DATO: un punto más grande y con más aire que el
                      resto del panel. Se lee de corrido; lo demás se escanea. */}
                  <p className="text-[12px] leading-[1.6]" style={{ color: "var(--a-ink-2)" }}>
                    {report.verdict}
                  </p>

                  {/* LO QUE FALTABA: decir que esto NO mueve el número, y una salida.
                      Era un párrafo que nombraba defectos («bullets mal escritos»,
                      «duplicación en el resumen») y no llevaba a ninguna parte: el
                      usuario leía el reproche y tenía que buscar solo dónde estaba.
                      Los puntos que nombra ya son chequeos de «lo que mira la
                      persona» —peso 0— así que el botón abre el ejecutor filtrado
                      justo ahí, como opcionales. */}
                  <div
                    className="mt-3 flex flex-wrap items-center gap-2 border-t pt-2.5"
                    style={{ borderColor: "var(--a-border)" }}
                  >
                    <span
                      className="text-[9.5px] font-bold uppercase tracking-[0.06em]"
                      style={{ color: "var(--a-muted-2)" }}
                    >
                      {t("verdict_no_score")}
                    </span>
                    {!!report && solvableChecks(report).some((c) => c.section === "tips") && (
                      <button
                        type="button"
                        onClick={() => { setFocusCheckId(null); setTailorFilter("tips"); setTailorOpen(true) }}
                        className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10.5px] font-bold transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{ background: "var(--a-ai-soft)", color: "var(--a-ai-ink)", outlineColor: "var(--a-ai)" }}
                      >
                        <Sparkles className="h-2.5 w-2.5" /> {t("verdict_open_tips")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Score breakdown — per-category coverage. Lives under ① as score
                detail (not a "fix"), computed server-side, applicable categories only. */}
            </>)}


            {/* The hard requirements this posting states and the CV does not meet.
                They weigh 0.20 — second only to hard skills — and until now they
                were computed, counted in the plan ("2 requirements missing") and
                never listed anywhere: the lever even scrolled to an id that does
                not exist. Nobody could act on a number.

                No Fix button, and that is the honest answer: a licence, a degree
                or three more years is not something we can write into a CV. What
                we can do is name it, so the candidate decides whether to apply.
                Requirements the work history already satisfies are dropped before
                this point, so what is left is genuinely missing.

                Shown in BOTH views on purpose — it decides whether this
                application is worth sending at all. */}
            {/* «Requisitos que faltan» se fue al riel, como el hallazgo
                `hard.requirements`: crítico, con sus puntos reales y con el techo
                de la nota adentro. Acá abajo estaba duplicando lo que el riel ya
                dice arriba, que es exactamente el cruce que este panel vino a
                terminar. */}



            {/* Everything below is the résumé pass: the full report, unchanged.
                It renders exactly as it always did — the only difference is that
                someone with ten postings to send today is not made to read it
                first. Nothing here was removed or weakened. */}
            {/* LO QUE QUEDA ACÁ ABAJO: SÓLO ESTADOS.
                El informe vive en el riel y los arreglos en el ejecutor. Los ocho
                bloques que estaban acá —críticos, refinamientos, camino al
                objetivo, erratas, credibilidad, viñetas, fusión y habilidades—
                se fueron a uno de esos dos. Lo único que sobrevive es lo que no
                es un hallazgo: que el ejecutor todavía está escribiendo, y que
                el informe quedó viejo tras aplicar algo. */}
            {tailor.loading && (
              <div className="flex items-center gap-2 rounded-xl border px-3 py-2"
                style={{ borderColor: "var(--a-border)", background: "var(--a-ai-soft)" }}>
                <Loader2 className="h-3 w-3 animate-spin shrink-0" style={{ color: "var(--a-ai)" }} />
                <p className="text-[10.5px] leading-snug" style={{ color: "var(--a-ink-2)" }}>{t("tailoring_in_progress")}</p>
              </div>
            )}

            {/* EL CARTEL «APLICASTE CAMBIOS EN TU CV» SE FUE.
                No era información: era el informe avisando que no se había
                actualizado, y pasándole el trabajo al usuario. Ya no hace falta.
                `buildPanelReport` corre sobre el CV VIVO en cada edición, los
                chequeos deterministas se recalculan solos, y desde
                `recruiter-verified.ts` un hallazgo del modelo que cita texto que
                tailor acaba de reescribir deja de encontrarse en el documento y
                desaparece por su cuenta. Contaba, además, los hallazgos CRUDOS
                —los de antes de verificar—, así que podía avisar por cosas que
                el panel ya no mostraba en ninguna parte. */}

          </div>
        )}

        {/* Review Results */}
        {reviewResult && (
          <div className="space-y-3 pt-1">
            {/* The deterministic resume score lives in the always-on "CV health"
                card at the top of the panel now — not repeated here, so a general
                review never shows a second, competing number. */}
            {reviewResult.answer && (
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-cyan-50/60 backdrop-blur-sm p-4">
                <p className="text-[10px] font-black tracking-widest uppercase text-blue-600 flex items-center gap-1.5 mb-2.5">
                  <MessageSquare className="h-3.5 w-3.5" /> {t("label_respuesta")}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">{reviewResult.answer}</p>
              </div>
            )}

            {!reviewResult.answer && reviewResult.summary && (
              <div className="rounded-2xl border border-slate-100 bg-white/60 backdrop-blur-sm p-4">
                <p className="text-xs text-slate-600 leading-relaxed">{reviewResult.summary}</p>
              </div>
            )}




          </div>
        )}
      </div>

      {/* Diff modal — rendered outside panel to avoid z-index issues */}
      {/* EL EJECUTOR. Resuelve lo que el informe listó, y nada más. */}
      {tailorOpen && report && (
        <TailorModal
          report={report}
          resolutions={resolutions}
          appliedIds={appliedCheckIds}
          onApply={applyCheck}
          onUndo={undoCheck}
          onApplyAll={() => {
            if (!report) return
            // La lista sale de `applyAllPlan`, que es una función pura y por eso
            // se puede probar de verdad. Antes era un bucle suelto acá adentro y
            // el único test posible era leer que la línea existía.
            const plan = applyAllPlan(report, appliedCheckIds, addedKeywords)
            for (const id of plan.checkIds) applyCheck(id)
            // Los términos se AGREGAN, no se tejen: tejer son cinco llamadas al
            // modelo y cinco esperas. Para el filtro, el término dentro del CV ya
            // cuenta; escribirlo dentro de una viñeta sigue disponible tarjeta por
            // tarjeta, que es la versión que convence a quien entrevista.
            for (const term of plan.terms) addKeywordToSkills(term)
          }}
          onClose={() => { setTailorOpen(false); setFocusCheckId(null) }}
          focusCheckId={focusCheckId}
          initialFilter={tailorFilter}
          onWeaveTerm={(term) => { void weaveSkill(term, undefined, false) }}
          onAddTerm={(term) => { addKeywordToSkills(term) }}
          addedTerms={addedKeywords}
          busyTerm={weavingSoft}
          busy={tailor.loading}
        />
      )}

      {modal && (
        <SuggestionDiffModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={handleConfirmApply}
          suggestion={modal.suggestion}
          currentValue={modal.currentValue}
          // Computed by running the real write — see previewSuggestion.
          afterValue={previewSuggestion(modal.suggestion, sectionData as unknown as ResumeSections)?.after}
        />
      )}

      {/* Inline weak-bullet rewrite (improve-bullet) → diff → apply by index */}
      {bulletFix && (
        <SuggestionDiffModal
          open={true}
          onClose={() => setBulletFix(null)}
          onConfirm={confirmBulletFix}
          suggestion={{
            field: "workExperience.description",
            type: "replace",
            preview: bulletFix.improved,
            // The model's own reason for the change, when it gave one. A rewrite
            // of your own resume that arrives bare can only be accepted on trust.
            reason: bulletFix.why?.trim() || t("content_quality_hint"),
          }}
          currentValue={bulletFix.current}
          /* The same work from another angle. One rewrite leaves a yes/no, and
             "no" used to mean asking the model again — the loop. Picking swaps
             what the preview above shows, so the decision ends here. */
          options={
            bulletFix.options && bulletFix.options.length > 0
              ? [
                  // The model's own pick, first and reselectable: choosing another
                  // angle must not be a one-way door.
                  {
                    text: bulletFix.recommended,
                    label: t("bullet_angle_recommended"),
                    why: bulletFix.recommendedWhy ?? "",
                    active: bulletFix.improved === bulletFix.recommended,
                    onPick: () => setBulletFix({ ...bulletFix, improved: bulletFix.recommended, why: bulletFix.recommendedWhy }),
                  },
                  ...bulletFix.options.map((o) => ({
                    text: o.text,
                    label: t(`bullet_angle_${o.angle}` as "bullet_angle_technical"),
                    why: o.why,
                    active: o.text === bulletFix.improved,
                    onPick: () => setBulletFix({ ...bulletFix, improved: o.text, why: o.why }),
                  })),
                ]
              : undefined
          }
        />
      )}

      {/* Which role does this belong to? Always asked, with our pick marked. */}
      {softPick && (
        <JobPickerModal
          title={t("job_picker_title")}
          subtitle={softPick.recommendedId
            ? t("job_picker_subtitle_recommended", { skill: softPick.skill })
            : t("job_picker_subtitle", { skill: softPick.skill })}
          recommendedId={softPick.recommendedId ?? undefined}
          recommendedLabel={t("job_picker_recommended")}
          jobs={((sectionData.workExperience ?? []) as WorkExperienceItem[])
            .filter((j) => j.id)
            .map((j) => ({
              id: j.id as string,
              jobTitle: j.jobTitle ?? "",
              employer: j.employer ?? "",
              startDate: j.startDate ?? undefined,
              endDate: j.endDate ?? undefined,
            }))}
          onClose={() => setSoftPick(null)}
          onPick={(id) => {
            const picked = softPick
            setSoftPick(null)
            // Chose the recommended role → the bullet is already written; show the
            // diff straight away instead of paying for an identical second call.
            if (picked.recommendedId === id && picked.draft) {
              const job = ((sectionData.workExperience ?? []) as WorkExperienceItem[]).find((j) => j.id === id)
              if (job) {
                setModal({
                  suggestion: {
                    field: "workExperience.description",
                    type: "append",
                    preview: picked.draft,
                    reason: t("prove_skill_reason", { skill: picked.skill }),
                    targetId: id,
                  },
                  currentValue: job.description ?? "",
                  itemKey: `soft-${picked.skill}`,
                })
                return
              }
            }
            void weaveSkill(picked.skill, id, picked.soft)
          }}
        />
      )}

      {/* Remove-bullet confirm — preview the exact line before it's deleted. */}
      {pendingRemove && (
        <SuggestionDiffModal
          open={true}
          onClose={() => setPendingRemove(null)}
          onConfirm={confirmRemoveBullet}
          suggestion={{
            field: "workExperience.description",
            type: "replace",
            preview: t("bullet_remove_preview"),
            reason: t("bullet_remove_reason"),
          }}
          currentValue={pendingRemove.text}
        />
      )}

      {/* Choose the positioning, then confirm the change like any other fix —
          the diff against the current summary is not skipped, it comes next. */}
      <SummaryVersionModal
        open={summaryVersions.length > 0}
        versions={summaryVersions}
        onClose={() => setSummaryVersions([])}
        onSelect={(text) => {
          setSummaryVersions([])
          openSummaryDiff(text, (sectionData.summary as string) ?? "")
        }}
      />
    </>
  )
}
