"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  MessageSquare, Loader2, CheckCircle2, TrendingUp,
  Lightbulb, Check, Wand2, Sparkles, RotateCcw,
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

const CARD_COLORS = [
  { bg: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))', border: 'rgba(139,92,246,0.3)', left: '#8B5CF6', title: '#7C3AED', action: '#8B5CF6' },
  { bg: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,212,255,0.05))', border: 'rgba(0,212,255,0.3)', left: '#00D4FF', title: '#00B4D8', action: '#00D4FF' },
  { bg: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', border: 'rgba(16,185,129,0.3)', left: '#10B981', title: '#059669', action: '#10B981' },
  { bg: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))', border: 'rgba(245,158,11,0.3)', left: '#F59E0B', title: '#D97706', action: '#F59E0B' },
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
  const colors = CARD_COLORS[index % CARD_COLORS.length]
  const isStrength = itemKey.startsWith("strength")
  const [hover, setHover] = useState(false)
  const canApply = Boolean(item.suggestion) && !applied

  function handleCardClick() {
    if (canApply) onApply(item, itemKey)
  }

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '12px 12px 10px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.left}`,
        borderRadius: 10,
        cursor: canApply ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        marginBottom: 8,
        transform: hover && canApply ? 'translateY(-2px)' : 'none',
        boxShadow: hover && canApply ? '0 8px 20px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.title, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
        {isStrength
          ? <CheckCircle2 className="h-3.5 w-3.5" />
          : <Lightbulb className="h-3.5 w-3.5" />}
        <span>{isStrength ? t("strengths_label") : t("improvements_label")}</span>
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.5, color: '#0F172A', marginBottom: 4 }}>
        {item.text}
      </div>
      {canApply && (
        <div style={{ fontSize: 10, color: colors.action, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Wand2 className="h-2.5 w-2.5" /> {t("apply_button")}
        </div>
      )}
      {applied && (
        <div style={{ fontSize: 10, color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Check className="h-2.5 w-2.5" /> {tAts("toast_change_applied")}
        </div>
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
      <div className="flex flex-col gap-4 p-4">

        {/* Hero header */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #00D4FF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="white" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0B1B3D' }}>{t("title")}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, background: 'rgba(139,92,246,0.1)', color: '#7C3AED', padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>{t("pro_badge")}</span>
          </div>
          <div style={{ fontSize: 11, color: '#475569' }}>{t("description")}</div>
        </div>

        {/* Input area */}
        <div className="space-y-3">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("placeholder")}
            className="text-sm min-h-[88px] resize-none focus-visible:ring-emerald-500"
            maxLength={300}
          />
          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
              onClick={handleReview}
              disabled={loading}
            >
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Sparkles className="h-4 w-4" />}
              {loading ? t("analyzing") : t("analyze")}
            </Button>
            {result && (
              <button
                type="button"
                onClick={() => { reset(); setAppliedItems(new Set()) }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {t("clear")}
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {!result && !loading && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
            <div className="flex justify-center">
              <div className="bg-muted rounded-full p-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("empty_state_hint")}
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[80, 60, 72, 64].map((w, i) => (
              <div key={i} className="h-3 bg-muted rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-4">

            {/* Answer */}
            {result.answer && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" /> {t("answer_label")}
                </p>
                <p className="text-sm text-foreground leading-relaxed">{result.answer}</p>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-foreground mb-2">{t("summary_label")}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> {t("strengths_label")}
                </p>
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
            )}

            {/* Improvements */}
            {result.improvements.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-amber-600" /> {t("improvements_label")}
                </p>
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
