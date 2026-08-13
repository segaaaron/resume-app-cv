"use client"

import { useState, useRef, useMemo } from "react"
import { useLocale, useTranslations } from "next-intl"
import { apiFetch } from "@/lib/apiFetch"
import { cutReason } from "@/lib/ats/bullet-strength"
import { suggestFigureSlot } from "@/lib/ats/figure-slot"
import { toMachineDate } from "@/lib/ats/normalize-dates"
import { parseBullets, formatBullet, serializeBullets, serializeBulletsReporting } from "@/lib/services/ai/shared/bullets"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { isApplicableFix, detectWordCorrections } from "@/lib/ats/fix-text"
// Same normalization the matcher used to decide "demonstrated", so an accented
// Spanish skill matches the stored verdict instead of silently missing it.
import { normalizeTerm } from "@/lib/ats/vocabulary"
import { computeCredibility, credibilityVerdict } from "@/lib/ats/credibility"
import { fixAxis, type FixAxis } from "@/lib/ats/fix-impact"
import { sameSoftRequirement } from "@/lib/ats/skill-dedup"
import { Target, Loader2, CheckCircle2, AlertCircle, Lightbulb, Tag, Plus, Check, MessageSquare, TrendingUp, Wand2, Clock, ShieldCheck, LayoutTemplate, FileSearch, ListChecks, ChevronRight, Users, Layers, Stethoscope, Sparkles, Pencil, PenLine } from "lucide-react"
import { useTailorCV } from "./hooks/useTailorCV"
import AtsEngineMatrix from "./AtsEngineMatrix"
import AtsSafeDownload from "./AtsSafeDownload"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import SuggestionDiffModal, { type Suggestion, type SuggestionField } from "./SuggestionDiffModal"
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
import { markContentOptimized, isContentOptimized } from "./hooks/useOptimizedGuard"
import { normalizeDates } from "@/lib/ats/normalize-dates"
import { useCooldownLabel } from "./hooks/useAICooldown"
import { useCvLanguage } from "./hooks/useCvLanguage"
import type { ReviewItem } from "./hooks/useATSScore"
import { AI_INPUT_LIMITS, ImproveBulletResponseSchema } from "@/lib/services/ai/shared/ai-types"
import { computeResumeScore, type ResumeScoreKey } from "@/lib/services/ai/shared/resume-score"

/** One colour per number, so the badge and the figure it refers to read as a pair. */
/**
 * Share of bullets that should carry a figure. Not every line takes one — an
 * "improved code quality" cannot be counted honestly — and a resume where every
 * single line ends in a percentage is the manufactured pattern the credibility
 * check exists to catch. Half is the shape of a well-written history.
 */
const HEALTHY_METRIC_PCT = 50

const AXIS_STYLE: Record<FixAxis, string> = {
  match: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  content: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  trust: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 70
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  return (
    <div className="relative flex flex-col items-center gap-2 py-4">
      <div className="relative inline-block" style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.3))' }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#00D4FF' }} />
              <stop offset="100%" style={{ stopColor: '#10B981' }} />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(0,212,255,0.08)" strokeWidth="8" />
          <circle cx="80" cy="80" r="70" fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-black text-[#1a2e4a] leading-none">{score}</div>
          <div className="text-[10px] font-bold text-dash-cyan uppercase tracking-widest mt-1">{label}</div>
        </div>
      </div>
    </div>
  )
}

// One cyan across the panel (#00D4FF, the --dash-cyan token). The ring and bars
// used to run on #00E5FF, a third shade that existed nowhere else in the app.
function getBarStyle(pct: number): { color: string; gradient: string } {
  if (pct >= 80) return { color: '#10B981', gradient: 'linear-gradient(90deg, #10B981, #00D4FF)' }
  if (pct >= 60) return { color: '#00D4FF', gradient: 'linear-gradient(90deg, #00D4FF, #00A8CC)' }
  return { color: '#F59E0B', gradient: 'linear-gradient(90deg, #F59E0B, #FCD34D)' }
}

// Path-to-target lever presentation. Icon per lever + which of the cards below it
// jumps to (levers with no jump target — title, sections — are informative only).
const LEVER_ICON: Record<GapLever["key"], React.ComponentType<{ className?: string }>> = {
  hardSkills: Tag,
  mustHaves: AlertCircle,
  title: Target,
  softSkills: Users,
  sections: Layers,
  template: LayoutTemplate,
}

// Numbered section header — turns the report into ONE ordered flow (verdict →
// what to fix → rewrites → verify) instead of a stack of disconnected cards.
function SectionHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a2e4a] text-white text-[10px] font-black shrink-0">{n}</span>
      <span className="text-[11px] font-black uppercase tracking-widest text-[#1a2e4a]">{title}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
    </div>
  )
}

// Pass-risk pill styling — color-not-only (icon + word), readable in the report.
const RISK_STYLE: Record<"low" | "medium" | "high", { chip: string; label: string }> = {
  low: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "risk_low" },
  medium: { chip: "bg-amber-50 text-amber-700 ring-amber-200", label: "risk_medium" },
  high: { chip: "bg-rose-50 text-rose-700 ring-rose-200", label: "risk_high" },
}

function ScoreBar({ label, pct }: { label: string; pct: number }) {
  const { color, gradient } = getBarStyle(pct)
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] font-semibold text-slate-700">{label}</span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}1A`, color }}
        >
          {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-cyan-50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: gradient }}
        />
      </div>
    </div>
  )
}

// Deterministic CV-health verdict — the reliable "is my CV good or bad?" answer
// that used to live only in the separate AI-Review tab. Computed in code (no LLM,
// no job description needed), so it is honest and always available. This is what
// the user sees first: a plain good/bad verdict, then the dimensions behind it.
const HEALTH_VERDICT: { min: number; label: string; chip: string; ring: string }[] = [
  { min: 80, label: "verdict_strong", chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", ring: "#10B981" },
  { min: 60, label: "verdict_good", chip: "bg-cyan-50 text-cyan-700 ring-cyan-200", ring: "#00D4FF" },
  { min: 40, label: "verdict_fair", chip: "bg-amber-50 text-amber-700 ring-amber-200", ring: "#F59E0B" },
  { min: 0, label: "verdict_weak", chip: "bg-rose-50 text-rose-700 ring-rose-200", ring: "#F43F5E" },
]
const HEALTH_DIM_LABEL: Record<ResumeScoreKey, string> = {
  impact: "dim_impact",
  actionVerbs: "dim_action_verbs",
  completeness: "dim_completeness",
  brevity: "dim_brevity",
  recruiterScan: "dim_recruiter_scan",
}

function CVHealthCard({ data }: { data: ReturnType<typeof computeResumeScore> }) {
  const t = useTranslations("editor.ats")
  const v = HEALTH_VERDICT.find((x) => data.overall >= x.min) ?? HEALTH_VERDICT[HEALTH_VERDICT.length - 1]
  const r = 26
  const c = 2 * Math.PI * r
  const offset = c - (data.overall / 100) * c
  return (
    <div className="@container rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/40 p-4 shadow-sm">
      <div className="flex items-center gap-3.5">
        {/* Compact ring — the health number at a glance */}
        <div className="relative shrink-0" style={{ filter: "drop-shadow(0 0 10px rgba(0,212,255,0.2))" }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="6" />
            <circle cx="32" cy="32" r={r} fill="none" stroke={v.ring} strokeWidth="6"
              strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.8s ease" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black text-[#1a2e4a] leading-none">{data.overall}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-black text-[#1a2e4a]">{t("health_title")}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${v.chip}`}>{t(`health_${v.label}`)}</span>
          </div>
          <p className="mt-0.5 text-[10.5px] text-slate-500 leading-relaxed">{t("health_subtitle")}</p>
        </div>
      </div>
      {/* Dimensions behind the number — honest breakdown, N/A when not measurable */}
      <div className="mt-3 grid grid-cols-1 gap-x-4 @sm:grid-cols-2">
        {data.dimensions.map((d) => {
          const label = t(`health_${HEALTH_DIM_LABEL[d.key]}`)
          if (d.score === null) {
            return (
              <div key={d.key} className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10.5px] font-semibold text-slate-500">{label}</span>
                  <span className="text-[9px] font-bold text-slate-400">{t("health_na")}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full" />
              </div>
            )
          }
          const { color, gradient } = getBarStyle(d.score)
          return (
            <div key={d.key} className="mb-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10.5px] font-semibold text-slate-700">{label}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${color}1A`, color }}>{d.score}%</span>
              </div>
              <div className="h-1.5 bg-cyan-50 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${d.score}%`, background: gradient }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ATSErrorBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50/80 px-5 py-6 text-center backdrop-blur-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 ring-4 ring-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-red-800">{title}</p>
        <p className="text-xs text-red-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

/** Extracts the current string value of a suggestion field from sectionData */
function getCurrentValue(field: SuggestionField, targetId: string | undefined, sectionData: ResumeSections): string {
  switch (field) {
    case "summary":
      return (sectionData.summary as string) ?? ""
    case "personalDetails.jobTitle":
      return (sectionData.personalDetails as { jobTitle?: string })?.jobTitle ?? ""
    case "skills":
      return ((sectionData.skills ?? []) as { name: string }[]).map((s) => s.name).join(", ")
    case "workExperience.description": {
      const items = (sectionData.workExperience ?? []) as { id: string; description?: string }[]
      const item = targetId ? items.find((i) => i.id === targetId) : items[0]
      return item?.description ?? ""
    }
    case "workExperience.jobTitle": {
      const items = (sectionData.workExperience ?? []) as { id: string; jobTitle?: string }[]
      const item = targetId ? items.find((i) => i.id === targetId) : items[0]
      return item?.jobTitle ?? ""
    }
    case "languages":
      return ((sectionData.languages ?? []) as { name?: string; language?: string }[])
        .map((l) => l.name ?? l.language ?? "").join(", ")
    case "certifications":
      return ((sectionData.certifications ?? []) as { name?: string }[]).map((c) => c.name ?? "").join(", ")
    default:
      return ""
  }
}

/**
 * What is actually wrong with this one bullet, from the same deterministic
 * signals the server checks. Sending a guessed defect made the request
 * unstoppable and pointed the prompt at a problem that was not there.
 */
/**
 * What a rewrite of this bullet could still fix.
 *
 * Delegates to the shared rule instead of deciding here. This function used to
 * count a missing figure as a defect, which the endpoint refuses to treat as one
 * — so the panel drew a button whose only possible answer was "already well
 * written". Empty means: do not offer the rewrite.
 */
/**
 * Rows of the "bullets to improve" list shown at once.
 *
 * A CV with forty bullets produced twenty-four rows, which reads as "your resume
 * is broken" rather than as work to get through. Six matches the number of lines
 * a single role should carry (writing-checks), so a full page of this list is
 * about one role's worth of decisions.
 */
const BULLETS_PAGE = 6

/**
 * Where in the CV a finding lands, in the user's words.
 *
 * The report quoted a line and named a problem but never said WHICH section or
 * role it belonged to — on a resume with five jobs and forty bullets, "this
 * bullet" is not an address. The action already carries the target because the
 * buttons need it; this just says it out loud, so a finding with no button is
 * still findable by hand.
 */
function fixLocationLabel(
  action: { kind: string; targetId?: string; index?: number } | undefined,
  jobs: WorkExperienceItem[],
  t: (k: string, v?: Record<string, string | number>) => string,
): string | null {
  if (!action) return null
  if (action.kind === "rewrite_summary") return t("fix_where_summary")
  if (action.kind === "add_skill") return t("fix_where_skills")
  if (action.kind === "fix_dates") return t("fix_where_dates")
  if (action.kind === "rewrite_bullet" && action.targetId) {
    const job = jobs.find((j) => j.id === action.targetId)
    if (!job) return null
    const where = [job.jobTitle, job.employer].filter(Boolean).join(" · ")
    return action.index === undefined
      ? where
      : t("fix_where_bullet", { job: where, n: action.index + 1 })
  }
  return null
}

function bulletDefects(text: string): string[] {
  return repairableDefects(text)
}

/**
 * May the AI still be asked to rewrite this job's bullets?
 *
 * Two conditions, both cheap and local. There has to be a defect a rewrite can
 * repair, AND the text must not be what the AI wrote last time — the ATS panel
 * used to only WRITE that mark and never read it, so a bullet the model had just
 * produced could be sent straight back to the model from here. Every such press
 * pays for an answer we already have.
 */
function canAskAI(jobId: string, description: string, bullet: string): boolean {
  if (repairableDefects(bullet).length === 0) return false
  return !isContentOptimized(`opt_bullet_${jobId}`, description)
}

export default function ATSScorePanel() {
  const t = useTranslations("editor.ats")
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
  async function runRescore() {
    await rescore()
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
        toast.error(t("metricless_improve_error"))
        return
      }
      const data = await res.json().catch(() => null)
      const parsed = ImproveBulletResponseSchema.safeParse(data)
      if (!parsed.success) { toast.error(t("metricless_improve_error")); return }
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
      const first = Array.isArray(data?.versions) ? data.versions[0] : null
      const text = typeof first === "string" ? first : null
      // The engine says so itself when there is nothing to gain; the text check
      // covers the case where it returns the user's own summary back.
      if (data?.status === "already_optimized" || !text || text.trim() === current.trim()) {
        toast.info(t("summary_already_good"))
        return
      }
      setModal({
        suggestion: { field: "summary", type: "replace", preview: text, reason: t("summary_fix_reason") },
        currentValue: current,
        itemKey: "fix-summary",
      })
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
      if (job && bullet && proposed && isApplicableFix(proposed, bullet)) {
        // The analyst already wrote the replacement. Offering "Rewrite" here would
        // pay the model to write it a second time; offering nothing — which is
        // what a metric-only defect used to get — left a critical finding dead.
        key = `bullet-${action.targetId}-${action.index}`
        label = t("fix_action_apply_text")
        run = () => setBulletFix({
          targetId: action.targetId as string,
          index: action.index as number,
          current: bullet,
          improved: proposed,
          recommended: proposed,
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
      const applyText = (text: string) => () => setModal({
        suggestion: { field: "summary", type: "replace", preview: text, reason: t("summary_fix_reason") },
        currentValue: currentSummary,
        itemKey: "fix-summary",
      })
      if (hasProposed) label = t("fix_action_apply_text")
      run = hasProposed
        ? applyText(proposed as string)
        : hasTailored
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
    if (!job || index < 0 || index >= bullets.length || bullets[index].trim() !== current.trim()) {
      toast.error(t("metricless_improve_error"))
      return false
    }
    const written = serializeBulletsReporting(bullets.map((line, i) => (i === index ? next : line)))
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
      if (!job || index < 0 || index >= bullets.length || bullets[index].trim() !== bulletFix.current.trim()) {
        toast.error(t("metricless_improve_error"))
        return
      }
      // A merge deletes a second line, so BOTH have to still be the lines that
      // were merged. If either moved, dropping one would destroy work the user
      // never agreed to lose.
      const rm = bulletFix.removeIndex
      if (rm !== undefined && (rm < 0 || rm >= bullets.length || bullets[rm].trim() !== (bulletFix.removeCurrent ?? "").trim())) {
        toast.error(t("metricless_improve_error"))
        return
      }
      // Replace the one bullet; re-mark every bullet uniformly so the stored
      // description stays consistent (formatBullet strips then re-adds "• ").
      // Through the one owner of the convention, so this path cannot reintroduce
      // a duplicate the rest of the app has made impossible.
      const merged = bullets.map((line, i) => (i === index ? improved : line))
      const written = serializeBulletsReporting(
        bulletFix.removeIndex !== undefined ? merged.filter((_, i) => i !== bulletFix.removeIndex) : merged,
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
  /** Hard-skill variant: the CV LISTS the skill but nothing shows it. */
  function proveSkill(skill: string) {
    return weaveSkill(skill, undefined, false)
  }
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
      setModal({
        suggestion: { field: "workExperience.description", type: "append", preview: data.text, reason, targetId: data.targetId },
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
      if (!job || index < 0 || index >= bullets.length || bullets[index].trim() !== text.trim()) {
        toast.error(t("toast_change_error")); return
      }
      const next = bullets.filter((_, i) => i !== index).map(formatBullet).join("\n")
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

  function openDiffModal(item: ReviewItem, itemKey: string) {
    if (!item.suggestion) return
    const currentValue = getCurrentValue(item.suggestion.field, item.suggestion.targetId, sectionData as unknown as ResumeSections)
    setModal({ suggestion: item.suggestion, currentValue, itemKey })
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
  function addAllKeywords() {
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
    if (added.length === 0) { toast.info(t("toast_keywords_already")); return }
    updateSectionData("skills", [...existing, ...added])
    setAddedKeywords((prev) => { const next = new Set(prev); candidates.forEach((kw) => next.add(kw)); return next })
    toast.success(t("keywords_added", { count: added.length }))
    void runRescore()
  }

  /**
   * Reorder the work history, most recent first.
   *
   * Deterministic: the end date decides, an ongoing role outranks a finished one,
   * and a role with no readable date KEEPS ITS POSITION rather than being guessed
   * into place — inventing an order is the same class of harm as inventing a date.
   * Nothing is deleted and no text is touched; only the sequence changes.
   */
  function reorderRoles() {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    if (work.length < 2) return
    const rank = (j: WorkExperienceItem): number | null => {
      if (j.currentlyWorking) return Number.MAX_SAFE_INTEGER
      const machine = toMachineDate(j.endDate) ?? toMachineDate(j.startDate)
      if (!machine) return null
      const [mm, yyyy] = machine.split("/")
      return Number(yyyy) * 12 + Number(mm)
    }
    // Undated rows keep their index; dated rows sort among the positions dated
    // rows already occupy. So a partially dated history is improved, never
    // scrambled.
    const dated = work.map((j, i) => ({ j, i, r: rank(j) })).filter((x) => x.r !== null)
    const slots = dated.map((x) => x.i)
    const sorted = [...dated].sort((a, b) => (b.r as number) - (a.r as number) || a.i - b.i)
    if (sorted.every((x, k) => x.i === slots[k])) {
      toast.info(t("cred_order_already"))
      return
    }
    const next = [...work]
    slots.forEach((slot, k) => { next[slot] = sorted[k].j })
    updateSectionData("workExperience", next)
    toast.success(t("cred_order_done"))
    void runRescore()
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

  function ReviewItemRow({ item, itemKey, icon, iconColor }: {
    item: ReviewItem
    itemKey: string
    icon: React.ReactNode
    iconColor: string
  }) {
    const applied = appliedItems.has(itemKey)
    const clickable = !!item.suggestion && !applied
    return (
      <li
        className={`flex items-start gap-2 p-2.5 rounded-xl transition-all duration-200 ${
          clickable ? "hover:bg-slate-50 cursor-pointer" : ""
        }`}
        onClick={clickable ? () => openDiffModal(item, itemKey) : undefined}
      >
        <span className={`mt-0.5 shrink-0 ${iconColor}`}>{icon}</span>
        <span className="text-xs text-slate-700 leading-relaxed flex-1">{item.text}</span>
        {item.suggestion && !applied && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openDiffModal(item, itemKey) }}
            className="shrink-0 flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 text-cyan-700 border border-cyan-200 rounded-full px-2 py-0.5 transition-all"
          >
            <Wand2 className="h-2.5 w-2.5" /> {t("apply_button")}
          </button>
        )}
        {applied && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
            <Check className="h-2.5 w-2.5" /> {t("applied")}
          </span>
        )}
      </li>
    )
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
        {cvReady && <CVHealthCard data={cvHealth} />}

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
            {atsResult.subScores && (
              <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/80 to-blue-50/60 backdrop-blur-sm p-4">
                <p className="text-[10px] font-black tracking-widest uppercase text-cyan-600 mb-3">{t("title")}</p>
                {atsResult.subScores.hardSkills !== null && atsResult.subScores.hardSkills !== undefined && (
                  <ScoreBar label={t("bar_hard_skills")} pct={atsResult.subScores.hardSkills} />
                )}
                {atsResult.subScores.softSkills !== null && atsResult.subScores.softSkills !== undefined && (
                  <ScoreBar label={t("bar_soft_skills")} pct={atsResult.subScores.softSkills} />
                )}
                {atsResult.subScores.title !== null && atsResult.subScores.title !== undefined && (
                  <ScoreBar label={t("bar_title_match")} pct={atsResult.subScores.title} />
                )}
                {atsResult.subScores.sections !== null && atsResult.subScores.sections !== undefined && (
                  <ScoreBar label={t("bar_sections")} pct={atsResult.subScores.sections} />
                )}

                {/* The arithmetic, on demand.
                    A score whose weights nobody can inspect reads as invented —
                    and these weights ARE ours, chosen rather than measured. We
                    cannot honestly claim otherwise, so the answer is to show the
                    sum and say which figures are convention and which are our
                    judgement. The rows add up to the headline; the user can check. */}
                {atsResult.scoreBreakdown && atsResult.scoreBreakdown.categories.length > 0 && (
                  <details className="group mt-3 border-t border-cyan-100 pt-2.5">
                    <summary className="flex cursor-pointer list-none items-center gap-1.5">
                      <span className="text-[10px] font-bold text-cyan-700">{t("breakdown_toggle")}</span>
                      <ChevronRight className="h-3 w-3 text-cyan-500 transition-transform group-open:rotate-90" />
                    </summary>

                    <table className="mt-2 w-full text-[10px] tabular-nums">
                      <thead>
                        <tr className="text-left text-slate-400">
                          <th className="font-semibold">{t("breakdown_col_category")}</th>
                          <th className="text-right font-semibold">{t("breakdown_col_coverage")}</th>
                          <th className="text-right font-semibold">{t("breakdown_col_weight")}</th>
                          <th className="text-right font-semibold">{t("breakdown_col_points")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {atsResult.scoreBreakdown.categories.map((c) => (
                          <tr key={c.category} className="border-t border-cyan-50">
                            <td className="py-1 text-slate-600">
                              {t(`bar_${c.category === "hardSkills" ? "hard_skills" : c.category === "softSkills" ? "soft_skills" : c.category === "title" ? "title_match" : c.category === "mustHaves" ? "must_haves" : "sections"}` as "bar_hard_skills")}
                            </td>
                            <td className="py-1 text-right text-slate-500">{c.coveragePct}%</td>
                            <td className="py-1 text-right text-slate-500">{Math.round(c.share * 100)}%</td>
                            <td className="py-1 text-right font-bold text-[#1a2e4a]">{c.points}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-cyan-200">
                          <td className="py-1 font-bold text-[#1a2e4a]" colSpan={3}>{t("breakdown_total")}</td>
                          <td className="py-1 text-right font-black text-[#1a2e4a]">{atsResult.scoreBreakdown.score}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Said plainly, because it is the truth and it is what makes
                        the rest credible: no ATS publishes its ranking, so every
                        score in this category is a weighting somebody picked. */}
                    <p className="mt-2 text-[9.5px] leading-relaxed text-slate-500">{t("breakdown_honesty")}</p>
                  </details>
                )}
              </div>
            )}

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
            {atsResult.score < 90 && (atsResult.gapPlan?.length ?? 0) > 0 && (() => {
              const plan = atsResult.gapPlan ?? []
              const potential = Math.min(100, atsResult.score + plan.reduce((a, l) => a + l.points, 0))
              return (
                <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/50 p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ListChecks className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                    <p className="text-[10px] font-black tracking-widest uppercase text-cyan-600">{t("path_title")}</p>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                    {t.rich("path_subtitle", {
                      score: atsResult.score,
                      potential,
                      b: (c) => <span className="font-bold text-slate-800 tabular-nums">{c}</span>,
                    })}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {/* ONE plan, ordered by what gets the interview — not by what
                        moves the score. Credibility comes first and always: the
                        highest-value fix on a real CV (roles listed backwards) is
                        worth exactly zero points, so a plan ranked by points can
                        never put it where it belongs. The two are different
                        currencies and the row says which one it spends, because
                        adding them into one "potential" number would be the false
                        precision this product refuses. Detail stays in the card
                        above; these are the ranked actions. */}
                    {credibility.findings.map((f) => (
                      <li
                        key={`cred-${f.key}`}
                        onClick={() => scrollToFirst("ats-credibility")}
                        className="flex items-center gap-2.5 rounded-xl border border-rose-100 bg-rose-50/40 px-3 py-2.5 transition-all hover:border-rose-200 cursor-pointer"
                      >
                        <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="flex-1 text-[11px] text-slate-700 leading-snug">
                          {t(`cred_${f.key}` as "cred_reverse_order", { count: f.count })}
                        </span>
                        <span className="shrink-0 text-[9.5px] font-black uppercase tracking-wide text-rose-500">
                          {t("path_credibility_badge")}
                        </span>
                      </li>
                    ))}
                    {plan.map((lever) => {
                      const Icon = LEVER_ICON[lever.key]
                      const action = leverAction(lever.key)
                      const label = t(`path_lever_${lever.key}`, { count: lever.missingCount ?? 0 })
                      return (
                        <li
                          key={lever.key}
                          className={`flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white/70 px-3 py-2.5 transition-all ${action ? "hover:border-cyan-200 hover:bg-cyan-50/40 cursor-pointer" : ""}`}
                          onClick={action ?? undefined}
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 ring-1 ring-cyan-100 shrink-0">
                            <Icon className="h-3.5 w-3.5 text-cyan-600" />
                          </span>
                          <span className="flex-1 text-[11.5px] text-slate-700 leading-snug">{label}</span>
                          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-black text-emerald-700 ring-1 ring-emerald-200 tabular-nums">
                            <TrendingUp className="h-2.5 w-2.5" /> {t("path_points", { points: lever.points })}
                          </span>
                          {action && <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                        </li>
                      )
                    })}
                  </ul>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-2.5">{t("path_hint")}</p>
                </div>
              )
            })()}

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
                          {/* The unit, because "−18" next to a big score reads as
                              eighteen points off the match — which it is not, and
                              was asked about in exactly those words. These are
                              credibility points; the two numbers never mix. */}
                          <span className="shrink-0 text-right">
                            <span className="block text-[10px] font-black tabular-nums text-rose-500">−{f.cost}</span>
                            <span className="block text-[8px] font-bold uppercase tracking-wide text-rose-400">{t("cred_points_unit")}</span>
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
                        {f.key === "reverse_order" && (
                          <button
                            type="button"
                            onClick={reorderRoles}
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
              metricless.forEach((b) => add(b.targetId, b.jobTitle, b.index, b.text, "metric"))
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
              const tailored = new Map(
                tailor.bulletRewrites
                  .filter((r) => !sameLine(r.text ?? "", r.currentBullet ?? ""))
                  .map((r) => [`${r.targetId}-${r.index}`, r]),
              )
              tailor.bulletRewrites.forEach((r) => add(r.targetId, r.jobTitle, r.index, r.currentBullet || r.text, "tailored"))
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
              const bullets = [...allBullets].sort((a, b) => rank(a) - rank(b))
              const cq = liveContentQuality
              if (bullets.length === 0 && softSkills.length === 0 && (!cq || cq.totalBullets === 0) && dupes.length === 0) return null
              return (
              <div id="ats-bullets" className={`rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/40 p-3.5 scroll-mt-4 transition-all duration-500${hlRing("ats-bullets")}`}>
                <p className="text-[10px] font-black tracking-widest uppercase text-violet-600 flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3 w-3" /> {t("bullets_to_improve_title")}
                </p>
                {/* Says out loud what the score does NOT do. Quantifying a bullet
                    moves no lever — that is deliberate (a figure the algorithm
                    cannot verify must not inflate a number), but the section above
                    is ranked "by impact", so a user fixed ten bullets, watched the
                    score sit still, and concluded the panel was lying. It was not
                    lying; it was silent about which kind of win this is. */}
                <p className="text-[10px] text-violet-700/80 leading-snug mb-2">{t("bullets_not_score_note")}</p>

                {/* A line that is the tail of the one above it, cut off by a page
                    break when the CV was imported. Import repairs these now, but a
                    document imported before that fix still carries them — and a
                    bullet reading "5%." on its own is the most obviously broken
                    thing a recruiter can see. One click puts the sentence back
                    together; the user reads both halves first. */}
                {liveWritingChecks.orphanFragments
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
                        : t("content_quality_metrics_target", { target: HEALTHY_METRIC_PCT })}
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
                {liveWritingChecks.nearDuplicates
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
                                {b.reasons.has("tailored") && <span className="text-[9px] font-bold rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 px-1.5">{t("reason_tailored")}</span>}
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
                                {t("bullet_number_hint")}
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
                                  disabled={!editingBullet.draft.trim() || editingBullet.draft.trim() === b.text.trim()}
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
                                onClick={() => setEditingBullet({ key, targetId: b.targetId, index: b.index, current: b.text, draft: b.text })}
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
              <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-white p-3.5">
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
                          {r.weakest.map((b) => (
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

            {atsResult.strengths?.length > 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                <p className="text-[10px] font-black tracking-widest uppercase text-emerald-600 flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="h-3 w-3" /> {t("strengths")}
                </p>
                <ul className="space-y-1.5">
                  {atsResult.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5 shrink-0 font-bold">✓</span> {s}
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
              const listedOnly = (atsResult.listedOnlyKeywords ?? []).filter((kw) => !appliedItems.has(`prove-${kw}`))
              // Soft skills moved to the bullets list — their action writes a
              // bullet, so they belong with the work on bullets, not among tags
              // the user adds to a chip list.
              if (missingKw.length === 0 && listedOnly.length === 0) return null
              return (
              <div id="ats-skills" className={`rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-sm p-3.5 scroll-mt-4 transition-all duration-500${hlRing("ats-skills")}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-black tracking-widest uppercase text-slate-600 flex items-center gap-1.5">
                    <Tag className="h-3 w-3" /> {t("skills_card_title")}
                  </p>
                  {missingKw.length > 0 && (
                    <button type="button" onClick={addAllKeywords}
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
                {listedOnly.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-amber-700 mb-1">{t("skills_group_unproven")}</p>
                    <p className="text-[10px] text-slate-500 leading-snug mb-1.5">{t("listed_only_hint")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {listedOnly.map((kw: string) => (
                        <button key={kw} type="button" onClick={() => proveSkill(kw)} disabled={!!weavingSoft}
                          className="flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 bg-amber-50 text-amber-700 ring-1 ring-amber-200 transition-all hover:bg-amber-100 hover:ring-amber-300 disabled:opacity-50">
                          {weavingSoft === kw ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5" />}
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}


                <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed">{t("keyword_hint")}</p>
              </div>
              )
            })()}

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

            {reviewResult.strengths?.length > 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                <p className="text-[10px] font-black tracking-widest uppercase text-emerald-600 flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="h-3 w-3" /> {t("strengths")}
                </p>
                <ul className="space-y-1">
                  {reviewResult.strengths.map((item, i) => (
                    <ReviewItemRow
                      key={i}
                      item={item}
                      itemKey={`strength-${i}`}
                      icon="✓"
                      iconColor="text-emerald-500 font-bold"
                    />
                  ))}
                </ul>
              </div>
            )}

            {reviewResult.improvements?.length > 0 && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5">
                <p className="text-[10px] font-black tracking-widest uppercase text-amber-600 flex items-center gap-1.5 mb-2.5">
                  <TrendingUp className="h-3 w-3" /> {t("label_areas_mejora")}
                </p>
                <ul className="space-y-1">
                  {reviewResult.improvements.map((item, i) => (
                    <ReviewItemRow
                      key={i}
                      item={item}
                      itemKey={`improvement-${i}`}
                      icon={<Lightbulb className="h-3 w-3 text-amber-500" />}
                      iconColor=""
                    />
                  ))}
                </ul>
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
    </>
  )
}
