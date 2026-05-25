"use client"

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
  onViewDetail?: (app: ApplicationCard) => void
}

export function KanbanCard({ app, isFound, isRejected, dragging, onDragStart, onDragEnd, onDelete, onViewDetail }: CardProps) {
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
      boxShadow: "0 0 0 1px rgba(220,38,68,0.1) inset",
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
    return {}
  })()

  return (
    <div
      draggable={!locked}
      onDragStart={() => !locked && onDragStart(app.id, app.status)}
      onDragEnd={onDragEnd}
      className={[
        "group bg-white border border-dash-border rounded-[6px] py-[11px] px-3 select-none relative",
        "transition-[transform,box-shadow,border-color,opacity,background] duration-[180ms] ease-in-out",
        !locked && !dragging ? "cursor-grab hover:border-dash-cyan hover:bg-dash-surface hover:shadow-[0_4px_16px_rgba(0,212,255,0.1)]" : "",
      ].join(" ")}
      style={cardStyle}
    >
      {isRejected && (
        <div className="absolute top-2 left-[10px] [font-family:var(--dash-serif)] text-[9.5px] font-bold tracking-[0.18em] uppercase text-[#B91C1C] py-[2px] pl-[7px] pr-2 bg-[rgba(254,242,242,0.85)] border border-[rgba(220,38,38,0.4)] rounded-[3px] inline-flex items-center gap-[5px] shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_1px_2px_rgba(220,38,38,0.08)]">
          <span className="w-[5px] h-[5px] rounded-full bg-[#DC2626] shadow-[0_0_0_2px_rgba(220,38,38,0.18)] inline-block" />
          {t("card_rejected_badge")}
        </div>
      )}

      {isFound && (
        <>
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.5)_0%,transparent_50%)] rounded-[inherit]" />
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
            whiteSpace: "nowrap",
            opacity: 0.92, pointerEvents: "none", zIndex: 10,
          }}>
            {t("card_found_stamp")}
          </div>
        </>
      )}

      {!locked && (
        <span className="absolute top-2 right-7 opacity-0 group-hover:opacity-50 transition-opacity duration-[180ms] text-dash-subtle pointer-events-none">
          <GripSVG />
        </span>
      )}

      {!locked && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(app.id) }}
          aria-label={t("delete_card")}
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-[5px] border border-transparent bg-transparent flex items-center justify-center cursor-pointer text-dash-subtle p-0 opacity-0 group-hover:opacity-100 transition-all duration-[160ms] ease-in-out hover:border-red-400/30 hover:bg-red-500/10 hover:text-[#EF4444]"
        >
          <XSvg />
        </button>
      )}

      <div className={`text-[12.5px] font-semibold text-dash-navy tracking-[-0.01em] mb-[3px] ${locked ? "opacity-[0.55]" : ""}`}>
        {app.jobTitle}
      </div>
      <div className={`text-[11.5px] text-dash-muted mb-[9px] ${locked ? "opacity-[0.55]" : ""}`}>
        {app.company}
      </div>
      <div className={`flex items-center gap-1.5 ${locked ? "opacity-[0.55]" : ""}`}>
        {app.modalidad && (
          <span className="text-[10px] font-medium py-[2px] px-[7px] rounded-[4px] tracking-[0.02em]" style={tagStyle}>
            {app.modalidad}
          </span>
        )}
        {dateStr && (
          <span className="[font-family:var(--dash-mono)] text-[10px] text-dash-subtle ml-auto">{dateStr}</span>
        )}
      </div>

      {isRejected && app.notes && (
        <p className="text-[10px] mt-1.5 text-dash-muted leading-[1.5]">{app.notes}</p>
      )}
      {isRejected && (
        <button
          onClick={() => onViewDetail?.(app)}
          className="mt-[10px] w-full inline-flex items-center justify-center gap-1.5 text-[11.5px] font-semibold tracking-[0.02em] text-[#B91C1C] bg-[linear-gradient(135deg,rgba(254,242,242,0.95)_0%,rgba(254,226,226,0.7)_100%)] border border-[rgba(220,38,38,0.28)] rounded-[7px] cursor-pointer px-[10px] py-[7px] [font-family:inherit] relative overflow-hidden transition-all duration-[180ms] ease-in-out hover:text-[#991B1B] hover:border-[rgba(220,38,38,0.5)] hover:shadow-[0_2px_8px_rgba(220,38,38,0.12)]"
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
