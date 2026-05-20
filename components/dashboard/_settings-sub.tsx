"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// ── Shared style constants ────────────────────────────────────────────────────

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
  fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)",
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
      style={{
        width: "100%", background: "#EEF2F9",
        border: `1px solid ${focused ? "#00D4FF" : "#D9E1ED"}`,
        borderRadius: 6, padding: "8px 12px",
        fontSize: 13, color: disabled ? "#6B7A8C" : "#1a2e4a",
        fontFamily: "inherit", outline: "none",
        transition: "border-color 0.15s ease",
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
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 6, border: "none",
        background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
        color: "white", fontWeight: 600, letterSpacing: "0.005em",
        fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: hovered ? "0 4px 16px rgba(0,212,255,0.35)" : "0 2px 8px rgba(0,212,255,0.25)",
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "all 0.2s ease",
        opacity: disabled ? 0.65 : 1,
        width: fullWidth ? "100%" : undefined,
        justifyContent: fullWidth ? "center" : undefined,
        fontFamily: "inherit",
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
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 16px", borderRadius: 6,
        border: danger ? "1px solid rgba(239,68,68,0.25)" : `1px solid ${hovered ? "#00D4FF" : "#D9E1ED"}`,
        background: danger ? hovered ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.1)" : hovered ? "#EEF2F9" : "transparent",
        color: danger ? "#DC2626" : hovered ? "#1a2e4a" : "#6B7A8C",
        fontWeight: 500, fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.18s ease",
        opacity: disabled ? 0.65 : 1,
        width: fullWidth ? "100%" : undefined,
        justifyContent: fullWidth ? "center" : undefined,
        fontFamily: "inherit",
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
    <div style={{ background: "white", border: "1px solid #D9E1ED", borderRadius: 10, overflow: "hidden" }}>
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
      <div style={{ padding: "18px 20px" }}>
        <p style={{ fontSize: 12.5, color: "#6B7A8C", marginBottom: 14, lineHeight: 1.6 }}>
          {t("export_desc")}
        </p>
        <BtnGhost onClick={handleDataExport} disabled={exportLoading} fullWidth>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v6M4 5l2 2 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 9v1a1 1 0 001 1h7a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {exportLoading ? t("exporting") : t("export_button")}
        </BtnGhost>

        <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6, padding: "14px 16px", marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: "#EF4444", marginBottom: 5 }}>
            {t("danger_zone")}
          </div>
          <p style={{ fontSize: 12.5, color: "#6B7A8C", marginBottom: 12, lineHeight: 1.5 }}>
            {t("danger_desc")}
          </p>
          <AlertDialog>
            <AlertDialogTrigger
              render={<button type="button" disabled={deleteLoading} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 6,
                border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.1)",
                color: "#DC2626", fontWeight: 500, fontSize: 13,
                cursor: deleteLoading ? "not-allowed" : "pointer",
                transition: "all 0.18s ease", opacity: deleteLoading ? 0.65 : 1,
                width: "100%", justifyContent: "center", fontFamily: "inherit",
              }} />}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 3.5h7M5 2h2M4.5 9l-.5-4.5M7.5 9l.5-4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                <rect x="1.5" y="3.5" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
              </svg>
              {deleteLoading ? t("deleting") : t("delete_account")}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("delete_dialog_title")}</AlertDialogTitle>
                <AlertDialogDescription>{t("delete_dialog_desc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-white hover:bg-destructive/90">
                  {t("confirm_delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
