"use client"

/**
 * Thin pre/post hook around AI endpoint calls. Does NOT wrap fetch —
 * existing hooks (useATSScore, useCVReview, Summary, WorkExperience,
 * TailorCVPanel, CoverLetterEditor) have rich per-endpoint error
 * handling (cooldowns, 422 off-topic, no-changes de-dupe) we do not
 * want to lose.
 *
 * Responsibilities:
 *  - `preCheck(endpoint)`: BEFORE the fetch, if the user is UNSUBSCRIBED
 *    and quota.remaining === 1 for `endpoint`, show a single Sonner
 *    warning toast nudging them toward PRO. Runs once per (endpoint,
 *    remaining=1) state — re-armed when quota refreshes.
 *  - `onSuccess()`: AFTER a successful fetch, invalidate the quota
 *    cache so the next preCheck and any quota badge UI re-reads fresh
 *    counters.
 *
 * Errors → callers use `handleApiError` from upgrade-modal-handler.
 */

import { useCallback, useRef } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useQuotaStatus } from "@/hooks/useQuotaStatus"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { track } from "@/lib/analytics/track"

export function useAICall() {
  const { data: quota, refresh } = useQuotaStatus()
  const { open } = useUpgradeModal()
  const tEditor = useTranslations("freemium.editor")
  const tBanner = useTranslations("freemium.dashboard.banner")
  const warnedFor = useRef<Set<string>>(new Set())
  // Remembers the endpoint of the in-flight call so onSuccess can emit the
  // umbrella `ai_used` event for EVERY AI surface without touching each hook.
  const lastEndpointRef = useRef<string | null>(null)

  const preCheck = useCallback(
    (endpoint: string): void => {
      lastEndpointRef.current = endpoint
      if (!quota) return
      if (quota.plan?.plan !== "UNSUBSCRIBED") return
      const entry = quota.ai?.[endpoint]
      if (!entry) return
      // Last free use → nudge once per (endpoint, remaining-window)
      if (entry.remaining !== 1) {
        // re-arm warning if user is no longer at remaining===1 (e.g. refreshed)
        warnedFor.current.delete(endpoint)
        return
      }
      if (warnedFor.current.has(endpoint)) return
      warnedFor.current.add(endpoint)
      toast.warning(tEditor("lastUseToast"), {
        duration: 6000,
        action: {
          label: tBanner("cta"),
          onClick: () => open("ai-quota", { endpoint }),
        },
      })
    },
    [quota, open, tEditor, tBanner],
  )

  const onSuccess = useCallback(async () => {
    // Umbrella AI-usage event — endpoint discriminates the surface; pairs with the
    // per-endpoint events (ai_tailor_completed, ai_ats_scored…) for volume + cost.
    if (lastEndpointRef.current) {
      track("ai_used", { endpoint: lastEndpointRef.current, plan: quota?.plan?.plan ?? "UNSUBSCRIBED" })
    }
    // Invalidate quota cache so the badge UI + next preCheck see fresh counters.
    await refresh()
  }, [refresh, quota])

  return { preCheck, onSuccess }
}
