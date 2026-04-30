"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Target, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Lightbulb, Tag, Plus, Check,
  MessageSquare, TrendingUp, Wand2,
} from "lucide-react"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import SuggestionDiffModal, { type Suggestion, type SuggestionField } from "./SuggestionDiffModal"
import type { ResumeSections, PersonalDetails, SkillItem, WorkExperienceItem } from "@/types/resume"

interface ATSResult {
  score: number
  label: string
  summary: string
  strengths: string[]
  gaps: string[]
  missingKeywords: string[]
  suggestions: string[]
}

interface ReviewItem {
  text: string
  suggestion?: Suggestion
}

interface ReviewResult {
  summary: string
  strengths: ReviewItem[]
  improvements: ReviewItem[]
  answer: string
}

/** Heuristic: short text or ends with ? → treat as question */
function isQuestion(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.endsWith("?")) return true
  if (trimmed.length < 50) return true
  return false
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "#16a34a" :
    score >= 60 ? "#2563eb" :
    score >= 40 ? "#d97706" : "#dc2626"
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 48 48)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x="48" y="44" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="bold" fill={color}>{score}</text>
      <text x="48" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#6b7280">/100</text>
    </svg>
  )
}

function ATSErrorBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
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
  const { sectionData, updateSectionData, config } = useResumeStore()
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [offTopic, setOffTopic] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set())
  const [appliedItems, setAppliedItems] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<{ suggestion: Suggestion; currentValue: string; itemKey: string } | null>(null)

  const inputIsQuestion = isQuestion(input)

  async function handleSubmit() {
    const text = input.trim()
    if (text.length < 5) {
      toast.error(t("toast_empty_input"))
      return
    }
    setLoading(true)
    setAtsResult(null)
    setReviewResult(null)
    setOffTopic(false)
    setAddedKeywords(new Set())
    setAppliedItems(new Set())

    try {
      if (inputIsQuestion) {
        const res = await fetch("/api/ai/review-cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionData, question: text, language: config.language }),
        })
        if (res.status === 429) { toast.error(t("rate_limit_exceeded")); return }
        if (res.status === 403) { toast.error(t("pro_only")); return }
        if (res.status === 400) { toast.error(t("not_enough_data")); return }
        if (res.status === 422) { setOffTopic(true); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setReviewResult(data)
      } else {
        const res = await fetch("/api/ai/ats-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription: text, sectionData, language: config.language }),
        })
        if (res.status === 429) { toast.error(t("rate_limit_exceeded")); return }
        if (res.status === 403) { toast.error(t("pro_only")); return }
        if (res.status === 400) { toast.error(t("not_enough_data")); return }
        if (res.status === 422) { setOffTopic(true); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setAtsResult(data)
      }
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
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
        toast.info(t("toast_update_languages"))
        setAppliedItems((prev) => new Set(prev).add(itemKey))
        setModal(null)
        return

      } else if (field === "certifications") {
        toast.info(t("toast_update_certifications"))
        setAppliedItems((prev) => new Set(prev).add(itemKey))
        setModal(null)
        return
      }

      setAppliedItems((prev) => new Set(prev).add(itemKey))
      toast.success(t("toast_change_applied"))
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
  }

  function ReviewItemRow({ item, itemKey, icon, iconColor }: {
    item: ReviewItem
    itemKey: string
    icon: React.ReactNode
    iconColor: string
  }) {
    const applied = appliedItems.has(itemKey)
    return (
      <li className="flex items-start gap-1.5">
        <span className={`mt-0.5 shrink-0 ${iconColor}`}>{icon}</span>
        <span className="text-xs text-foreground leading-relaxed flex-1">{item.text}</span>
        {item.suggestion && !applied && (
          <button
            type="button"
            onClick={() => openDiffModal(item, itemKey)}
            className="shrink-0 flex items-center gap-0.5 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.5 transition-colors"
          >
            <Wand2 className="h-2.5 w-2.5" /> {t("apply_button")}
          </button>
        )}
        {applied && (
          <span className="shrink-0 flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5">
            <Check className="h-2.5 w-2.5" /> {t("applied")}
          </span>
        )}
      </li>
    )
  }

  const hasResult = atsResult || reviewResult

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold">{t("title")}</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">{t("pro_badge")}</span>
          </div>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-3 bg-white border-t border-border">
            <p className="text-[11px] text-muted-foreground pt-3 leading-relaxed">
              {t("panel_description")}
            </p>

            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("placeholder")}
                className="text-xs min-h-[110px] resize-none"
              />
              {input.trim().length > 0 && (
                <span className={`absolute bottom-2 right-2 text-[9px] px-1.5 py-0.5 rounded font-medium ${
                  inputIsQuestion ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                }`}>
                  {inputIsQuestion ? t("badge_consulta") : t("badge_ats")}
                </span>
              )}
            </div>

            {!inputIsQuestion && input.trim().length > 0 && (
              <p className="text-[10px] text-muted-foreground leading-relaxed">💡 {t("hint")}</p>
            )}

            <Button size="sm" className="w-full gap-2" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : inputIsQuestion && input.trim().length > 0
                  ? <MessageSquare className="h-3.5 w-3.5" />
                  : <Target className="h-3.5 w-3.5" />}
              {loading ? t("analyzing") : inputIsQuestion && input.trim().length > 0 ? t("button_consultar") : t("analyze")}
            </Button>

            {offTopic && (
              <ATSErrorBlock title={t("off_topic_title")} description={t("off_topic_description")} />
            )}

            {/* ATS Results */}
            {atsResult && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-3">
                  <div className="flex flex-col items-center gap-1">
                    <ScoreRing score={atsResult.score} />
                    <span className="text-xs font-semibold" style={{
                      color: atsResult.score >= 80 ? "#16a34a" : atsResult.score >= 60 ? "#2563eb" : atsResult.score >= 40 ? "#d97706" : "#dc2626"
                    }}>{atsResult.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed flex-1">{atsResult.summary}</p>
                </div>

                {atsResult.strengths?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-green-700 flex items-center gap-1 mb-1.5">
                      <CheckCircle2 className="h-3 w-3" /> {t("strengths")}
                    </p>
                    <ul className="space-y-1">
                      {atsResult.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5 shrink-0">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {atsResult.gaps?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-amber-700 flex items-center gap-1 mb-1.5">
                      <AlertCircle className="h-3 w-3" /> {t("gaps")}
                    </p>
                    <ul className="space-y-1">
                      {atsResult.gaps.map((g, i) => (
                        <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5 shrink-0">!</span> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {atsResult.missingKeywords?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] font-semibold text-red-700 flex items-center gap-1">
                        <Tag className="h-3 w-3" /> {t("missing_keywords")}
                      </p>
                      <button type="button" onClick={addAllKeywords}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                        {t("button_add_all")}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {atsResult.missingKeywords.map((kw, i) => {
                        const added = addedKeywords.has(kw)
                        return (
                          <button key={i} type="button" onClick={() => addKeywordToSkills(kw)} disabled={added}
                            className={`flex items-center gap-1 text-[10px] border rounded px-1.5 py-0.5 transition-colors ${
                              added ? "bg-green-50 text-green-700 border-green-300 cursor-default"
                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 cursor-pointer"
                            }`}>
                            {added ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                            {kw}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {t("keyword_hint")}
                    </p>
                  </div>
                )}

                {atsResult.suggestions?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1 mb-1.5">
                      <Lightbulb className="h-3 w-3" /> {t("suggestions")}
                    </p>
                    <ul className="space-y-1">
                      {atsResult.suggestions.map((s, i) => (
                        <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                          <span className="text-indigo-500 mt-0.5 shrink-0">→</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Review Results */}
            {reviewResult && (
              <div className="space-y-3 pt-1">
                {reviewResult.answer && (
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3">
                    <p className="text-[11px] font-semibold text-indigo-700 mb-1.5 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {t("label_respuesta")}
                    </p>
                    <p className="text-xs text-foreground leading-relaxed">{reviewResult.answer}</p>
                  </div>
                )}

                {!reviewResult.answer && reviewResult.summary && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">{reviewResult.summary}</p>
                  </div>
                )}

                {reviewResult.strengths?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-green-700 flex items-center gap-1 mb-1.5">
                      <CheckCircle2 className="h-3 w-3" /> {t("strengths")}
                    </p>
                    <ul className="space-y-2">
                      {reviewResult.strengths.map((item, i) => (
                        <ReviewItemRow
                          key={i}
                          item={item}
                          itemKey={`strength-${i}`}
                          icon="✓"
                          iconColor="text-green-500"
                        />
                      ))}
                    </ul>
                  </div>
                )}

                {reviewResult.improvements?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-amber-700 flex items-center gap-1 mb-1.5">
                      <TrendingUp className="h-3 w-3" /> {t("label_areas_mejora")}
                    </p>
                    <ul className="space-y-2">
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

            {hasResult && (
              <button type="button"
                onClick={() => { setAtsResult(null); setReviewResult(null); setAddedKeywords(new Set()); setAppliedItems(new Set()) }}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                {t("clear")}
              </button>
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
        />
      )}
    </>
  )
}
