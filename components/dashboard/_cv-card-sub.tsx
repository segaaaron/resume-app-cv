"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

// ── getAnimationDelay ─────────────────────────────────────────────────────────

export function getAnimationDelay(index: number): string {
  const delays = [0.05, 0.13, 0.21]
  if (index < delays.length) return `${delays[index]}s`
  return `${0.21 + (index - 2) * 0.08}s`
}

// ── NewCVCard ─────────────────────────────────────────────────────────────────

interface NewCVCardProps {
  creating: boolean
  index: number
  onClick: () => void
}

export function NewCVCard({ creating, index, onClick }: NewCVCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const t = useTranslations("dashboard.resumes")

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={creating}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="dash-card-in"
      style={{
        background: isHovered ? "rgba(0,212,255,0.04)" : "transparent",
        border: `2px dashed ${isHovered ? "#00D4FF" : "#A0AABE"}`,
        borderRadius: "10px",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "286px", gap: "12px",
        cursor: creating ? "not-allowed" : "pointer",
        transition: "border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
        transform: isHovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: isHovered ? "0 10px 36px rgba(0,212,255,0.08)" : "none",
        opacity: creating ? 0.5 : 1,
        animationDelay: getAnimationDelay(index),
        width: "100%",
      }}
    >
      <div style={{
        width: "46px", height: "46px", borderRadius: "50%",
        border: `1.5px solid ${isHovered ? "#00D4FF" : "#A0AABE"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: isHovered ? "#00D4FF" : "#6B7A8C",
        background: isHovered ? "rgba(0,212,255,0.08)" : "transparent",
        transition: "all 0.2s ease",
      }}>
        {creating ? (
          <Loader2 style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: "13px", fontWeight: 500, color: isHovered ? "#00D4FF" : "#6B7A8C", transition: "color 0.2s ease" }}>
        {t("new_cv_create")}
      </span>
      <span style={{ fontSize: "11px", color: isHovered ? "#6B7A8C" : "#A0AABE", transition: "color 0.2s ease", textAlign: "center" }}>
        {t("new_cv_subtitle")}
      </span>
    </button>
  )
}

// ── DDItem ────────────────────────────────────────────────────────────────────

interface DDItemProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
  danger?: boolean
  disabled?: boolean
}

export function DDItem({ onClick, icon, label, danger = false, disabled = false }: DDItemProps) {
  const [hovered, setHovered] = useState(false)

  const baseColor = danger ? "#EF4444" : "#1a2e4a"
  const hoverColor = danger ? "#DC2626" : "#00D4FF"
  const hoverBg = danger ? "rgba(239,68,68,0.1)" : "rgba(0,212,255,0.08)"

  return (
    <div
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "9px",
        padding: "9px 11px", borderRadius: "7px",
        fontSize: "13px", fontWeight: 500,
        color: hovered ? hoverColor : baseColor,
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.12s ease",
        background: hovered ? hoverBg : "transparent",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}
      {label}
    </div>
  )
}
