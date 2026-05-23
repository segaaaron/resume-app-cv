"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import {
  MessageSquare, Loader2, CheckCircle2, TrendingUp,
  Lightbulb, Check, Wand2, Sparkles, RotateCcw, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import SuggestionDiffModal, { type Suggestion, type SuggestionField } from "./SuggestionDiffModal"
import type { ResumeSections, PersonalDetails, SkillItem, WorkExperienceItem } from "@/types/resume"
import { useCVReview } from "./hooks/useCVReview"
import type { ReviewItem } from "./hooks/useCVReview"

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

const REVIEW_COLORS = [
  { ring: 'ring-violet-200', bg: 'from-violet-50/80 to-purple-50/60', border: 'border-violet-100', accent: 'text-violet-600', bar: '#8B5CF6' },
  { ring: 'ring-cyan-200', bg: 'from-cyan-50/80 to-blue-50/60', border: 'border-cyan-100', accent: 'text-cyan-600', bar: '#00D4FF' },
  { ring: 'ring-emerald-200', bg: 'from-emerald-50/80 to-teal-50/60', border: 'border-emerald-100', accent: 'text-emerald-600', bar: '#10B981' },
  { ring: 'ring-amber-200', bg: 'from-amber-50/80 to-orange-50/60', border: 'border-amber-100', accent: 'text-amber-600', bar: '#F59E0B' },
] as const

function ReviewItemRow({
  item,
  itemKey,
  index,
  applied,
  t,
  tAts,
  onApply,
}: {
  item: ReviewItem
  itemKey: string
  index: number
  applied: boolean
  t: ReturnType<typeof useTranslations>
  tAts: ReturnType<typeof useTranslations>
  onApply: (item: ReviewItem, key: string) => void
}) {
  const colors = REVIEW_COLORS[index % REVIEW_COLORS.length]
  const isStrength = itemKey.startsWith("strength")
  const canApply = Boolean(item.suggestion) && !applied

  return (
    <div
      onClick={() => canApply && onApply(item, itemKey)}
      className={`relative rounded-2xl border bg-gradient-to-br ${colors.bg} ${colors.border} p-3.5 transition-all duration-200 ${
        canApply ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
      } ${applied ? "opacity-80" : ""}`}
    >
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style={{ background: colors.bar }} />

      <div className={`flex items-center gap-1.5 mb-1.5 ${colors.accent}`}>
        {isStrength
          ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          : <Lightbulb className="h-3.5 w-3.5 shrink-0" />}
        <span className="text-[10px] font-black tracking-widest uppercase">
          {isStrength ? t("strengths_label") : t("improvements_label")}
        </span>
      </div>

      <p className="text-xs text-slate-700 leading-relaxed mb-2">{item.text}</p>

      {canApply && (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.accent} bg-white/70 ring-1 ${colors.ring}`}>
          <Wand2 className="h-2.5 w-2.5" /> {t("apply_button")}
        </span>
      )}
      {applied && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200">
          <Check className="h-2.5 w-2.5" /> {tAts("toast_change_applied")}
        </span>
      )}
    </div>
  )
}

export default function CVReviewPanel() {
  const t = useTranslations("editor.cv_review")
  const tAts = useTranslations("editor.ats")
  const { sectionData, updateSectionData, save } = useResumeStore()
  const { question, setQuestion, loading, result, review, reset } = useCVReview()
  const [modal, setModal] = useState<{ suggestion: Suggestion; currentValue: string; itemKey: string } | null>(null)
  const [appliedItems, setAppliedItems] = useState<Set<string>>(new Set())

  const summary = (sectionData.summary as string) ?? ""
  const workExp = (sectionData.workExperience as unknown[]) ?? []
  const skills = (sectionData.skills as unknown[]) ?? []
  const cvReady = summary.trim().length > 0 && workExp.length > 0 && skills.length > 0

  async function handleReview() {
    setAppliedItems(new Set())
    await review()
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
      if (field === "summary") {
        const current = (sectionData.summary as string) ?? ""
        updateSectionData("summary", type === "append" ? [current, preview].filter(Boolean).join(" ") : preview)
      } else if (field === "personalDetails.jobTitle") {
        const pd = (sectionData.personalDetails ?? {}) as PersonalDetails
        updateSectionData("personalDetails", { ...pd, jobTitle: preview })
      } else if (field === "skills") {
        const existing = (sectionData.skills ?? []) as SkillItem[]
        const newNames = preview.split(",").map((s) => s.trim()).filter(Boolean)
        const toAdd = newNames.filter((n) => !existing.some((e) => e.name.toLowerCase() === n.toLowerCase()))
        updateSectionData("skills", [...existing, ...toAdd.map((n): SkillItem => ({ id: nanoid(), name: n, level: "intermediate" }))])
      } else if (field === "workExperience.description" || field === "workExperience.jobTitle") {
        const subField = field === "workExperience.description" ? "description" : "jobTitle"
        const items = [...((sectionData.workExperience ?? []) as WorkExperienceItem[])]
        const idx = targetId ? items.findIndex((i) => i.id === targetId) : 0
        if (idx !== -1) {
          const updated = { ...items[idx] }
          if (type === "append") {
            updated[subField] = [updated[subField], preview].filter(Boolean).join(" ")
          } else {
            updated[subField] = preview
          }
          items[idx] = updated
          updateSectionData("workExperience", items)
        }
      } else if (field === "languages") {
        toast.info(tAts("toast_update_languages"))
        setAppliedItems((prev) => new Set(prev).add(itemKey))
        setModal(null)
        return
      } else if (field === "certifications") {
        toast.info(tAts("toast_update_certifications"))
        setAppliedItems((prev) => new Set(prev).add(itemKey))
        setModal(null)
        return
      }

      setAppliedItems((prev) => new Set(prev).add(itemKey))
      toast.success(tAts("toast_change_applied"))
    } catch {
      toast.error(tAts("toast_change_error"))
    } finally {
      setModal(null)
    }
    save().catch(() => {})
  }

  return (
    <>
      <div className="flex flex-col gap-4 pb-4">

        {/* Hero header */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-400 blur-lg opacity-40 animate-pulse" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-slate-800">{t("title")}</span>
              <span className="text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-violet-500 to-cyan-500 text-white px-2.5 py-1 rounded-full">{t("pro_badge")}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{t("description")}</p>
          </div>
        </div>

        {/* Incomplete CV warning */}
        {!cvReady && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 flex flex-col gap-2">
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

        {/* Textarea */}
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("placeholder")}
          maxLength={300}
          disabled={!cvReady}
          className="w-full min-h-[88px] resize-none rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Buttons row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReview}
            disabled={loading || !cvReady}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-xs font-bold shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? t("analyzing") : t("analyze")}
          </button>
          {result && (
            <button
              type="button"
              onClick={() => { reset(); setAppliedItems(new Set()) }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors shrink-0 px-3 py-2.5 rounded-2xl hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" /> {t("clear")}
            </button>
          )}
        </div>

        {/* Empty state */}
        {!result && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 blur-xl opacity-60" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#cvReviewGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <defs>
                      <linearGradient id="cvReviewGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#00D4FF" />
                      </linearGradient>
                    </defs>
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    <path d="M8 10h8M8 14h5" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-600 mb-1">{t("empty_state_hint")}</p>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">Escribe una pregunta o deja en blanco para una revisión completa</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-3 w-3 rounded-full bg-slate-200" />
                  <div className="h-2.5 rounded-full bg-slate-200" style={{ width: `${40 + i * 15}px` }} />
                </div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-slate-100" style={{ width: `${75 + i * 5}%` }} />
                  <div className="h-2 rounded-full bg-slate-100" style={{ width: `${55 + i * 8}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-4">

            {/* Answer */}
            {result.answer && (
              <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/80 to-blue-50/60 backdrop-blur-sm p-4">
                <p className="text-[10px] font-black tracking-widest uppercase text-cyan-600 flex items-center gap-1.5 mb-2.5">
                  <MessageSquare className="h-3.5 w-3.5" /> {t("answer_label")}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">{result.answer}</p>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-2xl border border-slate-100 bg-white/70 backdrop-blur-sm p-4">
              <p className="text-[10px] font-black tracking-widest uppercase text-slate-500 mb-2">{t("summary_label")}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{result.summary}</p>
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase text-emerald-600 flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t("strengths_label")}
                </p>
                <div className="space-y-2">
                  {result.strengths.map((item, i) => (
                    <ReviewItemRow
                      key={i}
                      item={item}
                      itemKey={`strength-${i}`}
                      index={i}
                      applied={appliedItems.has(`strength-${i}`)}
                      t={t}
                      tAts={tAts}
                      onApply={openDiffModal}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {result.improvements.length > 0 && (
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase text-amber-600 flex items-center gap-1.5 mb-2.5">
                  <TrendingUp className="h-4 w-4" /> {t("improvements_label")}
                </p>
                <div className="space-y-2">
                  {result.improvements.map((item, i) => (
                    <ReviewItemRow
                      key={i}
                      item={item}
                      itemKey={`improvement-${i}`}
                      index={i + (result.strengths?.length ?? 0)}
                      applied={appliedItems.has(`improvement-${i}`)}
                      t={t}
                      tAts={tAts}
                      onApply={openDiffModal}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {modal && (
        <SuggestionDiffModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={handleConfirmApply}
          suggestion={modal.suggestion}
          currentValue={modal.currentValue}
        />
      )}
    </>
  )
}
