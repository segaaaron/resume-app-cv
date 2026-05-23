"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useResumeStore } from "@/stores/resumeStore"
import { useTranslations, useLocale } from "next-intl"
import type { Suggestion } from "../SuggestionDiffModal"

export interface ReviewItem {
  text: string
  suggestion?: Suggestion
}

export interface CVReviewResult {
  summary: string
  strengths: ReviewItem[]
  improvements: ReviewItem[]
  answer: string
}

export function useCVReview() {
  const t = useTranslations("editor.cv_review")
  const locale = useLocale()
  const { sectionData } = useResumeStore()

  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CVReviewResult | null>(null)

  const review = useCallback(async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await apiFetch("/api/ai/review-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionData, question: question.trim() || undefined, language: locale }),
      })
      if (res.status === 403) { toast.error(t("pro_only")); return }
      if (res.status === 400) { toast.error(t("not_enough_data")); return }
      if (res.status === 422) { toast.error(t("off_topic")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
  }, [question, sectionData, locale, t])

  const reset = useCallback(() => {
    setResult(null)
    setQuestion("")
  }, [])

  return { question, setQuestion, loading, result, review, reset }
}
