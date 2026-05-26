"use client"

import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { ArrowDown } from "lucide-react"

export type SuggestionField =
  | "summary"
  | "personalDetails.jobTitle"
  | "skills"
  | "workExperience.description"
  | "workExperience.jobTitle"
  | "languages"
  | "certifications"

export interface Suggestion {
  field: SuggestionField
  type: "replace" | "append"
  preview: string
  reason: string
  targetId?: string
}

interface SuggestionDiffModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  suggestion: Suggestion
  currentValue: string
}

const FIELD_KEYS: Record<SuggestionField, string> = {
  "summary": "field_summary",
  "personalDetails.jobTitle": "field_job_title",
  "skills": "field_skills",
  "workExperience.description": "field_work_description",
  "workExperience.jobTitle": "field_work_job_title",
  "languages": "field_languages",
  "certifications": "field_certifications",
}

export default function SuggestionDiffModal({
  open,
  onClose,
  onConfirm,
  suggestion,
  currentValue,
}: SuggestionDiffModalProps) {
  const t = useTranslations("editor.cv_review")

  const afterValue = suggestion.type === "append"
    ? [currentValue, suggestion.preview].filter(Boolean).join(" ")
    : suggestion.preview

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-[560px] w-[calc(100vw-2rem)] sm:w-[95vw] border border-[#D9E1ED] shadow-[0_40px_100px_rgba(0,212,255,0.08)] gap-0">
        {/* Head */}
        <div className="relative px-4 sm:px-7 pt-5 sm:pt-[26px] pb-4 sm:pb-5 border-b border-[#E8EDF6] bg-gradient-to-b from-[#F5F7FB] to-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-60" />
          <div className="flex items-start gap-3 mb-1">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-[#00D4FF] bg-gradient-to-br from-[rgba(0,212,255,0.12)] to-[rgba(0,168,204,0.04)] border border-[rgba(0,212,255,0.25)] shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M12 10l2 2-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="min-w-0">
              <div
                className="text-[14px] sm:text-[16px] font-bold text-[#1a2e4a] tracking-[-0.02em] leading-tight"
                style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
              >
                {t("diff_title")} — {t(FIELD_KEYS[suggestion.field])}
              </div>
              <div className="text-[11px] sm:text-[11.5px] text-[#6B7A8C] mt-[2px] leading-snug">{suggestion.reason}</div>
            </div>
          </div>
        </div>

        {/* Diff content — vertical, scrollable */}
        <div className="px-4 sm:px-7 py-4 sm:py-5 space-y-3 bg-white overflow-y-auto max-h-[55vh] sm:max-h-[60vh]">
          {/* Before */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1.5">{t("diff_before")}</p>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 sm:px-3.5 py-3 text-[12px] sm:text-[12.5px] text-[#6B7A8C] leading-relaxed min-h-[48px] whitespace-pre-wrap break-words">
              {currentValue || <span className="italic opacity-60">{t("diff_empty")}</span>}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200">
              <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
            </div>
          </div>

          {/* After */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1.5">{t("diff_after")}</p>
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 px-3 sm:px-3.5 py-3 text-[12px] sm:text-[12.5px] text-[#1a2e4a] leading-relaxed min-h-[48px] whitespace-pre-wrap break-words">
              {afterValue}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-[10px] px-4 sm:px-6 pt-3 pb-5 sm:pb-[22px] border-t border-[#E8EDF6] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex justify-center items-center px-3 sm:px-4 py-3 sm:py-[11px] text-[13px] font-medium rounded-xl border border-[#E2E8F0] bg-white text-[#6B7A8C] cursor-pointer transition-all duration-150 hover:border-[#CBD5E1] hover:text-[#1a2e4a] min-h-[44px]"
          >
            {t("diff_cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 flex justify-center items-center px-3 sm:px-4 py-3 sm:py-[11px] text-[13px] font-semibold text-white rounded-xl border-none cursor-pointer bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_2px_8px_rgba(16,185,129,0.3)] transition-all duration-150 hover:shadow-[0_4px_14px_rgba(16,185,129,0.4)] hover:-translate-y-px min-h-[44px]"
          >
            {t("diff_confirm")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
