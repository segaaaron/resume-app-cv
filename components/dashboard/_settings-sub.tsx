"use client"

import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// ── FieldInput ────────────────────────────────────────────────────────────────

export function FieldInput({ value, onChange, type = "text", disabled = false, placeholder }: {
  value: string
  onChange?: (v: string) => void
  type?: string
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={e => onChange?.(e.target.value)}
      className="w-full min-h-[44px] bg-dash-surface2 rounded-md px-3 py-2 text-[13px] outline-none transition-[border-color,box-shadow] duration-150 border border-dash-border focus:border-dash-cyan focus:shadow-[0_0_0_2px_rgba(0,212,255,0.08)] text-dash-navy disabled:text-dash-muted disabled:cursor-default cursor-text"
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
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md border-none text-white font-semibold text-[13px] tracking-[0.005em] transition-all duration-200 bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] shadow-[0_2px_8px_rgba(0,212,255,0.25)] hover:shadow-[0_4px_16px_rgba(0,212,255,0.35)] hover:-translate-y-px disabled:opacity-65 disabled:cursor-not-allowed${fullWidth ? " w-full justify-center" : " cursor-pointer"}`}
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
  if (danger) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-[13px] transition-all duration-[180ms] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.1)] text-[#DC2626] hover:bg-[rgba(239,68,68,0.2)] disabled:opacity-65 disabled:cursor-not-allowed${fullWidth ? " w-full justify-center" : " cursor-pointer"}`}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-[13px] transition-all duration-[180ms] border border-dash-border bg-transparent text-dash-muted hover:border-dash-cyan hover:bg-dash-surface2 hover:text-dash-navy disabled:opacity-65 disabled:cursor-not-allowed${fullWidth ? " w-full justify-center" : " cursor-pointer"}`}
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
    <div className="bg-white border border-dash-border rounded-[10px] overflow-hidden">
      {/* Card header */}
      <div className="px-5 pt-4 pb-3 border-b border-dash-border-s flex items-center gap-[10px]">
        <div className="w-[30px] h-[30px] rounded-lg bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center text-dash-cyan shrink-0">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1.5v8M5 7l2.5 2.5L10 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 11v1.5a1 1 0 001 1h9a1 1 0 001-1V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div className="[font-family:var(--dash-serif)] text-sm font-semibold text-dash-navy tracking-[-0.02em]">Mis datos</div>
          <div className="text-[11.5px] text-dash-muted mt-px">Exportar y eliminar cuenta</div>
        </div>
      </div>
      <div className="px-5 py-[18px]">
        <p className="text-[12.5px] text-dash-muted mb-[14px] leading-relaxed">
          {t("export_desc")}
        </p>
        <BtnGhost onClick={handleDataExport} disabled={exportLoading} fullWidth>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v6M4 5l2 2 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 9v1a1 1 0 001 1h7a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {exportLoading ? t("exporting") : t("export_button")}
        </BtnGhost>

        <div className="rounded-md px-4 py-[14px] mt-5 border bg-[rgba(239,68,68,0.05)] border-[rgba(239,68,68,0.15)]">
          <div className="text-xs font-semibold tracking-[0.04em] text-[#EF4444] mb-[5px]">
            {t("danger_zone")}
          </div>
          <p className="text-[12.5px] text-dash-muted mb-3 leading-[1.5]">
            {t("danger_desc")}
          </p>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <button
                  type="button"
                  disabled={deleteLoading}
                  className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-md text-[13px] font-medium text-[#DC2626] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.1)] transition-all duration-[180ms] cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed"
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
              className="p-0 overflow-hidden rounded-[16px] max-w-[400px] border border-dash-border shadow-[0_40px_100px_rgba(239,68,68,0.08)]"
            >
              <div className="px-7 pt-[30px] pb-4 text-center border-b border-dash-border-s relative bg-gradient-to-b from-[#FFF5F5] to-white">
                {/* top accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px opacity-50 bg-gradient-to-r from-transparent via-[#EF4444] to-transparent" />
                <div className="w-[60px] h-[60px] mx-auto mb-[14px] rounded-full flex items-center justify-center text-[#EF4444] relative border bg-gradient-to-br from-[rgba(239,68,68,0.12)] to-[rgba(220,38,38,0.04)] border-[rgba(239,68,68,0.25)]">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="text-xl font-bold text-dash-navy tracking-[-0.03em] mb-2 [font-family:var(--dash-serif)]">
                  {t("delete_dialog_title")}
                </div>
                <div className="text-[13px] text-dash-muted leading-[1.5] max-w-[300px] mx-auto">
                  {t("delete_dialog_desc")}
                </div>
              </div>
              <div className="flex gap-[10px] px-6 pt-[18px] pb-[22px]">
                <AlertDialogCancel className="flex-1 px-4 py-[11px] text-[13px] font-medium justify-center">
                  {t("cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="flex-1 text-white font-semibold px-4 py-[11px] text-[13px] border-none cursor-pointer justify-center bg-gradient-to-br from-[#DC2626] to-[#B91C1C] shadow-[0_2px_8px_rgba(220,38,38,0.25)]"
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
