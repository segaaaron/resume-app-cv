"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useAICooldown, useCooldownLabel } from "./useAICooldown"
import { useAICall } from "@/hooks/useAICall"
import { useCvLanguage } from "./useCvLanguage"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { handleApiError } from "@/lib/upgrade-modal-handler"
import { useRouter } from "next/navigation"
import { track } from "@/lib/analytics/track"
import { useEditorPro } from "../EditorContext"

/**
 * Lo que tailor devuelve: texto, atado al hallazgo que cierra.
 *
 * `missingSkills` y `softSkillSuggestions` se fueron con el arreglo de fondo del
 * 2026-08-20: no eran suyos. Los calcula `ats-score` de forma determinista y el
 * panel los muestra en la tabla de términos, con el conteo a los dos lados.
 */
export interface TailorResult {
  summary: string | null
  rewrites: Array<{
    checkId: string
    text: string
    /** La línea que reemplaza, dicha por quien la reescribió — no deducida por índice. */
    original?: string
    metricHint?: string
    demonstrates?: string
    needsFigureConfirm?: boolean
  }>
}

interface Options {
  /** Los términos de la vacante, ya extraídos por el análisis. */
  posting: { jobTitle: string; hardSkills: string[]; softSkills: string[]; mustHaves: string[] } | null
  /** Los ítems que el informe le asignó. Vacío = no hay nada que pedirle. */
  workload: Array<{ checkId: string; targetId: string; index: number; reason: string }>
  /** Si el informe pidió reescribir el resumen. */
  rewriteSummary?: boolean
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
export function useTailorCV({ posting, workload, rewriteSummary = false, autoRunSignal = 0 }: Options) {
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
   * Las reescrituras ya no hay que emparejarlas: vienen con el `checkId` que
   * cierran. El emparejamiento por puesto+índice era donde vivía el defecto
   * medido — el modelo devolvió para el índice 0 una reescritura de la viñeta 1.
   */

  const runTailor = useCallback(async () => {
    if (loading) return
    /**
     * Sin trabajo asignado no hay llamada, y no es un error.
     *
     * Antes tailor decidía solo qué tocar y siempre encontraba algo, así que un
     * CV impecable igual gastaba un uso y dos minutos de enfriamiento. Ahora el
     * informe dice qué falta: si no falta nada, no hay nada que pedir.
     */
    if (!posting || (workload.length === 0 && !rewriteSummary)) return

    const tailorKey = JSON.stringify({
      w: workload.map((x) => x.checkId).sort(),
      rs: rewriteSummary,
      s: sectionData.summary,
      j: sectionData.workExperience,
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
        // Tailor escribe texto que entra al CV → idioma del CV.
        body: JSON.stringify({ sectionData, language: cvLanguage, posting, workload, rewriteSummary }),
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
      track("ai_tailor_completed", { plan, added_count: Array.isArray(data?.rewrites) ? data.rewrites.length : undefined })
    } catch {
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, posting, workload, rewriteSummary, sectionData, inCooldown, cooldownLabel, cvLanguage, locale, plan])

  // One "Analyze" is one report: the panel bumps this after a full run with a
  // real posting and tailor fills in behind it. runTailor still guards dedup,
  // cooldown and the plan gate.
  const lastAutoRef = useRef(0)
  useEffect(() => {
    if (autoRunSignal <= 0 || autoRunSignal === lastAutoRef.current) return
    lastAutoRef.current = autoRunSignal
    if (loading || inCooldown || !posting) return
    void runTailor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunSignal])

  // Only what the panel actually renders. A wider surface here would be dead
  // API that reads as "there is more of this feature somewhere" — there isn't.
  return {
    /** True while the posting-specific rewrites are still being written. */
    loading,
    /** Tailored summary, or null when the report did not ask for one. */
    tailoredSummary: result?.summary ?? null,
    /** Lo escrito, indexado por hallazgo. El panel lo cruza con el informe. */
    rewrites: result?.rewrites ?? [],
    runTailor,
  }
}
