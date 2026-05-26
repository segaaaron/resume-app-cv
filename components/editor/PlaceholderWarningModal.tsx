"use client"

import { useTranslations } from "next-intl"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { AlertTriangle, Pencil, Download, Lightbulb } from "lucide-react"

interface Props {
  open: boolean
  count: number
  onReview: () => void
  onProceedAnyway: () => void
}

const EXAMPLE_CHIPS = ["[X%]", "[N users]", "[$Z]", "[X years]"]

export default function PlaceholderWarningModal({ open, count, onReview, onProceedAnyway }: Props) {
  const t = useTranslations("editor.print.placeholder_modal")

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onReview() }}>
      <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-md border-0 gap-0 w-full mx-4"
        style={{ boxShadow: "0 40px 100px rgba(11,27,61,0.28), 0 0 0 1px rgba(245,158,11,0.22)" }}>

        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none z-10"
          style={{ background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.7) 30%, rgba(245,158,11,0.9) 50%, rgba(251,191,36,0.7) 70%, transparent)" }} />
        <div className="absolute top-0 right-0 w-52 h-36 pointer-events-none rounded-tr-2xl overflow-hidden"
          style={{ background: "radial-gradient(ellipse at 100% 0%, rgba(245,158,11,0.14) 0%, transparent 68%)" }} />

        {/* Header */}
        <div className="relative px-6 pt-6 pb-5"
          style={{ background: "linear-gradient(135deg, #0c1e3b 0%, #1a2e4a 55%, #0f2440 100%)" }}>

          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 mt-0.5"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(251,191,36,0.10) 100%)",
                border: "1px solid rgba(245,158,11,0.38)",
                boxShadow: "0 0 22px rgba(245,158,11,0.18)",
              }}>
              <AlertTriangle size={20} className="text-amber-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-bold text-white leading-snug tracking-[-0.02em]"
                style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}>
                {t("title")}
              </h2>
              <p className="text-[12px] text-[rgba(255,255,255,0.52)] mt-1 leading-relaxed">
                {t("subtitle", { count })}
              </p>
            </div>
          </div>

          {/* Count + example chips */}
          <div className="mt-4 px-3.5 py-3 rounded-xl"
            style={{ background: "rgba(245,158,11,0.09)", border: "1px solid rgba(245,158,11,0.18)" }}>
            <p className="text-[11.5px] text-amber-200 font-medium mb-2">
              {t("found_label", { count })}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_CHIPS.map((chip) => (
                <span key={chip}
                  className="font-mono text-[10.5px] text-amber-300 px-2 py-0.5 rounded-md"
                  style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5" style={{ background: "linear-gradient(180deg, #f8faff 0%, #f0f6fc 100%)" }}>
          <p className="text-[13px] text-[#334155] leading-relaxed">
            {t("body")}
          </p>

          <div className="mt-3 flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.14)" }}>
            <Lightbulb size={13} className="text-amber-500 shrink-0 mt-px" />
            <p className="text-[11.5px] text-[#64748B] leading-relaxed">
              {t("tip")}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 px-6 pb-6 pt-1"
          style={{ background: "linear-gradient(180deg, #f0f6fc 0%, #eaf4fb 100%)" }}>
          <button
            type="button"
            onClick={onReview}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-bold text-white whitespace-nowrap cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:brightness-95"
            style={{
              background: "linear-gradient(135deg, #00C4EE 0%, #0099CC 60%, #007BB5 100%)",
              boxShadow: "0 4px 18px rgba(0,196,238,0.38), inset 0 1px 0 rgba(255,255,255,0.18)",
              border: "1px solid rgba(0,212,255,0.4)",
            }}>
            <Pencil size={13} />
            {t("cta_review")}
          </button>

          <button
            type="button"
            onClick={onProceedAnyway}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[12.5px] font-medium text-[#64748B] cursor-pointer transition-all duration-200 hover:text-[#475569] hover:bg-[rgba(100,116,139,0.1)]"
            style={{
              background: "rgba(100,116,139,0.06)",
              border: "1px solid rgba(100,116,139,0.18)",
            }}>
            <Download size={12} />
            {t("cta_anyway")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
