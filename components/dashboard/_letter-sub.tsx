"use client"

import React, { useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { CoverLetterThumbnail } from "@/components/cover-letter/thumbnails"
import { formatInTimezone } from "@/hooks/useUserTimezone"
import type { Locale } from "date-fns"

// ── LetterCard type ───────────────────────────────────────────────────────────

export interface LetterCard {
  id: string
  title: string
  templateId: string
  colorScheme: string
  updatedAt: Date
  createdAt: Date
}

// ── DeleteBtn ─────────────────────────────────────────────────────────────────

export function DeleteBtn({ onDelete }: { onDelete: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onDelete() }}
      className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-all duration-150 flex-shrink-0 ml-auto border border-red-500/20 bg-red-500/[0.07] text-red-400 hover:border-red-500/45 hover:bg-red-500/[0.14] hover:text-red-600"
      title="Eliminar"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"/>
        <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      </svg>
    </button>
  )
}

// ── LetterThumbSVG ────────────────────────────────────────────────────────────

export function LetterThumbSVG() {
  return (
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" className="w-full h-full block">
      <rect width="210" height="297" fill="#F9F7F4" />
      <rect x="18" y="18" width="174" height="36" rx="2" fill="#3B5A9A" opacity="0.9" />
      <rect x="26" y="26" width="90" height="6" rx="1" fill="rgba(255,255,255,0.9)" />
      <rect x="26" y="35" width="62" height="4" rx="1" fill="rgba(255,255,255,0.55)" />
      <rect x="155" y="28" width="28" height="4" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="155" y="35" width="22" height="4" rx="1" fill="rgba(255,255,255,0.4)" />
      <line x1="18" y1="65" x2="192" y2="65" stroke="#3B5A9A" strokeWidth="1" opacity="0.4" />
      <rect x="18" y="74" width="70" height="3.5" rx="0.8" fill="#2D3748" opacity="0.7" />
      <rect x="18" y="81" width="52" height="3" rx="0.6" fill="#9CA3AF" opacity="0.7" />
      <rect x="18" y="87" width="60" height="3" rx="0.6" fill="#9CA3AF" opacity="0.6" />
      <rect x="18" y="104" width="174" height="3" rx="0.6" fill="#4A5568" opacity="0.6" />
      <rect x="18" y="110" width="170" height="3" rx="0.6" fill="#4A5568" opacity="0.55" />
      <rect x="18" y="116" width="160" height="3" rx="0.6" fill="#4A5568" opacity="0.5" />
      <rect x="18" y="122" width="140" height="3" rx="0.6" fill="#4A5568" opacity="0.45" />
      <rect x="18" y="136" width="174" height="3" rx="0.6" fill="#4A5568" opacity="0.6" />
      <rect x="18" y="142" width="168" height="3" rx="0.6" fill="#4A5568" opacity="0.55" />
      <rect x="18" y="148" width="172" height="3" rx="0.6" fill="#4A5568" opacity="0.5" />
      <rect x="18" y="154" width="120" height="3" rx="0.6" fill="#4A5568" opacity="0.45" />
      <rect x="18" y="168" width="174" height="3" rx="0.6" fill="#4A5568" opacity="0.6" />
      <rect x="18" y="174" width="165" height="3" rx="0.6" fill="#4A5568" opacity="0.55" />
      <rect x="18" y="180" width="150" height="3" rx="0.6" fill="#4A5568" opacity="0.5" />
      <rect x="18" y="200" width="55" height="3.5" rx="0.6" fill="#4A5568" opacity="0.6" />
      <rect x="18" y="220" width="80" height="3" rx="0.6" fill="#3B5A9A" opacity="0.6" />
      <rect x="18" y="226" width="60" height="3" rx="0.6" fill="#9CA3AF" opacity="0.6" />
    </svg>
  )
}

// ── CaBtn ─────────────────────────────────────────────────────────────────────

export function CaBtn({ children, primary, onClick }: {
  children: React.ReactNode
  primary?: boolean
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      className={[
        "inline-flex items-center gap-1 px-[10px] py-1 rounded-[5px] text-[11px] cursor-pointer transition-all duration-150 border",
        primary
          ? "border-dash-cyan/25 text-dash-cyan bg-dash-cyan/10 hover:bg-dash-cyan/15"
          : "border-dash-border bg-transparent text-dash-muted hover:bg-dash-surface2 hover:border-dash-cyan hover:text-dash-navy",
      ].join(" ")}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// ── LetterActivityItem ────────────────────────────────────────────────────────

export function LetterActivityItem({ type, name, time }: { type: "edit" | "create" | "down"; name: string; time: string }) {
  const t = useTranslations("dashboard.cover_letters")
  const dotColor = type === "edit" ? "#00D4FF" : type === "create" ? "#10B981" : "#6B8AC4"
  const dotShadow = type === "edit" ? "0 0 6px rgba(0,212,255,0.5)" : type === "create" ? "0 0 6px rgba(16,185,129,0.5)" : "0 0 6px rgba(107,138,196,0.4)"
  const actionLabel = type === "edit" ? t("activity_edited") : type === "create" ? t("activity_created") : t("activity_downloaded")
  return (
    <div className="flex items-center gap-3 px-[14px] py-[10px] rounded-md border border-transparent hover:border-dash-border-s hover:bg-dash-surface2 transition-[background,border-color] duration-150 cursor-default">
      {/* dot color/shadow are fully dynamic — keep inline */}
      <span
        className="inline-block w-[6px] h-[6px] rounded-full flex-shrink-0 mt-px"
        style={{ background: dotColor, boxShadow: dotShadow }}
      />
      <div className="flex-1">
        <div className="text-[12.5px] text-gray-700">
          {actionLabel}{" "}<strong className="text-dash-navy font-medium">{name}</strong>
        </div>
      </div>
      <span
        className="text-[11px] text-dash-subtle flex-shrink-0"
        style={{ fontFamily: "var(--dash-mono)" }}
      >{time}</span>
    </div>
  )
}

// ── LetterCardItem ────────────────────────────────────────────────────────────

interface LetterCardItemProps {
  letter: LetterCard
  index: number
  locale: string
  userTimezone: string
  dateLocale: Locale
  onEdit: () => void
  onRename: () => void
  onDelete: () => void
}

export const LetterCardItem = React.memo(function LetterCardItem({ letter, index, userTimezone, dateLocale, onEdit, onRename, onDelete }: LetterCardItemProps) {
  const t = useTranslations("dashboard.cover_letters")
  const [hovered, setHovered] = useState(false)
  const animDelay = `${index * 0.08 + 0.05}s`

  return (
    <div
      className="cl-card-wrap cl-card-anim group relative overflow-hidden rounded-[14px] cursor-pointer flex flex-col bg-white"
      style={{
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: hovered ? "rgba(0,212,255,0.55)" : "#E2E8F4",
        animationDelay: animDelay,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 12px 40px rgba(0,212,255,0.14), 0 2px 8px rgba(26,46,74,0.08)"
          : "0 1px 4px rgba(26,46,74,0.06)",
        transition: "border-color 0.25s ease, transform 0.25s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.25s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* accent bar top — gradient values are dynamic, keep inline */}
      <div
        className="h-[3px] flex-shrink-0 transition-[background] duration-[350ms]"
        style={{
          background: hovered
            ? "linear-gradient(90deg, #00D4FF 0%, #6B8AC4 50%, #1a2e4a 100%)"
            : "linear-gradient(90deg, #C8D8F0 0%, #E2E8F4 100%)",
        }}
      />

      {/* thumbnail zone */}
      <div
        className="relative flex items-end justify-center px-8 pt-[22px] min-h-[148px] overflow-hidden flex-shrink-0"
        style={{ background: "linear-gradient(160deg, #EFF3FB 0%, #E4EAF6 55%, #DDE4F0 100%)" }}
        onClick={onEdit}
      >
        {/* subtle dot grid — opacity is dynamic, keep inline */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(107,138,196,0.18) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
            opacity: hovered ? 0.7 : 0.4,
          }}
        />
        {/* cyan radial glow — opacity is dynamic, keep inline */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 60%)",
            opacity: hovered ? 1 : 0,
          }}
        />

        {/* document thumbnail — box-shadow is dynamic, keep inline */}
        <div
          className="cl-thumb-hover w-full max-w-[112px] rounded-t-[3px] overflow-hidden relative z-[1] transition-[box-shadow] duration-[250ms]"
          style={{
            aspectRatio: "210 / 297",
            boxShadow: hovered
              ? "0 -4px 28px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,212,255,0.3)"
              : "0 -2px 16px rgba(0,0,0,0.1), 0 0 0 1px #D0D8EC",
          }}
        >
          {letter.templateId ? <CoverLetterThumbnail id={letter.templateId} color={letter.colorScheme} /> : <LetterThumbSVG />}
        </div>

        {/* hover overlay — static gradient, keep inline */}
        <div
          className="cl-overlay absolute inset-0 flex items-center justify-center z-[5] backdrop-blur-[3px]"
          style={{ background: "linear-gradient(160deg, rgba(15,30,60,0.55) 0%, rgba(0,50,80,0.45) 100%)" }}
          onClick={(e) => { e.stopPropagation(); onEdit() }}
        >
          <div className="flex flex-col items-center gap-[7px]">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-dash-cyan border border-dash-cyan/60 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(0,168,204,0.15) 100%)" }}
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <path d="M9 2l3 3L5 12H2V9L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="cl-ov-label text-[10px] font-bold tracking-[0.1em] uppercase text-dash-cyan">{t("edit")}</span>
          </div>
        </div>
      </div>

      {/* info + actions */}
      <div className="px-4 pt-[14px] pb-[15px] flex-1 flex flex-col gap-0">
        {/* title */}
        <div className="text-[13.5px] font-bold text-[#111D2E] tracking-[-0.02em] leading-[1.3] whitespace-nowrap overflow-hidden text-ellipsis mb-[5px]">
          {letter.title}
        </div>

        {/* meta row */}
        <div className="flex items-center gap-[6px] mb-3">
          <span
            className="inline-flex items-center gap-[3px] text-[9.5px] font-bold tracking-wider uppercase text-[#00A8CC] rounded border border-dash-cyan/20 px-[6px] py-[2px]"
            style={{ background: "rgba(0,212,255,0.08)" }}
          >
            <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M3.5 5l1 1 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            IA
          </span>
          <span className="inline-block w-[2px] h-[2px] rounded-full bg-[#C4CDD9] flex-shrink-0" />
          <span className="text-[11px] text-[#8B98AB] tabular-nums">
            {formatInTimezone(letter.updatedAt, userTimezone, dateLocale)}
          </span>
        </div>

        {/* actions */}
        <div className="flex items-center gap-[6px] pt-[10px] border-t border-[#EDF0F7] overflow-visible relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRename() }}
            className="inline-flex items-center gap-[5px] px-[11px] py-[5px] rounded-md text-[11.5px] font-semibold cursor-pointer transition-all duration-150 border border-dash-cyan/[0.28] tracking-[-0.01em] text-[#00A8CC] hover:border-dash-cyan/50 hover:text-dash-cyan"
            style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,168,204,0.06) 100%)" }}
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M9 2l3 3L5 12H2V9L9 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t("rename")}
          </button>
          <DeleteBtn onDelete={onDelete} />
        </div>
      </div>
    </div>
  )
})
