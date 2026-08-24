"use client"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useTranslations } from "next-intl"
import type { ApplicationCard, AppStatus } from "@/stores/applicationStore"
import { Z_BOARD_DIALOG, Z_MODAL } from "@/lib/ui/z-layers"

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
    <div style={{ zIndex: Z_BOARD_DIALOG }} className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl mx-4 w-full max-w-sm p-6" style={{ boxShadow: "0 24px 64px rgba(26,46,74,0.18)" }}>
        <div className="w-12 h-12 rounded-full mx-auto mb-4 bg-red-500/10 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-center mb-1 text-dash-navy" style={{ fontFamily: "var(--dash-serif)" }}>
          {t("reject_reason_title")}
        </h2>
        <p className="text-xs text-center mb-4 text-dash-muted">{t("reject_reason_subtitle")}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => setRejectChip(rejectChip === chip ? "" : chip)}
              className="text-xs px-3 py-1.5 rounded-full cursor-pointer transition-all duration-150"
              style={{
                border: rejectChip === chip ? "1px solid #00D4FF" : "1px solid #D9E1ED",
                background: rejectChip === chip ? "rgba(0,212,255,0.1)" : "transparent",
                color: rejectChip === chip ? "#1a2e4a" : "#6B7A8C",
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
          className="w-full text-[13px] border border-dash-border rounded-[10px] px-3 py-2 mb-4 resize-none outline-none box-border font-[inherit]"
        />
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 text-[13px] py-2 rounded-[10px] border border-dash-border text-dash-muted bg-transparent cursor-pointer transition-[background] duration-150"
          >
            {t("reject_cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-[13px] py-2 rounded-[10px] border-none font-semibold text-white bg-red-500 cursor-pointer"
          >
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
    <div style={{ zIndex: Z_BOARD_DIALOG }} className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl mx-4 w-full max-w-sm p-8 text-center" style={{ boxShadow: "0 24px 64px rgba(26,46,74,0.18)" }}>
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-black mb-2 text-dash-navy" style={{ fontFamily: "var(--dash-serif)" }}>{t("found_title")}</h2>
        <p className="text-sm font-semibold mb-1 text-dash-cyan">{foundCard.jobTitle} @ {foundCard.company}</p>
        <p className="text-sm mb-6 text-dash-muted">{t("found_subtitle")}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer"
          style={{ background: "linear-gradient(135deg,#00D4FF,#00A8CC)" }}
        >
          {t("found_thanks")}
        </button>
      </div>
    </div>
  )
}

// ── RejectionDetailModal ──────────────────────────────────────────────────────

export function RejectionDetailModal({ app, onClose }: { app: ApplicationCard | null; onClose: () => void }) {
  const t = useTranslations("kanban")
  const mountedRef = useRef(false)
  useEffect(() => { mountedRef.current = true }, [])

  if (!app) return null

  // notes format: "reason — personalNotes" or just one of them
  const notesParts = app.notes ? app.notes.split(" — ") : []
  const reason = notesParts[0] || ""
  const personalNotes = notesParts.slice(1).join(" — ")

  const archivedDate = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })

  const modal = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ zIndex: Z_MODAL }}
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md"
    >
      <div className="bg-white rounded-[20px] mx-4 w-full max-w-[440px] overflow-hidden" style={{ boxShadow: "0 32px 80px rgba(26,46,74,0.22)" }}>

        {/* ── Header ── */}
        <div
          className="px-7 pt-8 pb-6 text-center border-b border-[#F3E4E4]"
          style={{ background: "linear-gradient(180deg,#FFF1F2 0%,#FFFFFF 100%)" }}
        >
          {/* Icon with dashed ring */}
          <div className="relative w-[72px] h-[72px] mx-auto mb-4">
            <svg viewBox="0 0 72 72" fill="none" className="absolute inset-0 w-full h-full">
              <circle cx="36" cy="36" r="34" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="5 4" strokeOpacity="0.5"/>
            </svg>
            <div
              className="absolute inset-2 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)", boxShadow: "0 8px 20px rgba(239,68,68,0.4)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-red-500 mb-2">{t("detail_eyebrow")}</p>
          <h2 className="text-[22px] font-extrabold text-dash-navy mb-1.5 tracking-[-0.02em]" style={{ fontFamily: "var(--dash-serif)" }}>{app.jobTitle}</h2>
          <p className="text-[13px] text-dash-muted leading-[1.5]">{app.company} · {t("detail_subtitle")}</p>
        </div>

        {/* ── Body ── */}
        <div className="px-7 pt-5">

          {/* Motivo */}
          {reason && (
            <div className="mb-[18px]">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-3.5 h-0.5 bg-red-500 rounded-sm shrink-0" />
                <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-dash-muted">{t("detail_reason_label")}</span>
              </div>
              <p className="text-[15px] font-bold text-[#DC2626] m-0 leading-[1.4]">{reason}</p>
            </div>
          )}

          {/* Notas */}
          {personalNotes && (
            <div className="mb-[18px]">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-3.5 h-0.5 bg-red-500 rounded-sm shrink-0" />
                <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-dash-muted">{t("detail_notes_label")}</span>
              </div>
              <div className="bg-[#F8F9FB] rounded-lg px-3.5 py-2.5 border-l-[3px] border-dash-border">
                <p className="text-[13px] text-dash-muted m-0 leading-[1.55] italic">{personalNotes}</p>
              </div>
            </div>
          )}

          {/* Archivada */}
          <div className="mb-[18px]">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-3.5 h-0.5 bg-red-500 rounded-sm shrink-0" />
              <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-dash-muted">{t("detail_archived_label")}</span>
            </div>
            <p className="text-[15px] font-bold text-dash-navy m-0">{archivedDate}</p>
          </div>

          {/* Info box */}
          <div
            className="rounded-[10px] px-3.5 py-3 mb-5 flex gap-2.5 items-start"
            style={{ background: "rgba(0,212,255,0.07)", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0097B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            <p className="text-[12.5px] text-[#0B5D70] m-0 leading-[1.6]">{t("detail_advice")} <b>{t("detail_advice_bold")}</b></p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-7 pb-6">
          <button
            onClick={onClose}
            className="w-full py-[11px] rounded-[10px] font-semibold text-[13.5px] text-dash-navy border border-dash-border bg-dash-surface cursor-pointer flex items-center justify-center gap-1.5 transition-[background] duration-150 hover:bg-dash-surface2"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {t("detail_close")}
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== "undefined" ? createPortal(modal, document.body) : modal
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
    <div style={{ zIndex: Z_BOARD_DIALOG }} className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl mx-4 w-full max-w-sm p-6" style={{ boxShadow: "0 24px 64px rgba(26,46,74,0.18)" }}>
        <div className="w-12 h-12 rounded-full mx-auto mb-4 bg-red-500/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-center mb-1 text-dash-navy" style={{ fontFamily: "var(--dash-serif)" }}>{t("clear_confirm_title")}</h2>
        <p className="text-xs text-center mb-6 text-dash-muted">{t("clear_confirm_desc", { count: totalCount })}</p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-[13px] py-2 rounded-[10px] border border-dash-border text-dash-muted bg-transparent cursor-pointer"
          >
            {t("clear_cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={clearing}
            className="flex-1 text-[13px] py-2 rounded-[10px] border-none font-semibold text-white bg-red-500 cursor-pointer"
            style={{ opacity: clearing ? 0.6 : 1 }}
          >
            {clearing ? t("clear_yes_cleaning") : t("clear_yes")}
          </button>
        </div>
      </div>
    </div>
  )
}
