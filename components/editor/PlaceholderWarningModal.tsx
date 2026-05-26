"use client"

import { useTranslations } from "next-intl"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { AlertTriangle, FileText, Pencil, Download } from "lucide-react"

interface Props {
  open: boolean
  count: number
  onReview: () => void
  onProceedAnyway: () => void
}

export default function PlaceholderWarningModal({ open, count, onReview, onProceedAnyway }: Props) {
  const t = useTranslations("editor.print.placeholder_modal")

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onReview() }}>
      <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-md border-0 shadow-[0_40px_100px_rgba(11,27,61,0.25),0_0_0_1px_rgba(245,158,11,0.25)] gap-0 w-full mx-4">

        {/* Ambient glow top */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.6) 30%, rgba(251,191,36,0.8) 50%, rgba(245,158,11,0.6) 70%, transparent)" }} />
        <div className="absolute top-0 right-0 w-48 h-32 pointer-events-none rounded-tr-2xl overflow-hidden" style={{ background: "radial-gradient(ellipse at 100% 0%, rgba(245,158,11,0.12) 0%, transparent 70%)" }} />

        {/* Header */}
        <div className="relative px-6 pt-6 pb-5" style={{ background: "linear-gradient(135deg, #0d1f3c 0%, #1a2e4a 60%, #0f2440 100%)" }}>
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 mt-0.5"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(251,191,36,0.1) 100%)",
                border: "1px solid rgba(245,158,11,0.35)",
                boxShadow: "0 0 20px rgba(245,158,11,0.15)",
              }}
            >
              <AlertTriangle size={20} className="text-amber-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h2
                className="text-[16px] font-bold text-white leading-snug tracking-[-0.02em]"
                style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
              >
                {t("title")}
              </h2>
              <p className="text-[12px] text-[rgba(255,255,255,0.55)] mt-1 leading-relaxed">
                {t("subtitle", { count })}
              </p>
            </div>
          </div>

          {/* Count badge */}
          <div className="mt-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <FileText size={13} className="text-amber-400 shrink-0" />
            <p className="text-[12px] text-amber-200 leading-relaxed">
              {t("found_label", { count })}
              <span className="ml-1.5 font-mono text-[11px] text-amber-300 opacity-80">[X%] · [N users] · [$Z] · [X years]</span>
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5" style={{ background: "linear-gradient(180deg, #f8faff 0%, #f0f6fc 100%)" }}>
          <p className="text-[13px] text-[#334155] leading-relaxed">
            {t("body")}
          </p>

          <div className="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
            <span className="text-amber-500 text-[13px] shrink-0 mt-px">💡</span>
            <p className="text-[11.5px] text-[#64748B] leading-relaxed">
              {t("tip")}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 px-6 pb-6 pt-1" style={{ background: "linear-gradient(180deg, #f0f6fc 0%, #eaf4fb 100%)" }}>
          {/* Primary: review */}
          <button
            type="button"
            onClick={onReview}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-bold text-white cursor-pointer transition-all duration-200 hover:-translate-y-px"
            style={{
              background: "linear-gradient(135deg, #1a2e4a 0%, #0d1f3c 100%)",
              boxShadow: "0 4px 16px rgba(11,27,61,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
            }}
          >
            <Pencil size={13} />
            {t("cta_review")}
          </button>

          {/* Secondary: download anyway */}
          <button
            type="button"
            onClick={onProceedAnyway}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[12.5px] font-medium text-[#64748B] cursor-pointer transition-all duration-200 hover:text-[#475569] hover:border-[rgba(100,116,139,0.3)]"
            style={{
              background: "rgba(100,116,139,0.06)",
              border: "1px solid rgba(100,116,139,0.18)",
            }}
          >
            <Download size={12} />
            {t("cta_anyway")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
