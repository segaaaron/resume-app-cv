"use client"

import { useState, useRef, useMemo } from "react"
import { useLocale, useTranslations } from "next-intl"
import { apiFetch } from "@/lib/apiFetch"
import { cutReason } from "@/lib/ats/bullet-strength"
import { suggestFigureSlot } from "@/lib/ats/figure-slot"
import { roleRecency } from "@/lib/ats/resume-integrity"
import { spliceSummary } from "@/lib/ats/summary-splice"
import { stripSectionLabel } from "@/lib/ats/strip-label"
import { isKeywordSafe, postingTermsLost } from "@/lib/ats/keyword-safety"
import { resolveBulletFindings } from "@/lib/ats/bullet-findings"
import { resolveBulletIndex } from "@/lib/ats/bullet-locate"
import { reportUxFailure } from "@/lib/client-error-reporter"
import { BULLETS_PER_ROLE_MAX } from "@/lib/ats/scoring-config"
import { parseBullets, formatBullet, serializeBullets, serializeBulletsReporting } from "@/lib/services/ai/shared/bullets"
import SummaryVersionModal, { type SummaryVersion } from "@/components/resume/sections/SummaryVersionModal"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { isApplicableFix, detectWordCorrections } from "@/lib/ats/fix-text"
// Same normalization the matcher used to decide "demonstrated", so an accented
// Spanish skill matches the stored verdict instead of silently missing it.
import { normalizeTerm, termPresent } from "@/lib/ats/vocabulary"
import { computeCredibility, credibilityVerdict } from "@/lib/ats/credibility"
import { fixAxis } from "@/lib/ats/fix-impact"
import { MAX_APPLICATION_ACTIONS, belongsToApplication, leverBelongsToApplication, readyToApply, type PanelMode } from "@/lib/ats/panel-mode"
import { sameSoftRequirement } from "@/lib/ats/skill-dedup"
import { Target, Loader2, CheckCircle2, AlertCircle, Lightbulb, Tag, Plus, Check, MessageSquare, TrendingUp, Wand2, Clock, ShieldCheck, LayoutTemplate, FileSearch, ListChecks, ChevronRight, Layers, Stethoscope, Sparkles, Pencil, PenLine } from "lucide-react"
import { useTailorCV } from "./hooks/useTailorCV"
import AtsEngineMatrix from "./AtsEngineMatrix"
import AtsSafeDownload from "./AtsSafeDownload"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import SuggestionDiffModal, { type Suggestion } from "./SuggestionDiffModal"
import JobPickerModal from "./JobPickerModal"
import type { ResumeSections, SkillItem, WorkExperienceItem } from "@/types/resume"
import { useATSScore, isQuestion, type GapLever } from "./hooks/useATSScore"
import { applySuggestion, previewSuggestion } from "@/lib/services/ai/shared/apply-suggestion"
import { repairableDefects } from "@/lib/services/ai/shared/repairable-defects"
import { assessResumeContent } from "@/lib/services/ai/shared/bullet-quality"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { assessSummary } from "@/lib/services/ai/shared/summary-quality"
import { applySpellingFix } from "@/lib/ats/apply-spelling"
import { findDuplicateSkill } from "@/lib/ats/skill-dedup"
import { displaySkill } from "@/lib/ats/skill-catalog"
import { isPlausibleSkill } from "@/lib/ats/skill-validation"
import { markContentOptimized } from "./hooks/useOptimizedGuard"
import { AXIS_STYLE, RISK_STYLE, ScoreRing, SectionHeader, ATSErrorBlock } from "./ats-panel/presentational"
import { HEALTHY_METRIC_PCT, BULLETS_PAGE, fixLocationLabel, bulletDefects, canAskAI } from "./ats-panel/panel-helpers"
import { normalizeDates } from "@/lib/ats/normalize-dates"
import { useCooldownLabel } from "./hooks/useAICooldown"
import { useCvLanguage } from "./hooks/useCvLanguage"
import { AI_INPUT_LIMITS, ImproveBulletResponseSchema } from "@/lib/services/ai/shared/ai-types"
import { computeResumeScore } from "@/lib/services/ai/shared/resume-score"

/** One colour per number, so the badge and the figure it refers to read as a pair. */
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
  const [mode, setMode] = useState<PanelMode>("application")
  const [fixingAll, setFixingAll] = useState(false)
  /** What the one-press repair actually did, said afterwards instead of a toast. */
  const [fixAllReport, setFixAllReport] = useState<{ done: string[]; gained: number } | null>(null)

  /** Shared AI error copy — quota messages already live there, in both locales. */
  const tAi = useTranslations("editor.ai")
  // The figure hint rewrites the candidate's own sentence, so it has to agree
  // with the language the interface is speaking.
  const locale = useLocale()
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
    scoreDelta: delta,
    verifyReal, verifyResult, verifyLoading,
    cooldownUntil,
  } = useATSScore()
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set())
  const [appliedItems, setAppliedItems] = useState<Set<string>>(new Set())
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
  const [reportStale, setReportStale] = useState(false)

  /** The ONLY writer of applied-state, so nothing can mark a fix done silently. */
  function markFixApplied(key: string) {
    setAppliedItems((prev) => new Set(prev).add(key))
    setReportStale(true)
  }

  // Re-score deterministically after a fix. The hook owns the delta badge now,
  // so a plain edit that moves the score keeps it truthful too.
  async function runRescore(): Promise<number | null> {
    return await rescore()
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
  const [fixDraft, setFixDraft] = useState<
    | { key: string; field: "bullet"; targetId: string; index: number; current: string; draft: string }
    | { key: string; field: "summary"; current: string; draft: string }
    | null
  >(null)
  const [mergingKey, setMergingKey] = useState<string | null>(null)
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
  const fixableDates = useMemo(() => {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const edu = (sectionData.education ?? []) as { startDate?: string; endDate?: string }[]
    return normalizeDates(work).changed + normalizeDates(edu).changed
  }, [sectionData])

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
  const [fixingSummary, setFixingSummary] = useState(false)
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

  async function rewriteSummary() {
    if (fixingSummary) return
    const current = (sectionData.summary as string) ?? ""
    if (!current.trim()) { toast.info(t("summary_empty")); return }
    setFixingSummary(true)
    try {
      const res = await apiFetch("/api/ai/improve-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: current, language: cvLanguage, sectionData }),
      })
      if (!res.ok) { toast.error(t("summary_error")); return }
      const data = await res.json().catch(() => null)
      const list: string[] = Array.isArray(data?.versions)
        ? data.versions.filter((v: unknown): v is string => typeof v === "string" && v.trim().length > 0)
        : []
      const first = list[0] ?? null
      // The engine says so itself when there is nothing to gain; the text check
      // covers the case where it returns the user's own summary back.
      if (data?.status === "already_optimized" || !first || first.trim() === current.trim()) {
        toast.info(t("summary_already_good"))
        return
      }
      // The endpoint writes THREE positionings — executive, specialist, value
      // proposition — and this panel used to keep the first and bin the other
      // two, which were already paid for. Which one fits is the person's call.
      // The label comes from the server: its quality gate reorders the list, so
      // position no longer says which positioning a version was written as.
      if (list.length > 1) {
        const byIndex: SummaryVersion["type"][] = ["executive", "specialist", "value_prop"]
        const types: string[] | undefined = Array.isArray(data?.types) ? data.types : undefined
        setSummaryVersions(list.map((text, i) => ({
          type: (types?.[i] as SummaryVersion["type"]) ?? byIndex[i] ?? "executive",
          text,
        })))
        return
      }
      openSummaryDiff(first, current)
    } catch {
      toast.error(t("summary_error"))
    } finally {
      setFixingSummary(false)
    }
  }

  /**
   * Turns one recruiter finding into the button that repairs it.
   *
   * Every action was validated server-side against the real CV (a bullet index
   * that does not exist arrives as "manual"), so a rendered button always does
   * something. "manual" renders nothing — advice with no false promise.
   */
  /**
   * `proposedText` is the analyst's own replacement wording, already written.
   *
   * Without it the only offer for a weak bullet was "Rewrite" — a second model
   * call to produce text we were already showing on screen — and when the sole
   * shortcoming was a missing number, no offer at all: the report named a
   * critical problem and left the user with no way to act on it.
   *
   * Applying it verbatim is honest even when it carries [placeholders]: we are
   * not inventing the figure, we are marking exactly where the candidate's own
   * number goes, and PlaceholderWarningModal already stops an export that still
   * has one. That is the difference between asking for a number and making one up.
   */
  function renderFixAction(
    action?: { kind: string; targetId?: string; index?: number; value?: string; replacement?: string },
    proposedText?: string,
  ) {
    if (!action || action.kind === "manual") return null
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]

    let label = ""
    let run: (() => void) | null = null
    let busy = false
    // Every action carries a key so the finding can show "applied" instead of an
    // eternally live button. Before this, only rewrite_bullet tracked state: the
    // summary, dates and duplicate actions could be run over and over on a CV
    // that was already fixed.
    let key: string | null = null

    if (action.kind === "rewrite_bullet" && action.targetId && action.index !== undefined) {
      const job = work.find((j) => j.id === action.targetId)
      const bullet = parseBullets(job?.description ?? "")[action.index]
      // Only when a rewrite can actually change something. A bullet whose sole
      // shortcoming is a missing number is not repairable by us — we do not
      // invent figures — so the advice stays and the button does not appear,
      // rather than sending the user to a toast that says it was fine all along.
      const defects = canAskAI(action.targetId, job?.description ?? "", bullet) ? bulletDefects(bullet) : []
      const proposed = proposedText?.trim()
      // isApplicableFix, not a bare length check: once the instruction tail is
      // split off server-side, what remains can be a stub, and replacing a full
      // bullet with half a sentence leaves the CV worse than before the user
      // asked for help. No usable text → no button, same rule as groundFixAction.
      // Same guard as the tailored list: a replacement that reads better and drops
      // a word the posting searches for is a fix that costs the candidate points.
      const jdTermsB = [
        ...(atsResult?.extractedKeywords?.hardSkills ?? []),
        ...(atsResult?.extractedKeywords?.mustHaves ?? []),
      ]
      const lost = proposed ? postingTermsLost(bullet, proposed, jdTermsB) : []
      if (job && bullet && proposed && isApplicableFix(proposed, bullet) && lost.length === 0) {
        // The analyst already wrote the replacement. Offering "Rewrite" here would
        // pay the model to write it a second time; offering nothing — which is
        // what a metric-only defect used to get — left a critical finding dead.
        key = `bullet-${action.targetId}-${action.index}`
        label = t("fix_action_apply_text")
        run = () => setBulletFix({
          targetId: action.targetId as string,
          index: action.index as number,
          current: bullet,
          improved: stripSectionLabel(proposed),
          recommended: stripSectionLabel(proposed),
        })
      } else if (job && bullet && defects.length > 0) {
        // SAME key the bullets list uses: applying from here marks the bullet
        // applied everywhere, instead of leaving a second live button on a line
        // that has already been rewritten.
        key = `bullet-${action.targetId}-${action.index}`
        busy = improvingKey === key
        label = t("fix_action_rewrite_bullet")
        // The REAL defect, not a hardcoded pair. This used to send
        // ["weak_verb","metric"] on every rewrite regardless of what was wrong,
        // which both misled the prompt and made the request unstoppable — the
        // server treats a focus as a claim and now verifies it.
        run = () => improveMetricless(
          { text: bullet, targetId: action.targetId as string, jobTitle: job.jobTitle ?? "", index: action.index as number, reasons: defects },
          key as string,
        )
      }
    } else if (action.kind === "rewrite_summary") {
      // Tailor already wrote a summary for THIS posting during the analysis.
      // Spending a second LLM call to write a generic one — and offering both in
      // the same report — was the duplication this section had. Prefer the text
      // that exists; fall back to the generic rewrite when tailor had nothing.
      const tailored = tailor.tailoredSummary?.trim()
      const currentSummary = ((sectionData.summary as string) ?? "").trim()
      const hasTailored = !!tailored && tailored !== currentSummary

      // The analyst has no memory: every run reads the CV fresh and a model asked
      // to improve prose always finds another variant, so it kept asking for the
      // summary the user had just rewritten — forever. The same deterministic
      // signals the endpoint uses decide here whether a rewrite has anything left
      // to repair. A tailored version is exempt: that is adapting to THIS posting,
      // not fixing a defect, and it costs no call because the text already exists.
      // The analyst's own rewrite, when it wrote one. Free to apply and already
      // on screen — offering a fresh model call instead was paying twice for the
      // same sentence.
      const proposed = proposedText?.trim()
      const hasProposed = !!proposed && proposed.length > 40 && proposed !== currentSummary

      const summaryGood = assessSummary(
        currentSummary,
        (atsResult?.contentQuality?.quantifiedBullets ?? 0) > 0,
      ).alreadyGood
      if (!hasTailored && !hasProposed && summaryGood) return null

      // The key rewriteSummary() already hands the confirm modal — it was being
      // written on confirm and never read back here.
      key = "fix-summary"
      label = t("fix_action_rewrite_summary")
      busy = fixingSummary
      // The analyst quotes ONE sentence and offers a better version of it. Written
      // over the whole field, that deleted the rest of the paragraph — measured on
      // a real summary: 56 words to 24, taking "7 years", "UIKit", "SwiftUI" and a
      // 15% figure with it. spliceSummary puts a sentence-sized rewrite back where
      // it belongs and leaves the rest alone; a full-length rewrite still replaces
      // the field, as it should.
      const applyText = (rawText: string) => () => {
        // The model quotes the section it is fixing, so its replacement often
        // opens with "Professional Summary:". Applied verbatim, that label was
        // printed inside the CV under a heading that already says PERFIL.
        const text = stripSectionLabel(rawText)
        const merged = spliceSummary(currentSummary, text)
        if (!merged) { toast.info(t("summary_fix_unplaceable")); return }
        setModal({
          suggestion: { field: "summary", type: "replace", preview: merged, reason: t("summary_fix_reason") },
          currentValue: currentSummary,
          itemKey: "fix-summary",
        })
      }
      // A rewrite that cannot be placed is not an offer. Deciding it here means
      // the button either works or is not drawn — pressing it to be told "that
      // does not fit any sentence" is the dead end this panel keeps removing.
      const jdTerms = [
        ...(atsResult?.extractedKeywords?.hardSkills ?? []),
        ...(atsResult?.extractedKeywords?.mustHaves ?? []),
      ]
      const placeable = (text?: string) => {
        if (!text) return false
        const merged = spliceSummary(currentSummary, text)
        // Judged on the RESULT, not on the fragment: splicing keeps the other
        // sentences, so a term the fragment drops may still survive the merge.
        // The summary is where the posting's words are densest, which makes it the
        // most expensive place to lose one.
        return merged !== null && isKeywordSafe(currentSummary, merged, jdTerms)
      }
      const canProposed = hasProposed && placeable(proposed)
      const canTailored = hasTailored && placeable(tailored)
      if (!canProposed && !canTailored && summaryGood) return null
      if (canProposed) label = t("fix_action_apply_text")
      run = canProposed
        ? applyText(proposed as string)
        : canTailored
          ? applyText(tailored as string)
          : () => void rewriteSummary()
    } else if (action.kind === "replace_text" && action.value?.trim() && action.replacement?.trim()) {
      // A wording slip gets a wording-sized repair. The whole-paragraph rewrite
      // that used to handle these changed sentences that were already fine, and
      // made the user re-read everything to accept a three-word correction.
      const from = action.value.trim()
      const to = action.replacement.trim()
      key = `fix-text-${from.toLowerCase()}`
      label = t("fix_action_replace_text")
      run = () => {
        // includeSkills: the other half of the same bug. The validator could not
        // see a skill, and the writer would not have written one either — so
        // "Objetive-C" was unfixable from both ends at once.
        const { patch, changed } = applySpellingFix(sectionData, from, to, { includeSkills: true })
        if (!changed) { toast.info(t("typo_not_found")); return }
        for (const [k, v] of Object.entries(patch)) {
          updateSectionData(k as Parameters<typeof updateSectionData>[0], v as never)
        }
        markFixApplied(key as string)
        toast.success(t("typo_fixed", { correct: to }))
        void runRescore()
      }
    } else if (action.kind === "add_skill" && action.value?.trim()) {
      const skill = action.value.trim()
      key = `fix-skill-${skill.toLowerCase()}`
      // If the CV ALREADY has this skill there is nothing to press — but do not
      // call that "applied": the user did not do it, and a finding that says
      // "Applied" about work nobody did destroys trust in every other badge.
      // No button, no badge; the stale-report banner explains the leftover.
      if (((sectionData.skills ?? []) as SkillItem[]).some((sk) => sk.name.toLowerCase() === skill.toLowerCase())) return null
      label = t("fix_action_add_skill", { skill })
      run = () => { if (addKeywordToSkills(skill)) markFixApplied(key as string) }
    } else if (action.kind === "fix_dates") {
      // Nothing this button could change → advice only. See fixableDates.
      if (fixableDates === 0) return null
      key = "fix-dates"
      label = t("fix_action_fix_dates")
      // Mark applied only when a date actually changed. Pressing a button that
      // finds nothing to do and then reports "Applied" is the same lie.
      run = () => { if (fixDates()) markFixApplied(key as string) }
    } else if (action.kind === "remove_duplicates") {
      key = "fix-dupes"
      label = t("dedupe_action")
      run = () => { if (removeDuplicateBullets()) markFixApplied(key as string) }
    }

    if (key && appliedItems.has(key)) {
      return (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold">
          <Check className="h-2.5 w-2.5" /> {t("applied")}
        </span>
      )
    }

    if (!run || !label) return null
    // Which of the two numbers this repair will move, said BEFORE it is pressed.
    // Every fix moves something measurable, but only add_skill touches the ring —
    // and a list headed "critical fixes" whose buttons leave the headline figure
    // untouched reads as a broken product, not as a scoring decision.
    const axis = fixAxis(action.kind)
    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0077B6] to-[#00D4FF] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm transition-all hover:shadow disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          {busy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5" />}
          {label}
        </button>
        {axis && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${AXIS_STYLE[axis]}`}>
            {t(`axis_moves_${axis}` as "axis_moves_match")}
          </span>
        )}
      </div>
    )
  }

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
    markFixApplied(`bullet-${targetId}-${index}`)
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
  const [editingBullet, setEditingBullet] = useState<{ key: string; targetId: string; index: number; current: string; draft: string } | null>(null)
  /** Rows on screen at once — the rest are one click away. */
  const [shownBullets, setShownBullets] = useState(BULLETS_PAGE)

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
  function weaveSoftSkill(skill: string, targetId?: string) {
    return weaveSkill(skill, targetId, true)
  }

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
      const reason = soft
        ? (tailor.softSkillSuggestions.find((s) => s.skill === skill)?.suggestion ?? t("soft_skill_demonstrate"))
        : t("prove_skill_reason", { skill })
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
  const scrollToFirst = (...ids: string[]) => {
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        // Flash a ring on the card we landed on, so the jump isn't disorienting —
        // the user sees exactly where the lever took them.
        setHighlightId(id)
        window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 1800)
        return
      }
    }
  }
  // Class appended to a scroll-target card while it's the freshly-jumped-to one.
  const hlRing = (id: string) => (highlightId === id ? " ring-2 ring-cyan-400 ring-offset-2 ring-offset-white" : "")
  function leverAction(key: GapLever["key"]): (() => void) | null {
    switch (key) {
      // Missing-keyword card can be deduped away when every missing keyword was a
      // typo — fall back to the typo card, which is where the real fix lives then.
      case "hardSkills": return () => scrollToFirst("ats-skills", "ats-typos")
      case "mustHaves": return () => scrollToFirst("ats-gaps")
      // Soft skills live in the §② list only; the Tailor card that used to
      // mirror them here is gone, so jumping to Tailor would land on nothing.
      case "softSkills": return () => scrollToFirst("ats-bullets")
      case "template": return () => window.dispatchEvent(new CustomEvent("editor-switch-tab", { detail: "planillas" }))
      default: return null
    }
  }

  const summary = (sectionData.summary as string) ?? ""
  const workExp = (sectionData.workExperience as unknown[]) ?? []
  const skills = (sectionData.skills as unknown[]) ?? []
  const cvReady = summary.trim().length > 0 && workExp.length > 0 && skills.length > 0

  // Deterministic health verdict (no LLM, no JD) — recomputes live as the CV is
  // edited. This is the honest "is my CV good or bad?" answer, shown always.
  const cvHealth = useMemo(() => computeResumeScore(sectionData as Record<string, unknown>), [sectionData])

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
  const liveWritingChecks = useMemo(
    () => analyzeWriting(sectionData as Record<string, unknown>),
    [sectionData],
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
  const ownedBy = useMemo(() => {
    const cut = new Set<string>()
    for (const r of liveWritingChecks.bulletRanking) {
      for (const w of r.weakest) cut.add(`${r.targetId}-${w.index}`)
    }
    const broken = new Set(liveWritingChecks.orphanFragments.map((f) => `${f.targetId}-${f.index}`))
    const duplicate = new Set(liveWritingChecks.nearDuplicates.map((n) => `${n.targetId}-${n.index}`))
    // Authority order: a broken fragment is not a sentence yet, and a repetition
    // outranks a preference about which line to keep.
    for (const k of broken) { cut.delete(k); duplicate.delete(k) }
    for (const k of duplicate) cut.delete(k)
    return { cut, broken, duplicate }
  }, [liveWritingChecks])
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
  const tailor = useTailorCV({
    jobDescription: input,
    atsMissingKeywords: atsResult?.missingKeywords ?? [],
    autoRunSignal: autoTailorSignal,
  })

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
  const softSkills = useMemo(() => {
    const fromTailor = new Map(tailor.softSkillSuggestions.map((x) => [x.skill.toLowerCase(), x]))
    // Skills the bullets were judged to demonstrate are OFF this list, whichever
    // side proposed them. missingSoftSkills already excludes them — tailor's own
    // suggestions did not, so a behaviour the user had just written a bullet for
    // kept being asked for. That is the "the list only ever grows" report: it
    // could not shrink, because nothing subtracted from it.
    const proven = new Set((atsResult?.demonstratedSoftSkills ?? []).map(normalizeTerm))
    const provenList = atsResult?.demonstratedSoftSkills ?? []
    return [
      ...tailor.softSkillSuggestions,
      ...(atsResult?.missingSoftSkills ?? [])
        .filter((sk) => !fromTailor.has(sk.toLowerCase()))
        .map((skill) => ({ skill, suggestion: "" })),
    ].filter(
      (x) =>
        !appliedItems.has(`soft-${x.skill}`) &&
        !proven.has(normalizeTerm(x.skill)) &&
        // Tailor rewords the requirement, so an exact comparison let the same one
        // return under a new phrasing — the growth report surviving in the corner
        // the first filter did not reach.
        !provenList.some((p) => sameSoftRequirement(p, x.skill)),
    )
  }, [tailor.softSkillSuggestions, atsResult?.missingSoftSkills, atsResult?.demonstratedSoftSkills, appliedItems])
  async function handleSubmit() {
    setAddedKeywords(new Set())
    setAppliedItems(new Set())
    setReportStale(false)
    await analyze()
    if (!inputIsQuestion && input.trim().length >= 20) {
      setAutoTailorSignal((n) => n + 1)
    }
  }

  // Spelling FIX button — not just "you misspelled X", but one click that replaces
  // the wrong spelling with the right one everywhere in the CV (skills, summary,
  // work bullets), then re-scores. Deterministic word-boundary replace, case kept
  // from the correct term. This is a real solution, not a note.
  const [correctedTypos, setCorrectedTypos] = useState<Set<string>>(new Set())
  // Id of the scroll-target card a gap-plan lever just jumped to (flash highlight).
  const [highlightId, setHighlightId] = useState<string | null>(null)

  function applyTypoFix(typed: string, correct: string) {
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
    if (!changed) { toast.info(t("typo_not_found")); return }
    for (const [key, value] of Object.entries(patch)) {
      updateSectionData(key as Parameters<typeof updateSectionData>[0], value as never)
    }
    setCorrectedTypos((prev) => new Set(prev).add(typed))
    toast.success(t("typo_fixed", { correct }))
    void runRescore()
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

      markFixApplied(itemKey)
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
  function addKeywordToSkills(keyword: string): boolean {
    const cleaned = keyword.trim().replace(/^["'“”]+|["'“”.,;:]+$/g, "").trim()
    // Validated against the skills engine, not just by length: a known skill is
    // accepted outright, and anything else has to look like a skill and not be
    // the user's own employer, city or job title.
    if (!isPlausibleSkill(cleaned, sectionData as Record<string, unknown>)) {
      toast.info(t("keyword_not_a_skill"))
      return false
    }
    const name = displaySkill(cleaned)
    const existing = (sectionData.skills ?? []) as SkillItem[]
    // Same spelling, or the same skill under another spelling / the other
    // language — the row must not gain a twin of what is already there.
    if (existing.some((s) => s.name.toLowerCase() === name.toLowerCase()) ||
        findDuplicateSkill(name, existing.map((s) => s.name))) {
      toast.info(t("keyword_already_added", { keyword: name }))
      setAddedKeywords((prev) => new Set(prev).add(keyword))
      return false
    }
    updateSectionData("skills", [
      ...existing,
      { id: nanoid(), name, level: "intermediate" as const },
    ])
    setAddedKeywords((prev) => new Set(prev).add(keyword))
    toast.success(t("keyword_added", { keyword: name }))
    void runRescore()
    return true
  }

  /**
   * Adds every missing keyword at once — through the SAME normalization the
   * one-by-one button uses. It used to write the raw strings straight into the
   * section, so "Add all" could land casing and near-duplicates that the single
   * add would have cleaned ("objective-c" beside "Objective-C").
   */
  function addAllKeywords(opts: { silent?: boolean } = {}) {
    const existing = (sectionData.skills ?? []) as SkillItem[]
    const candidates = (atsResult?.missingKeywords ?? []).filter((kw) => isPlausibleSkill(kw, sectionData as Record<string, unknown>))
    const added: SkillItem[] = []
    const seen = existing.map((s) => s.name)
    for (const kw of candidates) {
      const name = displaySkill(kw.trim())
      if (seen.some((n) => n.toLowerCase() === name.toLowerCase()) || findDuplicateSkill(name, seen)) continue
      added.push({ id: nanoid(), name, level: "intermediate" as const })
      seen.push(name)
    }
    if (added.length === 0) { if (!opts.silent) toast.info(t("toast_keywords_already")); return }
    updateSectionData("skills", [...existing, ...added])
    setAddedKeywords((prev) => { const next = new Set(prev); candidates.forEach((kw) => next.add(kw)); return next })
    if (!opts.silent) { toast.success(t("keywords_added", { count: added.length })); void runRescore() }
  }

  /**
   * Reorder the work history, most recent first.
   *
   * Deterministic: the end date decides, an ongoing role outranks a finished one,
   * and a role with no readable date KEEPS ITS POSITION rather than being guessed
   * into place — inventing an order is the same class of harm as inventing a date.
   * Nothing is deleted and no text is touched; only the sequence changes.
   */
  /**
   * Would pressing "put the most recent first" actually change anything?
   *
   * Drawn from the same comparator the action uses, so the button cannot appear
   * and then answer "your roles are already in order" — which is exactly what it
   * did, one line under a finding telling the user they were backwards. A button
   * with nothing to do is worse than no button.
   */
  function wouldReorderRoles(): boolean {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const dated = work
      .map((j, i) => ({ i, r: roleRecency({ startDate: j.startDate, endDate: j.endDate, currentlyWorking: j.currentlyWorking }) }))
      .filter((x) => x.r !== null)
    if (dated.length < 2) return false
    const sorted = [...dated].sort((a, b) => (b.r as number) - (a.r as number) || a.i - b.i)
    return sorted.some((x, k) => x.i !== dated[k].i)
  }

  /**
   * One press: everything the code can repair on its own.
   *
   * The ask, in the CEO's words: "press fix and the score goes up as far as it
   * can." Everything in here is deterministic and reversible-looking to the
   * user — no model call, no invented fact, nothing that changes what the résumé
   * CLAIMS. It adds keywords the posting asks for and the CV can plausibly carry,
   * collapses lines written twice, puts the roles in the order a recruiter
   * expects and unifies the date format. What it cannot do — a figure only the
   * candidate has, a licence they either hold or not, evidence for a skill — is
   * left to the short list below, honestly labelled.
   *
   * State is read FRESH from the store at each step. Reading `sectionData` from
   * the closure would hand every step the same pre-edit snapshot and the last
   * write would silently undo the first three.
   */
  async function fixEverythingSafe() {
    if (fixingAll) return
    setFixingAll(true)
    const done: string[] = []
    try {
      const read = () => useResumeStore.getState().sectionData as Record<string, unknown>

      // 1. Keywords the posting asks for. The single largest lever (.45), and the
      //    only one of these that moves the match at all.
      const kwBefore = ((read().skills ?? []) as SkillItem[]).length
      addAllKeywords({ silent: true })
      const kwAdded = ((useResumeStore.getState().sectionData.skills ?? []) as SkillItem[]).length - kwBefore
      if (kwAdded > 0) done.push(t("fix_all_did_keywords", { count: kwAdded }))

      // 2. Lines written twice. Credibility, and it can never lose information —
      //    the surviving copy is identical.
      const work = (read().workExperience ?? []) as WorkExperienceItem[]
      let removed = 0
      const deduped = work.map((j) => {
        const bullets = parseBullets(j.description ?? "")
        if (bullets.length === 0) return j
        const next = serializeBullets(bullets)
        const after = parseBullets(next)
        if (after.length === bullets.length) return j
        removed += bullets.length - after.length
        return { ...j, description: next }
      })
      if (removed > 0) {
        updateSectionData("workExperience", deduped)
        done.push(t("fix_all_did_duplicates", { count: removed }))
      }

      // 3. Reverse-chronological order. Undated rows keep their place.
      if (wouldReorderRoles()) {
        reorderRoles({ silent: true })
        done.push(t("fix_all_did_order"))
      }

      // 4. One date format. A bare year stays a bare year — writing "01/2015"
      //    over "2015" would invent a month, and inventing tenure is worse than
      //    a mixed format.
      const w2 = normalizeDates((useResumeStore.getState().sectionData.workExperience ?? []) as WorkExperienceItem[])
      const e2 = normalizeDates((useResumeStore.getState().sectionData.education ?? []) as { startDate?: string; endDate?: string }[])
      if (w2.changed > 0) updateSectionData("workExperience", w2.rows)
      if (e2.changed > 0) updateSectionData("education", e2.rows as never)
      if (w2.changed + e2.changed > 0) done.push(t("fix_all_did_dates", { count: w2.changed + e2.changed }))

      if (done.length === 0) {
        // "Nothing left" printed above a card offering "+20" reads as the panel
        // arguing with itself. Both are true and they are about different things:
        // the button repairs what code can repair, and what is left is a
        // requirement only the candidate can meet. Say which.
        const gaps = (atsResult?.gaps ?? []).length
        toast.info(gaps > 0 ? t("fix_all_nothing_gaps", { count: gaps }) : t("fix_all_nothing"))
        return
      }
      // rescore() returns the movement it measured; asking a ref afterwards would
      // race with React's own update.
      const delta = await runRescore()
      setFixAllReport({ done, gained: Math.max(0, delta ?? 0) })
    } catch {
      toast.error(t("toast_change_error"))
    } finally {
      setFixingAll(false)
    }
  }

  function reorderRoles(opts: { silent?: boolean } = {}) {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    if (work.length < 2) return
    // The SAME reading the check uses. This used to parse MM/YYYY and treat a
    // bare year as unreadable, so on a résumé written "2015 – 2016" every row
    // ranked null, nothing sorted, and the button answered "already in order" to
    // the very finding that had just told the user they were backwards.
    const rank = (j: WorkExperienceItem): number | null =>
      roleRecency({
        jobTitle: j.jobTitle,
        startDate: j.startDate,
        endDate: j.endDate,
        currentlyWorking: j.currentlyWorking,
      })
    // Undated rows keep their index; dated rows sort among the positions dated
    // rows already occupy. So a partially dated history is improved, never
    // scrambled.
    const dated = work.map((j, i) => ({ j, i, r: rank(j) })).filter((x) => x.r !== null)
    const slots = dated.map((x) => x.i)
    const sorted = [...dated].sort((a, b) => (b.r as number) - (a.r as number) || a.i - b.i)
    if (sorted.every((x, k) => x.i === slots[k])) {
      if (!opts.silent) toast.info(t("cred_order_already"))
      return
    }
    const next = [...work]
    slots.forEach((slot, k) => { next[slot] = sorted[k].j })
    updateSectionData("workExperience", next)
    if (!opts.silent) { toast.success(t("cred_order_done")); void runRescore() }
  }

  /** Drop one or more entries from Skills. Nothing else in the CV is touched. */
  function removeSkills(names: string[]) {
    const skills = (sectionData.skills ?? []) as { id?: string; name?: string }[]
    const drop = new Set(names.map((n) => n.trim().toLowerCase()))
    const next = skills.filter((sk) => !drop.has((sk.name ?? "").trim().toLowerCase()))
    if (next.length === skills.length) { toast.info(t("typo_not_found")); return }
    updateSectionData("skills", next as never)
    toast.success(t("cred_degree_removed", { count: skills.length - next.length }))
    void runRescore()
  }


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

        {/* ATS Results */}
        {atsResult && (
          <div className="space-y-3 pt-1">
            {/* ── ① Verdict + score ────────────────────────────────────────── */}
            <SectionHeader n={1} title={t("section_verdict")} />

            {/* Score section */}
            <div className="flex flex-col items-center gap-1 py-2">
              <ScoreRing score={atsResult.score} label={t("score_label")} />
              {/* The second number, next to the first, because the first one alone
                  taught the wrong lesson.
                  The ring is coverage against THIS posting: it moves when a skill
                  the posting asked for appears, and by design it cannot move when
                  a bullet is rewritten. A candidate who quantified three bullets
                  and watched 53 stay 53 concluded the tool was broken — and the
                  only lever they could see rewarded stuffing the skills list,
                  which is the behaviour this product argues against.
                  Content strength is computed live from the CV, no model and no
                  posting involved, so the work that the ring ignores lands
                  somewhere visible the moment it is typed. */}
              <div className="mt-1 grid w-full max-w-[280px] grid-cols-2 gap-2">
                <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 px-2.5 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wide text-cyan-700">{t("axis_match")}</p>
                  <p className="text-lg font-black leading-none text-[#1a2e4a] tabular-nums">{atsResult.score}</p>
                  <p className="mt-0.5 text-[9px] leading-snug text-slate-500">{t("axis_match_moves")}</p>
                </div>
                <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-2.5 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wide text-violet-700">{t("axis_content")}</p>
                  <p className="text-lg font-black leading-none text-[#1a2e4a] tabular-nums">{cvHealth.overall}</p>
                  <p className="mt-0.5 text-[9px] leading-snug text-slate-500">{t("axis_content_moves")}</p>
                </div>
              </div>
              {delta !== null && delta > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10.5px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <TrendingUp className="h-3 w-3 shrink-0" /> {t("score_delta", { delta })}
                </span>
              )}
              <p className="text-sm font-bold text-slate-800">{atsResult.label}</p>
              <p className="text-[11px] text-slate-500 text-center leading-relaxed max-w-[240px]">{atsResult.summary}</p>

              {/* S2 — target guidance: motivate toward the 80%+ ATS threshold */}
              {atsResult.score >= 80 ? (
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10.5px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  {t("score_target_reached")}
                </span>
              ) : (
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[10.5px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  <TrendingUp className="h-3 w-3 shrink-0" />
                  {t("score_target_below")}
                </span>
              )}

              {/* The real-PDF verification is our strongest evidence and it costs a
                  render of the actual file — it belongs to the résumé pass, not to
                  the third posting of the afternoon. Kept whole, one click away. */}
              {mode === "resume" && (<>
              {/* Verify against your real PDF — the SAME ATS metric, measured on the
                  actual exported file instead of the structured estimate. Fused into
                  the score so the user sees ONE metric (estimated → verified), never
                  two competing numbers. The real parse is the truth of the file, and
                  nothing is hidden: the engine matrix + extracted text stay expandable. */}
              <div className="w-full mt-2.5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-3">
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
                  const delta = atsResult.score - verifyResult.realScore
                  const faithful = delta < 8
                  const email = ((sectionData.personalDetails as { email?: string })?.email ?? "").trim().toLowerCase()
                  const contactLost = !!email && !!verifyResult.extractedText && !verifyResult.extractedText.toLowerCase().includes(email)
                  return (
                  <div className="space-y-2">
                    {/* SAME metric, two ways: estimated (from your data) → verified (real file). */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="text-center">
                        <div className="text-[8.5px] font-bold uppercase tracking-wide text-slate-400">{t("score_estimated")}</div>
                        <div className="text-[17px] font-black text-slate-400 tabular-nums leading-none mt-0.5">{atsResult.score}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                      <div className="text-center">
                        <div className="text-[8.5px] font-bold uppercase tracking-wide text-indigo-500">{t("score_verified")}</div>
                        <div className={`text-[22px] font-black tabular-nums leading-none mt-0.5 ${faithful ? "text-emerald-600" : "text-amber-600"}`}>{verifyResult.realScore}</div>
                      </div>
                    </div>
                    <div className={`flex items-start gap-2 rounded-xl px-3 py-2 ${faithful ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-amber-50 ring-1 ring-amber-200"}`}>
                      {faithful ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />}
                      <p className={`text-[11px] leading-snug text-left ${faithful ? "text-emerald-800" : "text-amber-800"}`}>{faithful ? t("verify_faithful") : t("verify_loss", { delta })}</p>
                    </div>
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
                        {verifyResult.engines && <AtsEngineMatrix simulation={verifyResult.engines} />}
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mb-1 text-left">{t("verify_extracted_label")}</p>
                          <pre className="text-[10px] leading-relaxed text-slate-600 bg-white/70 border border-indigo-100 rounded-lg p-2.5 max-h-52 overflow-auto whitespace-pre-wrap break-words text-left">{verifyResult.extractedText}</pre>
                        </div>
                        <AtsSafeDownload />
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
            {mode === "resume" && (<>
            {/* ① Verdict — the recruiter's honest read: would this pass, and the
                biggest risk. The voice that ties the whole report together. */}
            {atsResult.analysis?.verdict?.trim() && (() => {
              const risk = RISK_STYLE[atsResult.analysis.passRisk] ?? RISK_STYLE.medium
              return (
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Stethoscope className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <p className="text-[10px] font-black tracking-widest uppercase text-indigo-600 flex-1">{t("verdict_title")}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${risk.chip}`}>
                      {atsResult.analysis.passRisk === "low" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                      {t(risk.label)}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-700 leading-relaxed">{atsResult.analysis.verdict}</p>
                </div>
              )
            })()}

            {/* Score breakdown — per-category coverage. Lives under ① as score
                detail (not a "fix"), computed server-side, applicable categories only. */}
            </>)}

            {/* ── The two-minute view ──────────────────────────────────────────
                Three actions, chosen by one rule: it moves the match with THIS
                posting, or the résumé gets thrown out before a human reads it.
                Every one keeps the same Fix button it has in the full report —
                this is the same machinery, filtered and ranked, not a new one. */}
            {mode === "application" && (() => {
              const plan = (atsResult.gapPlan ?? []).filter((l) => leverBelongsToApplication(l.key))
              const matchFixes = (atsResult.analysis?.criticalFixes ?? [])
                .filter((f) => belongsToApplication(f.action?.kind) && !appliedItems.has(`fix-skill-${f.action?.value?.trim().toLowerCase()}`))
              const missingKw = (atsResult.missingKeywords ?? []).filter((kw) => !addedKeywords.has(kw))
              const templateSafe = atsResult.templateSafety !== "caution"
              const ready = readyToApply(
                atsResult.scoreBreakdown?.categories.find((c) => c.category === "hardSkills")?.coveragePct ?? null,
                templateSafe,
              )
              const rows = plan.slice(0, MAX_APPLICATION_ACTIONS)

              return (
                <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/50 p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 shrink-0 text-cyan-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-600">{t("apply_mode_title")}</p>
                  </div>

                  {/* One press, then the truth about what it did.
                      Everything inside is deterministic: keywords the posting
                      asks for, lines written twice, role order, date format.
                      Nothing here invents a fact or changes what the résumé
                      claims — which is exactly why it can run without asking. */}
                  {fixAllReport ? (
                    <div className="mb-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5">
                      <p className="text-[11px] font-bold leading-snug text-emerald-900">
                        {fixAllReport.gained > 0 ? t("fix_all_done", { points: fixAllReport.gained }) : t("fix_all_done_nopoints")}
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {fixAllReport.done.map((d) => (
                          <li key={d} className="text-[10px] leading-snug text-emerald-800/90">• {d}</li>
                        ))}
                      </ul>
                      <p className="mt-1.5 text-[10px] leading-relaxed text-emerald-800/80">{t("fix_all_rest")}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void fixEverythingSafe()}
                      disabled={fixingAll}
                      className="mb-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0077B6] to-[#00D4FF] px-3 py-2.5 text-[11px] font-black text-white shadow-sm transition-all hover:shadow disabled:opacity-50 cursor-pointer"
                    >
                      {fixingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                      {fixingAll ? t("fix_all_working") : t("fix_all_button")}
                    </button>
                  )}

                  {/* The stop rule. Coverage past this point is stuffing, which
                      modern parsers penalise — and a tool that never says "done"
                      teaches people to keep editing a résumé that was ready. */}
                  {/* Nothing left to do here, whether or not the coverage cleared
                      the bar: a headline promising "the fastest things to change"
                      over an empty list is the worst version of this card. Below
                      the bar with nothing to act on is a real state — every lever
                      applied, coverage still short — and it gets an honest line
                      instead of a blank. */}
                  {rows.length === 0 && missingKw.length === 0 && matchFixes.length === 0 ? (
                    ready ? (
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-[11px] font-bold leading-snug text-emerald-900">{t("apply_mode_ready")}</p>
                        <p className="mt-0.5 text-[10.5px] leading-snug text-emerald-800/80">{t("apply_mode_ready_body")}</p>
                      </div>
                    </div>
                    ) : (
                      <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10.5px] leading-relaxed text-slate-600">
                        {t("apply_mode_nothing_left")}
                      </p>
                    )
                  ) : (
                    <>
                      <p className="mb-2.5 text-[11px] leading-relaxed text-slate-600">{t("apply_mode_subtitle")}</p>
                      <ul className="flex flex-col gap-1.5">
                        {/* One button for every missing keyword, not one card each.
                            Same writer as the single add, so casing and near
                            duplicates are cleaned exactly the same way. */}
                        {missingKw.length > 0 && (
                          <li className="flex items-center gap-2.5 rounded-xl border border-cyan-200 bg-white px-3 py-2.5">
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-600" />
                            <span className="flex-1 text-[11px] leading-snug text-slate-700">
                              {t("apply_mode_keywords", { count: missingKw.length })}
                            </span>
                            <button
                              type="button"
                              onClick={() => addAllKeywords()}
                              className="shrink-0 rounded-full bg-gradient-to-r from-[#0077B6] to-[#00D4FF] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm transition-all hover:shadow cursor-pointer"
                            >
                              {t("apply_mode_add_all")}
                            </button>
                          </li>
                        )}
                        {rows.map((lever) => {
                          const action = leverAction(lever.key)
                          // The levers scroll to cards that live in the full
                          // report, and in this view those cards are not mounted —
                          // the click would land on nothing. Open the report first,
                          // then scroll, on the next frame so the target exists.
                          // A button that goes nowhere was removed from this panel
                          // once already; it is not coming back through a fold.
                          const go = action
                            ? () => { setMode("resume"); requestAnimationFrame(() => action()) }
                            : undefined
                          return (
                            <li
                              key={lever.key}
                              onClick={go}
                              className={`flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white/70 px-3 py-2.5 transition-all ${go ? "cursor-pointer hover:border-cyan-200 hover:bg-cyan-50/40" : ""}`}
                            >
                              <TrendingUp className="h-3.5 w-3.5 shrink-0 text-cyan-600" />
                              <span className="flex-1 text-[11px] leading-snug text-slate-700">
                                {t(`path_lever_${lever.key}`, { count: lever.missingCount ?? 0 })}
                              </span>
                              <span className="shrink-0 text-[10px] font-black tabular-nums text-cyan-700">+{lever.points}</span>
                            </li>
                          )
                        })}
                        {/* A recruiter-level fix that adds a keyword keeps its own
                            button — the action is grounded server-side, so it
                            either edits the right place or is not drawn at all. */}
                        {matchFixes.slice(0, MAX_APPLICATION_ACTIONS).map((f, i) => (
                          <li key={`amf-${i}`} className="rounded-xl border border-slate-100 bg-white/70 px-3 py-2.5">
                            <p className="text-[11px] font-bold leading-snug text-[#1a2e4a]">{f.issue}</p>
                            {renderFixAction(f.action, f.fix)}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {/* Everything else, one click away and untouched. Nothing here
                      was deleted; it stopped competing for the attention of
                      someone who has ten more postings to send today. */}
                  <button
                    type="button"
                    onClick={() => setMode("resume")}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
                  >
                    <ListChecks className="h-3 w-3" /> {t("apply_mode_see_all")}
                  </button>
                </div>
              )
            })()}

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
            {(atsResult.gaps?.length ?? 0) > 0 && (
              <div id="ats-gaps" className={`rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 scroll-mt-4 transition-all duration-500${hlRing("ats-gaps")}`}>
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
                  <AlertCircle className="h-3 w-3" /> {t("gaps_title")}
                </p>
                <ul className="space-y-1">
                  {(atsResult.gaps ?? []).slice(0, 4).map((g, i) => (
                    <li key={`gap-${i}`} className="text-[11px] leading-snug text-slate-700">• {g}</li>
                  ))}
                </ul>
                <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{t("gaps_hint")}</p>
                {/* The honest answer to "how do I get to 100 on this posting".
                    Hard requirements are a fifth of the score, and no amount of
                    keywords or rewriting touches them — so a candidate who does
                    not meet them has a ceiling, and being told where it is beats
                    hunting for improvements that cannot exist. */}
                {(() => {
                  const must = atsResult.scoreBreakdown?.categories.find((c) => c.category === "mustHaves")
                  if (!must || (must.coveragePct ?? 0) >= 100) return null
                  const ceiling = Math.max(0, 100 - Math.round(must.recoverable))
                  return (
                    <p className="mt-1.5 rounded-lg bg-white/70 px-2 py-1.5 text-[10px] font-semibold leading-relaxed text-amber-900 ring-1 ring-amber-200">
                      {t("gaps_ceiling", { ceiling })}
                    </p>
                  )
                })()}
              </div>
            )}

            {mode === "resume" && (
              <button
                type="button"
                onClick={() => setMode("application")}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50/60 px-3 py-2 text-[10.5px] font-bold text-cyan-800 transition-colors hover:bg-cyan-100/60 cursor-pointer"
              >
                <Target className="h-3 w-3" /> {t("apply_mode_back")}
              </button>
            )}

            {/* Everything below is the résumé pass: the full report, unchanged.
                It renders exactly as it always did — the only difference is that
                someone with ten postings to send today is not made to read it
                first. Nothing here was removed or weakened. */}
            {mode === "resume" && (<>
            {/* ── ② What to fix — by impact. Header only when there is at least one
                thing to fix, so a near-perfect CV never shows an empty section. ── */}
            {(() => {
              const typoSet = new Set((atsResult.typoWarnings ?? []).map((w) => w.keyword.toLowerCase()))
              const missingKwLeft = (atsResult.missingKeywords ?? []).filter((kw) => !typoSet.has(kw.toLowerCase()))
              const hasFixes =
                (atsResult.analysis?.criticalFixes?.length ?? 0) > 0 ||
                (atsResult.score < 90 && (atsResult.gapPlan?.length ?? 0) > 0) ||
                (atsResult.typoWarnings?.length ?? 0) > 0 ||
                atsResult.templateSafety === "caution" ||
                liveContentQuality.totalBullets > 0 ||
                (atsResult.gaps?.length ?? 0) > 0 ||
                missingKwLeft.length > 0
              return hasFixes ? <SectionHeader n={2} title={t("section_fixes")} /> : null
            })()}

            {/* The findings are a snapshot of the CV as it was when analyzed. Once a
                fix lands, the untouched ones may be describing text that no longer
                exists — saying so beats letting the user chase a defect they already
                repaired. The score above stays live; only these need a new pass. */}
            {/* Tailor runs behind the analysis, so its rewrites land a few seconds
                after the rest of the report. Without this the list looks final
                while more fixes are still on their way. */}
            {tailor.loading && (
              <div className="flex items-center gap-2 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2">
                <Loader2 className="h-3 w-3 animate-spin text-cyan-600 shrink-0" />
                <p className="text-[10.5px] text-cyan-800 leading-snug">{t("tailoring_in_progress")}</p>
              </div>
            )}

            {reportStale && (atsResult.analysis?.criticalFixes?.length ?? 0) > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-amber-900 leading-snug">{t("report_stale_title")}</p>
                  <p className="text-[10.5px] text-amber-800/80 leading-snug mt-0.5">{t("report_stale_body")}</p>
                </div>
              </div>
            )}

            {/* Recruiter critical fixes — what a keyword matcher can't see (layout,
                weak metrics, language mix, structure), ranked, each: issue → why →
                fix. Typos and missing keywords live in their own cards below, deduped. */}
            {/* Two lists, because they are two different claims.
                The model grades every finding high or medium and both used to sit
                under one heading that said CRITICAL — so a report could open by
                calling the summary "strong" and then file it as critical, which
                is the contradiction that made the whole section feel arbitrary.
                High is what costs the interview; medium is refinement, and it is
                collapsed so it never competes with the real problems. */}
            {(() => {
              const all = atsResult.analysis?.criticalFixes ?? []
              const high = all.filter((f) => f.severity === "high")
              const medium = all.filter((f) => f.severity !== "high")

              const renderFix = (f: (typeof all)[number], i: number, tone: "high" | "medium") => (
                <li key={i} className="rounded-xl border border-slate-100 bg-white/70 p-3">
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${tone === "high" ? "bg-rose-500" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] font-semibold text-slate-800 leading-snug">{f.issue}</p>
                      {(() => {
                        const where = fixLocationLabel(f.action, (sectionData.workExperience ?? []) as WorkExperienceItem[], t)
                        return where ? (
                          <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold text-slate-600">
                            <Layers className="h-2.5 w-2.5" /> {where}
                          </p>
                        ) : null
                      })()}
                      {f.why?.trim() && <p className="text-[10.5px] text-slate-500 leading-snug mt-1">{f.why}</p>}
                      {f.fix?.trim() && (
                        <p className="text-[10.5px] text-emerald-700 leading-snug mt-1 flex items-start gap-1">
                          <Wand2 className="h-3 w-3 shrink-0 mt-0.5" /> <span>{f.fix}</span>
                        </p>
                      )}
                      {/* What only the candidate knows, kept OUT of the text above.
                          It used to be the tail of the same sentence, so "Apply this
                          text" wrote "add the release volume you can defend" into the
                          resume. Named with a label and an icon rather than by colour
                          alone, so the split is legible without relying on hue. */}
                      {f.needsFromYou?.trim() && (
                        <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2 py-1.5">
                          <p className="text-[9.5px] font-bold uppercase tracking-wide text-amber-700 flex items-center gap-1">
                            <PenLine className="h-2.5 w-2.5 shrink-0" /> {t("fix_needs_from_you")}
                          </p>
                          <p className="text-[10.5px] text-amber-900 leading-snug mt-0.5">{f.needsFromYou}</p>
                        </div>
                      )}
                      {/* The button the finding earns. Absent on purpose when
                          nothing in the editor can do it in one click. */}
                      {(() => {
                        const a = f.action as { kind?: string; targetId?: string; index?: number } | undefined
                        const needs = f.needsFromYou?.trim()
                        const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
                        const job = a?.targetId ? work.find((j) => j.id === a.targetId) : undefined
                        const currentBullet =
                          job && a?.kind === "rewrite_bullet" && a.index !== undefined
                            ? (parseBullets(job.description ?? "")[a.index] ?? "")
                            : ""
                        /* The summary needs the same door as a bullet. It was left out
                           of the first version and that is exactly the hole reported:
                           a finding that asks for a figure, on the one field where the
                           only offer was to paste text that still lacks it. */
                        const currentSummary = a?.kind === "rewrite_summary" ? ((sectionData.summary as string) ?? "") : ""
                        const editTarget: { key: string; current: string } | null =
                          needs && f.fix?.trim()
                            ? currentBullet
                              ? { key: `fixdraft-${a!.targetId}-${a!.index}`, current: currentBullet }
                              : currentSummary.trim()
                                ? { key: "fixdraft-summary", current: currentSummary }
                                : null
                            : null
                        // Only when there is real text to replace AND something only
                        // the candidate knows. Otherwise the normal button stands.
                        if (!editTarget) {
                          const drawn = renderFixAction(f.action, f.fix)
                          if (drawn) return drawn
                          /* A finding with no engine behind it, that is nevertheless
                             the most certain fix in the report: a typo, with the
                             corrected word already written. It had no button at all
                             — the panel named the defect, showed the answer, and
                             sent the user off to find the word by hand. Only drawn
                             when the misspelling is really in the CV. */
                          const corrections = f.fix?.trim() ? detectWordCorrections(f.issue, f.fix) : []
                          /* Presence checked with the SAME reader that will do the
                             writing, not a regex over the serialized state: that
                             matched field names and any string anywhere, so the
                             button could appear for a word the writer would then
                             fail to find. One reader, one answer. */
                          const present = corrections.filter(
                            (c) =>
                              applySpellingFix(sectionData as unknown as Record<string, unknown>, c.from, c.to, {
                                includeSkills: true,
                              }).changed,
                          )
                          if (present.length === 0) return null
                          const cKey = `typo-${present.map((c) => c.from).join("-")}`
                          if (appliedItems.has(cKey)) {
                            return (
                              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold">
                                <Check className="h-2.5 w-2.5" /> {t("applied")}
                              </span>
                            )
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                for (const c of present) applyTypoFix(c.from, c.to)
                                markFixApplied(cKey)
                              }}
                              className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#1a2e4a] px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-[#24405f] cursor-pointer"
                            >
                              <Wand2 className="h-2.5 w-2.5" />
                              {t("fix_action_correct_word", { from: present[0].from, to: present[0].to })}
                            </button>
                          )
                        }
                        const key = editTarget.key
                        /**
                         * Applied stays applied.
                         *
                         * This path bypassed renderFixAction, which is where the
                         * "Applied" badge lives — so after writing the figure the
                         * button still read "Add your figure and apply", and
                         * pressing it re-opened the bullet the user had just fixed.
                         * The finding is a snapshot of the CV as it was; the badge
                         * is what tells the user which snapshots they have already
                         * dealt with.
                         */
                        if (appliedItems.has(key)) {
                          return (
                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold">
                              <Check className="h-2.5 w-2.5" /> {t("applied")}
                            </span>
                          )
                        }
                        // The line may already carry a figure — either this fix was
                        // applied from elsewhere or the user typed it by hand. Either
                        // way there is nothing left to ask for.
                        if (currentBullet && /\d/.test(currentBullet) && !/\d/.test(editTarget.current)) {
                          return null
                        }
                        if (fixDraft?.key !== key) {
                          return (
                            <button
                              type="button"
                              onClick={() =>
                                setFixDraft(
                                  currentBullet
                                    ? { key, field: "bullet", targetId: a!.targetId!, index: a!.index!, current: currentBullet, draft: f.fix }
                                    : { key, field: "summary", current: currentSummary, draft: f.fix },
                                )
                              }
                              className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#1a2e4a] px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-[#24405f] cursor-pointer"
                            >
                              <PenLine className="h-2.5 w-2.5" /> {t("fix_complete_and_apply")}
                            </button>
                          )
                        }
                        return (
                          <div className="mt-2">
                            <label htmlFor={key} className="block text-[9.5px] font-bold uppercase tracking-wide text-slate-600">
                              {t("fix_complete_label")}
                            </label>
                            <textarea
                              id={key}
                              value={fixDraft.draft}
                              onChange={(e) => setFixDraft({ ...fixDraft, draft: e.target.value })}
                              rows={4}
                              autoFocus
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-[11px] leading-snug text-slate-800 focus:border-[#00D4FF] focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/40"
                            />
                            <p className="mt-1 text-[9.5px] text-slate-500 leading-snug">{needs}</p>
                            <div className="mt-1.5 flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setFixDraft(null)}
                                className="rounded-full border border-slate-300 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
                              >
                                {t("bullet_edit_cancel")}
                              </button>
                              <button
                                type="button"
                                disabled={!fixDraft.draft.trim() || fixDraft.draft.trim() === fixDraft.current.trim()}
                                onClick={() => {
                                  if (fixDraft.field === "bullet") {
                                    if (writeBullet(fixDraft.targetId, fixDraft.index, fixDraft.current, fixDraft.draft.trim(), false)) {
                                      markFixApplied(fixDraft.key)
                                      setFixDraft(null)
                                    }
                                    return
                                  }
                                  // Same stale guard as the bullet path: if the summary
                                  // moved between the analysis and this click, writing
                                  // over it would destroy an edit the user just made.
                                  if (((sectionData.summary as string) ?? "").trim() !== fixDraft.current.trim()) {
                                    toast.error(t("metricless_improve_error"))
                                    return
                                  }
                                  updateSectionData("summary", fixDraft.draft.trim() as never)
                                  markContentOptimized("opt_summary", fixDraft.draft.trim())
                                  markFixApplied("fix-summary")
                                  markFixApplied(fixDraft.key)
                                  toast.success(t("toast_change_applied"))
                                  void runRescore()
                                  setFixDraft(null)
                                }}
                                className="rounded-full bg-[#1a2e4a] px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-[#24405f] disabled:opacity-50 cursor-pointer"
                              >
                                {t("apply_button")}
                              </button>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </li>
              )

              return (
                <>
                  {high.length > 0 && (
                    <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/60 to-white p-4">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <p className="text-[10px] font-black tracking-widest uppercase text-rose-600">{t("critical_fixes_title")}</p>
                      </div>
                      <ul className="flex flex-col gap-2.5">{high.map((f, i) => renderFix(f, i, "high"))}</ul>
                    </div>
                  )}

                  {medium.length > 0 && (
                    <details className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/40 to-white p-4">
                      <summary className="flex cursor-pointer list-none items-center gap-1.5">
                        <ListChecks className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                          {t("optional_fixes_title", { count: medium.length })}
                        </p>
                        <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-amber-500 transition-transform group-open:rotate-90" />
                      </summary>
                      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">{t("optional_fixes_hint")}</p>
                      <ul className="mt-2.5 flex flex-col gap-2.5">{medium.map((f, i) => renderFix(f, i, "medium"))}</ul>
                    </details>
                  )}
                </>
              )
            })()}

            {/* Path to your target — the ranked, points-attributed answer to
                "what do I need to reach 90/100?". Every lever is derived from the
                SAME score weights (see gapLevers in ats-matcher), so the plan can
                never contradict the number. Maxing them all lands on ~100. */}


            {/* Typo / near-miss warnings — a keyword the CV misspells so a real ATS
                (exact match) misses it. Highest-value fix: the skill is already
                there, one edit away from counting. Generic edit-distance, no word
                list — works for any typo in any language. */}
            {(atsResult.typoWarnings?.length ?? 0) > 0 && (
              <div id="ats-typos" className={`rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/80 to-orange-50/50 p-4 scroll-mt-4 transition-all duration-500${hlRing("ats-typos")}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <p className="text-[10px] font-black tracking-widest uppercase text-rose-600">{t("typo_title")}</p>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">{t("typo_subtitle")}</p>
                <ul className="flex flex-col gap-1.5">
                  {(atsResult.typoWarnings ?? []).map((w, i) => {
                    const done = correctedTypos.has(w.typed)
                    return (
                    <li key={i} className="flex items-center gap-2 rounded-xl border border-rose-100 bg-white/70 px-3 py-2 text-[11.5px]">
                      <span className={`font-semibold ${done ? "text-slate-400" : "text-rose-700 line-through decoration-rose-300"}`}>{w.typed}</span>
                      <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                      <span className="font-bold text-emerald-700 flex-1">{w.keyword}</span>
                      {done ? (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                          <Check className="h-2.5 w-2.5" /> {t("typo_corrected")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => applyTypoFix(w.typed, w.keyword)}
                          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white/70 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 transition-all hover:bg-rose-100"
                        >
                          <Wand2 className="h-2.5 w-2.5" /> {t("typo_fix_button")}
                        </button>
                      )}
                    </li>
                    )
                  })}
                </ul>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-2">{t("typo_hint")}</p>
              </div>
            )}

            {/* C1 — parseability, template-aware. A single-column template parses
                cleanly; a multi-column one may be reordered by a strict ATS, so we
                say so honestly instead of showing a blanket "parses cleanly" seal. */}
            {atsResult.templateSafety === "caution" ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/50 px-3 py-2.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[10.5px] font-bold text-amber-800 leading-tight">{t("template_caution_title")}</p>
                  <p className="text-[9.5px] text-amber-700/90 leading-snug mt-0.5">{t("template_caution_desc")}</p>
                  {/* The cost, named. Without a figure the warning is either ignored
                      or blamed for the whole gap, and it is neither: the layout is a
                      5% ding, while 45% of the score is keyword coverage. Telling
                      the user "your score is low because of the template" would send
                      them to change designs instead of fixing what actually moves. */}
                  {!!atsResult.templatePenaltyPoints && (
                    <p className="text-[10px] font-bold text-amber-900 leading-snug mt-1">
                      {t("template_cost", {
                        points: atsResult.templatePenaltyPoints,
                        raw: atsResult.score + atsResult.templatePenaltyPoints,
                      })}
                    </p>
                  )}
                  {/* And the part that is evidence rather than a claim: what a parser
                      actually pulled out of the exported PDF. A two-column layout
                      fails HERE, not in the 5% — and this is measured, not asserted.
                      Only shown once the real check has run and really lost ground. */}
                  {verifyResult && atsResult.score - verifyResult.realScore >= 8 && (
                    <p className="text-[10px] text-amber-800 leading-snug mt-1">
                      {t("template_real_loss", { delta: atsResult.score - verifyResult.realScore })}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("editor-switch-tab", { detail: "planillas" }))}
                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full px-2.5 py-0.5 transition-all"
                  >
                    <LayoutTemplate className="h-2.5 w-2.5" /> {t("template_caution_action")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 px-3 py-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10.5px] font-bold text-emerald-800 leading-tight">{t("parseable_badge")}</p>
                  <p className="text-[9.5px] text-emerald-600/90 leading-snug mt-0.5">{t("parseable_hint")}</p>
                </div>
              </div>
            )}

            {/* THE SECOND NUMBER.
                The keyword score answers whether a filter passes the document.
                This answers whether a person believes it — and the gap between
                them is the diagnosis. A CV listed oldest-first, claiming seven
                years over dates spanning eleven, with the same achievement written
                twice, passes the filter and loses the seven-second screen; our own
                writing score rated exactly that CV 81, because it measures craft
                and not trust. Ranked by what the reader CONCLUDES, so a reason to
                disbelieve outranks a reason to frown however the points land. */}
            {(() => {
              const cred = credibility
              if (cred.findings.length === 0) return null
              const verdict = credibilityVerdict(atsResult.score, cred.score)
              const detail: Partial<Record<string, string>> = {
                reverse_order: liveWritingChecks.chronology
                  ? t("integrity_order_desc", {
                      first: liveWritingChecks.chronology.firstShown,
                      recent: liveWritingChecks.chronology.mostRecent,
                    })
                  : "",
                future_date: liveWritingChecks.futureDates[0]
                  ? t("integrity_future_desc", {
                      jobTitle: liveWritingChecks.futureDates[0].jobTitle,
                      value: liveWritingChecks.futureDates[0].value,
                    })
                  : "",
                incomplete_education: liveWritingChecks.incompleteEducation[0]
                  ? t("cred_incomplete_education_desc", {
                      school: liveWritingChecks.incompleteEducation[0].school,
                      missing: liveWritingChecks.incompleteEducation[0].missingDegree
                        ? t("cred_missing_degree")
                        : t("cred_missing_dates"),
                    })
                  : "",
                // Name the entry. "Your degree is listed as a skill" with nothing
                // pointing at WHICH chip sent the user hunting through their own
                // resume and concluding the finding was invented — reported in
                // those words. The chip is right there in the data we measured.
                degree_as_skill: liveWritingChecks.degreeInSkills.length > 0
                  ? t("cred_degree_as_skill_desc", { skill: liveWritingChecks.degreeInSkills.join(", ") })
                  : "",
                // "2 lines repeat something you already said" — and never which
                // two, or where. A count is not something anyone can act on, and
                // the data was already measured; it simply was not printed.
                duplicates: liveWritingChecks.nearDuplicates[0]
                  ? t("cred_duplicates_desc", {
                      jobTitle: liveWritingChecks.nearDuplicates[0].jobTitle,
                      text: liveWritingChecks.nearDuplicates[0].text.slice(0, 70),
                    })
                  : "",
                overloaded_roles: liveWritingChecks.bulletBalance.filter((b) => b.kind === "too_many").length > 0
                  ? t("cred_overloaded_desc", {
                      jobs: liveWritingChecks.bulletBalance
                        .filter((b) => b.kind === "too_many")
                        .map((b) => b.jobTitle || "—")
                        .join(", "),
                    })
                  : "",
                years_contradiction: liveWritingChecks.yearsClaim
                  ? t("integrity_years_desc", {
                      claimed: liveWritingChecks.yearsClaim.claimed,
                      actual: liveWritingChecks.yearsClaim.actual,
                    })
                  : "",
              }
              return (
                <div id="ats-credibility" className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/70 to-orange-50/40 p-3.5 scroll-mt-4">
                  <p className="text-[10px] font-black tracking-widest uppercase text-rose-600 flex items-center gap-1.5 mb-2">
                    <AlertCircle className="h-3 w-3" /> {t("integrity_title")}
                  </p>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="text-center">
                      <div className="text-[8.5px] font-bold uppercase tracking-wide text-slate-400">{t("cred_bar_ats")}</div>
                      <div className="text-[17px] font-black text-slate-400 tabular-nums leading-none mt-0.5">{atsResult.score}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                    <div className="text-center">
                      <div className="text-[8.5px] font-bold uppercase tracking-wide text-rose-500">{t("cred_bar_recruiter")}</div>
                      <div className="text-[22px] font-black tabular-nums leading-none mt-0.5 text-rose-600">{cred.score}</div>
                    </div>
                  </div>
                  <p className="text-[10.5px] text-rose-800 leading-snug mb-2 text-center">
                    {verdict.kind === "keywords_ahead" ? t("cred_gap_keywords_ahead") : t("integrity_hint")}
                  </p>
                  <ul className="space-y-2">
                    {cred.findings.map((f) => (
                      <li key={f.key} className="rounded-xl border border-rose-200 bg-white/70 p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] font-bold text-slate-800 leading-snug">
                            {t(`cred_${f.key}` as "cred_reverse_order", { count: f.count })}
                          </p>
                          {/* A bare "−18" answered a question nobody asked and
                              raised one nobody could answer — reported in those
                              words. The number only ever existed to ORDER the
                              list, so the list shows the order and drops the
                              arithmetic. Anyone who wants the maths has the
                              credibility figure at the top of this card. */}
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                            f.cost >= 15 ? "bg-rose-100 text-rose-700" : f.cost >= 8 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {t(f.cost >= 15 ? "cred_weight_high" : f.cost >= 8 ? "cred_weight_medium" : "cred_weight_low")}
                          </span>
                        </div>
                        {detail[f.key] ? (
                          <p className="text-[10.5px] text-slate-600 leading-snug mt-0.5">{detail[f.key]}</p>
                        ) : null}
                        {/* The one finding here we cannot repair FOR the user: only
                            they know their degree. So the button does the next
                            honest thing — it opens the section instead of leaving
                            them to hunt for it. A tab switch that points at nothing
                            was removed from this panel once, and rightly; this one
                            names the section it is taking you to. */}
                        {/* Roles in the wrong order is the highest-value fix on a
                            real resume and it was pure diagnosis: the card said
                            "put the most recent first" and left the user to drag
                            rows in another tab. Sorting by date is arithmetic, so
                            we do it — most recent first, ongoing roles above
                            finished ones, and anything undated keeps its place
                            rather than being guessed at. */}
                        {f.key === "reverse_order" && wouldReorderRoles() && (
                          <button
                            type="button"
                            onClick={() => reorderRoles()}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#1a2e4a] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#24405f] cursor-pointer"
                          >
                            <ListChecks className="h-2.5 w-2.5" /> {t("cred_fix_order")}
                          </button>
                        )}
                        {/* The credential sits in Skills; removing it is one write
                            and cannot lose anything — the education entry it was
                            copied from stays exactly where it is. */}
                        {f.key === "degree_as_skill" && liveWritingChecks.degreeInSkills.length > 0 && (
                          <button
                            type="button"
                            onClick={() => removeSkills(liveWritingChecks.degreeInSkills)}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#1a2e4a] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#24405f] cursor-pointer"
                          >
                            <Pencil className="h-2.5 w-2.5" /> {t("cred_fix_degree", { skill: liveWritingChecks.degreeInSkills[0] })}
                          </button>
                        )}
                        {/* Which of the two numbers is true is not ours to decide —
                            only the candidate knows. The button takes them to the
                            summary with the contradiction still on screen. */}
                        {f.key === "years_contradiction" && (
                          <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent("editor-switch-tab", { detail: "content" }))}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#1a2e4a] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#24405f] cursor-pointer"
                          >
                            <Pencil className="h-2.5 w-2.5" /> {t("cred_fix_years")}
                          </button>
                        )}
                        {/* Both of these are real work with a real home: merging two
                            lines that say the same thing, and cutting the weakest
                            lines of an overloaded role. Neither can be done FOR the
                            user — which half to keep is theirs — but leaving a red
                            finding with no way in is how a report turns into a
                            complaint. The button opens the report and lands on the
                            card that does it. */}
                        {(f.key === "duplicates" || f.key === "overloaded_roles") && (
                          <button
                            type="button"
                            onClick={() => {
                              setMode("resume")
                              requestAnimationFrame(() => scrollToFirst(f.key === "duplicates" ? "ats-neardup" : "ats-structure", "ats-bullets"))
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#1a2e4a] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#24405f] cursor-pointer"
                          >
                            <ListChecks className="h-2.5 w-2.5" /> {t(f.key === "duplicates" ? "cred_fix_duplicates" : "cred_fix_overloaded")}
                          </button>
                        )}
                        {f.key === "incomplete_education" && (
                          <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent("editor-switch-tab", { detail: "content" }))}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#1a2e4a] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#24405f] cursor-pointer"
                          >
                            <Pencil className="h-2.5 w-2.5" /> {t("cred_fix_education")}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {/* Reported, never scored. A link is the cheapest proof there is
                      and its absence is invisible to every keyword matcher — but
                      plenty of honest careers have nothing to link, and docking a
                      nurse for having no GitHub would be exactly the tech-shaped
                      blindness the rest of this file works to avoid. */}
                  {!liveWritingChecks.hasLink && (
                    <p className="mt-2 text-[10px] text-slate-500 leading-snug">{t("cred_no_link_hint")}</p>
                  )}
                </div>
              )
            })()}

            {/* Bullets to improve — ONE place. Merges the "no metric" signal
                (contentQuality) with the deterministic cliché check (writingChecks),
                deduped by bullet, each with a REAL action: Rewrite (improve-bullet)
                or Remove (a bullet that doesn't earn its place). No longer split
                across two cards that both talked about bullets. */}
            {(() => {
              const metricless = liveContentQuality.metriclessBullets
              const cliche = liveWritingChecks.clicheBullets
              const byKey = new Map<string, { targetId: string; jobTitle: string; index: number; text: string; reasons: Set<string> }>()
              const add = (targetId: string, jobTitle: string, index: number, text: string, reason: string) => {
                const k = `${targetId}-${index}`
                const ex = byKey.get(k)
                if (ex) ex.reasons.add(reason)
                else byKey.set(k, { targetId, jobTitle, index, text, reasons: new Set([reason]) })
              }
              const weakVerb = liveWritingChecks.weakVerbBullets
              // A bullet the CV states twice. The recruiter pass reports the
              // repetition in prose but cannot point at a line; this names the
              // exact twin, so "Remove" below is a real one-click fix.
              // Exact copies AND the same achievement rewritten. The near-duplicate
              // pass is what catches a real CV: "Wrote comprehensive unit tests and
              // coordinated with backend engineers…" next to "Coordinated unit and
              // UI testing with backend engineers…" — not identical, unmistakably
              // one thing said twice, and invisible to the exact-match check.
              // EXACT copies only. The one-click button collapses identical lines,
              // so anything it cannot remove must not be counted here — the banner
              // said "1 repeated line" while the button answered "no repeated lines
              // left", which is the panel arguing with itself in front of the user.
              //
              // A near-duplicate is a different problem with a different answer:
              // the two lines are NOT identical, so deleting one loses words the
              // candidate wrote. Those go to the review list below, where the user
              // reads both and decides.
              const dupes = liveWritingChecks.duplicateBullets
              /**
               * At the healthy level, stop asking for numbers.
               *
               * Reported: "16 of 29 state a metric (59%). That is a healthy level"
               * — and then three lines listed underneath with a button each, so the
               * work never ends and every re-analysis serves the same ones again.
               * Saying "optional" while still printing the list is not the same as
               * not printing it. A résumé where every line ends in a figure is the
               * manufactured pattern our own credibility check flags, so past the
               * healthy share these are not improvements at all.
               *
               * A line with a real defect — a cliché, a weak opener, a duplicate —
               * still appears: those are wrong at any ratio.
               */
              if (liveContentQuality.quantificationPct < HEALTHY_METRIC_PCT) {
                metricless.forEach((b) => add(b.targetId, b.jobTitle, b.index, b.text, "metric"))
              }
              cliche.forEach((c) => add(c.targetId, c.jobTitle, c.index, c.text, "cliche"))
              weakVerb.forEach((w) => add(w.targetId, w.jobTitle, w.index, w.text, "weak_verb"))
              // Tailor's rewrites join the SAME list instead of a second section
              // that said "improve these bullets" all over again. Where a line is
              // already flagged here, the ready-made text just turns "Rewrite"
              // (an LLM call) into "Apply" (free) below.
              /**
               * A rewrite is only offered when it actually rewrites something.
               *
               * Reported with a screenshot of the confirm modal showing CURRENT and
               * SUGGESTED word for word identical — "cuál es la mejora ahí". It
               * happens when the user has already applied the change (the rewrite
               * is now the bullet) or when the model returned the line unchanged.
               * Either way, asking someone to confirm a change to nothing is the
               * panel wasting their attention and their trust.
               *
               * Compared on the normalised text so a difference in spacing or a
               * trailing period does not count as an improvement either.
               */
              const sameLine = (a: string, b: string) =>
                a.trim().replace(/\s+/g, " ").replace(/[.;,]+$/, "").toLowerCase() ===
                b.trim().replace(/\s+/g, " ").replace(/[.;,]+$/, "").toLowerCase()
              /**
               * Tailor runs again on every analysis and a model asked to improve
               * prose always returns another variant, so a rewrite the user
               * already accepted came back as a brand-new suggestion for the line
               * it had just produced. Reported as "I finish them, I press analyse,
               * and they are all back".
               *
               * The CV itself is the record of what was accepted: if the line now
               * in the résumé already says what the rewrite proposes, there is
               * nothing to offer. Compared against the LIVE bullet, not against
               * the snapshot the proposal was written from.
               */
              const currentBulletAt = (targetId: string, index: number): string => {
                const job = ((sectionData.workExperience ?? []) as WorkExperienceItem[]).find((j) => j.id === targetId)
                return parseBullets(job?.description ?? "")[index] ?? ""
              }
              /**
               * A tailored rewrite has to ADD a word this posting looks for.
               *
               * Tailor re-runs on every analysis, and a model asked to adapt prose
               * always returns another phrasing — so the same line came back
               * forever, each time worded slightly differently, each time labelled
               * "for this posting". Comparing against the current bullet only
               * stopped the identical case; the variants walked straight through.
               *
               * The question this card exists to answer is not "can this sentence
               * be phrased differently" — it always can — but "is this posting
               * asking for something this line does not say". That is a fact about
               * two texts, so code decides it, and it converges: once the keyword
               * is in the bullet, the rewrite stops being offered. Forever.
               */
              const postingTerms = [
                ...(atsResult.extractedKeywords?.hardSkills ?? []),
                ...(atsResult.extractedKeywords?.mustHaves ?? []),
              ]
              const addsPostingTerm = (rewrite: string, current: string): boolean => {
                // Fail closed. With no posting terms we cannot say a rewrite adds
                // anything, and "it reads differently" is not a reason to offer it.
                if (postingTerms.length === 0) return false
                const cur = normalizeTerm(current)
                const next = normalizeTerm(rewrite)
                return postingTerms.some((kw) => termPresent(kw, next) && !termPresent(kw, cur))
              }
              const tailored = new Map(
                tailor.bulletRewrites
                  .filter((r) => !sameLine(r.text ?? "", r.currentBullet ?? ""))
                  .filter((r) => !sameLine(r.text ?? "", currentBulletAt(r.targetId, r.index)))
                  .filter((r) => addsPostingTerm(r.text ?? "", currentBulletAt(r.targetId, r.index) || (r.currentBullet ?? "")))
                  // And it must not cost coverage. A better sentence that drops a
                  // word the posting searches for is how applying suggestions took
                  // the score from 80 to 79.
                  .filter((r) => isKeywordSafe(currentBulletAt(r.targetId, r.index) || (r.currentBullet ?? ""), r.text ?? "", postingTerms))
                  .map((r) => [`${r.targetId}-${r.index}`, r]),
              )
              /**
               * Only rewrites that SURVIVED the filters above become rows.
               *
               * Every rewrite used to be added here while `tailored` kept only the
               * ones worth applying, so a discarded rewrite still drew a row —
               * with no "Apply", no repairable defect, and therefore the fallback
               * button "Add your number" on a line that already ends in "by 20%".
               * Pressing it opened an editor pre-filled with the same sentence and
               * "Nothing changed yet". A row whose every action is a no-op is the
               * panel asking for work it cannot describe.
               *
               * The text is the LIVE bullet, never the snapshot the proposal was
               * written from: the snapshot is what the write guards compare
               * against, and a stale one turns Remove and Save into errors.
               */
              tailor.bulletRewrites.forEach((r) => {
                if (!tailored.has(`${r.targetId}-${r.index}`)) return
                const live = currentBulletAt(r.targetId, r.index)
                if (!live) return
                add(r.targetId, r.jobTitle, r.index, live, "tailored")
              })
              // NOT added to the list: a duplicate is not "a bullet to improve",
              // it is a line that should not be there twice. It gets one banner
              // and one button that cleans the whole CV — see the block below.
              const allBullets = [...byKey.values()].filter((b) => !appliedItems.has(`bullet-${b.targetId}-${b.index}`))

              // Roles carrying more lines than a recruiter reads. Our own rule
              // (writing-checks: more than 6 on one role reads as noise) already
              // knew this and only whispered it in a card further down, while this
              // list asked the user to add a figure to every one of them. On an
              // overloaded role the cheaper win is the opposite: keep the best
              // lines, drop the weakest — the metric share rises by subtraction,
              // and deleting is a decision the candidate can make in a second.
              // WHICH lines are expendable, not merely which ROLE is crowded.
              // The badge used to mean "this role has too many and this line has no
              // repairable defect" — which could label a quantified achievement as
              // cuttable while the ranking below listed the same line among the six
              // worth keeping. Two opinions about one line on one screen. Now both
              // read the same ranking.
              const cuttable = new Set(
                liveWritingChecks.bulletRanking.flatMap((r) =>
                  r.weakest.map((w) => `${r.targetId}-${w.index}`),
                ),
              )

              // Most useful first. A ready rewrite costs nothing to apply; a real
              // defect can be repaired; a missing figure needs the candidate. The
              // old order was whatever the maps happened to produce, so the row
              // that could be fixed for free sat below twenty that could not.
              const rank = (b: (typeof allBullets)[number]) => {
                if (b.reasons.has("tailored")) return 0
                if (repairableDefects(b.text).length > 0) return 1
                return 2
              }
              /**
               * ONE verdict per bullet, decided in one place.
               *
               * Each card used to reach its own conclusion about the same line, so
               * a bullet could be told to be rewritten here, deleted below and
               * adapted further down — and fixing it in one card left the others
               * demanding work on text that no longer existed. Now every signal is
               * reconciled first and each line leaves with a single action; the
               * cards render a slice of that decision instead of competing for it.
               */
              const verdicts = resolveBulletFindings(
                allBullets.map((b) => ({ targetId: b.targetId, jobTitle: b.jobTitle, index: b.index, text: b.text })),
                {
                  broken: liveWritingChecks.orphanFragments.map((f) => ({ targetId: f.targetId, index: f.index })),
                  duplicate: [
                    ...liveWritingChecks.nearDuplicates.map((n) => ({ targetId: n.targetId, index: n.index })),
                    ...liveWritingChecks.duplicateBullets.map((d) => ({ targetId: d.targetId, index: d.index })),
                  ],
                  cut: liveWritingChecks.bulletRanking.flatMap((r) =>
                    r.weakest.map((w) => ({ targetId: r.targetId, index: w.index })),
                  ),
                  defect: allBullets
                    .filter((b) => b.reasons.has("cliche") || b.reasons.has("weak_verb"))
                    .map((b) => ({ targetId: b.targetId, index: b.index })),
                  tailor: allBullets
                    .filter((b) => b.reasons.has("tailored"))
                    .map((b) => ({ targetId: b.targetId, index: b.index })),
                  metric: allBullets
                    .filter((b) => b.reasons.has("metric"))
                    .map((b) => ({ targetId: b.targetId, index: b.index })),
                },
              )
              // This list shows the lines whose one action lives HERE. A line that
              // belongs to the merge card, the duplicate card or the cut list is
              // not repeated in it.
              const brokenOwned = ownedBy.broken
              const duplicateOwned = ownedBy.duplicate
              const ownedHere = new Set(
                verdicts
                  .filter((v) => v.action === "defect" || v.action === "tailor" || v.action === "metric")
                  .map((v) => `${v.targetId}-${v.index}`),
              )
              const bullets = [...allBullets]
                .filter((b) => ownedHere.has(`${b.targetId}-${b.index}`))
                .sort((a, b) => rank(a) - rank(b))
              // Every remaining line is an adaptation to THIS posting, not a defect.
              const onlyTailored = bullets.length > 0 && bullets.every((b) => b.reasons.has("tailored") && b.reasons.size === 1)
              const cq = liveContentQuality
              if (bullets.length === 0 && softSkills.length === 0 && (!cq || cq.totalBullets === 0) && dupes.length === 0) return null
              // Nothing left to act on: a headline reading "bullets to improve"
              // over a ratio line and no bullets is the panel manufacturing work.
              const nothingToDo =
                bullets.length === 0 &&
                softSkills.length === 0 &&
                dupes.length === 0 &&
                liveWritingChecks.nearDuplicates.length === 0 &&
                liveWritingChecks.orphanFragments.length === 0 &&
                liveWritingChecks.mergeCandidates.length === 0
              if (nothingToDo && cq && cq.quantificationPct >= HEALTHY_METRIC_PCT) {
                return (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> {t("bullets_to_improve_title")}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-emerald-900">
                      {t("bullets_all_good", { quantified: cq.quantifiedBullets, total: cq.totalBullets, pct: cq.quantificationPct })}
                    </p>
                  </div>
                )
              }
              return (
              <div id="ats-bullets" className={`rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/40 p-3.5 scroll-mt-4 transition-all duration-500${hlRing("ats-bullets")}`}>
                <p className="text-[10px] font-black tracking-widest uppercase text-violet-600 flex items-center gap-1.5 mb-1">
                  {/* When everything left is a posting-specific rewrite, the card is
                      not "bullets to improve" — nothing is wrong with them. Calling
                      it that is what made a healthy CV look like unfinished work. */}
                  <TrendingUp className="h-3 w-3" /> {t(onlyTailored ? "bullets_tailor_title" : "bullets_to_improve_title")}
                </p>
                {/* Says out loud what the score does NOT do. Quantifying a bullet
                    moves no lever — that is deliberate (a figure the algorithm
                    cannot verify must not inflate a number), but the section above
                    is ranked "by impact", so a user fixed ten bullets, watched the
                    score sit still, and concluded the panel was lying. It was not
                    lying; it was silent about which kind of win this is. */}
                <p className="text-[10px] text-violet-700/80 leading-snug mb-2">
                  {onlyTailored ? t("bullets_tailor_hint") : t("bullets_not_score_note")}
                </p>

                {/* A line that is the tail of the one above it, cut off by a page
                    break when the CV was imported. Import repairs these now, but a
                    document imported before that fix still carries them — and a
                    bullet reading "5%." on its own is the most obviously broken
                    thing a recruiter can see. One click puts the sentence back
                    together; the user reads both halves first. */}
                {liveWritingChecks.orphanFragments
                  .filter((f) => brokenOwned.has(`${f.targetId}-${f.index}`))
                  .filter((f) => !appliedItems.has(`orphan-${f.targetId}-${f.index}`))
                  .map((f) => {
                    const key = `orphan-${f.targetId}-${f.index}`
                    return (
                      <div key={key} className="rounded-xl border border-amber-200 bg-amber-50/50 p-2.5 mb-2">
                        <p className="text-[9.5px] font-bold uppercase tracking-wide text-amber-700 flex items-center gap-1">
                          <AlertCircle className="h-2.5 w-2.5 shrink-0" /> {t("orphan_title")}
                        </p>
                        <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{t("orphan_hint", { jobTitle: f.jobTitle })}</p>
                        <p className="text-[10.5px] text-slate-700 leading-snug mt-1.5">
                          {f.previousText} <span className="bg-amber-200/70 rounded px-1">{f.text}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (writeBullet(f.targetId, f.index - 1, f.previousText, `${f.previousText} ${f.text}`, false)) {
                              // The tail is now inside the line above; drop the leftover.
                              const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
                              const job = work.find((j) => j.id === f.targetId)
                              if (job) {
                                const lines = parseBullets(job.description ?? "")
                                const idx = lines.findIndex((l) => l.trim() === f.text)
                                if (idx >= 0) {
                                  const written = serializeBulletsReporting(lines.filter((_, i) => i !== idx))
                                  updateSectionData(
                                    "workExperience",
                                    work.map((j) => (j.id === f.targetId ? { ...j, description: written.text } : j)),
                                  )
                                }
                              }
                              markFixApplied(key)
                            }
                          }}
                          className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-amber-700 cursor-pointer"
                        >
                          <Layers className="h-2.5 w-2.5" /> {t("orphan_action")}
                        </button>
                      </div>
                    )
                  })}

                {/* Two thin lines telling one story. Offered only on a role already
                    carrying more lines than a recruiter reads, and only when BOTH
                    lines are short and neither carries a figure — see
                    merge-candidates.ts. Deleting loses what the candidate earned;
                    rewriting one cannot reach the other. This is the third option. */}
                {liveWritingChecks.mergeCandidates
                  // A pair inside a role the ranking is already showing belongs
                  // there, with both lines and the cut list in view. Offering it
                  // twice is the repetition this registry exists to end.
                  .filter((c) => !liveWritingChecks.bulletRanking.some((r) => r.targetId === c.targetId))
                  .filter((c) => !appliedItems.has(`merge-${c.targetId}-${c.indexes[0]}-${c.indexes[1]}`))
                  .map((c) => {
                    const key = `merge-${c.targetId}-${c.indexes[0]}-${c.indexes[1]}`
                    return (
                      <div key={key} className="rounded-xl border border-violet-200 bg-white/70 p-2.5 mb-2">
                        <p className="text-[9.5px] font-bold uppercase tracking-wide text-violet-700 flex items-center gap-1">
                          <Layers className="h-2.5 w-2.5 shrink-0" /> {t("merge_title")}
                        </p>
                        <p className="text-[10px] text-slate-500 leading-snug mt-0.5">{t("merge_hint", { jobTitle: c.jobTitle })}</p>
                        <ul className="mt-1.5 space-y-1">
                          {c.texts.map((line, i) => (
                            <li key={i} className="text-[10.5px] text-slate-700 leading-snug flex gap-1.5">
                              <span className="text-violet-400 shrink-0">•</span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          onClick={() => void runMerge(c)}
                          disabled={mergingKey === key}
                          aria-label={t("merge_action")}
                          className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-violet-700 disabled:opacity-50 cursor-pointer"
                        >
                          {mergingKey === key ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Layers className="h-2.5 w-2.5" />}
                          {t("merge_action")}
                        </button>
                      </div>
                    )
                  })}
                {cq && cq.totalBullets > 0 && (
                  <>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      {t("content_quality_metrics", { pct: cq.quantificationPct, quantified: cq.quantifiedBullets, total: cq.totalBullets })}
                    </p>
                    {/* Not every line takes a number, and a CV where every single
                        one ends in a figure reads as manufactured — the same
                        pattern the credibility check calls out. Around half is the
                        healthy shape. Listing the rest as defects past that point
                        was asking for numbers that do not exist, which is how
                        people end up inventing them. */}
                    <p className="text-[10.5px] leading-relaxed text-slate-500">
                      {cq.quantificationPct >= HEALTHY_METRIC_PCT
                        ? t("content_quality_metrics_enough")
                        : /* A finite ask. "16 of 35 (46%)" with a list under it reads
                             as thirty-five pending tasks; the real gap is two lines.
                             Asked in exactly those words: "do we really need metrics
                             on all 35?" */
                          t("content_quality_metrics_need", {
                            count: Math.max(1, Math.ceil((HEALTHY_METRIC_PCT / 100) * cq.totalBullets) - cq.quantifiedBullets),
                          })}
                    </p>
                  </>
                )}

                {/* Soft skills the posting asks for that no bullet demonstrates.
                    First in this list on purpose: unlike a bullet whose only
                    shortcoming is a missing figure, pressing this ALWAYS produces
                    a new line of CV — it is the action here that cannot come back
                    empty-handed. */}
                {softSkills.length > 0 && (
                  <div className="mt-2 rounded-lg border border-cyan-200 bg-gradient-to-br from-cyan-50/80 to-sky-50/40 p-2.5">
                    <p className="text-[11px] font-bold leading-snug text-[#1a2e4a]">{t("skills_group_soft")}</p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{t("skills_group_soft_hint")}</p>
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {softSkills.map((sk) => (
                        <li key={sk.skill} className="flex items-start justify-between gap-2 rounded-lg border border-cyan-100 bg-white/70 px-2 py-1.5">
                          <div className="min-w-0 flex-1">
                            <span className="block text-[10.5px] font-semibold capitalize text-slate-700">{sk.skill}</span>
                            {sk.suggestion && (
                              <span className="mt-0.5 block text-[9.5px] leading-snug text-slate-500">{sk.suggestion}</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => weaveSoftSkill(sk.skill)}
                            disabled={!!weavingSoft}
                            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-200 bg-gradient-to-r from-cyan-100 to-sky-100 px-2 py-0.5 text-[9.5px] font-bold text-cyan-800 transition-all hover:from-cyan-200 hover:to-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {weavingSoft === sk.skill ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                            {t("soft_skill_demonstrate")}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Repeated lines — one banner, one click, whole CV clean. */}
                {dupes.length > 0 && (
                  <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50/70 p-2.5">
                    <p className="text-[11px] font-bold text-rose-700 leading-snug">
                      {t("dedupe_title", { count: dupes.length })}
                    </p>
                    <p className="mt-0.5 text-[10px] text-rose-600/90 leading-relaxed">{t("dedupe_hint")}</p>
                    <ul className="mt-1.5 flex flex-col gap-0.5">
                      {dupes.slice(0, 4).map((d) => (
                        <li key={`${d.targetId}-${d.index}`} className="text-[10px] text-slate-600 leading-snug line-clamp-1">
                          • {d.text}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={removeDuplicateBullets}
                      className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white transition-all hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    >
                      <Wand2 className="h-2.5 w-2.5" /> {t("dedupe_action")}
                    </button>
                  </div>
                )}

                {/* Near-duplicates: the same achievement written twice in different
                    words. No auto-remove — the lines differ, so a machine cannot
                    know which wording the candidate wants to keep. Both are shown
                    and the user removes one, or merges them from the card above. */}
                {liveWritingChecks.nearDuplicates.length > 0 && <span id="ats-neardup" className="block scroll-mt-4" />}
                {liveWritingChecks.nearDuplicates
                  .filter((n) => duplicateOwned.has(`${n.targetId}-${n.index}`))
                  .filter((n) => !appliedItems.has(`neardup-${n.targetId}-${n.index}`))
                  .slice(0, 3)
                  .map((n) => {
                    const key = `neardup-${n.targetId}-${n.index}`
                    return (
                      <div key={key} className="mt-2 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
                        <p className="text-[11px] font-bold text-amber-800 leading-snug">{t("neardup_title")}</p>
                        <p className="mt-0.5 text-[10px] text-amber-700/90 leading-relaxed">{t("neardup_hint")}</p>
                        <ul className="mt-1.5 flex flex-col gap-1">
                          <li className="text-[10.5px] text-slate-600 leading-snug">• {n.otherText}</li>
                          <li className="text-[10.5px] text-slate-800 leading-snug">• {n.text}</li>
                        </ul>
                        <button
                          type="button"
                          onClick={() => {
                            const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
                            const job = work.find((j) => j.id === n.targetId)
                            if (!job) return
                            const lines = parseBullets(job.description ?? "")
                            const idx = lines.findIndex((l) => l.trim() === n.text.trim())
                            if (idx < 0) { toast.error(t("metricless_improve_error")); return }
                            const written = serializeBulletsReporting(lines.filter((_, i) => i !== idx))
                            updateSectionData(
                              "workExperience",
                              work.map((j) => (j.id === n.targetId ? { ...j, description: written.text } : j)),
                            )
                            markFixApplied(key)
                            toast.success(t("toast_change_applied"))
                            void runRescore()
                          }}
                          className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-amber-700 cursor-pointer"
                        >
                          <Wand2 className="h-2.5 w-2.5" /> {t("neardup_action")}
                        </button>
                      </div>
                    )
                  })}

                {bullets.length > 0 && (
                  <ul className="flex flex-col gap-1.5 mt-2">
                    {bullets.slice(0, shownBullets).map((b) => {
                      const key = `bullet-${b.targetId}-${b.index}`
                      const busy = improvingKey === key
                      // A rewrite tailor already produced for this exact line.
                      const readyRaw = tailored.get(`${b.targetId}-${b.index}`)
                      // The stored bullet may have moved on since the analysis: if
                      // it already reads like the suggestion, there is nothing to
                      // apply and no button.
                      const ready = readyRaw && !sameLine(readyRaw.text ?? "", b.text) ? readyRaw : undefined
                      // Same rule the endpoint applies, plus the "already AI
                      // written" mark: the button is drawn only when pressing it
                      // can change the bullet AND the model has not already
                      // answered this exact text.
                      const jobDesc = ((sectionData.workExperience ?? []) as WorkExperienceItem[])
                        .find((j) => j.id === b.targetId)?.description ?? ""
                      const repairable = canAskAI(b.targetId, jobDesc, b.text) ? repairableDefects(b.text) : []
                      return (
                        <li key={key} className="rounded-lg bg-white/60 border border-violet-100 p-2">
                          <div className="flex items-start gap-1.5">
                            <span className="text-violet-400 mt-0.5 shrink-0">•</span>
                            <div className="flex-1 min-w-0">
                              <span className="line-clamp-2 block text-[10.5px] text-slate-600 leading-snug">{b.text}</span>
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                {b.jobTitle && <span className="text-[9px] text-violet-400/80">{t("metricless_in_job", { job: b.jobTitle })}</span>}
                                {b.reasons.has("cliche") && <span className="text-[9px] font-bold rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-200 px-1.5">{t("reason_cliche")}</span>}
                                {b.reasons.has("weak_verb") && <span className="text-[9px] font-bold rounded-full bg-orange-50 text-orange-600 ring-1 ring-orange-200 px-1.5">{t("reason_weak_verb")}</span>}
                                {b.reasons.has("metric") && <span className="text-[9px] font-bold rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200 px-1.5">{t("reason_metric")}</span>}
                                {b.reasons.has("tailored") && (() => {
                                  const r = tailored.get(`${b.targetId}-${b.index}`)
                                  const cur = normalizeTerm(currentBulletAt(b.targetId, b.index) || b.text)
                                  const adds = postingTerms.filter((kw) => termPresent(kw, normalizeTerm(r?.text ?? "")) && !termPresent(kw, cur))
                                  return (
                                    <span className="text-[9px] font-bold rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 px-1.5">
                                      {adds.length > 0 ? t("reason_tailored_adds", { terms: adds.slice(0, 3).join(", ") }) : t("reason_tailored")}
                                    </span>
                                  )
                                })()}
                                {/* A weak line inside a role that already carries
                                    too many. Named so "Remove" stops being a
                                    guess: this is the one worth losing. */}
                                {cuttable.has(`${b.targetId}-${b.index}`) && !b.reasons.has("tailored") && (
                                  <span className="rounded-full bg-slate-100 px-1.5 text-[9px] font-bold text-slate-600 ring-1 ring-slate-300">{t("reason_cuttable")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* The number gets typed where it is asked for. The
                              user's own wording, written through the same guarded
                              path as everything else — never marked as AI output,
                              because it is not. */}
                          {editingBullet?.key === key ? (
                            <div className="mt-1.5">
                              <textarea
                                value={editingBullet.draft}
                                onChange={(e) => setEditingBullet({ ...editingBullet, draft: e.target.value })}
                                rows={3}
                                autoFocus
                                className="w-full resize-y rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-[10.5px] leading-snug text-slate-700 focus:border-[#0077B6] focus:outline-none focus:ring-2 focus:ring-cyan-200"
                              />
                              {/* What kind of figure fits, and where. Telling the
                                  user "add your number" without saying what would
                                  count leaves them guessing; writing a [X%] into
                                  their CV for them is the placeholder we refuse to
                                  ship. Examples, not a template to fill. */}
                              {/* Their own sentence, with the slot where the
                                  number belongs. Shown, never written: the slot
                                  is a pointer for the eye, and the textarea above
                                  still holds only what the candidate types. */}
                              {(() => {
                                const slot = suggestFigureSlot(b.text, locale === "es" ? "es" : "en")
                                if (!slot) return null
                                return (
                                  <div className="mt-1 rounded-lg bg-amber-50/70 px-2 py-1.5 ring-1 ring-amber-100">
                                    <p className="text-[9px] font-bold uppercase tracking-wide text-amber-700">
                                      {t(`figure_kind_${slot.kind}` as "figure_kind_scale")}
                                    </p>
                                    <p className="mt-0.5 text-[10px] leading-snug text-slate-600">{slot.example}</p>
                                    {/* More than one placement fits most lines,
                                        and only the candidate knows which figure
                                        they can defend in an interview. Showing
                                        one slot and calling it the answer was
                                        reported as unclear; showing the options
                                        is the honest version. */}
                                    {slot.alternatives?.length ? (
                                      <>
                                        <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-amber-600/80">{t("figure_or")}</p>
                                        {slot.alternatives.map((alt) => (
                                          <p key={alt} className="text-[10px] leading-snug text-slate-500">{alt}</p>
                                        ))}
                                      </>
                                    ) : null}
                                  </div>
                                )
                              })()}
                              <p className="mt-1 text-[9.5px] leading-relaxed text-slate-500">
                                {editingBullet.draft.includes("___")
                                  ? t("bullet_number_replace_slot")
                                  : editingBullet.draft.trim() === b.text.trim()
                                    ? t("bullet_edit_unchanged")
                                    : !/\d/.test(editingBullet.draft)
                                      ? t("bullet_edit_no_figure")
                                      : t("bullet_number_hint")}
                              </p>
                              <div className="mt-1.5 flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingBullet(null)}
                                  className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[9.5px] font-bold text-slate-500 transition-all hover:bg-slate-50"
                                >
                                  {t("bullet_edit_cancel")}
                                </button>
                                <button
                                  type="button"
                                  // The slot must never reach the CV. A bullet that
                                  // ships "___" or "[X%]" to a recruiter reads as an
                                  // unfinished document, and it is the one thing this
                                  // product has always refused to write.
                                  disabled={
                                    !editingBullet.draft.trim() ||
                                    editingBullet.draft.trim() === b.text.trim() ||
                                    editingBullet.draft.includes("___")
                                  }
                                  onClick={() => {
                                    if (writeBullet(b.targetId, b.index, b.text, editingBullet.draft.trim(), false)) {
                                      setEditingBullet(null)
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-gradient-to-r from-cyan-100 to-sky-100 px-2.5 py-0.5 text-[9.5px] font-bold text-cyan-800 transition-all hover:from-cyan-200 hover:to-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Check className="h-2.5 w-2.5" /> {t("bullet_edit_save")}
                                </button>
                              </div>
                            </div>
                          ) : (
                          <div className="flex items-center justify-end gap-1.5 mt-1.5">
                            {ready ? (
                              <button
                                type="button"
                                onClick={() => setBulletFix({ targetId: b.targetId, index: b.index, current: b.text, improved: ready.text, recommended: ready.text })}
                                className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-gradient-to-r from-cyan-100 to-sky-100 hover:from-cyan-200 hover:to-sky-200 text-cyan-800 border border-cyan-200 rounded-full px-2 py-0.5 transition-all"
                              >
                                <Check className="h-2.5 w-2.5" /> {t("bullet_apply_ready")}
                              </button>
                            ) : repairable.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => improveMetricless({ text: b.text, targetId: b.targetId, jobTitle: b.jobTitle, index: b.index, reasons: repairable }, key)}
                                disabled={busy || !!improvingKey}
                                className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-gradient-to-r from-violet-100 to-fuchsia-100 hover:from-violet-200 hover:to-fuchsia-200 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {busy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5" />}
                                {busy ? t("metricless_improving") : t("bullet_rewrite")}
                              </button>
                            ) : (
                              /* Nothing a rewrite could repair — the line is well
                                 formed, it just never says what it achieved. We do
                                 not invent that figure, but naming the gap and
                                 then sending the user to another tab to find the
                                 line was a dead end. The number gets typed here. */
                              <button
                                type="button"
                                onClick={() => {
                                  const slot = suggestFigureSlot(b.text, locale === "es" ? "es" : "en")
                                  setEditingBullet({
                                    key,
                                    targetId: b.targetId,
                                    index: b.index,
                                    current: b.text,
                                    // Pre-placed so the only thing left to do is type the
                                    // number. What we will NOT do is fill in a plausible
                                    // figure "to be changed later": a default that reaches
                                    // a recruiter is a lie the candidate has to defend in
                                    // an interview, and half of them never get changed.
                                    draft: slot?.example ?? b.text,
                                  })
                                }}
                                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9.5px] font-bold text-amber-800 transition-all hover:bg-amber-100"
                              >
                                <Pencil className="h-2.5 w-2.5" /> {t("bullet_add_number")}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPendingRemove({ targetId: b.targetId, index: b.index, text: b.text })}
                              className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-white text-slate-500 border border-slate-200 rounded-full px-2 py-0.5 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                            >
                              {t("bullet_remove")}
                            </button>
                          </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Twenty-four rows is a wall, not a worklist. The ones that can
                    be acted on are on top; the rest stay one click away. */}
                {bullets.length > shownBullets && (
                  <button
                    type="button"
                    onClick={() => setShownBullets((n) => n + BULLETS_PAGE)}
                    className="mt-2 w-full rounded-xl border border-violet-200 bg-white/70 py-1.5 text-[10.5px] font-bold text-violet-700 transition-all hover:bg-violet-50"
                  >
                    {t("bullets_show_more", { count: bullets.length - shownBullets })}
                  </button>
                )}

                <p className="text-[10px] text-slate-500 leading-relaxed mt-2">{t("content_quality_hint")}</p>
              </div>
              )
            })()}

            {/* Date consistency + bullet balance — deterministic writing checks. */}
            {(liveWritingChecks.dateInconsistency || liveWritingChecks.bulletBalance.length > 0) && (
              <div id="ats-structure" className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-white p-3.5 scroll-mt-4">
                <p className="text-[10px] font-black tracking-widest uppercase text-sky-600 flex items-center gap-1.5 mb-2">
                  <ListChecks className="h-3 w-3" /> {t("structure_checks_title")}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {liveWritingChecks.dateInconsistency && (
                    <li className="text-[11px] text-slate-700 leading-snug flex flex-col items-start gap-1">
                      <span className="flex items-start gap-1.5">
                        <AlertCircle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" /> {t("check_dates")}
                      </span>
                      {/* Same rule as the fix-action button: with nothing to
                          rewrite (a CV whose dates are all bare years) this is a
                          button that can only answer "nothing to do". */}
                      {fixableDates > 0 ? (
                        <button
                          type="button"
                          onClick={fixDates}
                          className="ml-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0077B6] to-[#00D4FF] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm transition-all hover:shadow focus:outline-none focus:ring-2 focus:ring-cyan-300"
                        >
                          <Wand2 className="h-2.5 w-2.5" /> {t("fix_action_fix_dates")}
                        </button>
                      ) : (
                        <span className="ml-4 text-[10px] text-slate-500 leading-snug">{t("dates_month_needed")}</span>
                      )}
                    </li>
                  )}
                  {/* The structure check named the problem and left the candidate to
                      work out WHICH lines — the hard part, and the part a person is
                      worst at on their own writing. Now it names them: the ones
                      carrying the role, and the ones diluting it, each with the
                      action that fits. Nothing is deleted for them; two weak lines
                      about one thing offer a merge instead, so cutting the role
                      down does not mean throwing information away. */}
                  {liveWritingChecks.bulletRanking.map((r) => {
                    // The same pair is offered in two places — here and in the
                    // "two lines, one story" card. One applied-key for both, so
                    // merging in either makes it disappear from the other instead
                    // of leaving the user with a button for work already done.
                    const mergeHere = liveWritingChecks.mergeCandidates.find(
                      (m) =>
                        m.targetId === r.targetId &&
                        !appliedItems.has(`merge-${m.targetId}-${m.indexes[0]}-${m.indexes[1]}`),
                    )
                    return (
                      <li key={`rank-${r.targetId}`} className="rounded-xl border border-violet-200 bg-white/70 p-2.5">
                        <p className="text-[11px] font-bold text-slate-800 leading-snug">
                          {t("rank_title", { jobTitle: r.jobTitle, keep: r.strongest.length, cut: r.weakest.length })}
                        </p>
                        <p className="mt-1 text-[9.5px] font-bold uppercase tracking-wide text-emerald-700">{t("rank_keep")}</p>
                        <ul className="mt-0.5 space-y-0.5">
                          {r.strongest.map((b) => (
                            <li key={`k-${b.index}`} className="text-[10px] text-slate-600 leading-snug line-clamp-1">• {b.text}</li>
                          ))}
                        </ul>
                        <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-wide text-rose-600">{t("rank_cut")}</p>
                        <ul className="mt-0.5 space-y-1">
                          {r.weakest
                            .filter((b) => ownedBy.cut.has(`${r.targetId}-${b.index}`))
                            .map((b) => (
                            <li key={`w-${b.index}`} className="rounded-lg bg-rose-50/60 px-2 py-1.5">
                              <p className="text-[10.5px] text-slate-700 leading-snug">• {b.text}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="text-[9px] text-rose-600/90">
                                  {t(`rank_why_${cutReason(b)}` as "rank_why_outranked")}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPendingRemove({ targetId: r.targetId, index: b.index, text: b.text })}
                                  className="ml-auto rounded-full border border-slate-300 px-2 py-0.5 text-[9.5px] font-bold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
                                >
                                  {t("bullet_remove")}
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        {r.weakestHidden > 0 && (
                          <p className="mt-1 text-[9px] text-slate-400">{t("rank_more_weak", { count: r.weakestHidden })}</p>
                        )}
                        {mergeHere && (
                          <button
                            type="button"
                            onClick={() => void runMerge(mergeHere)}
                            disabled={mergingKey === `merge-${mergeHere.targetId}-${mergeHere.indexes[0]}-${mergeHere.indexes[1]}`}
                            className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-violet-700 disabled:opacity-50 cursor-pointer"
                          >
                            <Layers className="h-2.5 w-2.5" /> {t("rank_merge_instead")}
                          </button>
                        )}
                      </li>
                    )
                  })}
                  {liveWritingChecks.bulletBalance.filter((bb) => bb.kind !== "too_many").map((bb, i) => (
                    <li key={i} className="text-[11px] text-slate-700 leading-snug flex items-start gap-1.5">
                      <AlertCircle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                      {bb.kind === "too_many"
                        ? t("check_bullets_many", { job: bb.jobTitle, count: bb.count })
                        : t("check_bullets_none", { job: bb.jobTitle })}
                    </li>
                  ))}
                </ul>
              </div>
            )}



            {/* ── Skills — ONE card ────────────────────────────────────────
                Three separate cards used to ask for skills: "missing keywords",
                "listed without evidence", and soft skills buried in the bullets
                list. Same subject, three places, and the user had to work out
                that they were different questions about one section. One card,
                three groups, each with the action that actually fits it. ── */}
            {(() => {
              const typos = new Set((atsResult.typoWarnings ?? []).map((w) => w.keyword.toLowerCase()))
              const ownSkills = ((sectionData.skills ?? []) as SkillItem[]).map((sk) => sk.name)
              // A keyword the CV misspells shows ONCE, as a typo above — never
              // also here as "missing". findDuplicateSkill is the last defence
              // against offering a skill the CV already states under another
              // spelling or in the other language.
              const missingKw = [...(atsResult.missingKeywords ?? []), ...tailor.missingSkills]
                .filter((kw) => !typos.has(kw.toLowerCase()))
                .filter((kw) => !findDuplicateSkill(kw, ownSkills))
                .filter((kw, i, arr) => arr.findIndex((o) => o.toLowerCase() === kw.toLowerCase()) === i)
              // Soft skills moved to the bullets list — their action writes a
              // bullet, so they belong with the work on bullets, not among tags
              // the user adds to a chip list.
              if (missingKw.length === 0) return null
              return (
              <div id="ats-skills" className={`rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-sm p-3.5 scroll-mt-4 transition-all duration-500${hlRing("ats-skills")}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-black tracking-widest uppercase text-slate-600 flex items-center gap-1.5">
                    <Tag className="h-3 w-3" /> {t("skills_card_title")}
                  </p>
                  {missingKw.length > 0 && (
                    <button type="button" onClick={() => addAllKeywords()}
                      className="text-[10px] font-bold text-cyan-600 hover:text-cyan-800 transition-colors bg-cyan-50 hover:bg-cyan-100 px-2 py-0.5 rounded-full">
                      + {t("button_add_all")}
                    </button>
                  )}
                </div>

                {missingKw.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-slate-500 mb-1.5">{t("skills_group_missing")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {missingKw.map((kw, i) => {
                        const added = addedKeywords.has(kw)
                        return (
                          <span key={i} className={`inline-flex items-stretch rounded-full overflow-hidden ring-1 ${added ? "ring-emerald-200 bg-emerald-100" : "ring-slate-200 bg-slate-100"}`}>
                            <button type="button" onClick={() => addKeywordToSkills(kw)} disabled={added}
                              className={`flex items-center gap-1 text-[10px] font-semibold pl-2.5 pr-2 py-1 transition-all ${added ? "text-emerald-700 cursor-default" : "text-slate-700 hover:bg-cyan-100 hover:text-cyan-700 cursor-pointer"}`}>
                              {added ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                              {kw}
                            </button>
                            <button type="button" onClick={() => void weaveSkill(kw, undefined, false)}
                              disabled={!!weavingSoft}
                              title={t("prove_action")} aria-label={t("prove_action")}
                              className="flex items-center justify-center px-2 border-l border-slate-200 text-cyan-700 transition-all hover:bg-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed">
                              {weavingSoft === kw ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Listed, but nothing in the experience backs them. Dumping every
                    keyword into Skills still moves coverage — the word IS in the CV
                    — so each one lands here, unbacked, where the user can see it.
                    No invented penalty: whether the experience mentions the skill is
                    a fact, and it is what a recruiter checks after the claim. */}
                {/* REMOVED: "listed, with no evidence".
                    It offered to write a bullet proving each unbacked skill, and
                    the structure check two cards down then asked the user to
                    delete lines from the role that received them. The same
                    contradiction was reported three times, and warning about it
                    was not enough — the honest answer is that a keyword already
                    in the Skills section already counts for the match, so this
                    card was spending model calls and the user's trust to solve a
                    problem the score does not have. What it was really measuring
                    — a claim you cannot back up in an interview — belongs to the
                    credibility pass, which already says it in one line without
                    asking anyone to write six new bullets. */}


                <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed">{t("keyword_hint")}</p>
              </div>
              )
            })()}
            </>)}

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
                    reason: tailor.softSkillSuggestions.find((sk) => sk.skill === picked.skill)?.suggestion ?? t("soft_skill_demonstrate"),
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
