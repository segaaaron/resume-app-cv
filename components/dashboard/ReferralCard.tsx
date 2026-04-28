"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Copy, Check, Users, TrendingUp, Gift, Star, Trophy, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface NextTier {
  tier: number
  threshold: number
  label: string
}

interface ReferralStats {
  referralCode: string
  totalReferred: number
  totalPaid: number
  cycleCount: number
  rewardTier: number
  nextTier: NextTier | null
}

const TIERS = [
  { tier: 1, threshold: 3,  range: "3–4",  labelKey: "reward_tier_1", color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200" },
  { tier: 2, threshold: 5,  range: "5–8",  labelKey: "reward_tier_2", color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
  { tier: 3, threshold: 9,  range: "9–10", labelKey: "reward_tier_3", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
]

export default function ReferralCard() {
  const t = useTranslations("referral")
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  const referralUrl =
    typeof window !== "undefined" && stats
      ? `${window.location.origin}/register?ref=${stats.referralCode}`
      : ""

  async function handleCopy() {
    if (!referralUrl) return
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    toast.success(t("copied"))
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 animate-pulse">
        <div className="h-5 w-32 bg-muted rounded mb-4" />
        <div className="h-32 w-full bg-muted rounded" />
      </div>
    )
  }

  const cycleCount  = stats?.cycleCount  ?? 0
  const rewardTier  = stats?.rewardTier  ?? 0
  const nextTier    = stats?.nextTier    ?? null

  // Progress bar within the current cycle
  const prevThreshold = rewardTier > 0 ? (TIERS.find((t) => t.tier === rewardTier)?.threshold ?? 0) : 0
  const nextThreshold = nextTier?.threshold ?? 10
  const progressPct = nextTier
    ? Math.min(100, Math.max(0, ((cycleCount - prevThreshold) / (nextThreshold - prevThreshold)) * 100))
    : 100

  return (
    <div className="rounded-2xl border border-border bg-white p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{t("title")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t("description")}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{t("total_referred")}</span>
          </div>
          <p className="text-2xl font-bold">{stats?.totalReferred ?? 0}</p>
        </div>
        <div className="rounded-xl bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{t("cycle_count")}</span>
          </div>
          <p className="text-2xl font-bold text-primary">{cycleCount}</p>
        </div>
      </div>

      {/* Reward tiers */}
      <div>
        <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          {t("rewards_title")}
        </p>
        <div className="space-y-2">
          {TIERS.map(({ tier, range, labelKey, color, bg, border }) => {
            const achieved = rewardTier >= tier
            return (
              <div
                key={tier}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors",
                  achieved ? `${bg} ${border}` : "bg-muted/20 border-border"
                )}
              >
                <div className="flex items-center gap-2">
                  <Star className={cn("h-3.5 w-3.5", achieved ? color : "text-muted-foreground")} />
                  <span className={cn("font-medium", achieved ? color : "text-muted-foreground")}>
                    {t(labelKey as "reward_tier_1" | "reward_tier_2" | "reward_tier_3")}
                  </span>
                </div>
                <span className={cn("text-[10px]", achieved ? color : "text-muted-foreground")}>
                  {achieved ? "✓ activo" : `${range} referidos`}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          {nextTier ? (
            <>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{cycleCount} de {nextTier.threshold} referidos Pro en este ciclo</span>
                <span>{t((`reward_tier_${nextTier.tier}`) as "reward_tier_1" | "reward_tier_2" | "reward_tier_3")}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-[11px] text-purple-600 font-medium text-center mt-1">
              🏆 {t("max_tier")}
            </p>
          )}
        </div>

        {rewardTier > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2">{t("reward_applied")}</p>
        )}

        {/* Cycle reset note */}
        <div className="mt-2 flex items-start gap-1.5 text-[10px] text-muted-foreground">
          <RefreshCw className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{t("cycle_reset_note")}</span>
        </div>
      </div>

      {/* Referral link */}
      <div>
        <p className="text-xs font-medium mb-2">{t("your_link")}</p>
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground truncate select-all">
            {referralUrl || "..."}
          </div>
          <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("copied_short") : t("copy")}
          </Button>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">{t("how_it_works_title")}</p>
        <p>1. {t("how_step_1")}</p>
        <p>2. {t("how_step_2")}</p>
        <p>3. {t("how_step_3")}</p>
      </div>
    </div>
  )
}
