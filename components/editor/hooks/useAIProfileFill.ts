"use client"

import { useState, useCallback, useRef } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { useTranslations, useLocale } from "next-intl"
import { useAICooldown } from "./useAICooldown"
import { useAICall } from "@/hooks/useAICall"
import { useCvLanguage } from "./useCvLanguage"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { handleApiError } from "@/lib/upgrade-modal-handler"
import { useRouter } from "next/navigation"
import { track } from "@/lib/analytics/track"
import { useEditorPro } from "../EditorContext"

interface SuggestedLanguage { name: string; level: string }

export interface FillProfileResult {
  summary?: string | null
  jobTitle?: string | null
  hobbies?: string | null
  suggestedSkills?: string[]
  suggestedLanguages?: SuggestedLanguage[]
  workExperienceUpdates?: { id: string; description: string }[]
  workExperienceNew?: {
    jobTitle: string
    employer: string
    city?: string
    startDate?: string
    endDate?: string
    currentlyWorking?: boolean
    description: string
  }[]
  educationUpdates?: { id: string; description: string }[]
  projectUpdates?: { id: string; description: string }[]
  volunteerUpdates?: { id: string; description: string }[]
}

export function useAIProfileFill() {
  const t = useTranslations("editor.ai_profile_fill")
  const aiT = useTranslations("editor.ai")
  const locale = useLocale()
  const router = useRouter()
  const { open: openUpgradeModal } = useUpgradeModal()
  const { preCheck, onSuccess } = useAICall()
  const { plan } = useEditorPro()
  const { sectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData }))
  )
  const cvLanguage = useCvLanguage()

  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FillProfileResult | null>(null)
  const { cooldownUntil, setCooldownUntil } = useAICooldown("cooldown_ai_fill")
  const lastKeyRef = useRef<string | null>(null)

  const generate = useCallback(async (): Promise<FillProfileResult | undefined> => {
    if (loading) return undefined
    if (prompt.trim().length < 10) {
      toast.error(t("toast_min_chars"))
      return undefined
    }
    const key = prompt.trim()
    if (key === lastKeyRef.current) { toast.info(t("toast_no_changes")); return undefined }
    if (Date.now() < cooldownUntil) {
      const secs = Math.ceil((cooldownUntil - Date.now()) / 1000)
      const label = secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}` : `${secs}s`
      toast.info(t("toast_cooldown", { seconds: label }))
      return undefined
    }
    setLoading(true)
    setResult(null)
    preCheck("fill-profile")
    try {
      const res = await apiFetch("/api/ai/fill-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Everything this returns is written into the CV → CV's own language, not
        // the app's (an English CV edited in the Spanish UI stays English).
        body: JSON.stringify({ prompt: prompt.trim(), sectionData, language: cvLanguage }),
      })
      if (res.status === 429 || res.status === 403) {
        const handled = await handleApiError(res, {
          openUpgradeModal,
          redirect: (p) => router.push(p),
          locale,
          fallbackToast: () => toast.error(res.status === 429 ? t("toast_rate_limit") : t("toast_pro_only")),
          dailyCapToast: () => toast.warning(aiT("daily_cap_reached"), { duration: 6000 }),
        })
        if (handled || res.status === 429 || res.status === 403) return undefined
      }
      if (res.status === 400) { toast.error(t("toast_more_detail")); return undefined }
      if (res.status === 422) { track("ai_error_shown", { endpoint: "fill-profile", error_type: "offtopic" }); toast.error(t("toast_off_topic")); return undefined }
      const data = await res.json() as FillProfileResult
      if (!res.ok) throw new Error((data as unknown as { error: string }).error)
      setResult(data)
      await onSuccess()
      track("ai_profile_filled", { plan })
      lastKeyRef.current = key
      setCooldownUntil(Date.now() + 120_000)
      return data
    } catch {
      toast.error(t("toast_generate_error"))
      return undefined
    } finally {
      setLoading(false)
    }
  }, [prompt, sectionData, locale, cvLanguage, t, aiT, loading, cooldownUntil])

  const reset = useCallback(() => {
    setResult(null)
    setPrompt("")
    lastKeyRef.current = null
    setCooldownUntil(0)
  }, [])

  return { prompt, setPrompt, loading, result, generate, reset, cooldownUntil }
}
