"use client"

import { useState, useCallback, useRef, useEffect } from "react"
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
import type { EngineSimulation } from "@/lib/ats/engines"
import { track } from "@/lib/analytics/track"
import { scoreBucket } from "@/lib/analytics/user-type"
import { useEditorPro } from "../EditorContext"

export interface ATSSubScores {
  hardSkills: number | null
  softSkills: number | null
  title: number | null
  sections: number | null
  format?: number | null
}

/** One lever in the "path to your target score" (mirrors the server GapLever). */
export interface GapLever {
  key: "hardSkills" | "mustHaves" | "title" | "softSkills" | "sections" | "template"
  points: number
  currentPct: number | null
  missingCount?: number
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
  /** True when the target came from a role TITLE (standard requirements inferred), not a pasted posting. Result is approximate. */
  inferredFromRole?: boolean
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
    metriclessBullets: Array<{ text: string; targetId: string; jobTitle: string; index: number; weakOpener: boolean }>
  }
  /** Ranked "path to your target score": each lever + the points it recovers. */
  gapPlan?: GapLever[]
  /** Probable typos breaking exact ATS match: {keyword wanted, typed in CV}. */
  typoWarnings?: { keyword: string; typed: string }[]
  /** Senior-recruiter analysis: verdict, pass risk, ranked critical fixes, strengths. */
  analysis?: {
    verdict: string
    passRisk: "low" | "medium" | "high"
    criticalFixes: { issue: string; why: string; fix: string; severity: "high" | "medium" }[]
    strengths: string[]
  } | null
  /** Deterministic writing checks: clichés, date inconsistency, bullet balance. */
  writingChecks?: {
    clicheBullets: { targetId: string; jobTitle: string; index: number; text: string; cliches: string[] }[]
    weakVerbBullets: { targetId: string; jobTitle: string; index: number; text: string }[]
    dateInconsistency: { formats: string[] } | null
    bulletBalance: { targetId: string; jobTitle: string; count: number; kind: "too_many" | "none" }[]
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
  /** Per-engine verdicts of the REAL extracted PDF text. */
  engines?: EngineSimulation
  extractedText: string
  wordCount: number
}

export interface ReviewItem {
  text: string
  suggestion?: Suggestion
}

export interface ResumeScoreDimension {
  key: "impact" | "actionVerbs" | "completeness" | "brevity" | "recruiterScan"
  score: number | null
  detail: Record<string, number>
}

export interface ResumeScore {
  overall: number
  dimensions: ResumeScoreDimension[]
}

export interface ReviewResult {
  summary: string
  strengths: ReviewItem[]
  improvements: ReviewItem[]
  answer: string
  /** Deterministic, JD-independent resume score (computed server-side in code). */
  resumeScore?: ResumeScore
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
  const { plan } = useEditorPro()
  const { sectionData, templateId } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, templateId: s.config?.templateId }))
  )

  const [input, setInput] = useState("")
  // "jd" = paste full posting (precise). "role" = just a job title → the engine
  // infers the STANDARD requirements for that role (low-friction, approximate).
  const [mode, setMode] = useState<"jd" | "role">("jd")
  const [loading, setLoading] = useState(false)
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [offTopic, setOffTopic] = useState(false)
  /** Last score movement (+/-). Owned here so both rescore paths keep it truthful. */
  const [scoreDelta, setScoreDelta] = useState<number | null>(null)
  // Identity of the job input (`mode:text`) that produced the current result.
  // Keyed on the JOB posting only, NOT the CV: CV edits are picked up live by the
  // debounced rescore() below, so re-running the LLM on the same posting adds
  // nothing. This lets the UI say "up to date" instead of inviting a dead click.
  const [analyzedInputKey, setAnalyzedInputKey] = useState<string | null>(null)
  const { cooldownUntil, setCooldownUntil } = useAICooldown("cooldown_ats")
  const lastKeyRef = useRef<string | null>(null)

  const analyze = useCallback(async () => {
    if (loading) return
    const text = input.trim()
    const roleMode = mode === "role"
    if (text.length < (roleMode ? 3 : 5)) {
      toast.error(t("toast_empty_input"))
      return
    }
    // Token-saver: skip the LLM entirely when neither the job/question text NOR
    // ANY part of the CV changed since the last successful analyze. The key now
    // hashes the WHOLE sectionData (the review reads every section), so editing
    // education / languages / certifications correctly triggers a fresh review —
    // and re-clicking with nothing changed spends zero tokens.
    const key = `${mode}:${text}:${JSON.stringify(sectionData)}`
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
    setScoreDelta(null)

    try {
      if (!roleMode && isQuestion(text)) {
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
          body: JSON.stringify(
            roleMode
              ? { roleTitle: text, sectionData, language: locale, templateId }
              : { jobDescription: text, sectionData, language: locale, templateId }
          ),
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
        if (res.status === 422) { track("ai_error_shown", { endpoint: "ats-score", error_type: "offtopic" }); setOffTopic(true); return }
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setAtsResult(data)
        await onSuccess()
        track("ai_ats_scored", { plan, score_bucket: scoreBucket(typeof data?.score === "number" ? data.score : 0) })
      }
      lastKeyRef.current = key
      setAnalyzedInputKey(`${mode}:${text}`)
      setCooldownUntil(Date.now() + 120_000)
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
  }, [input, mode, sectionData, locale, t, aiT, loading, cooldownUntil])

  // Keep the latest result reachable from rescore() without stale-closure risk.
  const atsResultRef = useRef<ATSResult | null>(null)
  atsResultRef.current = atsResult
  /** sectionData already sent for scoring — dedupes manual vs debounced rescore. */
  const lastScoredRef = useRef<unknown>(null)

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
    // Claim this exact sectionData BEFORE the request so the debounced effect
    // below skips the edit that a manual rescore() is already handling (every
    // apply-a-fix path writes the store and then calls rescore() directly).
    lastScoredRef.current = state.sectionData
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
      // Preserve the LLM-only fields the deterministic rescore doesn't produce:
      // summary/suggestions (from the analyze) and analysis (the recruiter pass).
      // gapPlan and typoWarnings ARE recomputed here, so they update live.
      setAtsResult((cur) => (cur ? { ...data, summary: cur.summary, suggestions: cur.suggestions, analysis: cur.analysis } : data))
      const d = data.score - (prev?.score ?? data.score)
      // Single owner of the delta badge: EVERY score movement updates it, whether
      // it came from applying a fix or from a plain edit picked up by the debounce.
      // Previously the panel owned this and only the manual path wrote it, so an
      // edit that LOWERED the score left a stale "+N" badge under the new number.
      setScoreDelta(d)
      return d
    } catch {
      // Silent — keep the prior score rather than surfacing a re-score failure.
      return null
    }
  }, [locale])

  // Real-time score: once an initial analyze() has landed a result, debounce
  // further CV edits into an automatic rescore(). rescore() is deterministic/
  // no-LLM (reuses keywords already extracted), so this is free to run on every
  // edit pause. Deliberately depends on `sectionData` only — rescore() writes
  // atsResult, so including it here would refire this effect on its own output
  // and loop forever (the exact "useEffect calling AI endpoint without a
  // dependency guard" pattern the QA checklist flags). Read via atsResultRef
  // instead so the gate sees the latest value without becoming a dependency.
  useEffect(() => {
    if (!atsResultRef.current) return
    // Skip edits a manual rescore() already claimed (apply-a-fix paths call it
    // directly) — otherwise every applied fix fired a second, redundant request.
    if (lastScoredRef.current === sectionData) return
    const timer = setTimeout(() => { rescore() }, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionData])

  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)

  // A prior real-PDF verification is measured on the file AS IT WAS. Any CV edit
  // makes it stale, so clear it — a stale "real" score shown next to a freshly
  // rescored estimate would mislead (exactly the "two numbers that disagree" the
  // fused score set out to kill). The user re-verifies with one click when ready.
  useEffect(() => {
    setVerifyResult(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionData])

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
      track("ats_verified_real", { plan })
    } catch {
      toast.error(t("verify_error"))
    } finally {
      setVerifyLoading(false)
    }
  }, [input, locale, t, verifyLoading])

  const hasResult = atsResult !== null || reviewResult !== null
  // True when a result is on screen AND the job input is unchanged since it was
  // produced. The Analyze button reflects this: "up to date" vs "Re-analyze".
  const upToDate = hasResult && analyzedInputKey !== null && `${mode}:${input.trim()}` === analyzedInputKey

  return {
    input, setInput,
    mode, setMode,
    loading,
    atsResult, reviewResult,
    offTopic,
    hasResult,
    upToDate,
    analyze,
    rescore,
    scoreDelta,
    verifyReal, verifyResult, verifyLoading,
    cooldownUntil,
  }
}
