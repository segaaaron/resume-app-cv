"use client"

import { useTranslations } from "next-intl"
import { Users, Trophy, Wallet, TrendingUp } from "lucide-react"

interface Props {
  totalConversions: number
  rewardTier: number
  totalStripeCreditsCents: number
  cycleCount: number
}

export default function ReferralStats({ totalConversions, rewardTier, totalStripeCreditsCents, cycleCount }: Props) {
  const t = useTranslations("dashboard.referrals.stats")

  const stats = [
    {
      label: t("total_label"),
      value: totalConversions.toString(),
      icon: Users,
      accent: "from-[#00D4FF] to-[#00A8CC]",
      iconBg: "bg-[rgba(0,212,255,0.10)] border-[rgba(0,212,255,0.25)] text-[#00A8CC]",
    },
    {
      label: t("tier_label"),
      value: rewardTier === 0 ? "—" : `T${rewardTier}`,
      icon: Trophy,
      accent: "from-amber-400 to-amber-600",
      iconBg: "bg-amber-50 border-amber-200 text-amber-600",
    },
    {
      label: t("credits_label"),
      value: `$${(totalStripeCreditsCents / 100).toFixed(2)}`,
      icon: Wallet,
      accent: "from-emerald-400 to-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-200 text-emerald-600",
    },
    {
      label: t("cycle_label"),
      value: `${Math.max(0, cycleCount)} / 10`,
      icon: TrendingUp,
      accent: "from-[#1a2e4a] to-[#0e1d33]",
      iconBg: "bg-[#F2F5FA] border-[#E6EBF2] text-[#1a2e4a]",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon
        return (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border border-[#E6EBF2] bg-white p-4 transition-all duration-200 hover:border-[rgba(0,212,255,0.30)] hover:shadow-[0_8px_24px_-12px_rgba(0,212,255,0.30)] hover:-translate-y-[1px]"
          >
            {/* hover gradient accent */}
            <span className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${s.accent} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${s.iconBg}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7A8C]">
              {s.label}
            </p>
            <p
              className="mt-1 text-[24px] font-bold text-[#1a2e4a] leading-none tracking-tight tabular-nums"
              style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
            >
              {s.value}
            </p>
          </div>
        )
      })}
    </div>
  )
}
