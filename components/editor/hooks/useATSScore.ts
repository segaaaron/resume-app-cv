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
  format?: number | null
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
  /** Template parseability tier — "caution" = multi-column, a strict ATS may reorder it. */
  templateSafety?: "safe" | "caution"
  /** JD keywords echoed by the server so we can re-score deterministically after a fix. */
  extractedKeywords?: {
    hardSkills: string[]
    softSkills: string[]
    jobTitle: string
    mustHaves: string[]
  }
  /** Reported content-quality signals (metrics, weak openers). Not part of the score. */
  contentQuality?: {
    totalBullets: number
    quantifiedBullets: number
    quantificationPct: number
    weakOpenerBullets: number
    metriclessBullets: string[]
  }
}

export interface VerifyResult {
  realScore: number
  breakdown: {
    keywords: { score: number }
    format: { score: number; issues: string[] }
    sections: { score: number; missing: string[] }
    length: { score: number; recommendation: string }
    contact: { score: number; hasEmail: boolean; hasPhone: boolean; hasLinkedIn: boolean }
  }
  extractedText: string
  wordCount: number
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
  const { sectionData, templateId } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, templateId: s.config?.templateId }))
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
          body: JSON.stringify({ jobDescription: text, sectionData, language: locale, templateId }),
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

  // Keep the latest result reachable from rescore() without stale-closure risk.
  const atsResultRef = useRef<ATSResult | null>(null)
  atsResultRef.current = atsResult

  /**
   * Deterministic re-score after the user applies a fix. Reuses the keywords the
   * first analyze already extracted → no LLM call, no quota, no cooldown. Updates
   * the score/sub-scores/keyword sets, but PRESERVES the LLM-authored summary and
   * suggestions so applying a fix never wipes the guidance.
   */
  const rescore = useCallback(async (): Promise<number | null> => {
    const prev = atsResultRef.current
    const keywords = prev?.extractedKeywords
    if (!keywords) return null
    const state = useResumeStore.getState()
    try {
      const res = await apiFetch("/api/ai/ats-rescore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords,
          sectionData: state.sectionData,
          language: locale,
          templateId: state.config?.templateId,
        }),
      })
      if (!res.ok) return null
      const data: ATSResult = await res.json()
      setAtsResult((cur) => (cur ? { ...data, summary: cur.summary, suggestions: cur.suggestions } : data))
      return data.score - (prev?.score ?? data.score)
    } catch {
      // Silent — keep the prior score rather than surfacing a re-score failure.
      return null
    }
  }, [locale])

  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)

  /**
   * The pioneer check: render the REAL exported PDF, read what a strict ATS would
   * extract, and score that. Reveals content a two-column template reorders/loses
   * — the structured score can't see it because it never renders the file.
   */
  const verifyReal = useCallback(async () => {
    if (verifyLoading) return
    const state = useResumeStore.getState()
    const text = input.trim()
    if (!state.resumeId || text.length < 15) {
      toast.error(t("verify_needs_jd"))
      return
    }
    setVerifyLoading(true)
    setVerifyResult(null)
    try {
      // Persist current edits first — the PDF is rendered from the SAVED resume,
      // so without this the check would score a stale version.
      await state.save({ skipThumbnail: true })
      const res = await apiFetch("/api/ai/ats-verify-real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: state.resumeId, jobDescription: text, locale }),
      })
      if (res.status === 422) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error === "not_extractable" ? t("verify_not_extractable") : t("verify_error"))
        return
      }
      if (!res.ok) { toast.error(t("verify_error")); return }
      setVerifyResult(await res.json())
    } catch {
      toast.error(t("verify_error"))
    } finally {
      setVerifyLoading(false)
    }
  }, [input, locale, t, verifyLoading])

  const hasResult = atsResult !== null || reviewResult !== null

  return {
    input, setInput,
    loading,
    atsResult, reviewResult,
    offTopic,
    hasResult,
    analyze,
    rescore,
    verifyReal, verifyResult, verifyLoading,
    cooldownUntil,
  }
}
