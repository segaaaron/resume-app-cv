"use client"

import { useState } from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations, useLocale } from "next-intl"
import { logoutAction } from "@/lib/actions/logout"
import type { ResumeCard } from "./CVCard"

// ── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  children: React.ReactNode
  gold: boolean
  animDelay: string
}

export function StatCard({ children, gold, animDelay }: StatCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className="dash-card-in relative overflow-hidden rounded-[10px] p-5 border transition-all duration-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: gold
          ? "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(0,212,255,0.02) 100%)"
          : hovered ? "#F5F7FB" : "white",
        borderColor: gold
          ? hovered ? "rgba(0,212,255,0.35)" : "rgba(0,212,255,0.15)"
          : hovered ? "#00D4FF" : "#D9E1ED",
        animationDelay: animDelay,
      }}
    >
      {/* top shimmer line — dynamic opacity, keep inline */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none transition-opacity duration-200"
        style={{
          background: "linear-gradient(90deg, transparent, #00D4FF, transparent)",
          opacity: hovered ? 1 : 0,
        }}
      />
      {children}
    </div>
  )
}

// ── ActivityItem ─────────────────────────────────────────────────────────────

interface ActivityItemProps {
  type: "edit" | "create" | "down"
  name: string
  time: string
}

export function ActivityItem({ type, name, time }: ActivityItemProps) {
  const [hovered, setHovered] = useState(false)
  const t = useTranslations("dashboard.resumes")

  const dotColors: Record<string, { bg: string; shadow: string }> = {
    edit:   { bg: "#00D4FF", shadow: "0 0 6px rgba(0,212,255,0.5)" },
    create: { bg: "#10B981", shadow: "0 0 6px rgba(16,185,129,0.5)" },
    down:   { bg: "#6B8AC4", shadow: "0 0 6px rgba(107,138,196,0.4)" },
  }
  const dot = dotColors[type]

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-3 px-[14px] py-[10px] rounded-md border transition-[background,border-color] duration-150"
      style={{
        borderColor: hovered ? "#E8EDF6" : "transparent",
        background: hovered ? "#EEF2F9" : "transparent",
      }}
    >
      {/* dot color/shadow are fully dynamic — keep inline */}
      <span
        className="inline-block w-[6px] h-[6px] rounded-full flex-shrink-0 mt-px"
        style={{ background: dot.bg, boxShadow: dot.shadow }}
      />
      <div className="flex-1">
        <div className="text-[12.5px] text-[#1a2e4a]">
          {type === "edit" ? t("activity_edited") : t("activity_created")}{" "}
          <strong className="text-[#1a2e4a] font-medium">{name}</strong>
        </div>
      </div>
      <span className="text-[11px] text-[#A0AABE] flex-shrink-0 font-[var(--dash-mono)]">
        {time}
      </span>
    </div>
  )
}

// ── GhostButton ───────────────────────────────────────────────────────────────

export function GhostButton({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-[6px] px-4 py-2 rounded-md text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-[180ms] border"
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        borderColor: hovered && !disabled ? "#00D4FF" : "#D9E1ED",
        background: hovered && !disabled ? "#EEF2F9" : "transparent",
        color: hovered && !disabled ? "#1a2e4a" : "#6B7A8C",
        opacity: disabled ? 0.65 : 1,
      }}
    >
      {label}
    </button>
  )
}

// ── ProBanner ─────────────────────────────────────────────────────────────────

export function ProBanner({ onManagePlan, portalLoading }: { onManagePlan: () => void; portalLoading: boolean }) {
  const t = useTranslations("dashboard.resumes")
  return (
    <div
      className="flex items-center gap-4 rounded-[10px] px-5 py-4 mt-8 relative overflow-hidden border"
      style={{
        background: "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(0,212,255,0.02) 100%)",
        borderColor: "rgba(0,212,255,0.15)",
      }}
    >
      {/* top shimmer line — static opacity, keep inline for gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none opacity-40"
        style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }}
      />
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[#00D4FF] flex-shrink-0 border"
        style={{
          background: "rgba(0,212,255,0.08)",
          borderColor: "rgba(0,212,255,0.2)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2l2 5.5H18l-4.5 3.5 1.7 5.5L10 13.5 4.8 16.5l1.7-5.5L2 7.5h6L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex-1">
        <div
          className="text-sm font-semibold text-[#1a2e4a] tracking-[-0.01em] mb-[2px]"
          style={{ fontFamily: "var(--dash-serif)" }}
        >
          {t("pro_banner_title")}
        </div>
        <div className="text-xs text-[#6B7A8C]">{t("pro_banner_desc")}</div>
      </div>
      <GhostButton label={portalLoading ? t("opening_portal") : t("pro_banner_manage")} onClick={onManagePlan} disabled={portalLoading} />
      {/* decorative glyph — position/font-size/opacity are static design values, keep inline */}
      <span
        className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none select-none text-[#00D4FF]"
        style={{
          fontFamily: "var(--dash-serif)",
          fontSize: "60px",
          opacity: 0.04,
        }}
      >✦</span>
    </div>
  )
}

// ── UpgradeStatusOverlay ──────────────────────────────────────────────────────

type UpgradeState = "idle" | "waiting" | "confirmed" | "timeout"

interface UpgradeStatusOverlayProps {
  upgradeState: Exclude<UpgradeState, "idle">
}

export function UpgradeStatusOverlay({ upgradeState }: UpgradeStatusOverlayProps) {
  const t = useTranslations("dashboard.resumes")
  const locale = useLocale()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm px-6">
        {upgradeState === "waiting" && (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div>
              <p className="text-lg font-semibold">{t("syncing_title")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("syncing_subtitle")}</p>
            </div>
          </>
        )}
        {upgradeState === "confirmed" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div>
              <p className="text-lg font-semibold">{t("welcome_pro_title")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("upgrade_relogin_subtitle")}</p>
            </div>
          </>
        )}
        {upgradeState === "timeout" && (
          <>
            <AlertCircle className="h-12 w-12 text-amber-500" />
            <div>
              <p className="text-lg font-semibold">{t("timeout_title")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("timeout_subtitle")}</p>
            </div>
            <Button onClick={() => logoutAction(`/${locale}/login`)}>
              {t("timeout_reload")}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// ── StatsRow ──────────────────────────────────────────────────────────────────

interface StatsRowProps {
  resumes: ResumeCard[]
  isPro: boolean
}

export function StatsRow({ resumes, isPro }: StatsRowProps) {
  const t = useTranslations("dashboard.resumes")
  return (
    <div className="grid grid-cols-2 gap-3 mb-7">
      <StatCard animDelay="0ms" gold={false}>
        <div className="text-[11px] font-bold tracking-wider uppercase text-[#6B7A8C] mb-2">
          {t("stat_cvs_created")}
        </div>
        <div
          className="text-2xl font-bold text-[#1a2e4a] tracking-[-0.02em] leading-none"
          style={{ fontFamily: "var(--dash-mono)" }}
        >
          {resumes.length}
          <span
            className="text-xs font-normal text-[#6B7A8C] ml-1 tracking-normal"
            style={{ fontFamily: "inherit" }}
          >
            {t("stat_docs_unit")}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-[#6B7A8C] flex items-center gap-1">
          {resumes.some((r) => Date.now() - new Date(r.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000)
            ? t("stat_updated_this_week")
            : t("stat_no_changes")}
        </div>
        {/* decorative glyph — font-size is a large design value, keep inline */}
        <span
          className="absolute bottom-[10px] right-3 pointer-events-none select-none text-[#00D4FF] leading-none"
          style={{ fontFamily: "var(--dash-serif)", fontSize: "28px", opacity: 0.05 }}
        >§</span>
      </StatCard>

      <StatCard animDelay="80ms" gold={true}>
        <div className="text-[11px] font-bold tracking-wider uppercase text-[#00D4FF] mb-2">
          {t("stat_active_plan")}
        </div>
        <div
          className="text-xl font-bold text-[#00D4FF] tracking-[-0.02em] leading-none"
          style={{ fontFamily: "var(--dash-mono)" }}
        >
          {isPro ? "PRO" : "FREE"}
        </div>
        <div className="mt-2 text-[11px] text-[#6B7A8C] flex items-center gap-1">
          {isPro ? t("stat_plan_pro_desc") : t("stat_upgrade_plan")}
        </div>
        <span
          className="absolute bottom-[10px] right-3 pointer-events-none select-none text-[#00D4FF] leading-none"
          style={{ fontFamily: "var(--dash-serif)", fontSize: "28px", opacity: 0.05 }}
        >✦</span>
      </StatCard>
    </div>
  )
}

// ── ResumesToolbar ────────────────────────────────────────────────────────────

export function ResumesToolbar({ count }: { count: number }) {
  const t = useTranslations("dashboard.resumes")
  return (
    <div className="flex items-center gap-[10px] mb-[18px]">
      <span
        className="text-base font-semibold text-[#1a2e4a] tracking-[-0.025em] flex-1"
        style={{ fontFamily: "var(--dash-serif)" }}
      >
        {t("recent_documents")}
      </span>
      <span
        className="text-[11px] text-[#6B7A8C] bg-[#EEF2F9] border border-[#E8EDF6] rounded-lg px-2 py-[2px]"
        style={{ fontFamily: "var(--dash-mono)" }}
      >
        {count} {t("of")} {count}
      </span>
    </div>
  )
}

// ── ActivityFeed ──────────────────────────────────────────────────────────────

interface ActivityFeedProps {
  resumes: ResumeCard[]
  hasRecentEdit: boolean
  userTimezone: string
  dateLocale: Locale
  formatFn: (date: Date | string, tz: string, locale: Locale) => string
}

import type { Locale } from "date-fns"

export function ActivityFeed({ resumes, hasRecentEdit, userTimezone, dateLocale, formatFn }: ActivityFeedProps) {
  const t = useTranslations("dashboard.resumes")
  return (
    <div className="mt-10">
      <div
        className="text-[15px] font-semibold text-[#1a2e4a] tracking-[-0.02em] mb-[14px] flex items-center gap-[10px]"
        style={{ fontFamily: "var(--dash-serif)" }}
      >
        {t("activity_title")}
        <div className="flex-1 h-px bg-[#E8EDF6]" />
      </div>
      <div className="flex flex-col gap-px">
        {resumes.slice(0, 3).map((r, i) => {
          const isEdit = i === 0 && hasRecentEdit
          const type = isEdit ? "edit" : "create"
          const name = r.title || t("untitled")
          const time = formatFn(i === 0 ? r.updatedAt : r.createdAt, userTimezone, dateLocale)
          return <ActivityItem key={r.id} type={type} name={name} time={time} />
        })}
        {resumes.length === 0 && (
          <p className="text-[12.5px] px-[14px] py-2 text-[#6B7A8C]">{t("activity_empty")}</p>
        )}
      </div>
    </div>
  )
}
