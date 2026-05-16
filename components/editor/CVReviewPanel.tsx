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

function ReviewItemRow({
  item,
  itemKey,
  applied,
  t,
  tAts,
  onApply,
}: {
  item: ReviewItem
  itemKey: string
  applied: boolean
  t: ReturnType<typeof useTranslations>
  tAts: ReturnType<typeof useTranslations>
  onApply: (item: ReviewItem, key: string) => void
}) {
  const isStrength = itemKey.startsWith("strength")
  return (
    <div className={`flex gap-3 p-3 rounded-lg border text-sm leading-relaxed transition-colors ${
      isStrength
        ? "bg-green-50/60 border-green-100"
        : "bg-amber-50/60 border-amber-100"
    }`}>
      <span className={`shrink-0 mt-0.5 ${isStrength ? "text-green-600" : "text-amber-500"}`}>
        {isStrength ? <CheckCircle2 className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
      </span>
      <span className="flex-1 text-foreground">{item.text}</span>
      {item.suggestion && !applied && (
        <button
          type="button"
          onClick={() => onApply(item, itemKey)}
          className="shrink-0 self-start flex items-center gap-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md px-2 py-1 transition-colors font-medium"
        >
          <Wand2 className="h-3 w-3" /> {t("apply_button")}
        </button>
      )}
      {applied && (
        <span className="shrink-0 self-start flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-md px-2 py-1 font-medium">
          <Check className="h-3 w-3" /> {tAts("toast_change_applied")}
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

        {/* Hero banner */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-4 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white/20 rounded-lg p-1.5">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm">{t("title")}</span>
            <span className="ml-auto text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">{t("pro_badge")}</span>
          </div>
          <p className="text-xs text-white/80 leading-relaxed">{t("description")}</p>
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
