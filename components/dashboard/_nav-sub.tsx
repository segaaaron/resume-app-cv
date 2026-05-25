"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"

// ── NavItem ───────────────────────────────────────────────────────────────────

interface NavItemProps {
  label: string
  href: string
  icon: React.ElementType
  count: number | null
  isNew: boolean
  locked: boolean
  active: boolean
  onClick?: () => void
}

export function NavItem({ label, href, icon: Icon, count, isNew, locked, active, onClick }: NavItemProps) {
  const t = useTranslations("dashboard.nav")

  if (locked) {
    return (
      <span
        className="flex items-center gap-[10px] px-[11px] py-[9px] rounded-md border border-transparent text-[13.5px] font-medium cursor-not-allowed opacity-40 select-none relative no-underline text-dash-muted"
        title={label}
      >
        <Icon className="w-4 h-4 flex-shrink-0 opacity-60" />
        <span className="flex-1">{label}</span>
        {isNew && <NewBadge t={t} />}
      </span>
    )
  }

  return (
    <Link
      href={href}
      title={label}
      onClick={onClick}
      className={`flex items-center gap-[10px] px-[11px] py-[9px] rounded-md no-underline text-[13.5px] relative cursor-pointer transition-all duration-150 border ${
        active
          ? "font-semibold text-dash-cyan bg-[var(--dash-cyan-dim)] border-[var(--dash-cyan-border)]"
          : "font-medium text-dash-muted bg-transparent border-transparent hover:bg-[rgba(0,212,255,0.08)] hover:text-dash-navy hover:border-[rgba(0,212,255,0.15)]"
      }`}
    >
      {active && (
        <span className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-[0_2px_2px_0] bg-dash-cyan" />
      )}
      <Icon
        className={`w-4 h-4 flex-shrink-0 transition-opacity duration-150 ${active ? "opacity-100" : "opacity-60"}`}
      />
      <span className="flex-1">{label}</span>
      {count !== null && (
        <span className="ml-auto text-[11px] font-bold text-white rounded-lg px-2 py-[3px] inline-flex items-center justify-center min-w-[22px] h-5 border-none [font-family:var(--dash-mono)] bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] shadow-[0_2px_8px_rgba(0,212,255,0.3)]">
          {count}
        </span>
      )}
      {isNew && <NewBadge t={t} />}
    </Link>
  )
}

function NewBadge({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <span className="inline-flex items-center gap-[3px] ml-auto rounded-lg px-[6px] py-[2px] text-[8px] font-bold tracking-[0.06em] uppercase text-[#10B981] border bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)]">
      {t("new_badge")}
    </span>
  )
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

export function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[9px] font-bold tracking-[0.1em] uppercase px-[10px] pt-[10px] pb-[6px] text-dash-subtle">
      {label}
    </p>
  )
}

// ── Separator ─────────────────────────────────────────────────────────────────

export function NavSeparator() {
  return (
    <div className="h-px my-2 mx-[10px] bg-dash-border-s" />
  )
}
