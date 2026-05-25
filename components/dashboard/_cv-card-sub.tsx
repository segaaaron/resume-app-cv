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
  const t = useTranslations("dashboard.resumes")

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={creating}
      className="dash-card-in group flex flex-col items-center justify-center w-full min-h-[286px] gap-3 rounded-[10px] border-2 border-dashed border-dash-subtle bg-transparent transition-all duration-200 ease-out hover:border-dash-cyan hover:bg-[rgba(0,212,255,0.04)] hover:-translate-y-[3px] hover:shadow-[0_10px_36px_rgba(0,212,255,0.08)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      style={{ animationDelay: getAnimationDelay(index) }}
    >
      <div className="w-[46px] h-[46px] rounded-full border border-[1.5px] border-dash-subtle flex items-center justify-center text-dash-muted bg-transparent transition-all duration-200 group-hover:border-dash-cyan group-hover:text-dash-cyan group-hover:bg-[rgba(0,212,255,0.08)]">
        {creating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <span className="text-[13px] font-medium text-dash-muted transition-colors duration-200 group-hover:text-dash-cyan">
        {t("new_cv_create")}
      </span>
      <span className="text-[11px] text-dash-subtle transition-colors duration-200 text-center group-hover:text-dash-muted">
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
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`flex items-center gap-[9px] px-[11px] py-[9px] rounded-[7px] text-[13px] font-medium transition-all duration-[120ms] ${
        disabled
          ? "opacity-50 cursor-default"
          : danger
            ? "text-[#EF4444] cursor-pointer hover:text-[#DC2626] hover:bg-[rgba(239,68,68,0.1)]"
            : "text-dash-navy cursor-pointer hover:text-dash-cyan hover:bg-[rgba(0,212,255,0.08)]"
      }`}
    >
      {icon}
      {label}
    </div>
  )
}
