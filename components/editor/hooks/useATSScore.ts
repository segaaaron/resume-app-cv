"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useResumeStore } from "@/stores/resumeStore"
import { useTranslations, useLocale } from "next-intl"
import type { Suggestion } from "../SuggestionDiffModal"

export interface ATSResult {
  score: number
  label: string
  summary: string
  strengths: string[]
  gaps: string[]
  missingKeywords: string[]
  suggestions: string[]
}

export interface ReviewItem {
  text: string
  suggestion?: Suggestion
}

export interface ReviewResult {
  summary: string
  strengths: ReviewItem[]
  improvements: ReviewItem[]
  answer: string
}

/** Heuristic: short text or ends with ? → treat as question */
export function isQuestion(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.endsWith("?")) return true
  if (trimmed.length < 50) return true
  return false
}

export function useATSScore() {
  const t = useTranslations("editor.ats")
  const locale = useLocale()
  const { sectionData } = useResumeStore()

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [offTopic, setOffTopic] = useState(false)

  const analyze = useCallback(async () => {
    const text = input.trim()
    if (text.length < 5) {
      toast.error(t("toast_empty_input"))
      return
    }
    setLoading(true)
    setAtsResult(null)
    setReviewResult(null)
    setOffTopic(false)

    try {
      if (isQuestion(text)) {
        const res = await apiFetch("/api/ai/review-cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionData, question: text, language: locale }),
        })
        if (res.status === 429) { toast.error(t("rate_limit_exceeded")); return }
        if (res.status === 403) { toast.error(t("pro_only")); return }
        if (res.status === 400) { toast.error(t("not_enough_data")); return }
        if (res.status === 422) { setOffTopic(true); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setReviewResult(data)
      } else {
        const res = await apiFetch("/api/ai/ats-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription: text, sectionData, language: locale }),
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
  }, [input, sectionData, locale, t])

  const reset = useCallback(() => {
    setAtsResult(null)
    setReviewResult(null)
    setOffTopic(false)
    setInput("")
  }, [])

  const hasResult = atsResult !== null || reviewResult !== null

  return {
    input, setInput,
    loading,
    atsResult, reviewResult,
    offTopic,
    hasResult,
    analyze,
    reset,
  }
}
