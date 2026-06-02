"use client"

import { useTranslations } from "next-intl"
import { Trophy, Sparkles } from "lucide-react"

interface Props {
  rewardTier: number
  cycleCount: number
  nextTier: { tier: number; threshold: number; label: string } | null
  conversionsToNextTier: number | null
}

const TIER_DEFS = [
  { tier: 1, threshold: 3,  creditUsd: 4.5, key: "tier1" },
  { tier: 2, threshold: 5,  creditUsd: 7.5, key: "tier2" },
  { tier: 3, threshold: 10, creditUsd: 15,  key: "tier3" },
] as const

export default function ReferralTierProgress({ rewardTier, cycleCount, nextTier, conversionsToNextTier }: Props) {
  const t = useTranslations("dashboard.referrals.tiers")
  const maxTier = !nextTier && rewardTier >= 3

  return (
    <section className="relative rounded-2xl border border-[#E6EBF2] bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,25,45,0.04)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#fff7d6] to-[#ffe48a] border border-amber-200 shadow-[0_4px_12px_-4px_rgba(245,158,11,0.35)]">
          <Trophy className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-[#1a2e4a] tracking-tight">{t("title")}</h3>
          <p className="text-[12.5px] text-[#6B7A8C] mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TIER_DEFS.map((td) => {
          const achieved = rewardTier >= td.tier
          const isCurrent = rewardTier === td.tier
          return (
            <div
              key={td.tier}
              className={[
                "relative rounded-xl border p-4 transition-all duration-200",
                achieved
                  ? "border-[rgba(0,212,255,0.35)] bg-gradient-to-br from-[rgba(0,212,255,0.08)] to-white shadow-[0_6px_20px_-8px_rgba(0,212,255,0.35)]"
                  : "border-[#E6EBF2] bg-[#FAFBFD] hover:border-[#D5DCE7]",
                isCurrent ? "ring-2 ring-[rgba(0,212,255,0.35)]" : "",
              ].join(" ")}
            >
              {/* Decorative accent */}
              {achieved && (
                <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent" />
              )}
              <div className="flex items-center justify-between mb-2">
                <span className={[
                  "inline-flex items-center justify-center h-7 w-7 rounded-lg text-[12px] font-bold",
                  achieved ? "bg-[#1a2e4a] text-[#00D4FF]" : "bg-white border border-[#E6EBF2] text-[#6B7A8C]",
                ].join(" ")}>
                  {td.tier}
                </span>
                {achieved && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#1a2e4a] text-[#00D4FF] px-2 py-[3px] text-[9.5px] font-bold tracking-[0.08em] uppercase">
                    <Sparkles className="h-2.5 w-2.5" />
                    {t("badge_achieved")}
                  </span>
                )}
              </div>
              <p className="text-[13px] font-bold text-[#1a2e4a] tracking-tight">
                {t(`${td.key}_title` as "tier1_title" | "tier2_title" | "tier3_title")}
              </p>
              <p className="text-[11.5px] text-[#6B7A8C] mt-1 leading-snug">
                {t(`${td.key}_desc` as "tier1_desc" | "tier2_desc" | "tier3_desc")}
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-[20px] font-bold text-[#1a2e4a] tracking-tight">${td.creditUsd.toFixed(2)}</span>
                <span className="text-[10.5px] text-[#6B7A8C]">{t("credit_label")}</span>
              </div>
              <p className="text-[10.5px] text-[#6B7A8C] mt-1">
                {t("threshold_label", { count: td.threshold })}
              </p>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11.5px] font-semibold text-[#1a2e4a]">
            {t("cycle_progress_label", { count: Math.max(0, cycleCount), total: 10 })}
          </p>
          {nextTier && conversionsToNextTier !== null && conversionsToNextTier > 0 && (
            <p className="text-[11px] text-[#6B7A8C]">
              {t("to_next_tier", { count: conversionsToNextTier })}
            </p>
          )}
        </div>
        <div className="relative h-2.5 rounded-full bg-[#EEF2F8] overflow-visible">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(100, (Math.max(0, cycleCount) / 10) * 100)}%`,
              backgroundImage: "linear-gradient(90deg, #00D4FF 0%, #00A8CC 100%)",
              boxShadow: "0 0 12px rgba(0,212,255,0.45)",
            }}
          />
          {[3, 5, 10].map((threshold) => {
            const pct = (threshold / 10) * 100
            const reached = cycleCount >= threshold
            return (
              <div key={threshold} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${pct}%` }}>
                <div
                  className={[
                    "h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 transition-colors duration-300",
                    reached
                      ? "bg-[#00D4FF] border-[#00A8CC] shadow-[0_0_0_3px_rgba(0,212,255,0.18)]"
                      : "bg-white border-[#C9D2DF]",
                  ].join(" ")}
                />
              </div>
            )
          })}
        </div>
        <div className="relative h-4 mt-1.5">
          {[0, 3, 5, 10].map((val) => (
            <span
              key={val}
              className="absolute -translate-x-1/2 text-[10px] font-medium text-[#6B7A8C]"
              style={{ left: `${(val / 10) * 100}%` }}
            >
              {val}
            </span>
          ))}
        </div>
      </div>

      {/* Max tier banner */}
      {maxTier && (
        <div className="mt-5 relative overflow-hidden rounded-xl border border-amber-300/50 p-4"
          style={{ backgroundImage: "linear-gradient(135deg, #fff7d6 0%, #ffe7a8 100%)" }}>
          <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-[0_4px_12px_-4px_rgba(245,158,11,0.55)]">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-amber-900 tracking-tight">{t("max_tier_title")}</p>
              <p className="text-[11.5px] text-amber-800 mt-0.5">{t("max_tier_desc")}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
