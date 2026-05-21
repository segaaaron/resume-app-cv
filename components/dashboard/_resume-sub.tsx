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
      className="dash-card-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: gold
          ? "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(0,212,255,0.02) 100%)"
          : hovered ? "#F5F7FB" : "white",
        border: `1px solid ${
          gold
            ? hovered ? "rgba(0,212,255,0.35)" : "rgba(0,212,255,0.15)"
            : hovered ? "#00D4FF" : "#D9E1ED"
        }`,
        borderRadius: "10px",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease",
        animationDelay: animDelay,
      }}
    >
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, #00D4FF, transparent)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s",
          pointerEvents: "none",
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
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px 14px", borderRadius: "6px",
        border: `1px solid ${hovered ? "#E8EDF6" : "transparent"}`,
        background: hovered ? "#EEF2F9" : "transparent",
        transition: "background 0.15s ease, border-color 0.15s ease",
      }}
    >
      <span style={{
        width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
        marginTop: "1px", background: dot.bg, boxShadow: dot.shadow, display: "inline-block",
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "12.5px", color: "#1a2e4a" }}>
          {type === "edit" ? t("activity_edited") : t("activity_created")}{" "}
          <strong style={{ color: "#1a2e4a", fontWeight: 500 }}>{name}</strong>
        </div>
      </div>
      <span style={{
        fontSize: "11px", color: "#A0AABE", flexShrink: 0,
        fontFamily: "var(--dash-mono)",
      }}>
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
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.18s ease",
        border: `1px solid ${hovered && !disabled ? "#00D4FF" : "#D9E1ED"}`,
        background: hovered && !disabled ? "#EEF2F9" : "transparent",
        color: hovered && !disabled ? "#1a2e4a" : "#6B7A8C",
        whiteSpace: "nowrap", flexShrink: 0, opacity: disabled ? 0.65 : 1,
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
    <div style={{
      display: "flex", alignItems: "center", gap: "16px",
      background: "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(0,212,255,0.02) 100%)",
      border: "1px solid rgba(0,212,255,0.15)", borderRadius: "10px",
      padding: "16px 20px", marginTop: "32px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, #00D4FF, transparent)", opacity: 0.4, pointerEvents: "none" }} />
      <div style={{
        width: "40px", height: "40px", borderRadius: "10px",
        background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4FF", flexShrink: 0,
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2l2 5.5H18l-4.5 3.5 1.7 5.5L10 13.5 4.8 16.5l1.7-5.5L2 7.5h6L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "var(--dash-serif)", fontSize: "14px", fontWeight: 600,
          color: "#1a2e4a", letterSpacing: "-0.01em", marginBottom: "2px",
        }}>
          {t("pro_banner_title")}
        </div>
        <div style={{ fontSize: "12px", color: "#6B7A8C" }}>{t("pro_banner_desc")}</div>
      </div>
      <GhostButton label={portalLoading ? t("opening_portal") : t("pro_banner_manage")} onClick={onManagePlan} disabled={portalLoading} />
      <span style={{
        position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)",
        fontFamily: "var(--dash-serif)", fontSize: "60px",
        color: "#00D4FF", opacity: 0.04, pointerEvents: "none", userSelect: "none",
      }}>✦</span>
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "28px" }}>
      <StatCard animDelay="0ms" gold={false}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7A8C", marginBottom: "8px" }}>
          {t("stat_cvs_created")}
        </div>
        <div style={{ fontFamily: "var(--dash-mono)", fontSize: "24px", fontWeight: 700, color: "#1a2e4a", letterSpacing: "-0.02em", lineHeight: 1 }}>
          {resumes.length}
          <span style={{ fontFamily: "inherit", fontSize: "12px", fontWeight: 400, color: "#6B7A8C", marginLeft: "4px", letterSpacing: 0 }}>
            {t("stat_docs_unit")}
          </span>
        </div>
        <div style={{ marginTop: "8px", fontSize: "11px", color: "#6B7A8C", display: "flex", alignItems: "center", gap: "4px" }}>
          {resumes.some((r) => Date.now() - new Date(r.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000)
            ? t("stat_updated_this_week")
            : t("stat_no_changes")}
        </div>
        <span style={{ position: "absolute", bottom: "10px", right: "12px", fontFamily: "var(--dash-serif)", fontSize: "28px", color: "#00D4FF", opacity: 0.05, lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>§</span>
      </StatCard>

      <StatCard animDelay="80ms" gold={true}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#00D4FF", marginBottom: "8px" }}>
          {t("stat_active_plan")}
        </div>
        <div style={{ fontFamily: "var(--dash-mono)", fontSize: "20px", fontWeight: 700, color: "#00D4FF", letterSpacing: "-0.02em", lineHeight: 1 }}>
          {isPro ? "PRO" : "FREE"}
        </div>
        <div style={{ marginTop: "8px", fontSize: "11px", color: "#6B7A8C", display: "flex", alignItems: "center", gap: "4px" }}>
          {isPro ? t("stat_plan_pro_desc") : t("stat_upgrade_plan")}
        </div>
        <span style={{ position: "absolute", bottom: "10px", right: "12px", fontFamily: "var(--dash-serif)", fontSize: "28px", color: "#00D4FF", opacity: 0.05, lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>✦</span>
      </StatCard>
    </div>
  )
}

// ── ResumesToolbar ────────────────────────────────────────────────────────────

export function ResumesToolbar({ count }: { count: number }) {
  const t = useTranslations("dashboard.resumes")
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
      <span style={{ fontFamily: "var(--dash-serif)", fontSize: "16px", fontWeight: 600, color: "#1a2e4a", letterSpacing: "-0.025em", flex: 1 }}>
        {t("recent_documents")}
      </span>
      <span style={{ fontFamily: "var(--dash-mono)", fontSize: "11px", color: "#6B7A8C", background: "#EEF2F9", border: "1px solid #E8EDF6", borderRadius: "8px", padding: "2px 8px" }}>
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
    <div style={{ marginTop: "40px" }}>
      <div style={{ fontFamily: "var(--dash-serif)", fontSize: "15px", fontWeight: 600, color: "#1a2e4a", letterSpacing: "-0.02em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
        {t("activity_title")}
        <div style={{ flex: 1, height: "1px", background: "#E8EDF6" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        {resumes.slice(0, 3).map((r, i) => {
          const isEdit = i === 0 && hasRecentEdit
          const type = isEdit ? "edit" : "create"
          const name = r.title || t("untitled")
          const time = formatFn(i === 0 ? r.updatedAt : r.createdAt, userTimezone, dateLocale)
          return <ActivityItem key={r.id} type={type} name={name} time={time} />
        })}
        {resumes.length === 0 && (
          <p style={{ fontSize: "12.5px", padding: "8px 14px", color: "#6B7A8C" }}>{t("activity_empty")}</p>
        )}
      </div>
    </div>
  )
}
