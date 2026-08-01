"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Copy, Check, Users, TrendingUp, Gift, Star, Trophy, RefreshCw, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { isActive } from "@/lib/plans"
import { track } from "@/lib/analytics/track"

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

export default function ReferralCard({ embeddedMode = false }: { embeddedMode?: boolean }) {
  const t = useTranslations("referral")
  const { data: session } = useSession()
  const isManaged = !!session?.user?.isManaged
  const isPro = isActive(
    session?.user?.plan ?? "UNSUBSCRIBED",
    session?.user?.subscriptionEndsAt ? new Date(session.user.subscriptionEndsAt) : null,
    session?.user?.subscriptionStatus,
    session?.user?.role,
    session?.user?.isManaged,
    session?.user?.managedBlocked,
    session?.user?.managedExpiresAt ? new Date(session.user.managedExpiresAt) : null,
  )
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Managed users (plan=LIMITED) cannot use referrals — skip API call.
    if (isManaged) {
      setLoading(false)
      return
    }
    fetch("/api/referrals")
      .then((r) => {
        if (!r.ok) throw new Error("referrals fetch failed")
        return r.json()
      })
      .then(setStats)
      .catch(() => toast.error(t("load_error")))
      .finally(() => setLoading(false))
  }, [t, isManaged])

  // Managed users — feature unavailable, render nothing.
  if (isManaged) return null

  const referralUrl =
    typeof window !== "undefined" && stats
      ? `${window.location.origin}/register?ref=${stats.referralCode}`
      : ""

  async function handleCopy() {
    if (!referralUrl) return
    await navigator.clipboard.writeText(referralUrl)
    track("referral_link_shared", { channel: "copy" })
    setCopied(true)
    toast.success(t("copied"))
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className={cn("animate-pulse", !embeddedMode && "rounded-2xl border border-border bg-white p-6")}>
        <div className="h-5 w-32 bg-muted rounded mb-4" />
        <div className="h-32 w-full bg-muted rounded" />
      </div>
    )
  }

  const cycleCount  = stats?.cycleCount  ?? 0
  const rewardTier  = stats?.rewardTier  ?? 0
  const nextTier    = stats?.nextTier    ?? null

  return (
    <div className={cn("space-y-5", !embeddedMode && "rounded-2xl border border-border bg-white p-6")}>
      {/* Header — hidden when rendered inside SettingsForm card shell */}
      {!embeddedMode && (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t("title")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t("description")}</p>
          </div>
        </div>
      )}

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
                  {achieved ? t("tier_achieved") : t("tier_referidos", { range })}
                </span>
              </div>
            )
          })}
        </div>

        {/* Milestone progress bar */}
        <div className="mt-4">
          <div className="relative h-2 bg-neutral-100 rounded-full overflow-visible">
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (cycleCount / 10) * 100)}%` }}
            />
            {[3, 5, 9].map((threshold) => {
              const pct = (threshold / 10) * 100
              const reached = cycleCount >= threshold
              return (
                <div
                  key={threshold}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${pct}%` }}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-full border-2 -translate-x-1/2",
                    reached ? "bg-primary border-primary" : "bg-white border-neutral-300"
                  )} />
                </div>
              )
            })}
          </div>
          <div className="relative h-4 mt-1">
            {[
              { val: 0, label: "0" },
              { val: 3, label: "3" },
              { val: 5, label: "5" },
              { val: 9, label: "9" },
              { val: 10, label: "10" },
            ].map(({ val, label }) => (
              <span
                key={val}
                className="absolute -translate-x-1/2 text-[10px] text-muted-foreground"
                style={{ left: `${(val / 10) * 100}%` }}
              >
                {label}
              </span>
            ))}
          </div>
          {nextTier && (
            <p className="text-[10px] text-muted-foreground mt-1 text-center">
              {t("progress_label", { count: cycleCount, threshold: nextTier.threshold })}
            </p>
          )}
          {!nextTier && (
            <p className="text-[10px] text-purple-600 font-medium text-center mt-1">
              {t("max_tier")}
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
      {isPro ? (
        <>
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
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 flex flex-col items-center gap-2 text-center">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">{t("link_locked_title")}</p>
          <p className="text-xs text-muted-foreground">{t("link_locked_desc")}</p>
        </div>
      )}
    </div>
  )
}
