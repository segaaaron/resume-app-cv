"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Users, Gift, Trophy, Copy, Check, Share2, Mail,
  TrendingUp, Wallet, RefreshCw, Sparkles, ChevronDown,
} from "lucide-react"
import ReferralHero from "./ReferralHero"
import ReferralTierProgress from "./ReferralTierProgress"
import ReferralStats from "./ReferralStats"
import ReferralHowItWorks from "./ReferralHowItWorks"
import ReferralHistory from "./ReferralHistory"
import ReferralFAQ from "./ReferralFAQ"
import { apiFetch } from "@/lib/apiFetch"

export interface ReferralStatusData {
  referralCode: string
  totalReferred: number
  totalPaid: number
  cycleCount: number
  rewardTier: number
  nextTier: { tier: number; threshold: number; label: string } | null
  totalConversions: number
  cycleOffset: number
  conversionsToNextTier: number | null
  totalStripeCreditsCents: number
  rewardsHistory: Array<{
    id: string
    referredAt: string
    status: "verified" | "pending"
    tierApplied: number | null
    creditCents: number | null
  }>
}

interface Props {
  locale: string
  origin: string
  initialStatus: ReferralStatusData
}

export default function ReferralsPageClient({ locale, origin, initialStatus }: Props) {
  const t = useTranslations("dashboard.referrals")
  const [status, setStatus] = useState<ReferralStatusData>(initialStatus)

  const referralLink = useMemo(() => {
    return `${origin}/${locale}/register?ref=${status.referralCode}`
  }, [origin, locale, status.referralCode])

  // Light revalidation hook (in case user just got a new conversion)
  useEffect(() => {
    const refresh = () => {
      apiFetch("/api/referrals", { silent: true })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) setStatus(data) })
        .catch(() => { /* silent */ })
    }
    const onFocus = () => refresh()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [])

  const onCopyFeedback = () => toast.success(t("link.copied_toast"))
  const onCopyError = () => toast.error(t("errors.copy_failed"))

  return (
    <div className="flex flex-col gap-4">
      {/* ── Page head — premium navy/cyan branded ──────────────────────────── */}
      <div
        className="dash-card-in relative overflow-hidden px-4 py-5 sm:px-8 sm:py-6 w-full mb-1"
        style={{ animationDelay: "0ms" }}
      >
        {/* Decorative top accent line */}
        <span className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-70" />
        <div className="flex items-center gap-[7px] text-[10px] font-bold tracking-[0.12em] uppercase text-[#00D4FF] mb-[6px]">
          <span className="inline-block opacity-50 bg-[#00D4FF]" style={{ width: 14, height: 1.5 }} />
          {t("eyebrow")}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1
              className="text-[28px] sm:text-[32px] font-bold text-[#1a2e4a] tracking-[-0.035em] leading-[1.1] m-0"
              style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
            >
              {t("hero.title")}
            </h1>
            <p className="text-[13.5px] text-[#6B7A8C] mt-[6px] max-w-[640px]">
              {t("hero.subtitle")}
            </p>
          </div>
          {/* Conversions badge */}
          <div className="shrink-0 inline-flex items-center gap-2 rounded-full pl-3 pr-4 py-[7px] bg-gradient-to-br from-[rgba(0,212,255,0.12)] to-[rgba(0,168,204,0.04)] border border-[rgba(0,212,255,0.25)] shadow-[0_2px_8px_rgba(0,212,255,0.10)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#00D4FF] opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D4FF]" />
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-[#1a2e4a]">
              {t("hero.badge_conversions", { count: status.totalConversions })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Hero referral link card ─────────────────────────────────────────── */}
      <div className="dash-card-in" style={{ animationDelay: "60ms" }}>
        <ReferralHero
          referralLink={referralLink}
          referralCode={status.referralCode}
          onCopy={onCopyFeedback}
          onCopyError={onCopyError}
        />
      </div>

      {/* ── Tier progress ───────────────────────────────────────────────────── */}
      <div className="dash-card-in" style={{ animationDelay: "120ms" }}>
        <ReferralTierProgress
          rewardTier={status.rewardTier}
          cycleCount={status.cycleCount}
          nextTier={status.nextTier}
          conversionsToNextTier={status.conversionsToNextTier}
        />
      </div>

      {/* ── Stats grid ──────────────────────────────────────────────────────── */}
      <div className="dash-card-in" style={{ animationDelay: "180ms" }}>
        <ReferralStats
          totalConversions={status.totalConversions}
          rewardTier={status.rewardTier}
          totalStripeCreditsCents={status.totalStripeCreditsCents}
          cycleCount={status.cycleCount}
        />
      </div>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <div className="dash-card-in" style={{ animationDelay: "240ms" }}>
        <ReferralHowItWorks />
      </div>

      {/* ── History ─────────────────────────────────────────────────────────── */}
      <div className="dash-card-in" style={{ animationDelay: "300ms" }}>
        <ReferralHistory items={status.rewardsHistory} locale={locale} />
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <div className="dash-card-in" style={{ animationDelay: "360ms" }}>
        <ReferralFAQ />
      </div>

      {/* ── Final CTA — scroll to top ───────────────────────────────────────── */}
      <div className="dash-card-in" style={{ animationDelay: "420ms" }}>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group relative block w-full overflow-hidden rounded-2xl px-6 py-5 text-center transition-all duration-200 hover:shadow-[0_18px_50px_-12px_rgba(0,212,255,0.45)]"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #1a2e4a 0%, #0f1f36 50%, #1a2e4a 100%)",
          }}
        >
          {/* shimmering top accent */}
          <span className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent" />
          {/* glow */}
          <span className="pointer-events-none absolute -inset-x-10 -bottom-12 h-24 bg-[radial-gradient(closest-side,rgba(0,212,255,0.30),transparent)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative inline-flex items-center gap-2 text-white text-[15px] font-semibold tracking-tight">
            <Sparkles className="h-4 w-4 text-[#00D4FF]" />
            {t("cta.share_button")}
          </div>
        </button>
      </div>

      {/* Decorative spacing */}
      <div className="h-6" aria-hidden />
    </div>
  )
}

// ── Re-exports used by sub-components (icons re-used) ──────────────────────────
export const ReferralIcons = {
  Users, Gift, Trophy, Copy, Check, Share2, Mail, TrendingUp, Wallet, RefreshCw, Sparkles, ChevronDown,
}
