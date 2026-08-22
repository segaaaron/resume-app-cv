"use client"

import { useTranslations } from "next-intl"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Z_MODAL_FOLLOW_UP } from "@/lib/ui/z-layers"
import { Check, Zap, TrendingUp, Code2, Star, Landmark, Scale, Rocket, ShieldCheck } from "lucide-react"

/**
 * The three summary positionings, and the three cover-letter tones.
 *
 * One modal serves both: improve-cover-letter returns three versions exactly
 * like improve-summary does, and everything here except the badge and its two
 * labels is identical. Adding the tones is additive — the summary types and
 * their config are untouched.
 */
export type VersionType =
  | "executive" | "specialist" | "value_prop"
  | "formal" | "balanced" | "dynamic"

export interface SummaryVersion {
  type: VersionType
  text: string
}

interface Props {
  open: boolean
  versions: SummaryVersion[]
  onClose: () => void
  onSelect: (text: string) => void
  /**
   * When the AI finds nothing worth changing (status "already_optimized"), the
   * caller opens the modal with zero versions and this copy instead of firing a
   * fleeting toast — the "you can't improve this" answer gets the same modal
   * surface as the "here are 3 improvements" answer.
   */
  emptyState?: { title: string; description: string } | null
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
  // Cover letter tones — same three-card layout, letter's own vocabulary.
  formal: {
    icon: Landmark,
    badgeGradient: "linear-gradient(135deg, #1a2e4a 0%, #0f1d30 100%)",
    badgeTextColor: "#fff",
    accentColor: "#1a2e4a",
    glowColor: "rgba(26,46,74,0.12)",
    borderColor: "rgba(26,46,74,0.20)",
    cardBg: "rgba(26,46,74,0.03)",
  },
  balanced: {
    icon: Scale,
    badgeGradient: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
    badgeTextColor: "#0a1a35",
    accentColor: "#0891B2",
    glowColor: "rgba(0,212,255,0.10)",
    borderColor: "rgba(0,212,255,0.25)",
    cardBg: "rgba(0,212,255,0.03)",
  },
  dynamic: {
    icon: Rocket,
    badgeGradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    badgeTextColor: "#0a1a35",
    accentColor: "#D97706",
    glowColor: "rgba(245,158,11,0.12)",
    borderColor: "rgba(245,158,11,0.25)",
    cardBg: "rgba(245,158,11,0.04)",
  },
} as const satisfies Record<VersionType, unknown>

export default function SummaryVersionModal({ open, versions, onClose, onSelect, emptyState }: Props) {
  const t = useTranslations("editor.ai")

  // "Already optimized" surface: no versions to choose, a calm reassurance
  // instead of the three-card picker. Same modal, same close affordance.
  const showEmpty = versions.length === 0 && !!emptyState

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      {/* El panel ATS lo abre desde su modal a pantalla completa: sin la capa
          explícita, las versiones del resumen salían detrás. Mismo defecto que
          la confirmación de la viñeta, encontrado barriendo en vez de esperando
          la siguiente captura. */}
      <DialogContent layer={Z_MODAL_FOLLOW_UP} className="p-0 overflow-hidden rounded-2xl max-w-[580px] w-[calc(100vw-2rem)] sm:w-[95vw] border border-[#D9E1ED] shadow-[0_40px_100px_rgba(0,212,255,0.08)] gap-0">

        {/* Header */}
        <div className="relative px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-[#E8EDF6] bg-gradient-to-b from-[#F5F7FB] to-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-60" />
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 mt-0.5"
              style={showEmpty
                ? { background: "linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(13,148,136,0.05) 100%)", border: "1px solid rgba(16,185,129,0.30)", color: "#10B981" }
                : { background: "linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(0,168,204,0.04) 100%)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF" }}>
              {showEmpty ? <ShieldCheck className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-[#1a2e4a] tracking-tight leading-tight">
                {showEmpty ? emptyState!.title : t("version_modal_title")}
              </h2>
              <p className="text-[11px] text-[#6B7A8C] mt-0.5 leading-snug">
                {showEmpty ? emptyState!.description : t("version_modal_subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[60vh] sm:max-h-[64vh] px-5 sm:px-7 py-4 space-y-3 bg-white">
          {showEmpty && (
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25">
                <Check className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-[13px] font-semibold text-[#1a2e4a] leading-snug max-w-[360px]">
                {emptyState!.title}
              </p>
              <p className="text-[11.5px] text-[#6B7A8C] leading-relaxed max-w-[380px]">
                {emptyState!.description}
              </p>
            </div>
          )}
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

          {/* No placeholder disclaimer: these versions no longer contain [X%]
              brackets, so asking the user to go replace them would be asking
              them to fix a problem we stopped creating. */}
        </div>

        {/* Footer close */}
        <div className="px-5 sm:px-7 pt-3 pb-5 border-t border-[#E8EDF6] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full flex justify-center items-center px-3 py-3 text-[13px] font-medium rounded-xl border border-[#E2E8F0] bg-white text-[#6B7A8C] cursor-pointer transition-all duration-150 hover:border-[#CBD5E1] hover:text-[#1a2e4a] min-h-[44px]"
          >
            {showEmpty ? t("got_it") : t("cancel")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
