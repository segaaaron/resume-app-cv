"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MessageSquare, Loader2, ChevronDown, ChevronUp, CheckCircle2, TrendingUp, Lightbulb, Check, Wand2 } from "lucide-react"
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

export default function CVReviewPanel() {
  const t = useTranslations("editor.cv_review")
  const tAts = useTranslations("editor.ats")
  const { sectionData, updateSectionData } = useResumeStore()
  const { question, setQuestion, loading, result, review, reset } = useCVReview()
  const [expanded, setExpanded] = useState(true)
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
  }

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden mt-4">
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold">{t("title")}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">{t("pro_badge")}</span>
          </div>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-3 bg-white border-t border-border">
            <p className="text-[11px] text-muted-foreground pt-3 leading-relaxed">{t("description")}</p>

            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("placeholder")}
              className="text-xs min-h-[72px] resize-none"
              maxLength={300}
            />

            <div className="flex items-center justify-between">
              <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleReview} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                {loading ? t("analyzing") : t("analyze")}
              </Button>
              {result && (
                <button
                  type="button"
                  onClick={() => { reset(); setAppliedItems(new Set()) }}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("clear")}
                </button>
              )}
            </div>

            {/* Result */}
            {result && (
              <div className="space-y-3 pt-1">

                {/* Answer to specific question */}
                {result.answer && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                    <p className="text-[11px] font-semibold text-emerald-700 mb-1.5 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {t("answer_label")}
                    </p>
                    <p className="text-xs text-foreground leading-relaxed">{result.answer}</p>
                  </div>
                )}

                {/* Summary */}
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[11px] font-semibold text-foreground mb-1.5">{t("summary_label")}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{result.summary}</p>
                </div>

                {/* Strengths */}
                {result.strengths.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-foreground mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {t("strengths_label")}
                    </p>
                    <div className="space-y-1.5">
                      {result.strengths.map((item, i) => {
                        const itemKey = `strength-${i}`
                        const applied = appliedItems.has(itemKey)
                        return (
                          <div key={i} className="flex gap-2 text-xs text-foreground leading-relaxed">
                            <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                            <span className="flex-1">{item.text}</span>
                            {item.suggestion && !applied && (
                              <button type="button" onClick={() => openDiffModal(item, itemKey)}
                                className="shrink-0 flex items-center gap-0.5 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.5 transition-colors">
                                <Wand2 className="h-2.5 w-2.5" /> {t("apply_button")}
                              </button>
                            )}
                            {applied && (
                              <span className="shrink-0 flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5">
                                <Check className="h-2.5 w-2.5" /> {t("applied")}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {result.improvements.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-foreground mb-1.5 flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-amber-600" /> {t("improvements_label")}
                    </p>
                    <div className="space-y-1.5">
                      {result.improvements.map((item, i) => {
                        const itemKey = `improvement-${i}`
                        const applied = appliedItems.has(itemKey)
                        return (
                          <div key={i} className="flex gap-2 text-xs text-foreground leading-relaxed">
                            <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                            <span className="flex-1">{item.text}</span>
                            {item.suggestion && !applied && (
                              <button type="button" onClick={() => openDiffModal(item, itemKey)}
                                className="shrink-0 flex items-center gap-0.5 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.5 transition-colors">
                                <Wand2 className="h-2.5 w-2.5" /> {t("apply_button")}
                              </button>
                            )}
                            {applied && (
                              <span className="shrink-0 flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5">
                                <Check className="h-2.5 w-2.5" /> {t("applied")}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

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
