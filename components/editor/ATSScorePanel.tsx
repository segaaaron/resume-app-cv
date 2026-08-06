"use client"

import { useState, useRef, useMemo } from "react"
import { useTranslations } from "next-intl"
import { apiFetch } from "@/lib/apiFetch"
import { parseBullets, formatBullet, serializeBullets } from "@/lib/services/ai/shared/bullets"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { Target, Loader2, CheckCircle2, AlertCircle, Lightbulb, Tag, Plus, Check, MessageSquare, TrendingUp, Wand2, Clock, ShieldCheck, LayoutTemplate, FileSearch, ListChecks, ChevronRight, Users, Layers, Stethoscope, Sparkles } from "lucide-react"
import TailorCVPanel from "./TailorCVPanel"
import AtsEngineMatrix from "./AtsEngineMatrix"
import AtsSafeDownload from "./AtsSafeDownload"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import SuggestionDiffModal, { type Suggestion, type SuggestionField } from "./SuggestionDiffModal"
import JobPickerModal from "./JobPickerModal"
import type { ResumeSections, SkillItem, WorkExperienceItem } from "@/types/resume"
import { useATSScore, isQuestion, type GapLever } from "./hooks/useATSScore"
import { applySuggestion, previewSuggestion } from "@/lib/services/ai/shared/apply-suggestion"
import { applySpellingFix } from "@/lib/ats/apply-spelling"
import { findDuplicateSkill } from "@/lib/ats/skill-dedup"
import { normalizeDates } from "@/lib/ats/normalize-dates"
import { useCooldownLabel } from "./hooks/useAICooldown"
import { useCvLanguage } from "./hooks/useCvLanguage"
import type { ReviewItem } from "./hooks/useATSScore"
import { AI_INPUT_LIMITS, ImproveBulletResponseSchema } from "@/lib/services/ai/shared/ai-types"
import { computeResumeScore, type ResumeScoreKey } from "@/lib/services/ai/shared/resume-score"

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

export default function ATSScorePanel() {
  const t = useTranslations("editor.ats")
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
    scoreDelta: delta,
    verifyReal, verifyResult, verifyLoading,
    cooldownUntil,
  } = useATSScore()
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set())
  const [appliedItems, setAppliedItems] = useState<Set<string>>(new Set())

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
  const [bulletFix, setBulletFix] = useState<{ targetId: string; index: number; current: string; improved: string } | null>(null)
  const [improvingKey, setImprovingKey] = useState<string | null>(null)
  // Soft skills the job asks for that the CV doesn't demonstrate yet — hoisted up
  // from the Tailor run (§③) so ALL bullet work lives in the one list below (§②).
  const [softSkills, setSoftSkills] = useState<{ skill: string; suggestion: string }[]>([])
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
      setBulletFix({ targetId: b.targetId, index: b.index, current: b.text, improved: first.text })
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
  function removeDuplicateBullets() {
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
    if (removed === 0) { toast.info(t("dedupe_none")); return }
    updateSectionData("workExperience", updated)
    toast.success(t("dedupe_done", { count: removed }))
    void runRescore()
  }

  /**
   * One date format across the CV (MM/YYYY), in one action.
   *
   * Mixed formats confuse ATS tenure parsing — the check already said so and
   * then asked the user to retype every field by hand. Dates it cannot read with
   * certainty are left untouched; a wrong date is worse than a mixed one.
   */
  function fixDates() {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const edu = (sectionData.education ?? []) as { startDate?: string; endDate?: string }[]
    const w = normalizeDates(work)
    const e = normalizeDates(edu)
    if (w.changed + e.changed === 0) { toast.info(t("dates_none")); return }
    if (w.changed > 0) updateSectionData("workExperience", w.rows)
    if (e.changed > 0) updateSectionData("education", e.rows as never)
    toast.success(t("dates_done", { count: w.changed + e.changed }))
    void runRescore()
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
  function renderFixAction(action?: { kind: string; targetId?: string; index?: number; value?: string }) {
    if (!action || action.kind === "manual") return null
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]

    let label = ""
    let run: (() => void) | null = null
    let busy = false

    if (action.kind === "rewrite_bullet" && action.targetId && action.index !== undefined) {
      const job = work.find((j) => j.id === action.targetId)
      const bullet = parseBullets(job?.description ?? "")[action.index]
      if (job && bullet) {
        // SAME key the bullets list uses: applying from here marks the bullet
        // applied everywhere, instead of leaving a second live button on a line
        // that has already been rewritten.
        const key = `bullet-${action.targetId}-${action.index}`
        if (appliedItems.has(key)) return null
        busy = improvingKey === key
        label = t("fix_action_rewrite_bullet")
        run = () => improveMetricless(
          { text: bullet, targetId: action.targetId as string, jobTitle: job.jobTitle ?? "", index: action.index as number, reasons: ["weak_verb", "metric"] },
          key,
        )
      }
    } else if (action.kind === "rewrite_summary") {
      label = t("fix_action_rewrite_summary")
      busy = fixingSummary
      run = () => void rewriteSummary()
    } else if (action.kind === "add_skill" && action.value?.trim()) {
      const skill = action.value.trim()
      const already = ((sectionData.skills ?? []) as SkillItem[]).some((sk) => sk.name.toLowerCase() === skill.toLowerCase())
      if (!already) {
        label = t("fix_action_add_skill", { skill })
        run = () => addKeywordToSkills(skill)
      }
    } else if (action.kind === "fix_dates") {
      label = t("fix_action_fix_dates")
      run = fixDates
    } else if (action.kind === "remove_duplicates") {
      label = t("dedupe_action")
      run = removeDuplicateBullets
    }

    if (!run || !label) return null
    return (
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0077B6] to-[#00D4FF] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm transition-all hover:shadow disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
      >
        {busy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5" />}
        {label}
      </button>
    )
  }

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
      // Replace the one bullet; re-mark every bullet uniformly so the stored
      // description stays consistent (formatBullet strips then re-adds "• ").
      const nextDescription = bullets
        .map((line, i) => (i === index ? improved : line))
        .map(formatBullet)
        .join("\n")
      const updated = work.map((j) => (j.id === targetId ? { ...j, description: nextDescription } : j))
      updateSectionData("workExperience", updated)
      setAppliedItems((prev) => new Set(prev).add(`bullet-${targetId}-${index}`))
      toast.success(t("toast_change_applied"))
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
      if (!res.ok) { toast.error(t("soft_skill_error")); return }
      const data = (await res.json().catch(() => null)) as
        | { status: "written"; targetId: string; jobTitle: string; text: string }
        | { status: "no_fit" }
        | null
      const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      // No natural home — the model's call, not the last word. The candidate is
      // the only one who knows where this actually happened, so ask them instead
      // of ending on a toast with nothing to press.
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
        ? (softSkills.find((s) => s.skill === skill)?.suggestion ?? t("soft_skill_demonstrate"))
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
      case "hardSkills": return () => scrollToFirst("ats-missing-keywords", "ats-typos")
      case "mustHaves": return () => scrollToFirst("ats-gaps")
      case "softSkills": return () => scrollToFirst("ats-tailor")
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

  // Fusion: one "Analyze" = one full report. After a manual analysis against a
  // real job description, signal Tailor to run itself (rewrites appear inline in
  // ③ without a second click). Not fired for role-only or question inputs, nor on
  // the live rescore — only on an explicit JD analyze.
  const [autoTailorSignal, setAutoTailorSignal] = useState(0)
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
      setAppliedItems((prev) => new Set(prev).add(`bullet-${targetId}-${index}`))
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
        setAppliedItems((prev) => new Set(prev).add(itemKey))
        setModal(null)
        return
      }

      updateSectionData(result.section, result.value)

      setAppliedItems((prev) => new Set(prev).add(itemKey))
      toast.success(t("toast_change_applied"))
      void runRescore()
    } catch {
      toast.error(t("toast_change_error"))
    } finally {
      setModal(null)
    }
  }

  function addKeywordToSkills(keyword: string) {
    const existing = sectionData.skills ?? []
    const alreadyExists = (existing as { name: string }[]).some(
      (s) => s.name.toLowerCase() === keyword.toLowerCase()
    )
    if (alreadyExists) {
      toast.info(t("keyword_already_added", { keyword }))
      setAddedKeywords((prev) => new Set(prev).add(keyword))
      return
    }
    updateSectionData("skills", [
      ...(existing as SkillItem[]),
      { id: nanoid(), name: keyword, level: "intermediate" as const },
    ])
    setAddedKeywords((prev) => new Set(prev).add(keyword))
    toast.success(t("keyword_added", { keyword }))
    void runRescore()
  }

  function addAllKeywords() {
    const existing = (sectionData.skills ?? []) as { name: string }[]
    const missing = (atsResult?.missingKeywords ?? []).filter(
      (kw) => !existing.some((s) => s.name.toLowerCase() === kw.toLowerCase())
    )
    if (missing.length === 0) { toast.info(t("toast_keywords_already")); return }
    updateSectionData("skills", [
      ...(existing as SkillItem[]),
      ...missing.map((kw): SkillItem => ({ id: nanoid(), name: kw, level: "intermediate" })),
    ])
    setAddedKeywords((prev) => { const next = new Set(prev); missing.forEach((kw) => next.add(kw)); return next })
    toast.success(t("keywords_added", { count: missing.length }))
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
                    <button type="button" onClick={verifyReal} disabled={verifyLoading}
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
                    <button type="button" onClick={verifyReal} disabled={verifyLoading}
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
                (atsResult.contentQuality?.totalBullets ?? 0) > 0 ||
                (atsResult.gaps?.length ?? 0) > 0 ||
                missingKwLeft.length > 0 ||
                (atsResult.suggestions?.length ?? 0) > 0
              return hasFixes ? <SectionHeader n={2} title={t("section_fixes")} /> : null
            })()}

            {/* Recruiter critical fixes — what a keyword matcher can't see (layout,
                weak metrics, language mix, structure), ranked, each: issue → why →
                fix. Typos and missing keywords live in their own cards below, deduped. */}
            {(atsResult.analysis?.criticalFixes?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/60 to-white p-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <p className="text-[10px] font-black tracking-widest uppercase text-rose-600">{t("critical_fixes_title")}</p>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {(atsResult.analysis?.criticalFixes ?? []).map((f, i) => (
                    <li key={i} className="rounded-xl border border-slate-100 bg-white/70 p-3">
                      <div className="flex items-start gap-2">
                        <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${f.severity === "high" ? "bg-rose-500" : "bg-amber-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11.5px] font-semibold text-slate-800 leading-snug">{f.issue}</p>
                          {f.why?.trim() && <p className="text-[10.5px] text-slate-500 leading-snug mt-1">{f.why}</p>}
                          {f.fix?.trim() && (
                            <p className="text-[10.5px] text-emerald-700 leading-snug mt-1 flex items-start gap-1">
                              <Wand2 className="h-3 w-3 shrink-0 mt-0.5" /> <span>{f.fix}</span>
                            </p>
                          )}
                          {/* The button the finding earns. Absent on purpose when
                              nothing in the editor can do it in one click. */}
                          {renderFixAction(f.action)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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

            {/* Bullets to improve — ONE place. Merges the "no metric" signal
                (contentQuality) with the deterministic cliché check (writingChecks),
                deduped by bullet, each with a REAL action: Rewrite (improve-bullet)
                or Remove (a bullet that doesn't earn its place). No longer split
                across two cards that both talked about bullets. */}
            {(() => {
              const metricless = atsResult.contentQuality?.metriclessBullets ?? []
              const cliche = atsResult.writingChecks?.clicheBullets ?? []
              const byKey = new Map<string, { targetId: string; jobTitle: string; index: number; text: string; reasons: Set<string> }>()
              const add = (targetId: string, jobTitle: string, index: number, text: string, reason: string) => {
                const k = `${targetId}-${index}`
                const ex = byKey.get(k)
                if (ex) ex.reasons.add(reason)
                else byKey.set(k, { targetId, jobTitle, index, text, reasons: new Set([reason]) })
              }
              const weakVerb = atsResult.writingChecks?.weakVerbBullets ?? []
              // A bullet the CV states twice. The recruiter pass reports the
              // repetition in prose but cannot point at a line; this names the
              // exact twin, so "Remove" below is a real one-click fix.
              const dupes = atsResult.writingChecks?.duplicateBullets ?? []
              metricless.forEach((b) => add(b.targetId, b.jobTitle, b.index, b.text, "metric"))
              cliche.forEach((c) => add(c.targetId, c.jobTitle, c.index, c.text, "cliche"))
              weakVerb.forEach((w) => add(w.targetId, w.jobTitle, w.index, w.text, "weak_verb"))
              // NOT added to the list: a duplicate is not "a bullet to improve",
              // it is a line that should not be there twice. It gets one banner
              // and one button that cleans the whole CV — see the block below.
              const bullets = [...byKey.values()].filter((b) => !appliedItems.has(`bullet-${b.targetId}-${b.index}`))
              const cq = atsResult.contentQuality
              const visibleSoft = softSkills.filter((s) => !appliedItems.has(`soft-${s.skill}`))
              if (bullets.length === 0 && (!cq || cq.totalBullets === 0) && visibleSoft.length === 0 && dupes.length === 0) return null
              return (
              <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/40 p-3.5">
                <p className="text-[10px] font-black tracking-widest uppercase text-violet-600 flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3 w-3" /> {t("bullets_to_improve_title")}
                </p>
                {cq && cq.totalBullets > 0 && (
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {t("content_quality_metrics", { pct: cq.quantificationPct, quantified: cq.quantifiedBullets, total: cq.totalBullets })}
                  </p>
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

                {bullets.length > 0 && (
                  <ul className="flex flex-col gap-1.5 mt-2">
                    {bullets.map((b) => {
                      const key = `bullet-${b.targetId}-${b.index}`
                      const busy = improvingKey === key
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
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-1.5 mt-1.5">
                            <button
                              type="button"
                              onClick={() => improveMetricless({ text: b.text, targetId: b.targetId, jobTitle: b.jobTitle, index: b.index, reasons: [...b.reasons] }, key)}
                              disabled={busy || !!improvingKey}
                              className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-gradient-to-r from-violet-100 to-fuchsia-100 hover:from-violet-200 hover:to-fuchsia-200 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {busy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5" />}
                              {busy ? t("metricless_improving") : t("bullet_rewrite")}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingRemove({ targetId: b.targetId, index: b.index, text: b.text })}
                              className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-white text-slate-500 border border-slate-200 rounded-full px-2 py-0.5 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                            >
                              {t("bullet_remove")}
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Soft skills live in the SAME list as the bullets, with no heading
                    of their own: a separate titled block read as a second, competing
                    section ("why are there two bullet lists?"). A soft skill is not
                    a tag to add — it is a bullet the CV is missing, so it belongs in
                    the list of bullet work with a chip saying it creates a new one. */}
                {visibleSoft.length > 0 && (
                  <ul className="flex flex-col gap-1.5 mt-1.5">
                    {visibleSoft.map((s) => {
                      const busy = weavingSoft === s.skill
                      return (
                        <li key={s.skill} className="rounded-lg bg-white/60 border border-violet-100 p-2">
                          <div className="flex items-start gap-1.5">
                            <Sparkles className="h-2.5 w-2.5 text-violet-500 shrink-0 mt-1" />
                            <div className="flex-1 min-w-0">
                              <span className="block text-[10.5px] text-slate-600 leading-snug">{s.suggestion}</span>
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                <span className="text-[9px] font-bold rounded-full bg-violet-50 text-violet-600 ring-1 ring-violet-200 px-1.5">
                                  {t("reason_new_bullet")}
                                </span>
                                <span className="text-[9px] text-violet-400/80 capitalize">{s.skill}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end mt-1.5">
                            <button
                              type="button"
                              onClick={() => weaveSoftSkill(s.skill)}
                              disabled={busy || !!weavingSoft}
                              className="inline-flex items-center gap-1 text-[9.5px] font-bold bg-gradient-to-r from-violet-100 to-fuchsia-100 hover:from-violet-200 hover:to-fuchsia-200 text-violet-700 border border-violet-200 rounded-full px-2 py-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {busy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5" />}
                              {busy ? t("soft_skill_weaving") : t("soft_skill_demonstrate")}
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <p className="text-[10px] text-slate-500 leading-relaxed mt-2">{t("content_quality_hint")}</p>
              </div>
              )
            })()}

            {/* Date consistency + bullet balance — deterministic writing checks. */}
            {(atsResult.writingChecks?.dateInconsistency || (atsResult.writingChecks?.bulletBalance?.length ?? 0) > 0) && (
              <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-white p-3.5">
                <p className="text-[10px] font-black tracking-widest uppercase text-sky-600 flex items-center gap-1.5 mb-2">
                  <ListChecks className="h-3 w-3" /> {t("structure_checks_title")}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {atsResult.writingChecks?.dateInconsistency && (
                    <li className="text-[11px] text-slate-700 leading-snug flex flex-col items-start gap-1">
                      <span className="flex items-start gap-1.5">
                        <AlertCircle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" /> {t("check_dates")}
                      </span>
                      <button
                        type="button"
                        onClick={fixDates}
                        className="ml-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#0077B6] to-[#00D4FF] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm transition-all hover:shadow focus:outline-none focus:ring-2 focus:ring-cyan-300"
                      >
                        <Wand2 className="h-2.5 w-2.5" /> {t("fix_action_fix_dates")}
                      </button>
                    </li>
                  )}
                  {(atsResult.writingChecks?.bulletBalance ?? []).map((bb, i) => (
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

            {/* The stuffing answer. Dumping every missing keyword into Skills still
                moves the coverage score — the word IS in the CV — but each one
                lands here, unbacked, where the user can see it. No invented
                penalty: whether the work experience mentions the skill is a fact,
                and it is exactly what a recruiter checks after reading the claim. */}
            {(atsResult.listedOnlyKeywords?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 to-orange-50/50 p-3.5">
                <p className="text-[10px] font-black tracking-widest uppercase text-amber-600 flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="h-3 w-3" /> {t("listed_only")}
                </p>
                <p className="text-[10.5px] text-slate-600 leading-relaxed mb-2.5">{t("listed_only_hint")}</p>
                {/* Each one gets the fix it needs: not "remove the claim" but
                    "show where you did it". Same weaver as the soft skills, hard
                    mode (the bullet names the skill), user picks the role. */}
                <div className="flex flex-wrap gap-1.5">
                  {(atsResult.listedOnlyKeywords ?? []).filter((kw) => !appliedItems.has(`prove-${kw}`)).map((kw: string) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => proveSkill(kw)}
                      disabled={!!weavingSoft}
                      className="flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 bg-white/70 text-amber-700 ring-1 ring-amber-200 transition-all hover:bg-amber-100 hover:ring-amber-300 disabled:opacity-50"
                    >
                      {weavingSoft === kw ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Wand2 className="h-2.5 w-2.5" />}
                      {kw}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{t("listed_only_action_hint")}</p>
              </div>
            )}

            {atsResult.gaps?.length > 0 && (
              <div id="ats-gaps" className={`rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5 scroll-mt-4 transition-all duration-500${hlRing("ats-gaps")}`}>
                <p className="text-[10px] font-black tracking-widest uppercase text-amber-600 flex items-center gap-1.5 mb-2.5">
                  <AlertCircle className="h-3 w-3" /> {t("gaps")}
                </p>
                <ul className="space-y-1.5">
                  {atsResult.gaps.map((g, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5 shrink-0 font-bold">!</span> {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dedup: a keyword the CV misspells is shown ONCE, as a typo above —
                never also here as "missing". Keeps the unified report from saying
                the same thing twice. */}
            {(() => {
              const typos = new Set((atsResult.typoWarnings ?? []).map((w) => w.keyword.toLowerCase()))
              // Last line of defence against offering a skill the CV already
              // states under another spelling or in the other language ("code
              // review" next to "Revisión de código"). Two entries for one skill
              // is the duplication a recruiter reads as machine-written.
              const ownSkills = ((sectionData.skills ?? []) as SkillItem[]).map((sk) => sk.name)
              const missingKw = (atsResult.missingKeywords ?? [])
                .filter((kw) => !typos.has(kw.toLowerCase()))
                .filter((kw) => !findDuplicateSkill(kw, ownSkills))
              if (missingKw.length === 0) return null
              return (
              <div id="ats-missing-keywords" className={`rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-sm p-3.5 scroll-mt-4 transition-all duration-500${hlRing("ats-missing-keywords")}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[10px] font-black tracking-widest uppercase text-slate-600 flex items-center gap-1.5">
                    <Tag className="h-3 w-3" /> {t("missing_keywords")}
                  </p>
                  <button type="button" onClick={addAllKeywords}
                    className="text-[10px] font-bold text-cyan-600 hover:text-cyan-800 transition-colors bg-cyan-50 hover:bg-cyan-100 px-2 py-0.5 rounded-full">
                    + {t("button_add_all")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {missingKw.map((kw, i) => {
                    const added = addedKeywords.has(kw)
                    return (
                      <button key={i} type="button" onClick={() => addKeywordToSkills(kw)} disabled={added}
                        className={`flex items-center gap-1 text-[10px] font-semibold rounded-full px-2.5 py-1 transition-all ${added ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 cursor-default" : "bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-cyan-100 hover:text-cyan-700 hover:ring-cyan-200 cursor-pointer"}`}>
                        {added ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                        {kw}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">{t("keyword_hint")}</p>
              </div>
              )
            })()}

            {atsResult.suggestions?.length > 0 && (
              <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-orange-50/60 p-3.5">
                <p className="text-[10px] font-black tracking-widest uppercase text-amber-600 flex items-center gap-1.5 mb-2.5">
                  <Lightbulb className="h-3 w-3" /> {t("suggestions")}
                </p>
                <ul className="space-y-2">
                  {atsResult.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                      <span className="text-amber-400 shrink-0 mt-0.5 font-bold">→</span>
                      <span className="min-w-0 flex-1">
                        {s.text}
                        {renderFixAction(s.action)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── ③ Ready-to-apply rewrites (Tailor) — inline in the same report,
                chained off the same job description. ─────────────────────────── */}
            <SectionHeader n={3} title={t("section_rewrites")} />
            {/* Soft skills the posting asks for and the CV does not show yet.
                The list itself lives in §② (one place for all bullet work), but
                the entry point belongs here too — this is where the user is when
                they think about what the posting still wants. One button per
                skill; pressing it asks WHICH role it goes in. */}
            {softSkills.filter((sk) => !appliedItems.has(`soft-${sk.skill}`)).length > 0 && (
              <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/70 to-fuchsia-50/40 p-3.5">
                <p className="text-[10px] font-black tracking-widest uppercase text-violet-600 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3 w-3" /> {t("soft_entry_title")}
                </p>
                <p className="text-[10.5px] text-slate-600 leading-relaxed mb-2">{t("soft_entry_hint")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {softSkills.filter((sk) => !appliedItems.has(`soft-${sk.skill}`)).map((sk) => (
                    <button
                      key={sk.skill}
                      type="button"
                      onClick={() => weaveSoftSkill(sk.skill)}
                      disabled={!!weavingSoft}
                      className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[10.5px] font-bold capitalize text-violet-700 transition-all hover:bg-violet-50 disabled:opacity-50"
                    >
                      {weavingSoft === sk.skill ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Plus className="h-2.5 w-2.5" />}
                      {sk.skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div id="ats-tailor" className={`scroll-mt-4 rounded-2xl transition-all duration-500${hlRing("ats-tailor")}`}>
              <TailorCVPanel jobDescription={input} atsMissingKeywords={atsResult.missingKeywords ?? []} autoRunSignal={autoTailorSignal} onSoftSkills={setSoftSkills} />
            </div>
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
            reason: t("content_quality_hint"),
          }}
          currentValue={bulletFix.current}
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
                    reason: softSkills.find((sk) => sk.skill === picked.skill)?.suggestion ?? t("soft_skill_demonstrate"),
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
