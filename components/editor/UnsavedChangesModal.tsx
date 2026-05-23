"use client"

import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

interface Props {
  open: boolean
  onSave: () => void
  onDiscard: () => void
  onClose: () => void
}

export default function UnsavedChangesModal({ open, onSave, onDiscard, onClose }: Props) {
  const t = useTranslations("editor")
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <AlertDialogContent className="p-0 overflow-hidden rounded-2xl max-w-[400px] border border-[#D9E1ED] shadow-[0_40px_100px_rgba(0,212,255,0.08)]">
        {/* Head */}
        <div className="relative text-center px-7 pt-[30px] pb-5 border-b border-[#E8EDF6] bg-gradient-to-b from-[#F5F7FB] to-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-60" />
          <div className="flex items-center justify-center w-[60px] h-[60px] mx-auto mb-[14px] rounded-full text-[#00D4FF] bg-gradient-to-br from-[rgba(0,212,255,0.12)] to-[rgba(0,168,204,0.04)] border-[1.5px] border-[rgba(0,212,255,0.25)]">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <path d="M13 3v10M13 17v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M13 23C7.477 23 3 18.523 3 13S7.477 3 13 3s10 4.477 10 10-4.477 10-10 10z" stroke="currentColor" strokeWidth="1.6"/>
            </svg>
          </div>
          <div
            className="text-[22px] font-bold text-[#1a2e4a] tracking-[-0.03em] mb-[6px]"
            style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
          >
            {t("unsaved_modal.title")}
          </div>
          <div className="text-[13px] text-[#6B7A8C] leading-[1.5] max-w-[280px] mx-auto">
            {t("unsaved_modal.description")}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-[8px] px-6 pt-[18px] pb-[22px]">
          <AlertDialogAction
            onClick={onSave}
            className="w-full flex justify-center px-4 py-[11px] text-[13px] font-semibold text-white cursor-pointer border-none bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] shadow-[0_2px_8px_rgba(0,212,255,0.25)] rounded-xl"
          >
            {t("unsaved_modal.save")}
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={onDiscard}
            className="w-full flex justify-center px-4 py-[11px] text-[13px] font-medium rounded-xl border border-[#E2E8F0] bg-white text-[#6B7A8C]"
          >
            {t("unsaved_modal.discard")}
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
