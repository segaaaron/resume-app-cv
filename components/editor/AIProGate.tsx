"use client"

import { useEffect } from "react"
import { Sparkles, Lock } from "lucide-react"
import { useEditorPro } from "./EditorContext"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { getLimits, type AiEndpointName } from "@/lib/plans"
import { track } from "@/lib/analytics/track"

interface AIProGateProps {
  children: React.ReactNode
  /** Optional feature label propagated to the shared UpgradeModal (e.g. "ATS Checker"). */
  feature?: string
  /** AI endpoint this gate protects — unlocks only when the plan grants it (limit === -1).
   *  Lets SPRINT use content AI while ATS/Review stay PRO-only. Falls back to isPro. */
  endpoint?: AiEndpointName
}

/**
 * Wraps any AI feature. If the user is not Pro, renders a locked upgrade banner
 * instead of the children. CTA opens the shared freemium UpgradeModal with
 * trigger 'pro-feature' (replacing the previous editor-internal modal).
 */
export default function AIProGate({ children, feature, endpoint }: AIProGateProps) {
  const { isPro, plan } = useEditorPro()
  const { open } = useUpgradeModal()
  const t = useTranslations("editor.ai_gate")

  // Endpoint-aware: unlocked only when the effective plan grants unlimited use of
  // that endpoint (SPRINT content AI = -1; SPRINT ats/review = 0 → stays locked).
  // Without an endpoint, fall back to the blanket isPro flag.
  const unlocked = endpoint ? getLimits(plan).aiLimitsByEndpoint[endpoint] === -1 : isPro

  // Fires once when a locked gate is shown — "this feature is walled for this plan".
  useEffect(() => {
    if (!unlocked) track("paywall_hit", { feature: "ai", current_plan: plan })
  }, [unlocked, plan])

  if (unlocked) return <>{children}</>

  return (
    <div className="relative rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-5 py-6 flex flex-col items-center gap-3 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
        <Lock className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{t("title")}</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">{t("description")}</p>
      </div>
      <Button
        size="sm"
        className="gap-1.5 mt-1"
        onClick={() => {
          track("upgrade_cta_clicked", { from_feature: feature ?? "ai" })
          open("pro-feature", feature ? { feature } : undefined)
        }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {t("cta")}
      </Button>
    </div>
  )
}
