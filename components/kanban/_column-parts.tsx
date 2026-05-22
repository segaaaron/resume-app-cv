"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import type { AppStatus, ApplicationCard } from "@/stores/applicationStore"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { enUS } from "date-fns/locale/en-US"

// ── CSS color constants ───────────────────────────────────────────────────────

export const C = {
  navy:       "#1a2e4a",
  cyan:       "#00D4FF",
  cyanDim:    "rgba(0,212,255,0.08)",
  cyanBorder: "rgba(0,212,255,0.25)",
  surface:    "#F5F7FB",
  surface2:   "#EEF2F9",
  muted:      "#6B7A8C",
  subtle:     "#A0AABE",
  border:     "#D9E1ED",
  borderS:    "#E8EDF6",
  success:    "#10B981",
  danger:     "#EF4444",
  gold:       "#D4A574",
} as const

// ── Modalidad → tag style ─────────────────────────────────────────────────────

export function getTagStyle(modalidad?: string): React.CSSProperties {
  if (!modalidad) return {}
  const m = modalidad.toLowerCase()
  if (m === "remoto") return { background: "rgba(16,185,129,0.14)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }
  if (m === "híbrido" || m === "hibrido") return { background: "rgba(212,165,116,0.14)", color: "#D4A574", border: "1px solid rgba(212,165,116,0.2)" }
  if (m === "presencial") return { background: "rgba(107,138,196,0.14)", color: "#6B8AC4", border: "1px solid rgba(107,138,196,0.2)" }
  return { background: "rgba(150,150,170,0.12)", color: "#6B7A8C", border: "1px solid rgba(150,150,170,0.2)" }
}

// ── GripSVG ───────────────────────────────────────────────────────────────────

export function GripSVG() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
      <circle cx="3" cy="3" r="1" fill="currentColor"/>
      <circle cx="7" cy="3" r="1" fill="currentColor"/>
      <circle cx="3" cy="7" r="1" fill="currentColor"/>
      <circle cx="7" cy="7" r="1" fill="currentColor"/>
      <circle cx="3" cy="11" r="1" fill="currentColor"/>
      <circle cx="7" cy="11" r="1" fill="currentColor"/>
    </svg>
  )
}

// ── XSvg ──────────────────────────────────────────────────────────────────────

export function XSvg() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
      <path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

// ── KanbanCard ────────────────────────────────────────────────────────────────

interface CardProps {
  app: ApplicationCard
  isFound: boolean
  isRejected: boolean
  dragging: boolean
  onDragStart: (id: string, status: AppStatus) => void
  onDragEnd: () => void
  onDelete: (id: string) => void
}

export function KanbanCard({ app, isFound, isRejected, dragging, onDragStart, onDragEnd, onDelete }: CardProps) {
  const [hovered, setHovered] = useState(false)
  const [delHovered, setDelHovered] = useState(false)
  const [infoHovered, setInfoHovered] = useState(false)
  const locale = useLocale()
  const t = useTranslations("kanban")
  const dateFnsLocale = locale === "en" ? enUS : es
  const locked = isFound || isRejected
  const tagStyle = getTagStyle(app.modalidad)
  const dateStr = app.createdAt ? format(new Date(app.createdAt), "d MMM", { locale: dateFnsLocale }) : null

  const cardStyle: React.CSSProperties = (() => {
    if (isRejected) return {
      cursor: "default",
      background: "linear-gradient(135deg,rgba(239,68,68,0.05) 0%,rgba(220,38,38,0.025) 100%)",
      borderColor: "rgba(220,38,38,0.32)",
      boxShadow: "0 0 0 1px rgba(220,38,38,0.1) inset",
      paddingTop: 24,
    }
    if (isFound) return {
      cursor: "default", opacity: 0.78,
      background: "linear-gradient(135deg,rgba(212,165,116,0.06) 0%,rgba(16,185,129,0.04) 100%)",
      borderColor: "rgba(212,165,116,0.45)",
      boxShadow: "0 0 0 1px rgba(212,165,116,0.18) inset",
    }
    if (dragging) return {
      opacity: 0.25, transform: "scale(0.97)",
      boxShadow: "none", borderColor: C.border,
      background: C.surface, cursor: "grabbing", zIndex: 50,
      filter: "grayscale(0.4)",
    }
    if (hovered) return { borderColor: C.cyan, background: C.surface, boxShadow: "0 4px 16px rgba(0,212,255,0.1)", cursor: "grab" }
    return { cursor: "grab" }
  })()

  return (
    <div
      draggable={!locked}
      onDragStart={() => !locked && onDragStart(app.id, app.status)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => !locked && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDelHovered(false) }}
      style={{
        background: "white", borderWidth: 1, borderStyle: "solid", borderColor: C.border, borderRadius: 6,
        padding: "11px 12px", userSelect: "none", position: "relative",
        transition: "transform 0.18s ease,box-shadow 0.18s ease,border-color 0.18s ease,opacity 0.18s ease,background 0.18s ease",
        ...cardStyle,
      }}
    >
      {isRejected && (
        <div style={{
          position: "absolute", top: 8, left: 10,
          fontFamily: "var(--dash-serif)", fontSize: "9.5px", fontWeight: 700,
          letterSpacing: "0.18em", textTransform: "uppercase", color: "#B91C1C",
          padding: "2px 8px 2px 7px", background: "rgba(254,242,242,0.85)",
          border: "1px solid rgba(220,38,38,0.4)", borderRadius: 3,
          display: "inline-flex", alignItems: "center", gap: 5,
          boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset,0 1px 2px rgba(220,38,38,0.08)",
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#DC2626", boxShadow: "0 0 0 2px rgba(220,38,38,0.18)", display: "inline-block" }} />
          {t("card_rejected_badge")}
        </div>
      )}

      {isFound && (
        <>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle at 30% 30%,rgba(255,255,255,0.5) 0%,transparent 50%)", borderRadius: "inherit" }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%) rotate(-14deg)",
            fontFamily: "var(--dash-serif)", fontSize: 18, fontWeight: 700,
            letterSpacing: "0.18em", textTransform: "uppercase",
            color: "rgba(160,32,32,0.78)", padding: "10px 18px",
            border: "2.5px solid rgba(160,32,32,0.72)", borderRadius: 6,
            background: "rgba(255,250,240,0.08)",
            boxShadow: "0 0 0 2px rgba(255,250,240,0.15),inset 0 0 0 1.5px rgba(160,32,32,0.35),inset 0 0 18px rgba(160,32,32,0.08)",
            textShadow: "0 1px 0 rgba(255,255,255,0.4),0 0 2px rgba(160,32,32,0.2)",
            whiteSpace: "nowrap", animation: "stampIn 0.45s cubic-bezier(.34,1.56,.64,1) backwards",
            opacity: 0.92, pointerEvents: "none", zIndex: 10,
          }}>
            {t("card_found_stamp")}
          </div>
        </>
      )}

      {!locked && (
        <span style={{ position: "absolute", top: 8, right: 28, opacity: hovered ? 0.5 : 0, transition: "opacity 0.18s ease", color: C.subtle, pointerEvents: "none" }}>
          <GripSVG />
        </span>
      )}

      {!locked && (
        <button
          onMouseEnter={() => setDelHovered(true)}
          onMouseLeave={() => setDelHovered(false)}
          onClick={(e) => { e.stopPropagation(); onDelete(app.id) }}
          aria-label={t("delete_card")}
          style={{
            position: "absolute", top: 6, right: 6,
            width: 20, height: 20, borderRadius: 5,
            border: delHovered ? "1px solid rgba(239,68,68,0.3)" : "1px solid transparent",
            background: delHovered ? "rgba(239,68,68,0.1)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: delHovered ? C.danger : C.subtle,
            opacity: hovered ? 1 : 0, transition: "all 0.16s ease", padding: 0,
          }}
        >
          <XSvg />
        </button>
      )}

      <div style={{ fontSize: "12.5px", fontWeight: 600, color: C.navy, letterSpacing: "-0.01em", marginBottom: 3, opacity: locked ? 0.55 : 1 }}>
        {app.jobTitle}
      </div>
      <div style={{ fontSize: "11.5px", color: C.muted, marginBottom: 9, opacity: locked ? 0.55 : 1 }}>
        {app.company}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: locked ? 0.55 : 1 }}>
        {app.modalidad && (
          <span style={{ fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.02em", ...tagStyle }}>
            {app.modalidad}
          </span>
        )}
        {dateStr && (
          <span style={{ fontFamily: "var(--dash-mono)", fontSize: 10, color: C.subtle, marginLeft: "auto" }}>{dateStr}</span>
        )}
      </div>

      {isRejected && app.notes && (
        <p style={{ fontSize: 10, marginTop: 6, color: C.muted, lineHeight: 1.5 }}>{app.notes}</p>
      )}
      {isRejected && (
        <button
          onMouseEnter={() => setInfoHovered(true)}
          onMouseLeave={() => setInfoHovered(false)}
          style={{
            marginTop: 10, width: "100%",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "7px 10px", fontFamily: "inherit", fontSize: "11.5px", fontWeight: 600,
            letterSpacing: "0.02em",
            color: infoHovered ? "#991B1B" : "#B91C1C",
            background: "linear-gradient(135deg,rgba(254,242,242,0.95) 0%,rgba(254,226,226,0.7) 100%)",
            border: infoHovered ? "1px solid rgba(220,38,38,0.5)" : "1px solid rgba(220,38,38,0.28)",
            borderRadius: 7, cursor: "pointer",
            boxShadow: infoHovered ? "0 2px 8px rgba(220,38,38,0.12)" : "none",
            transition: "all 0.18s ease", position: "relative", overflow: "hidden",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
          {t("card_view_detail")}
        </button>
      )}
    </div>
  )
}
