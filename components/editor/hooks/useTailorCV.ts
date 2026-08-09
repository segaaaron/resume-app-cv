"use client"

import { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import type { SkillItem, WorkExperienceItem } from "@/types/resume"
import { filterVisibleMissingSkills } from "../tailor-dedupe"
import { useAICooldown, useCooldownLabel } from "./useAICooldown"
import { useAICall } from "@/hooks/useAICall"
import { useCvLanguage } from "./useCvLanguage"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { handleApiError } from "@/lib/upgrade-modal-handler"
import { useRouter } from "next/navigation"
import { track } from "@/lib/analytics/track"
import { useEditorPro } from "../EditorContext"

export interface TailorResult {
  summary: string | null
  experiences: Array<{
    targetId: string
    jobTitle: string
    employer: string
    changedBullets: Array<{ index: number; text: string }>
  }>
  missingSkills: string[]
  softSkillSuggestions?: { skill: string; suggestion: string }[]
}

interface Options {
  /** The job description — owned by the ATS panel, never re-asked here. */
  jobDescription: string
  /** Missing keywords the ATS score already lists, so a skill is offered once. */
  atsMissingKeywords?: string[]
  /** Bumped by the panel on each full analysis; tailor then runs itself once. */
  autoRunSignal?: number
}

/**
 * Tailor-to-posting, as state instead of a panel.
 *
 * This was a self-contained section (③) that re-rendered the same three things
 * the report already offers in §②: rewrite the summary, improve these bullets,
 * add these skills. Two engines answering one question in two places is how the
 * report ended up feeling like homework. The logic lives here now and the ATS
 * panel folds the results into its ONE list of fixes.
 *
 * Applying is deliberately NOT here: the panel owns a single confirm-diff path
 * for everything that writes to the CV, and a second writer is how duplicate
 * bullets got introduced before.
 */
export function useTailorCV({ jobDescription, atsMissingKeywords = [], autoRunSignal = 0 }: Options) {
  const t = useTranslations("editor.tailor")
  const aiT = useTranslations("editor.ai")
  const locale = useLocale()
  const router = useRouter()
  const { open: openUpgradeModal } = useUpgradeModal()
  const { preCheck, onSuccess } = useAICall()
  const cvLanguage = useCvLanguage()
  const { plan } = useEditorPro()
  const { sectionData } = useResumeStore(useShallow((s) => ({ sectionData: s.sectionData })))

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TailorResult | null>(null)
  const { cooldownUntil, setCooldownUntil } = useAICooldown("cooldown_tailor")
  const { inCooldown, label: cooldownLabel } = useCooldownLabel(cooldownUntil)
  const lastTailorKeyRef = useRef<string | null>(null)

  /**
   * Skills worth showing: not already in the CV, and not already listed by the
   * ATS score above. Matched through the shared ATS vocabulary rather than
   * string equality, so React ≡ React.js ≡ reactjs never shows twice.
   */
  const missingSkills = useMemo(() => {
    if (!result) return []
    return filterVisibleMissingSkills(
      result.missingSkills,
      ((sectionData.skills ?? []) as SkillItem[]).map((s) => s.name),
      atsMissingKeywords,
    )
  }, [result, sectionData.skills, atsMissingKeywords])

  /** Every rewritten bullet, flattened and paired with the line it replaces. */
  const bulletRewrites = useMemo(() => {
    if (!result) return []
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    return result.experiences.flatMap((exp) =>
      exp.changedBullets.map((b) => {
        const desc = work.find((j) => j.id === exp.targetId)?.description ?? ""
        const lines = desc.split("\n").map((l) => l.trim()).filter(Boolean)
        return {
          targetId: exp.targetId,
          jobTitle: exp.jobTitle,
          employer: exp.employer,
          index: b.index,
          text: b.text,
          currentBullet: lines[b.index] ?? "",
        }
      }),
    )
  }, [result, sectionData.workExperience])

  const runTailor = useCallback(async () => {
    if (loading) return
    const jd = jobDescription.trim()
    if (jd.length < 20) { toast.info(t("jd_too_short")); return }

    const tailorKey = JSON.stringify({
      jd,
      s: sectionData.summary,
      w: sectionData.workExperience,
      sk: sectionData.skills,
    })
    if (tailorKey === lastTailorKeyRef.current) { toast.info(t("no_changes")); return }
    if (inCooldown) { toast.info(t("cooldown", { seconds: cooldownLabel })); return }

    setLoading(true)
    setResult(null)
    preCheck("tailor-cv")
    try {
      const res = await apiFetch("/api/ai/tailor-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Tailor rewrites bullets and names skills that land in the CV → CV's language.
        body: JSON.stringify({ sectionData, jobDescription: jd, language: cvLanguage, atsMissingKeywords }),
      })
      if (res.status === 429 || res.status === 403) {
        const handled = await handleApiError(res, {
          openUpgradeModal,
          redirect: (p) => router.push(p),
          locale,
          fallbackToast: () => toast.error(res.status === 429 ? t("rate_limit") : t("pro_only")),
          dailyCapToast: () => toast.warning(aiT("daily_cap_reached"), { duration: 6000 }),
        })
        if (handled || res.status === 429 || res.status === 403) return
      }
      if (res.status === 422) { track("ai_error_shown", { endpoint: "tailor-cv", error_type: "offtopic" }); toast.error(t("off_topic")); return }
      if (!res.ok) { toast.error(t("error")); return }
      const data = await res.json() as TailorResult
      setResult(data)
      lastTailorKeyRef.current = tailorKey
      setCooldownUntil(Date.now() + 120_000)
      await onSuccess()
      track("ai_tailor_completed", { plan, added_count: Array.isArray(data?.missingSkills) ? data.missingSkills.length : undefined })
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, jobDescription, sectionData, inCooldown, cooldownLabel, atsMissingKeywords, cvLanguage, locale, plan])

  // One "Analyze" is one report: the panel bumps this after a full run with a
  // real posting and tailor fills in behind it. runTailor still guards dedup,
  // cooldown and the plan gate.
  const lastAutoRef = useRef(0)
  useEffect(() => {
    if (autoRunSignal <= 0 || autoRunSignal === lastAutoRef.current) return
    lastAutoRef.current = autoRunSignal
    if (loading || inCooldown || jobDescription.trim().length < 20) return
    void runTailor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunSignal])

  // Only what the panel actually renders. A wider surface here would be dead
  // API that reads as "there is more of this feature somewhere" — there isn't.
  return {
    /** True while the posting-specific rewrites are still being written. */
    loading,
    /** Tailored summary, or null when the model had nothing better to offer. */
    tailoredSummary: result?.summary ?? null,
    bulletRewrites,
    missingSkills,
    softSkillSuggestions: result?.softSkillSuggestions ?? [],
  }
}
