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
}

// ── KanbanColumn ──────────────────────────────────────────────────────────────

export default function KanbanColumn({
  columnId, label, applications,
  draggingId, dragOver,
  onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onDelete,
}: ColumnProps) {
  const t = useTranslations("kanban")
  const isFound = columnId === "WISHLIST"
  const isRejectedCol = columnId === "REJECTED"
  const cfg = isFound ? COL_CONFIG["FOUND"] : COL_CONFIG[columnId]

  const colStyle: React.CSSProperties = isFound
    ? {
        background: "linear-gradient(180deg,#FFFDF6 0%,#FFFFFF 60%)",
        borderColor: dragOver ? C.cyan : "rgba(212,165,116,0.35)",
        boxShadow: dragOver
          ? `0 8px 24px rgba(0,212,255,0.12)`
          : "inset 0 0 0 1px rgba(245,215,139,0.25),0 0 24px rgba(212,165,116,0.08)",
        transition: "border-color 0.2s",
      }
    : {
        background: "white",
        borderColor: dragOver ? C.cyan : C.border,
        boxShadow: dragOver ? "0 8px 24px rgba(0,212,255,0.12)" : "none",
        transition: "border-color 0.2s",
      }

  const cardsAreaStyle: React.CSSProperties = dragOver
    ? { background: "rgba(0,212,255,0.05)", boxShadow: `inset 0 0 0 1.5px ${C.cyanBorder}` }
    : {}

  const isShimmer = isFound
  const topBorderStyle: React.CSSProperties = isShimmer
    ? {
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        borderRadius: "10px 10px 0 0",
        background: `linear-gradient(90deg,${C.gold},#F5D78B,${C.success},${C.gold})`,
        backgroundSize: "200% 100%",
        animation: "shimmer 3s linear infinite",
      }
    : {
        position: "absolute", top: 0, left: 0, right: 0, height: "2.5px",
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
      style={{
        background: "white", border: `1px solid ${C.border}`,
        borderRadius: 10, overflow: "hidden", minHeight: 520,
        display: "flex", flexDirection: "column", ...colStyle,
      }}
      onDragOver={(e) => { e.preventDefault(); onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop() }}
    >
      <div style={{ padding: "13px 14px 10px", borderBottom: `1px solid ${C.borderS}`, display: "flex", alignItems: "center", gap: 8, position: "relative", flexShrink: 0 }}>
        <div style={topBorderStyle} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", flex: 1, ...titleStyle }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--dash-mono)", fontSize: 10, fontWeight: 600, borderRadius: 8, padding: "1px 7px", color: cfg.badgeColor, background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}` }}>
          {applications.length}
        </span>
      </div>

      <div
        style={{
          padding: 10, display: "flex", flexDirection: "column", gap: 8,
          flex: 1, minHeight: 120,
          transition: "background 0.18s ease,box-shadow 0.18s ease",
          position: "relative", borderRadius: 6, ...cardsAreaStyle,
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
          />
        ))}

        {applications.length === 0 && dragOver && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: C.cyan, padding: "6px 12px",
            border: `1px dashed ${C.cyanBorder}`, borderRadius: 6,
            background: "white", pointerEvents: "none",
          }}>
            {t("drop_here")}
          </div>
        )}
      </div>

    </div>
  )
}
