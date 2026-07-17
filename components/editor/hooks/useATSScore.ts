"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { useTranslations, useLocale } from "next-intl"
import type { Suggestion } from "../SuggestionDiffModal"
import { useAICooldown } from "./useAICooldown"
import { useAICall } from "@/hooks/useAICall"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { handleApiError } from "@/lib/upgrade-modal-handler"
import { useRouter } from "next/navigation"

export interface ATSSubScores {
  hardSkills: number | null
  softSkills: number | null
  title: number | null
  sections: number | null
}

export interface ATSResult {
  score: number
  label: string
  summary: string
  strengths: string[]
  gaps: string[]
  matchedKeywords?: string[]
  missingKeywords: string[]
  /** Matched, but with nothing in the work experience behind them. */
  listedOnlyKeywords?: string[]
  suggestions: string[]
  subScores?: ATSSubScores
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
  const aiT = useTranslations("editor.ai")
  const locale = useLocale()
  const router = useRouter()
  const { open: openUpgradeModal } = useUpgradeModal()
  const { preCheck, onSuccess } = useAICall()
  const { sectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData }))
  )

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [offTopic, setOffTopic] = useState(false)
  const { cooldownUntil, setCooldownUntil } = useAICooldown("cooldown_ats")
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
        preCheck("review-cv")
        const res = await apiFetch("/api/ai/review-cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionData, question: text, language: locale }),
        })
        if (res.status === 429 || res.status === 403) {
          const handled = await handleApiError(res, {
            openUpgradeModal,
            redirect: (p) => router.push(p),
            locale,
            fallbackToast: () => toast.error(res.status === 429 ? t("rate_limit_exceeded") : t("pro_only")),
            dailyCapToast: () => toast.warning(aiT("daily_cap_reached"), { duration: 6000 }),
          })
          if (handled || res.status === 429 || res.status === 403) return
        }
        if (res.status === 400) { toast.error(t("not_enough_data")); return }
        if (res.status === 422) { setOffTopic(true); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setReviewResult(data)
        await onSuccess()
      } else {
        preCheck("ats-score")
        const res = await apiFetch("/api/ai/ats-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription: text, sectionData, language: locale }),
        })
        if (res.status === 429 || res.status === 403) {
          const handled = await handleApiError(res, {
            openUpgradeModal,
            redirect: (p) => router.push(p),
            locale,
            fallbackToast: () => toast.error(res.status === 429 ? t("rate_limit_exceeded") : t("pro_only")),
            dailyCapToast: () => toast.warning(aiT("daily_cap_reached"), { duration: 6000 }),
          })
          if (handled || res.status === 429 || res.status === 403) return
        }
        if (res.status === 400) { toast.error(t("not_enough_data")); return }
        if (res.status === 422) { setOffTopic(true); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setAtsResult(data)
        await onSuccess()
      }
      lastKeyRef.current = key
      setCooldownUntil(Date.now() + 120_000)
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
  }, [input, sectionData, locale, t, aiT, loading, cooldownUntil])

  const hasResult = atsResult !== null || reviewResult !== null

  return {
    input, setInput,
    loading,
    atsResult, reviewResult,
    offTopic,
    hasResult,
    analyze,
    cooldownUntil,
  }
}
