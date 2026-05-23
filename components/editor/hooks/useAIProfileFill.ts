"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useResumeStore } from "@/stores/resumeStore"
import { useTranslations, useLocale } from "next-intl"

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
  const locale = useLocale()
  const { sectionData } = useResumeStore()

  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FillProfileResult | null>(null)

  const generate = useCallback(async (): Promise<FillProfileResult | undefined> => {
    if (prompt.trim().length < 10) {
      toast.error(t("toast_min_chars"))
      return undefined
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await apiFetch("/api/ai/fill-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), sectionData, language: locale }),
      })
      if (res.status === 429) { toast.error(t("toast_rate_limit")); return undefined }
      if (res.status === 403) { toast.error(t("toast_pro_only")); return undefined }
      if (res.status === 400) { toast.error(t("toast_more_detail")); return undefined }
      if (res.status === 422) { toast.error(t("toast_off_topic")); return undefined }
      const data = await res.json() as FillProfileResult
      if (!res.ok) throw new Error((data as unknown as { error: string }).error)
      setResult(data)
      return data
    } catch {
      toast.error(t("toast_generate_error"))
      return undefined
    } finally {
      setLoading(false)
    }
  }, [prompt, sectionData, locale, t])

  const reset = useCallback(() => {
    setResult(null)
    setPrompt("")
  }, [])

  return { prompt, setPrompt, loading, result, generate, reset }
}
