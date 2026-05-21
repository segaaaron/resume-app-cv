"use client"

import { useTranslations } from "next-intl"
import type { ApplicationCard, AppStatus } from "@/stores/applicationStore"

const C = {
  navy:   "#1a2e4a",
  cyan:   "#00D4FF",
  muted:  "#6B7A8C",
  border: "#D9E1ED",
  danger: "#EF4444",
} as const

// ── RejectModal ───────────────────────────────────────────────────────────────

interface RejectModalProps {
  rejectState: { id: string; prevStatus: AppStatus } | null
  rejectChip: string
  setRejectChip: (v: string) => void
  rejectNotes: string
  setRejectNotes: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function RejectModal({ rejectState, rejectChip, setRejectChip, rejectNotes, setRejectNotes, onConfirm, onCancel }: RejectModalProps) {
  const t = useTranslations("kanban")
  const chips = [
    t("reject_chip_1"),
    t("reject_chip_2"),
    t("reject_chip_3"),
    t("reject_chip_4"),
    t("reject_chip_5"),
    t("reject_chip_6"),
  ]
  if (!rejectState) return null
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 64px rgba(26,46,74,0.18)", padding: 24, maxWidth: 384, width: "100%", margin: "0 16px" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", margin: "0 auto 16px", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: "var(--dash-serif)", fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 4, color: C.navy }}>
          {t("reject_reason_title")}
        </h2>
        <p style={{ fontSize: 12, textAlign: "center", marginBottom: 16, color: C.muted }}>{t("reject_reason_subtitle")}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => setRejectChip(rejectChip === chip ? "" : chip)}
              style={{
                fontSize: 12, padding: "6px 12px", borderRadius: 999,
                border: rejectChip === chip ? `1px solid ${C.cyan}` : `1px solid ${C.border}`,
                background: rejectChip === chip ? "rgba(0,212,255,0.1)" : "transparent",
                color: rejectChip === chip ? C.navy : C.muted,
                cursor: "pointer", transition: "all 0.15s ease",
              }}
            >
              {chip}
            </button>
          ))}
        </div>
        <textarea
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
          placeholder={t("reject_notes_placeholder")}
          rows={2}
          style={{ width: "100%", fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", marginBottom: 16, resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, fontSize: 13, padding: "8px 0", borderRadius: 10, border: `1px solid ${C.border}`, color: C.muted, background: "transparent", cursor: "pointer", transition: "background 0.15s ease" }}>
            {t("reject_cancel")}
          </button>
          <button onClick={onConfirm} style={{ flex: 1, fontSize: 13, padding: "8px 0", borderRadius: 10, border: "none", fontWeight: 600, color: "white", background: C.danger, cursor: "pointer" }}>
            {t("reject_confirm")}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── FoundJobModal ─────────────────────────────────────────────────────────────

export function FoundJobModal({ foundCard, onClose }: { foundCard: ApplicationCard | null; onClose: () => void }) {
  const t = useTranslations("kanban")
  if (!foundCard) return null
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 64px rgba(26,46,74,0.18)", padding: 32, maxWidth: 384, width: "100%", margin: "0 16px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontFamily: "var(--dash-serif)", fontSize: 24, fontWeight: 900, marginBottom: 8, color: C.navy }}>{t("found_title")}</h2>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: C.cyan }}>{foundCard.jobTitle} @ {foundCard.company}</p>
        <p style={{ fontSize: 14, marginBottom: 24, color: C.muted }}>{t("found_subtitle")}</p>
        <button
          onClick={onClose}
          style={{ width: "100%", padding: "10px 0", borderRadius: 12, fontWeight: 700, fontSize: 14, color: "white", border: "none", background: "linear-gradient(135deg,#00D4FF,#00A8CC)", cursor: "pointer" }}
        >
          {t("found_thanks")}
        </button>
      </div>
    </div>
  )
}

// ── ClearBoardModal ───────────────────────────────────────────────────────────

interface ClearBoardModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  clearing: boolean
  totalCount: number
}

export function ClearBoardModal({ open, onClose, onConfirm, clearing, totalCount }: ClearBoardModalProps) {
  const t = useTranslations("kanban")
  if (!open) return null
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 64px rgba(26,46,74,0.18)", padding: 24, maxWidth: 384, width: "100%", margin: "0 16px" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", margin: "0 auto 16px", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </div>
        <h2 style={{ fontFamily: "var(--dash-serif)", fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 4, color: C.navy }}>{t("clear_confirm_title")}</h2>
        <p style={{ fontSize: 12, textAlign: "center", marginBottom: 24, color: C.muted }}>{t("clear_confirm_desc", { count: totalCount })}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, fontSize: 13, padding: "8px 0", borderRadius: 10, border: `1px solid ${C.border}`, color: C.muted, background: "transparent", cursor: "pointer" }}>
            {t("clear_cancel")}
          </button>
          <button onClick={onConfirm} disabled={clearing} style={{ flex: 1, fontSize: 13, padding: "8px 0", borderRadius: 10, border: "none", fontWeight: 600, color: "white", background: C.danger, cursor: "pointer", opacity: clearing ? 0.6 : 1 }}>
            {clearing ? t("clear_yes_cleaning") : t("clear_yes")}
          </button>
        </div>
      </div>
    </div>
  )
}
