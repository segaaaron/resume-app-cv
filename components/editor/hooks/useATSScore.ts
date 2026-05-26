"use client"

import { useState, useCallback, useRef } from "react"
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
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const lastKeyRef = useRef<string | null>(null)

  const analyze = useCallback(async () => {
    if (loading) return
    const text = input.trim()
    if (text.length < 5) {
      toast.error(t("toast_empty_input"))
      return
    }
    const key = `${text}:${JSON.stringify({
      s: sectionData.summary,
      w: sectionData.workExperience,
      sk: sectionData.skills,
    })}`
    if (key === lastKeyRef.current) { toast.info(t("no_changes")); return }
    if (Date.now() < cooldownUntil) {
      const secs = Math.ceil((cooldownUntil - Date.now()) / 1000)
      const label = secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : `${secs}s`
      toast.info(t("cooldown_wait", { seconds: label }))
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
      lastKeyRef.current = key
      setCooldownUntil(Date.now() + 120_000)
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
  }, [input, sectionData, locale, t, loading, cooldownUntil])

  const reset = useCallback(() => {
    setAtsResult(null)
    setReviewResult(null)
    setOffTopic(false)
    setInput("")
    lastKeyRef.current = null
    setCooldownUntil(0)
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
    cooldownUntil,
  }
}
