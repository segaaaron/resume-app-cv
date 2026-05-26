"use client"

import { useTranslations } from "next-intl"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Check, Zap, TrendingUp, Code2, Star } from "lucide-react"

export interface SummaryVersion {
  type: "executive" | "specialist" | "value_prop"
  text: string
}

interface Props {
  open: boolean
  versions: SummaryVersion[]
  onClose: () => void
  onSelect: (text: string) => void
}

const TYPE_CONFIG = {
  executive: {
    icon: TrendingUp,
    badgeGradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    badgeTextColor: "#0a1a35",
    accentColor: "#D97706",
    glowColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.25)",
    cardBg: "rgba(245,158,11,0.04)",
  },
  specialist: {
    icon: Code2,
    badgeGradient: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
    badgeTextColor: "#0a1a35",
    accentColor: "#0891B2",
    glowColor: "rgba(0,212,255,0.10)",
    borderColor: "rgba(0,212,255,0.25)",
    cardBg: "rgba(0,212,255,0.03)",
  },
  value_prop: {
    icon: Star,
    badgeGradient: "linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)",
    badgeTextColor: "#fff",
    accentColor: "#7C3AED",
    glowColor: "rgba(168,85,247,0.10)",
    borderColor: "rgba(168,85,247,0.25)",
    cardBg: "rgba(168,85,247,0.03)",
  },
}

export default function SummaryVersionModal({ open, versions, onClose, onSelect }: Props) {
  const t = useTranslations("editor.ai")

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-[580px] w-[calc(100vw-2rem)] sm:w-[95vw] border border-[#D9E1ED] shadow-[0_40px_100px_rgba(0,212,255,0.08)] gap-0">

        {/* Header */}
        <div className="relative px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-[#E8EDF6] bg-gradient-to-b from-[#F5F7FB] to-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-60" />
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5"
              style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,168,204,0.04) 100%)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF" }}>
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-[#1a2e4a] tracking-tight leading-tight">
                {t("version_modal_title")}
              </h2>
              <p className="text-[11px] text-[#6B7A8C] mt-0.5 leading-snug">
                {t("version_modal_subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Version cards */}
        <div className="overflow-y-auto max-h-[60vh] sm:max-h-[64vh] px-5 sm:px-7 py-4 space-y-3 bg-white">
          {versions.map((version) => {
            const cfg = TYPE_CONFIG[version.type]
            const Icon = cfg.icon
            return (
              <div
                key={version.type}
                className="rounded-2xl overflow-hidden"
                style={{ background: cfg.cardBg, border: `1px solid ${cfg.borderColor}` }}
              >
                {/* Type badge row */}
                <div className="flex items-center gap-2.5 px-4 pt-4 pb-2.5">
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-xl shrink-0"
                    style={{ background: cfg.badgeGradient }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: cfg.badgeTextColor }} />
                  </div>
                  <div>
                    <span
                      className="text-[11px] font-black tracking-widest uppercase block"
                      style={{ color: cfg.accentColor }}
                    >
                      {t(`version_type_${version.type}`)}
                    </span>
                    <span className="text-[10px] leading-tight" style={{ color: "#94A3B8" }}>
                      {t(`version_desc_${version.type}`)}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-4 h-px" style={{ background: cfg.borderColor }} />

                {/* Content */}
                <div className="px-4 pt-3 pb-4">
                  <p className="text-[12.5px] leading-relaxed text-[#1a2e4a] mb-3.5 whitespace-pre-wrap">
                    {version.text}
                  </p>
                  <button
                    type="button"
                    onClick={() => { onSelect(version.text); onClose() }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[11px] font-bold cursor-pointer transition-all duration-150 border-none min-h-[44px] sm:min-h-[38px]"
                    style={{
                      background: cfg.badgeGradient,
                      color: cfg.badgeTextColor,
                      boxShadow: `0 2px 10px ${cfg.glowColor}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88" }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
                  >
                    <Check className="w-3 h-3" />
                    {t("use_version")}
                  </button>
                </div>
              </div>
            )
          })}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 px-3.5 py-3 rounded-xl"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <span className="text-amber-500 shrink-0 text-[12px] mt-px">⚠</span>
            <p className="text-[10.5px] leading-relaxed" style={{ color: "rgba(180,120,0,0.9)" }}>
              {t("metrics_disclaimer")}
            </p>
          </div>
        </div>

        {/* Footer close */}
        <div className="px-5 sm:px-7 pt-3 pb-5 border-t border-[#E8EDF6] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex justify-center items-center px-3 py-3 text-[13px] font-medium rounded-xl border border-[#E2E8F0] bg-white text-[#6B7A8C] cursor-pointer transition-all duration-150 hover:border-[#CBD5E1] hover:text-[#1a2e4a] min-h-[44px]"
          >
            {t("cancel")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
