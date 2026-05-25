"use client"

import type { AppStatus, ApplicationCard } from "@/stores/applicationStore"
import { useTranslations } from "next-intl"
import { C, KanbanCard } from "./_column-parts"

// ── Column config ────────────────────────────────────────────────────────────
interface ColConfig {
  topColor: string
  badgeColor: string
  badgeBg: string
  badgeBorder: string
  titleGradient?: boolean
}

const COL_CONFIG: Record<AppStatus | "FOUND", ColConfig> = {
  WISHLIST: {
    topColor: `linear-gradient(90deg,${C.gold},#F5D78B,${C.success},${C.gold})`,
    badgeColor: "#92651A",
    badgeBg: "linear-gradient(135deg,rgba(245,215,139,0.35),rgba(212,165,116,0.2))",
    badgeBorder: "rgba(212,165,116,0.45)",
    titleGradient: true,
  },
  APPLIED: {
    topColor: "#6B8AC4",
    badgeColor: "#6B8AC4",
    badgeBg: "rgba(107,138,196,0.12)",
    badgeBorder: "rgba(107,138,196,0.2)",
  },
  INTERVIEW: {
    topColor: C.success,
    badgeColor: "#10B981",
    badgeBg: "rgba(16,185,129,0.12)",
    badgeBorder: "rgba(16,185,129,0.2)",
  },
  OFFER: {
    topColor: "#00A8CC",
    badgeColor: "#00A8CC",
    badgeBg: "rgba(0,168,204,0.12)",
    badgeBorder: "rgba(0,168,204,0.2)",
  },
  REJECTED: {
    topColor: C.danger,
    badgeColor: "#EF4444",
    badgeBg: "rgba(239,68,68,0.12)",
    badgeBorder: "rgba(239,68,68,0.2)",
  },
  FOUND: {
    topColor: `linear-gradient(90deg,${C.gold},#F5D78B,${C.success},${C.gold})`,
    badgeColor: "#92651A",
    badgeBg: "linear-gradient(135deg,rgba(245,215,139,0.35),rgba(212,165,116,0.2))",
    badgeBorder: "rgba(212,165,116,0.45)",
    titleGradient: true,
  },
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ColumnProps {
  columnId: AppStatus
  label: string
  color: string
  applications: ApplicationCard[]
  draggingId: string | null
  dragOver: boolean
  onDragStart: (id: string, status: AppStatus) => void
  onDragEnd: () => void
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: () => void
  onDelete: (id: string) => void
  onViewDetail?: (app: ApplicationCard) => void
}

// ── KanbanColumn ──────────────────────────────────────────────────────────────

export default function KanbanColumn({
  columnId, label, applications,
  draggingId, dragOver,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onDelete, onViewDetail,
}: ColumnProps) {
  const t = useTranslations("kanban")
  const isFound = columnId === "WISHLIST"
  const isRejectedCol = columnId === "REJECTED"
  const cfg = isFound ? COL_CONFIG["FOUND"] : COL_CONFIG[columnId]

  const colStyle: React.CSSProperties = isFound
    ? {
        background: "linear-gradient(180deg,#FFFDF6 0%,#FFFFFF 60%)",
        borderColor: dragOver ? C.cyan : "rgba(212,165,116,0.35)",
        boxShadow: dragOver ? "0 8px 24px rgba(0,212,255,0.12)" : "inset 0 0 0 1px rgba(245,215,139,0.25),0 0 24px rgba(212,165,116,0.08)",
        transition: "border-color 0.2s",
      }
    : {
        background: "white",
        borderColor: dragOver ? C.cyan : C.border,
        boxShadow: dragOver ? "0 8px 24px rgba(0,212,255,0.12)" : undefined,
        transition: "border-color 0.2s",
      }

  const cardsAreaStyle: React.CSSProperties = dragOver
    ? { background: "rgba(0,212,255,0.05)", boxShadow: `inset 0 0 0 1.5px ${C.cyanBorder}` }
    : {}

  const topBorderStyle: React.CSSProperties = {
    position: "absolute", top: 0, left: 0, right: 0, height: isFound ? 3 : "2.5px",
    borderRadius: "10px 10px 0 0",
    background: cfg.topColor,
  }

  const titleStyle: React.CSSProperties = cfg.titleGradient
    ? {
        background: "linear-gradient(135deg,#B8860B 0%,#D4A574 50%,#10B981 100%)",
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
        fontWeight: 700, letterSpacing: "-0.01em",
      }
    : { color: C.muted }

  return (
    <div
      className="rounded-[10px] overflow-hidden min-h-[520px] flex flex-col border"
      style={colStyle}
      onDragOver={(e) => { e.preventDefault(); onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop() }}
    >
      <div className="px-[14px] pt-[13px] pb-[10px] border-b border-[#E8EDF6] flex items-center gap-2 relative shrink-0">
        <div style={topBorderStyle} />
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase flex-1" style={titleStyle}>
          {label}
        </span>
        <span
          className="[font-family:var(--dash-mono)] text-[10px] font-semibold rounded-lg px-[7px] py-px"
          style={{ color: cfg.badgeColor, background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}` }}
        >
          {applications.length}
        </span>
      </div>

      <div
        className="p-[10px] flex flex-col gap-2 flex-1 min-h-[120px] relative rounded-[6px]"
        style={{
          transition: "background 0.18s ease,box-shadow 0.18s ease",
          ...cardsAreaStyle,
        }}
      >
        {applications.map((app) => (
          <KanbanCard
            key={app.id}
            app={app}
            isFound={isFound}
            isRejected={isRejectedCol}
            dragging={draggingId === app.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDelete={onDelete}
            onViewDetail={onViewDetail}
          />
        ))}

        {applications.length === 0 && dragOver && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-semibold tracking-[0.08em] uppercase text-dash-cyan py-1.5 px-3 border border-dashed border-dash-cyan/25 rounded-[6px] bg-white pointer-events-none">
            {t("drop_here")}
          </div>
        )}
      </div>

    </div>
  )
}
