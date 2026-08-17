"use client"

import { Loader2, CheckCircle2, AlertCircle, Languages } from "lucide-react"
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
  return (
    <div
      className={[
        "group dash-card-in relative overflow-hidden rounded-[10px] p-5 border transition-all duration-200",
        gold
          ? "border-dash-cyan/15 hover:border-dash-cyan/35"
          : "bg-white border-dash-border hover:bg-dash-surface hover:border-dash-cyan",
      ].join(" ")}
      style={{
        background: gold
          ? "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(0,212,255,0.02) 100%)"
          : undefined,
        animationDelay: animDelay,
      }}
    >
      {/* top shimmer line — gradient must stay inline; opacity driven by group-hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }}
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
  const t = useTranslations("dashboard.resumes")

  const dotColors: Record<string, { bg: string; shadow: string }> = {
    edit:   { bg: "#00D4FF", shadow: "0 0 6px rgba(0,212,255,0.5)" },
    create: { bg: "#10B981", shadow: "0 0 6px rgba(16,185,129,0.5)" },
    down:   { bg: "#6B8AC4", shadow: "0 0 6px rgba(107,138,196,0.4)" },
  }
  const dot = dotColors[type]

  return (
    <div className="flex items-center gap-3 px-[14px] py-[10px] rounded-md border border-transparent hover:border-dash-border-s hover:bg-dash-surface2 transition-[background,border-color] duration-150">
      {/* dot color/shadow are fully dynamic — keep inline */}
      <span
        className="inline-block w-[6px] h-[6px] rounded-full flex-shrink-0 mt-px"
        style={{ background: dot.bg, boxShadow: dot.shadow }}
      />
      <div className="flex-1">
        <div className="text-[12.5px] text-dash-navy">
          {type === "edit" ? t("activity_edited") : t("activity_created")}{" "}
          <strong className="text-dash-navy font-medium">{name}</strong>
        </div>
      </div>
      <span className="text-[11px] text-dash-subtle flex-shrink-0 font-[var(--dash-mono)]">
        {time}
      </span>
    </div>
  )
}

// ── GhostButton ───────────────────────────────────────────────────────────────

export function GhostButton({ label, onClick, disabled }: { label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-[6px] px-4 py-2 rounded-md text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-[180ms] border border-dash-border bg-transparent text-dash-muted hover:enabled:border-dash-cyan hover:enabled:bg-dash-surface2 hover:enabled:text-dash-navy disabled:opacity-65 disabled:cursor-not-allowed cursor-pointer"
    >
      {label}
    </button>
  )
}

// ── ProBanner ─────────────────────────────────────────────────────────────────

export function ProBanner({
  onManagePlan,
  portalLoading,
}: {
  /**
   * Omitted when the Stripe portal cannot be opened (no customer, or a PayPal payer).
   * The banner keeps confirming PRO status; only the action that would 400 disappears.
   */
  onManagePlan?: () => void
  portalLoading: boolean
}) {
  const t = useTranslations("dashboard.resumes")
  return (
    <div
      className="flex items-center gap-4 rounded-[10px] px-5 py-4 mt-8 mb-7 relative overflow-hidden border border-dash-cyan/15"
      style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(0,212,255,0.02) 100%)" }}
    >
      {/* top shimmer line — gradient must stay inline */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none opacity-40"
        style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }}
      />
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center text-dash-cyan flex-shrink-0 border border-dash-cyan/20"
        style={{ background: "rgba(0,212,255,0.08)" }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2l2 5.5H18l-4.5 3.5 1.7 5.5L10 13.5 4.8 16.5l1.7-5.5L2 7.5h6L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex-1">
        <div
          className="text-sm font-semibold text-dash-navy tracking-[-0.01em] mb-[2px]"
          style={{ fontFamily: "var(--dash-serif)" }}
        >
          {t("pro_banner_title")}
        </div>
        <div className="text-xs text-dash-muted">{t("pro_banner_desc")}</div>
      </div>
      {onManagePlan && (
        <GhostButton label={portalLoading ? t("opening_portal") : t("pro_banner_manage")} onClick={onManagePlan} disabled={portalLoading} />
      )}
      {/* decorative glyph — font-size/opacity are fixed design values, keep inline */}
      <span
        className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none select-none text-dash-cyan"
        style={{ fontFamily: "var(--dash-serif)", fontSize: "60px", opacity: 0.04 }}
      >✦</span>
    </div>
  )
}

// ── UpgradeStatusOverlay ──────────────────────────────────────────────────────

type UpgradeState = "idle" | "waiting" | "confirmed" | "timeout"

interface UpgradeStatusOverlayProps {
  upgradeState: Exclude<UpgradeState, "idle">
  /**
   * Plan the webhook actually provisioned ("PRO" | "BASIC" | "SPRINT"), so the
   * confirmation names what the customer bought. It used to say "Pro" to everyone,
   * including the BASIC and SPRINT buyers who never reach that plan.
   */
  purchasedPlan?: string | null
}

/** "BASIC" → "Basic". The plan column is upper case; the copy is not. */
function planLabel(plan?: string | null): string {
  if (!plan) return "Pro"
  return plan.charAt(0) + plan.slice(1).toLowerCase()
}

export function UpgradeStatusOverlay({ upgradeState, purchasedPlan }: UpgradeStatusOverlayProps) {
  const t = useTranslations("dashboard.resumes")
  const locale = useLocale()
  const plan = planLabel(purchasedPlan)

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
              <p className="text-lg font-semibold">{t("welcome_plan_title", { plan })}</p>
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

// ── TranslatingOverlay ────────────────────────────────────────────────────────
// Full-screen premium loading shown while a CV is being translated. Scrim isolates
// the foreground; the card uses the app's navy/cyan palette. role=status +
// aria-live announces progress; motion-reduce disables the spin for a11y.

export function TranslatingOverlay() {
  const t = useTranslations("dashboard.resumes")
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[1000] flex items-center justify-center px-6"
      style={{ background: "rgba(26,46,74,0.62)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
    >
      <div
        className="dash-card-in flex flex-col items-center gap-5 text-center rounded-[20px] px-8 py-9 max-w-[360px] w-full border border-white/60"
        style={{
          background: "linear-gradient(160deg, #FFFFFF 0%, #F5F9FF 100%)",
          boxShadow: "0 24px 70px rgba(26,46,74,0.35), 0 0 0 1px rgba(0,212,255,0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        {/* Animated emblem: gradient disc + orbiting ring */}
        <div className="relative flex items-center justify-center h-16 w-16">
          <span
            className="absolute inset-0 rounded-full border-[2.5px] border-transparent motion-reduce:animate-none animate-spin"
            style={{ borderTopColor: "#00D4FF", borderRightColor: "rgba(0,212,255,0.35)" }}
          />
          <span
            className="flex items-center justify-center h-12 w-12 rounded-full text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #00D4FF 0%, #0077B6 100%)", boxShadow: "0 8px 24px rgba(0,212,255,0.4)" }}
          >
            <Languages className="h-6 w-6" />
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="text-[17px] font-bold tracking-[-0.01em] text-dash-navy" style={{ fontFamily: "var(--dash-serif)" }}>
            {t("translate_overlay_title")}
          </p>
          <p className="text-[12.5px] leading-relaxed text-dash-muted">
            {t("translate_overlay_desc")}
          </p>
        </div>

        {/* Indeterminate shimmer bar */}
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,212,255,0.12)" }}>
          <div
            className="h-full w-1/3 rounded-full motion-reduce:hidden"
            style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)", animation: "cvv-shimmer 1.3s ease-in-out infinite" }}
          />
        </div>

        <p className="text-[10.5px] text-dash-subtle">{t("translate_overlay_hint")}</p>
      </div>

      <style>{`@keyframes cvv-shimmer { 0% { transform: translateX(-120%) } 100% { transform: translateX(400%) } }`}</style>
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
        <div className="text-[11px] font-bold tracking-wider uppercase text-dash-muted mb-2">
          {t("stat_cvs_created")}
        </div>
        <div
          className="text-2xl font-bold text-dash-navy tracking-[-0.02em] leading-none"
          style={{ fontFamily: "var(--dash-mono)" }}
        >
          {resumes.length}
          <span className="text-xs font-normal text-dash-muted ml-1 tracking-normal">
            {t("stat_docs_unit")}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-dash-muted flex items-center gap-1">
          {/* eslint-disable-next-line react-hooks/purity -- client component: the only
              divergence is a résumé updated within seconds of the 7-day boundary, and the
              text is informational. Moving it to state would trade that for a flash of
              the wrong label on every load. */}
          {resumes.some((r) => Date.now() - new Date(r.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000)
            ? t("stat_updated_this_week")
            : t("stat_no_changes")}
        </div>
        {/* decorative glyph — font-size is a large design value, keep inline */}
        <span
          className="absolute bottom-[10px] right-3 pointer-events-none select-none text-dash-cyan leading-none"
          style={{ fontFamily: "var(--dash-serif)", fontSize: "28px", opacity: 0.05 }}
        >§</span>
      </StatCard>

      <StatCard animDelay="80ms" gold={true}>
        <div className="text-[11px] font-bold tracking-wider uppercase text-dash-cyan mb-2">
          {t("stat_active_plan")}
        </div>
        <div
          className="text-xl font-bold text-dash-cyan tracking-[-0.02em] leading-none"
          style={{ fontFamily: "var(--dash-mono)" }}
        >
          {isPro ? "PRO" : "FREE"}
        </div>
        <div className="mt-2 text-[11px] text-dash-muted flex items-center gap-1">
          {isPro ? t("stat_plan_pro_desc") : t("stat_upgrade_plan")}
        </div>
        <span
          className="absolute bottom-[10px] right-3 pointer-events-none select-none text-dash-cyan leading-none"
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
        className="text-base font-semibold text-dash-navy tracking-[-0.025em] flex-1"
        style={{ fontFamily: "var(--dash-serif)" }}
      >
        {t("recent_documents")}
      </span>
      <span
        className="text-[11px] text-dash-muted bg-dash-surface2 border border-dash-border-s rounded-lg px-2 py-[2px]"
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
        className="text-[15px] font-semibold text-dash-navy tracking-[-0.02em] mb-[14px] flex items-center gap-[10px]"
        style={{ fontFamily: "var(--dash-serif)" }}
      >
        {t("activity_title")}
        <div className="flex-1 h-px bg-dash-border-s" />
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
          <p className="text-[12.5px] px-[14px] py-2 text-dash-muted">{t("activity_empty")}</p>
        )}
      </div>
    </div>
  )
}
