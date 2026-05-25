"use client"

import { useTranslations } from "next-intl"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import ResumePreview from "@/components/resume/ResumePreview"
import { useResumeStore } from "@/stores/resumeStore"
import { TEMPLATES, TemplateId } from "@/types/resume"
import { LayoutTemplate } from "lucide-react"

interface Props {
  pendingTemplateId: TemplateId | null
  onConfirm: () => void
  onCancel: () => void
}

export default function TemplateSwitchModal({ pendingTemplateId, onConfirm, onCancel }: Props) {
  const t = useTranslations("editor.template_switch")
  const config = useResumeStore((s) => s.config)
  const sections = useResumeStore((s) => s.sections)

  if (!pendingTemplateId) return null

  const targetMeta = TEMPLATES.find((t) => t.id === pendingTemplateId)
  const currentMeta = TEMPLATES.find((t) => t.id === config.templateId)

  const singleToDouble = currentMeta?.columns === "single" && targetMeta?.columns === "double"
  const doubleToSingle = currentMeta?.columns === "double" && targetMeta?.columns === "single"
  const losingPhoto = config.photoUrl && currentMeta?.hasPhoto && !targetMeta?.hasPhoto

  const hasSideContent = sections.some((s) => s.column === "side" && s.visible)
  const showColumnWarning = doubleToSingle && hasSideContent
  const hasWarning = showColumnWarning || losingPhoto || singleToDouble

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-2xl border border-[#D9E1ED] shadow-[0_40px_100px_rgba(0,212,255,0.08)] gap-0 w-full">
        {/* Head */}
        <div className="relative px-7 pt-[22px] pb-5 border-b border-[#E8EDF6] bg-gradient-to-b from-[#F5F7FB] to-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-60" />
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl text-[#00D4FF] bg-gradient-to-br from-[rgba(0,212,255,0.12)] to-[rgba(0,168,204,0.04)] border border-[rgba(0,212,255,0.25)] shrink-0">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <div
                className="text-[17px] font-bold text-[#1a2e4a] tracking-[-0.02em]"
                style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
              >
                {t("title", { name: targetMeta?.name ?? pendingTemplateId })}
              </div>
              <div className="text-[12px] text-[#6B7A8C] mt-[2px]">{t("subtitle")}</div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gradient-to-br from-[#F5F7FB] to-[#EEF2F8] p-5 flex justify-center overflow-hidden h-[340px]">
          <div className="pointer-events-none overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] w-[302px] h-[320px]">
            <div className="w-[794px] h-[1123px] origin-top-left scale-[0.38]">
              <ResumePreview overrideTemplateId={pendingTemplateId} />
            </div>
          </div>
        </div>

        {/* Warnings */}
        {hasWarning && (
          <div className="px-6 py-3 border-t border-[#FDE68A] bg-gradient-to-r from-amber-50 to-yellow-50 space-y-1">
            {showColumnWarning && (
              <p className="text-[12px] text-amber-800 flex items-center gap-1.5">
                <span className="text-amber-500">⚠</span> {t("warn_columns")}
              </p>
            )}
            {losingPhoto && (
              <p className="text-[12px] text-amber-800 flex items-center gap-1.5">
                <span className="text-amber-500">⚠</span> {t("warn_photo")}
              </p>
            )}
            {singleToDouble && (
              <p className="text-[12px] text-amber-700 flex items-center gap-1.5">
                <span className="text-blue-400">ℹ</span> {t("info_double")}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-[10px] px-6 pt-4 pb-[20px] border-t border-[#E8EDF6]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 flex justify-center px-4 py-[11px] text-[13px] font-medium rounded-xl border border-[#E2E8F0] bg-white text-[#6B7A8C] cursor-pointer transition-all duration-150 hover:border-[#CBD5E1] hover:text-[#1a2e4a]"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 flex justify-center px-4 py-[11px] text-[13px] font-semibold text-white rounded-xl border-none cursor-pointer bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] shadow-[0_2px_8px_rgba(0,212,255,0.25)] transition-all duration-150 hover:shadow-[0_4px_14px_rgba(0,212,255,0.35)] hover:-translate-y-px"
          >
            {t("confirm")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
