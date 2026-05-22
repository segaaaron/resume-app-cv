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
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onDelete() }}
      style={{
        width: 28, height: 28, borderRadius: 6,
        borderWidth: 1, borderStyle: "solid",
        borderColor: hov ? "rgba(239,68,68,0.45)" : "rgba(239,68,68,0.2)",
        background: hov ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.07)",
        color: hov ? "#DC2626" : "#EF4444",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.15s ease", flexShrink: 0, marginLeft: "auto",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
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
    <svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
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
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "4px 10px", borderRadius: 5, fontSize: 11, fontFamily: "inherit",
        cursor: "pointer", transition: "all 0.15s ease", border: "1px solid",
        background: primary ? hov ? "rgba(0,212,255,0.15)" : "rgba(0,212,255,0.1)" : hov ? "#EEF2F9" : "transparent",
        borderColor: primary ? "rgba(0,212,255,0.25)" : hov ? "#00D4FF" : "#D9E1ED",
        color: primary ? "#00D4FF" : hov ? "#1a2e4a" : "#6B7A8C",
      }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  )
}

// ── LetterActivityItem ────────────────────────────────────────────────────────

export function LetterActivityItem({ type, name, time }: { type: "edit" | "create" | "down"; name: string; time: string }) {
  const t = useTranslations("dashboard.cover_letters")
  const [hov, setHov] = useState(false)
  const dotColor = type === "edit" ? "#00D4FF" : type === "create" ? "#10B981" : "#6B8AC4"
  const dotShadow = type === "edit" ? "0 0 6px rgba(0,212,255,0.5)" : type === "create" ? "0 0 6px rgba(16,185,129,0.5)" : "0 0 6px rgba(107,138,196,0.4)"
  const actionLabel = type === "edit" ? t("activity_edited") : type === "create" ? t("activity_created") : t("activity_downloaded")
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
        borderRadius: 6, border: `1px solid ${hov ? "#E8EDF6" : "transparent"}`,
        background: hov ? "#EEF2F9" : "transparent",
        transition: "background 0.15s ease, border-color 0.15s ease", cursor: "default",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 1, background: dotColor, boxShadow: dotShadow, display: "inline-block" }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, color: "#374151" }}>
          {actionLabel}{" "}<strong style={{ color: "#1a2e4a", fontWeight: 500 }}>{name}</strong>
        </div>
      </div>
      <span style={{ fontSize: 11, color: "#A0AABE", flexShrink: 0, fontFamily: "var(--dash-mono)" }}>{time}</span>
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
      className="cl-card-wrap cl-card-anim"
      style={{
        background: "white",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: hovered ? "rgba(0,212,255,0.55)" : "#E2E8F4",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        transition: "border-color 0.25s ease, transform 0.25s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.25s ease",
        position: "relative",
        animationDelay: animDelay,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 12px 40px rgba(0,212,255,0.14), 0 2px 8px rgba(26,46,74,0.08)"
          : "0 1px 4px rgba(26,46,74,0.06)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* accent bar top */}
      <div style={{
        height: 3,
        background: hovered
          ? "linear-gradient(90deg, #00D4FF 0%, #6B8AC4 50%, #1a2e4a 100%)"
          : "linear-gradient(90deg, #C8D8F0 0%, #E2E8F4 100%)",
        transition: "background 0.35s ease",
        flexShrink: 0,
      }} />

      {/* thumbnail zone */}
      <div
        style={{
          position: "relative",
          background: "linear-gradient(160deg, #EFF3FB 0%, #E4EAF6 55%, #DDE4F0 100%)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          padding: "22px 32px 0", minHeight: 148, overflow: "hidden",
          flexShrink: 0,
        }}
        onClick={onEdit}
      >
        {/* subtle dot grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(107,138,196,0.18) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          opacity: hovered ? 0.7 : 0.4,
          transition: "opacity 0.3s ease",
        }} />
        {/* cyan radial glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 60%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }} />

        {/* document thumbnail */}
        <div
          className="cl-thumb-hover"
          style={{
            width: "100%", maxWidth: 112,
            aspectRatio: "210 / 297",
            borderRadius: "3px 3px 0 0",
            overflow: "hidden",
            boxShadow: hovered
              ? "0 -4px 28px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,212,255,0.3)"
              : "0 -2px 16px rgba(0,0,0,0.1), 0 0 0 1px #D0D8EC",
            position: "relative", zIndex: 1,
            transition: "box-shadow 0.25s ease",
          }}
        >
          {letter.templateId ? <CoverLetterThumbnail id={letter.templateId} color={letter.colorScheme} /> : <LetterThumbSVG />}
        </div>

        {/* hover overlay */}
        <div
          className="cl-overlay"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(160deg, rgba(15,30,60,0.55) 0%, rgba(0,50,80,0.45) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 5, backdropFilter: "blur(3px)",
          }}
          onClick={(e) => { e.stopPropagation(); onEdit() }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(0,212,255,0.3) 0%, rgba(0,168,204,0.15) 100%)",
              border: "1.5px solid rgba(0,212,255,0.6)",
              color: "#00D4FF",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(0,212,255,0.3)",
            }}>
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <path d="M9 2l3 3L5 12H2V9L9 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="cl-ov-label" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#00D4FF" }}>{t("edit")}</span>
          </div>
        </div>
      </div>

      {/* info + actions */}
      <div style={{ padding: "14px 16px 15px", flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        {/* title */}
        <div style={{
          fontSize: 13.5, fontWeight: 700, color: "#111D2E",
          letterSpacing: "-0.02em", lineHeight: 1.3,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          marginBottom: 5,
        }}>
          {letter.title}
        </div>

        {/* meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#00A8CC",
            background: "rgba(0,212,255,0.08)",
            borderWidth: 1, borderStyle: "solid", borderColor: "rgba(0,212,255,0.2)",
            borderRadius: 4, padding: "2px 6px",
          }}>
            <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M3.5 5l1 1 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            IA
          </span>
          <span style={{ width: 2, height: 2, borderRadius: "50%", background: "#C4CDD9", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#8B98AB", fontVariantNumeric: "tabular-nums" }}>
            {formatInTimezone(letter.updatedAt, userTimezone, dateLocale)}
          </span>
        </div>

        {/* actions */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          paddingTop: 10, borderTop: "1px solid #EDF0F7",
          overflow: "visible", position: "relative",
        }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRename() }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 11px", borderRadius: 6, fontSize: 11.5, fontFamily: "inherit",
              fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease",
              background: "linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,168,204,0.06) 100%)",
              borderWidth: 1, borderStyle: "solid", borderColor: "rgba(0,212,255,0.28)",
              color: "#00A8CC", letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.background = "linear-gradient(135deg, rgba(0,212,255,0.18) 0%, rgba(0,168,204,0.1) 100%)"
              el.style.borderColor = "rgba(0,212,255,0.5)"
              el.style.color = "#00D4FF"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.background = "linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,168,204,0.06) 100%)"
              el.style.borderColor = "rgba(0,212,255,0.28)"
              el.style.color = "#00A8CC"
            }}
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
