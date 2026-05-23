"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// ── Shared style constants (kept as CSSProperties for SettingsForm.tsx compat) ─

export const cardHeadStyle: React.CSSProperties = {
  padding: "16px 20px 12px",
  borderBottom: "1px solid #E8EDF6",
  display: "flex", alignItems: "center", gap: 10,
}

export const cardIcoStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8,
  background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#00D4FF", flexShrink: 0,
}

export const cardTitleStyle: React.CSSProperties = {
  fontFamily: "var(--dash-serif)",
  fontSize: 14, fontWeight: 600, color: "#1a2e4a", letterSpacing: "-0.02em",
}

export const cardSubStyle: React.CSSProperties = {
  fontSize: 11.5, color: "#6B7A8C", marginTop: 1,
}

export const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
  textTransform: "uppercase", color: "#6B7A8C", marginBottom: 5,
}

export const fieldHintStyle: React.CSSProperties = {
  fontSize: 11, color: "#A0AABE", marginTop: 4,
}

// ── FieldInput ────────────────────────────────────────────────────────────────

export function FieldInput({ value, onChange, type = "text", disabled = false, placeholder }: {
  value: string
  onChange?: (v: string) => void
  type?: string
  disabled?: boolean
  placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={e => onChange?.(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full min-h-[44px] bg-[#EEF2F9] rounded-md px-3 py-2 text-[13px] outline-none transition-[border-color] duration-150 border"
      style={{
        fontFamily: "inherit",
        borderColor: focused ? "#00D4FF" : "#D9E1ED",
        color: disabled ? "#6B7A8C" : "#1a2e4a",
        boxShadow: focused ? "0 0 0 2px rgba(0,212,255,0.08)" : "none",
        cursor: disabled ? "default" : "text",
      }}
    />
  )
}

// ── BtnGold ───────────────────────────────────────────────────────────────────

export function BtnGold({ children, onClick, disabled, type = "button", fullWidth = false }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit"
  fullWidth?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-[6px] px-4 py-2 rounded-md border-none text-white font-semibold text-[13px] transition-all duration-200"
      style={{
        fontFamily: "inherit",
        background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
        letterSpacing: "0.005em",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: hovered ? "0 4px 16px rgba(0,212,255,0.35)" : "0 2px 8px rgba(0,212,255,0.25)",
        transform: hovered ? "translateY(-1px)" : "none",
        opacity: disabled ? 0.65 : 1,
        width: fullWidth ? "100%" : undefined,
        justifyContent: fullWidth ? "center" : undefined,
      }}
    >
      {children}
    </button>
  )
}

// ── BtnGhost ──────────────────────────────────────────────────────────────────

export function BtnGhost({ children, onClick, disabled, fullWidth = false, danger = false }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  danger?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-[6px] px-4 py-2 rounded-md font-medium text-[13px] transition-all duration-[180ms] border"
      style={{
        fontFamily: "inherit",
        borderColor: danger ? "rgba(239,68,68,0.25)" : hovered ? "#00D4FF" : "#D9E1ED",
        background: danger ? hovered ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.1)" : hovered ? "#EEF2F9" : "transparent",
        color: danger ? "#DC2626" : hovered ? "#1a2e4a" : "#6B7A8C",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
        width: fullWidth ? "100%" : undefined,
        justifyContent: fullWidth ? "center" : undefined,
      }}
    >
      {children}
    </button>
  )
}

// ── DataCard (Card 3: Mis datos) ──────────────────────────────────────────────

interface DataCardProps {
  exportLoading: boolean
  deleteLoading: boolean
  handleDataExport: () => void
  handleDeleteAccount: () => void
}

export function DataCard({ exportLoading, deleteLoading, handleDataExport, handleDeleteAccount }: DataCardProps) {
  const t = useTranslations("dashboard.settings")
  return (
    <div className="bg-white border border-[#D9E1ED] rounded-[10px] overflow-hidden">
      <div style={cardHeadStyle}>
        <div style={cardIcoStyle}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1.5v8M5 7l2.5 2.5L10 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 11v1.5a1 1 0 001 1h9a1 1 0 001-1V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div style={cardTitleStyle}>Mis datos</div>
          <div style={cardSubStyle}>Exportar y eliminar cuenta</div>
        </div>
      </div>
      <div className="px-5 py-[18px]">
        <p className="text-[12.5px] text-[#6B7A8C] mb-[14px] leading-relaxed">
          {t("export_desc")}
        </p>
        <BtnGhost onClick={handleDataExport} disabled={exportLoading} fullWidth>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v6M4 5l2 2 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 9v1a1 1 0 001 1h7a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {exportLoading ? t("exporting") : t("export_button")}
        </BtnGhost>

        <div
          className="rounded-md px-4 py-[14px] mt-5 border"
          style={{
            background: "rgba(239,68,68,0.05)",
            borderColor: "rgba(239,68,68,0.15)",
          }}
        >
          <div className="text-xs font-semibold tracking-[0.04em] text-[#EF4444] mb-[5px]">
            {t("danger_zone")}
          </div>
          <p className="text-[12.5px] text-[#6B7A8C] mb-3 leading-[1.5]">
            {t("danger_desc")}
          </p>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <button
                  type="button"
                  disabled={deleteLoading}
                  className="inline-flex items-center justify-center gap-[6px] w-full px-4 py-2 rounded-md text-[13px] font-medium text-[#DC2626] border transition-all duration-[180ms]"
                  style={{
                    fontFamily: "inherit",
                    borderColor: "rgba(239,68,68,0.25)",
                    background: "rgba(239,68,68,0.1)",
                    cursor: deleteLoading ? "not-allowed" : "pointer",
                    opacity: deleteLoading ? 0.65 : 1,
                  }}
                />
              }
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 3.5h7M5 2h2M4.5 9l-.5-4.5M7.5 9l.5-4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                <rect x="1.5" y="3.5" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
              </svg>
              {deleteLoading ? t("deleting") : t("delete_account")}
            </AlertDialogTrigger>
            <AlertDialogContent
              className="p-0 overflow-hidden rounded-[16px] max-w-[400px] border border-[#D9E1ED]"
              style={{ boxShadow: "0 40px 100px rgba(239,68,68,0.08)" }}
            >
              <div
                className="px-7 pt-[30px] pb-4 text-center border-b border-[#E8EDF6] relative"
                style={{
                  background: "linear-gradient(180deg, #FFF5F5 0%, white 100%)",
                }}
              >
                {/* top accent line */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px opacity-50"
                  style={{ background: "linear-gradient(90deg, transparent, #EF4444, transparent)" }}
                />
                <div
                  className="w-[60px] h-[60px] mx-auto mb-[14px] rounded-full flex items-center justify-center text-[#EF4444] relative border"
                  style={{
                    background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.04))",
                    borderColor: "rgba(239,68,68,0.25)",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div
                  className="text-xl font-bold text-[#1a2e4a] tracking-[-0.03em] mb-2"
                  style={{ fontFamily: "var(--dash-serif)" }}
                >
                  {t("delete_dialog_title")}
                </div>
                <div className="text-[13px] text-[#6B7A8C] leading-[1.5] max-w-[300px] mx-auto">
                  {t("delete_dialog_desc")}
                </div>
              </div>
              <div className="flex gap-[10px] px-6 pt-[18px] pb-[22px]">
                <AlertDialogCancel
                  className="flex-1 px-4 py-[11px] text-[13px] font-medium justify-center"
                  style={{ fontFamily: "inherit" }}
                >
                  {t("cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="flex-1 text-white font-semibold px-4 py-[11px] text-[13px] border-none cursor-pointer justify-center"
                  style={{
                    fontFamily: "inherit",
                    background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                    boxShadow: "0 2px 8px rgba(220,38,38,0.25)",
                  }}
                >
                  {t("confirm_delete")}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
