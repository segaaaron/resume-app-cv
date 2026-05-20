"use client"

import { useState, useEffect, useRef } from "react"
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

// ── LetterDropdown ────────────────────────────────────────────────────────────

export function LetterDropdown({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={wrapRef} style={{ position: "relative", marginLeft: "auto" }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        style={{
          width: 26, height: 26, borderRadius: 5, border: "1px solid #D9E1ED",
          background: "transparent", color: "#6B7A8C",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s ease", flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = "#EEF2F9"
          ;(e.currentTarget as HTMLButtonElement).style.color = "#1a2e4a"
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
          ;(e.currentTarget as HTMLButtonElement).style.color = "#6B7A8C"
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <circle cx="5.5" cy="2" r="1" fill="currentColor" />
          <circle cx="5.5" cy="5.5" r="1" fill="currentColor" />
          <circle cx="5.5" cy="9" r="1" fill="currentColor" />
        </svg>
      </button>

      <div style={{
        position: "absolute", top: "calc(100% + 6px)", right: 0,
        background: "white", border: "1px solid #D9E1ED", borderRadius: 10,
        padding: 8, minWidth: 170, zIndex: 1000,
        boxShadow: "0 8px 32px rgba(26,46,74,0.12), 0 0 0 1px rgba(0,212,255,0.15)",
        opacity: open ? 1 : 0,
        transform: open ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.96)",
        pointerEvents: open ? "all" : "none",
        transition: "opacity 0.18s cubic-bezier(0.34,1.1,0.64,1), transform 0.18s cubic-bezier(0.34,1.1,0.64,1)",
        transformOrigin: "top right",
      }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 7, fontSize: 13, fontWeight: 500, color: "#1a2e4a", cursor: "pointer", transition: "all 0.12s ease" }}
          onMouseEnter={(e) => { ;(e.currentTarget as HTMLDivElement).style.background = "rgba(0,212,255,0.08)"; ;(e.currentTarget as HTMLDivElement).style.color = "#00D4FF" }}
          onMouseLeave={(e) => { ;(e.currentTarget as HTMLDivElement).style.background = "transparent"; ;(e.currentTarget as HTMLDivElement).style.color = "#1a2e4a" }}
          onClick={(e) => { e.stopPropagation(); setOpen(false) }}
        >
          Duplicar
        </div>
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #E8EDF6, transparent)", margin: "6px 0" }} />
        <div
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 7, fontSize: 13, fontWeight: 500, color: "#EF4444", cursor: "pointer", transition: "all 0.12s ease" }}
          onMouseEnter={(e) => { ;(e.currentTarget as HTMLDivElement).style.background = "rgba(239,68,68,0.1)"; ;(e.currentTarget as HTMLDivElement).style.color = "#DC2626" }}
          onMouseLeave={(e) => { ;(e.currentTarget as HTMLDivElement).style.background = "transparent"; ;(e.currentTarget as HTMLDivElement).style.color = "#EF4444" }}
          onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete() }}
        >
          Eliminar
        </div>
      </div>
    </div>
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
  const [hov, setHov] = useState(false)
  const dotColor = type === "edit" ? "#00D4FF" : type === "create" ? "#10B981" : "#6B8AC4"
  const dotShadow = type === "edit" ? "0 0 6px rgba(0,212,255,0.5)" : type === "create" ? "0 0 6px rgba(16,185,129,0.5)" : "0 0 6px rgba(107,138,196,0.4)"
  const actionLabel = type === "edit" ? "Editaste" : type === "create" ? "Creaste" : "Descargaste PDF de"
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
      <span style={{ fontSize: 11, color: "#A0AABE", flexShrink: 0, fontFamily: "var(--font-mono, monospace)" }}>{time}</span>
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
  onDelete: () => void
}

export function LetterCardItem({ letter, index, userTimezone, dateLocale, onEdit, onDelete }: LetterCardItemProps) {
  const [hovered, setHovered] = useState(false)
  const animDelay = `${index * 0.08 + 0.05}s`

  return (
    <div
      className="cl-card-wrap cl-card-anim"
      style={{
        background: hovered ? "#F5F7FB" : "white",
        border: `1px solid ${hovered ? "#00D4FF" : "#D9E1ED"}`,
        borderRadius: 10, overflow: "visible", cursor: "pointer",
        display: "block", textDecoration: "none",
        transition: "border-color 0.22s ease, background 0.22s ease, transform 0.22s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.22s ease",
        position: "relative", animationDelay: animDelay,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 20px rgba(0,212,255,0.12)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          position: "relative",
          background: "linear-gradient(135deg, #F5F7FB 0%, #EEF2F9 100%)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          padding: "18px 28px 0", minHeight: 140, overflow: "hidden",
          borderRadius: "10px 10px 0 0",
        }}
        onClick={onEdit}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.03) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div className="cl-thumb-hover" style={{ width: "100%", maxWidth: 118, aspectRatio: "210 / 297", borderRadius: "2px 2px 0 0", overflow: "hidden", boxShadow: "0 -2px 20px rgba(0,0,0,0.08), 0 0 0 1px #D9E1ED", position: "relative", zIndex: 1 }}>
          {letter.templateId ? <CoverLetterThumbnail id={letter.templateId} color={letter.colorScheme} /> : <LetterThumbSVG />}
        </div>
        <div className="cl-overlay" style={{ position: "absolute", inset: 0, background: "rgba(26,46,74,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, zIndex: 5, backdropFilter: "blur(2px)" }} onClick={(e) => { e.stopPropagation(); onEdit() }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,212,255,0.2)", border: "1px solid rgba(0,212,255,0.4)", color: "#00D4FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s ease" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2l3 3L5 12H2V9L9 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="cl-ov-label" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", color: "#00D4FF" }}>Editar</span>
          </div>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2e4a", letterSpacing: "-0.01em", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {letter.title}
        </div>
        <div style={{ fontSize: 11.5, color: "#6B7A8C", display: "flex", alignItems: "center", gap: 5 }}>
          <span>Generada con IA</span>
          <span style={{ width: 2.5, height: 2.5, borderRadius: "50%", background: "#A0AABE", display: "inline-block", flexShrink: 0 }} />
          <span>{formatInTimezone(letter.updatedAt, userTimezone, dateLocale)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 11, paddingTop: 10, borderTop: "1px solid #E8EDF6", overflow: "visible", position: "relative" }}>
          <CaBtn primary onClick={(e) => { e.stopPropagation(); onEdit() }}>Editar</CaBtn>
          <CaBtn onClick={(e) => { e.stopPropagation() }}>PDF</CaBtn>
          <LetterDropdown onDelete={onDelete} />
        </div>
      </div>
    </div>
  )
}
