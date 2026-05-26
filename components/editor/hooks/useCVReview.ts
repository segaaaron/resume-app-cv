"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useResumeStore } from "@/stores/resumeStore"
import { useTranslations, useLocale } from "next-intl"
import type { Suggestion } from "../SuggestionDiffModal"
import { useAICooldown } from "./useAICooldown"

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

const COOLDOWN_MS = 120_000

export function useCVReview() {
  const t = useTranslations("editor.cv_review")
  const locale = useLocale()
  const { sectionData } = useResumeStore()

  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CVReviewResult | null>(null)
  const { cooldownUntil, setCooldownUntil } = useAICooldown("cooldown_cv_review")
  const lastReviewKeyRef = useRef<string | null>(null)

  const review = useCallback(async () => {
    if (loading) return

    const reviewKey = JSON.stringify({
      q: question.trim(),
      s: sectionData.summary,
      w: sectionData.workExperience,
      sk: sectionData.skills,
      l: sectionData.languages,
      c: sectionData.certifications,
    })

    if (reviewKey === lastReviewKeyRef.current) {
      toast.info(t("review_no_changes"))
      return
    }

    if (Date.now() < cooldownUntil) {
      const secs = Math.ceil((cooldownUntil - Date.now()) / 1000)
      toast.info(t("review_cooldown", { seconds: secs }))
      return
    }

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
      lastReviewKeyRef.current = reviewKey
      setCooldownUntil(Date.now() + COOLDOWN_MS)
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
  }, [question, sectionData, locale, t, cooldownUntil, loading])

  const reset = useCallback(() => {
    setResult(null)
    setQuestion("")
    lastReviewKeyRef.current = null
    setCooldownUntil(0)
  }, [])

  return { question, setQuestion, loading, result, review, reset, cooldownUntil }
}
