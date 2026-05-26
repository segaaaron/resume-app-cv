"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ArrowDown, Check, Wand2, Sparkles } from "lucide-react"

export interface BulletPair {
  original: string
  improved: string
}

interface Props {
  open: boolean
  onClose: () => void
  jobTitle: string
  pairs: BulletPair[]
  onApplyBullet: (index: number) => void
  onApplyAll: () => void
  /** Called when every bullet has been individually applied */
  onAllApplied?: () => void
}

export default function BulletsImprovementModal({
  open,
  onClose,
  jobTitle,
  pairs,
  onApplyBullet,
  onApplyAll,
  onAllApplied,
}: Props) {
  const t = useTranslations("editor.ai")
  const [applied, setApplied] = useState<Set<number>>(new Set())

  function handleApplyOne(i: number) {
    onApplyBullet(i)
    setApplied((prev) => {
      const next = new Set(prev).add(i)
      // QA-003: fire onAllApplied when last bullet is individually applied
      if (next.size === pairs.length) onAllApplied?.()
      return next
    })
  }

  function handleApplyAll() {
    onApplyAll()
    setApplied(new Set(pairs.map((_, i) => i)))
  }

  const allApplied = pairs.length > 0 && applied.size === pairs.length

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setApplied(new Set()); onClose() } }}>
      <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-[580px] w-[calc(100vw-2rem)] sm:w-[95vw] border border-[#D9E1ED] shadow-[0_40px_100px_rgba(0,212,255,0.08)] gap-0">

        {/* Header */}
        <div className="relative px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-[#E8EDF6] bg-gradient-to-b from-[#F5F7FB] to-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-60" />
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5"
              style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,168,204,0.04) 100%)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF" }}>
              <Wand2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-[#1a2e4a] tracking-tight leading-tight">
                {t("bullets_improved_title")}
              </h2>
              <p className="text-[11px] text-[#6B7A8C] mt-0.5 leading-snug">
                {jobTitle && <span className="font-medium text-[#1a2e4a]">{jobTitle} · </span>}
                {t("bullets_improved_subtitle", { count: pairs.length })}
              </p>
            </div>
          </div>
        </div>

        {/* Bullet pairs list */}
        <div className="overflow-y-auto max-h-[55vh] sm:max-h-[58vh] px-5 sm:px-7 py-4 space-y-4 bg-white">
          {pairs.map((pair, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{
                border: applied.has(i)
                  ? "1px solid rgba(16,185,129,0.35)"
                  : "1px solid #E2E8F0",
                background: applied.has(i) ? "rgba(16,185,129,0.03)" : "#fff",
              }}
            >
              {/* Bullet index badge */}
              <div className="flex items-center gap-2 px-3.5 pt-3 pb-2">
                <span
                  className="flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black shrink-0"
                  style={{
                    background: applied.has(i)
                      ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #1a2e4a 0%, #243d5c 100%)",
                    color: "#fff",
                  }}
                >
                  {applied.has(i) ? <Check className="w-2.5 h-2.5" /> : i + 1}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: applied.has(i) ? "#10B981" : "#94A3B8" }}>
                  {applied.has(i) ? t("bullet_applied") : t("bullet_label", { n: i + 1 })}
                </span>
              </div>

              <div className="px-3.5 pb-3.5 space-y-2">
                {/* Original */}
                {pair.original ? (
                  <div>
                    <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1">
                      {t("diff_before")}
                    </p>
                    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-[12px] text-[#6B7A8C] leading-relaxed whitespace-pre-wrap break-words">
                      {pair.original}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-[11px] italic text-[#94A3B8] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    {t("bullet_empty_original")}
                  </div>
                )}

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200">
                    <ArrowDown className="h-3 w-3 text-emerald-600" />
                  </div>
                </div>

                {/* Improved */}
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
                    {t("diff_after")}
                  </p>
                  <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 px-3 py-2.5 text-[12px] text-[#1a2e4a] leading-relaxed whitespace-pre-wrap break-words">
                    {pair.improved}
                  </div>
                </div>

                {/* Per-bullet apply button */}
                {!applied.has(i) && (
                  <button
                    type="button"
                    onClick={() => handleApplyOne(i)}
                    className="mt-1 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[11px] font-bold cursor-pointer transition-all duration-150 border-none min-h-[44px] sm:min-h-[36px]"
                    style={{
                      background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(16,185,129,0.25)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(16,185,129,0.4)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(16,185,129,0.25)" }}
                  >
                    <Check className="w-3 h-3" />
                    {t("bullet_apply_this")}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <span className="text-amber-400 shrink-0 text-[11px] mt-px">⚠</span>
            <p className="text-[10.5px] leading-relaxed" style={{ color: "rgba(180,120,0,0.9)" }}>
              {t("metrics_disclaimer")}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 sm:gap-2.5 px-5 sm:px-7 pt-3 pb-5 border-t border-[#E8EDF6] bg-white">
          <button
            type="button"
            onClick={() => { setApplied(new Set()); onClose() }}
            className="flex-1 flex justify-center items-center px-3 py-3 text-[13px] font-medium rounded-xl border border-[#E2E8F0] bg-white text-[#6B7A8C] cursor-pointer transition-all duration-150 hover:border-[#CBD5E1] hover:text-[#1a2e4a] min-h-[44px]"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleApplyAll}
            disabled={allApplied}
            className="flex-1 flex justify-center items-center gap-1.5 px-3 py-3 text-[13px] font-semibold text-white rounded-xl border-none cursor-pointer transition-all duration-150 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: allApplied
                ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                : "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
              color: allApplied ? "#fff" : "#0a1a35",
              boxShadow: allApplied ? "0 2px 8px rgba(16,185,129,0.3)" : "0 2px 8px rgba(0,212,255,0.25)",
            }}
          >
            {allApplied
              ? <><Check className="w-3.5 h-3.5" />{t("bullets_all_applied")}</>
              : t("bullets_apply_all")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
