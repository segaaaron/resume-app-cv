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
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "9px 11px", borderRadius: "6px",
          color: "var(--dash-muted)", border: "1px solid transparent",
          fontSize: "13.5px", fontWeight: 500,
          cursor: "not-allowed", opacity: 0.4, userSelect: "none",
          textDecoration: "none", position: "relative",
        }}
        title={label}
      >
        <Icon style={{ width: 16, height: 16, flexShrink: 0, opacity: 0.6 }} />
        <span style={{ flex: 1 }}>{label}</span>
        {isNew && <NewBadge t={t} />}
      </span>
    )
  }

  return (
    <Link
      href={href}
      title={label}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "9px 11px", borderRadius: "6px",
        textDecoration: "none", fontSize: "13.5px",
        fontWeight: active ? 600 : 500,
        color: active ? "var(--dash-cyan)" : "var(--dash-muted)",
        backgroundColor: active ? "var(--dash-cyan-dim)" : "transparent",
        border: active ? "1px solid var(--dash-cyan-border)" : "1px solid transparent",
        transition: "all 0.15s ease", position: "relative", cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.backgroundColor = "rgba(0,212,255,0.08)"
          el.style.color = "var(--dash-navy)"
          el.style.borderColor = "rgba(0,212,255,0.15)"
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement
          el.style.backgroundColor = "transparent"
          el.style.color = "var(--dash-muted)"
          el.style.borderColor = "transparent"
        }
      }}
    >
      {active && (
        <span style={{
          position: "absolute", left: "-1px", top: "50%", transform: "translateY(-50%)",
          width: "3px", height: "18px", background: "var(--dash-cyan)", borderRadius: "0 2px 2px 0",
        }} />
      )}
      <Icon style={{ width: 16, height: 16, flexShrink: 0, opacity: active ? 1 : 0.6, transition: "opacity 0.15s ease" }} />
      <span style={{ flex: 1 }}>{label}</span>
      {count !== null && (
        <span style={{
          marginLeft: "auto",
          fontFamily: "var(--dash-mono)",
          fontSize: "11px", fontWeight: 700, color: "white",
          background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
          border: "none", borderRadius: "8px", padding: "3px 8px",
          boxShadow: "0 2px 8px rgba(0,212,255,0.3)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minWidth: "22px", height: "20px",
        }}>
          {count}
        </span>
      )}
      {isNew && <NewBadge t={t} />}
    </Link>
  )
}

function NewBadge({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "3px",
      marginLeft: "auto",
      background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
      borderRadius: "8px", padding: "2px 6px",
      fontSize: "8px", fontWeight: 700, letterSpacing: "0.06em",
      textTransform: "uppercase", color: "#10B981",
    }}>
      {t("new_badge")}
    </span>
  )
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

export function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase", color: "var(--dash-subtle)",
      padding: "10px 10px 6px",
    }}>
      {label}
    </p>
  )
}

// ── Separator ─────────────────────────────────────────────────────────────────

export function NavSeparator() {
  return (
    <div style={{ height: "1px", background: "var(--dash-border-s)", margin: "8px 10px" }} />
  )
}
