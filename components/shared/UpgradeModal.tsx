"use client"

/**
 * Shared, trigger-aware Upgrade Modal for the freemium funnel.
 *
 * Distinct from the editor-internal `components/editor/UpgradeModal.tsx` which
 * handles the in-editor pricing flow with Stripe checkout. This shared modal is
 * driven by trigger (download, ai-quota, second-resume, etc.) and is rendered
 * once globally through `UpgradeModalProvider`. Any descendant can open it via
 * `useUpgradeModal()`.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { motion, AnimatePresence } from "framer-motion"
import {
  Crown,
  Download,
  Sparkles,
  FileText,
  Mail,
  Stamp,
  X,
  ArrowRight,
} from "lucide-react"
import { Z_UPGRADE_DIALOG } from "@/lib/ui/z-layers"
import PendingScreen from "@/components/shared/PendingScreen"

export type UpgradeTrigger =
  | "download"
  | "ai-quota"
  | "second-resume"
  | "second-cover-letter"
  | "pro-feature"
  | "watermark-remove"

export type UpgradeModalContext = {
  endpoint?: string
  feature?: string
}

export interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  trigger: UpgradeTrigger
  context?: UpgradeModalContext
}

const ICONS: Record<UpgradeTrigger, React.ComponentType<{ className?: string }>> = {
  download: Download,
  "ai-quota": Sparkles,
  "second-resume": FileText,
  "second-cover-letter": Mail,
  "pro-feature": Crown,
  "watermark-remove": Stamp,
}

const I18N_KEYS: Record<UpgradeTrigger, string> = {
  download: "download",
  "ai-quota": "aiQuota",
  "second-resume": "secondResume",
  "second-cover-letter": "secondCoverLetter",
  "pro-feature": "proFeature",
  "watermark-remove": "watermarkRemove",
}

export default function UpgradeModal({
  isOpen,
  onClose,
  trigger,
  context,
}: UpgradeModalProps) {
  const t = useTranslations("upgradeModal")
  const locale = useLocale()
  const router = useRouter()
  const Icon = ICONS[trigger]
  const ns = I18N_KEYS[trigger]

  // Lock body scroll while modal is open.
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // Close on Escape — standard a11y for dialog overlays.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  const title =
    trigger === "pro-feature" && context?.feature
      ? t("proFeature.title", { feature: context.feature })
      : trigger === "pro-feature"
        ? t("proFeature.titleGeneric")
        : t(`${ns}.title`)

  const body =
    trigger === "ai-quota" && context?.endpoint
      ? t("aiQuota.bodyWithEndpoint", { endpoint: context.endpoint })
      : t(`${ns}.body`)

  const ctaLabel = t(`${ns}.cta`)

  /** Se enciende al empezar a irse y no se apaga: la navegación desmonta esto. */
  const [leaving, setLeaving] = useState(false)

  function handleUpgrade() {
    onClose()
    setLeaving(true)
    router.push(`/${locale}/pricing`)
  }

  return (
    <>
      <PendingScreen show={leaving} />
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={{ zIndex: Z_UPGRADE_DIALOG }}
          className="fixed inset-0 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
        >
          {/* Backdrop with blur */}
          <button
            type="button"
            aria-label={t("closeAria")}
            onClick={onClose}
            className="absolute inset-0 bg-[#0B1B3D]/60 backdrop-blur-md cursor-default"
          />

          {/* Card */}
          <motion.div
            className="relative w-full max-w-[440px] rounded-2xl overflow-hidden border border-[rgba(0,212,255,0.25)] shadow-[0_40px_120px_rgba(0,212,255,0.18),0_0_0_1px_rgba(0,212,255,0.08)]"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background:
                "linear-gradient(160deg, #1a2e4a 0%, #14253c 45%, #0f1a2e 100%)",
            }}
          >
            {/* Glow accents */}
            <div
              aria-hidden
              className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,212,255,0.35) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            <div
              aria-hidden
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #00D4FF 50%, transparent)",
                opacity: 0.55,
              }}
            />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label={t("closeAria")}
              className="absolute top-3 right-3 z-10 flex items-center justify-center w-9 h-9 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div className="relative px-7 pt-8 pb-7 text-white">
              {/* Icon */}
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl mb-5 border border-[rgba(0,212,255,0.4)] shadow-[0_8px_24px_rgba(0,212,255,0.25)]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,212,255,0.22) 0%, rgba(0,168,204,0.12) 100%)",
                }}
              >
                <Icon className="h-6 w-6 text-[#00D4FF]" />
              </div>

              {/* Title */}
              <h2
                id="upgrade-modal-title"
                className="text-[24px] leading-[1.15] font-bold tracking-[-0.03em] mb-2"
                style={{
                  fontFamily:
                    "var(--dash-serif, 'Playfair Display', Georgia, serif)",
                }}
              >
                {title}
              </h2>

              {/* Body */}
              <p className="text-[13.5px] leading-[1.55] text-white/70 mb-6">
                {body}
              </p>

              {/* Pricing card */}
              <div
                className="rounded-xl border border-[rgba(0,212,255,0.22)] p-4 mb-5 relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                }}
              >
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.1em] text-[#00D4FF]/80 font-bold mb-1">
                      PRO
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[26px] font-bold tracking-[-0.02em] text-white leading-none">
                        {t("pricing.monthly")}
                      </span>
                    </div>
                    <div className="text-[12px] text-white/55 mt-1.5">
                      {t("pricing.yearly")} · {t("pricing.yearlyHint")}
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full text-[#0B1B3D]"
                    style={{
                      background:
                        "linear-gradient(135deg, #00E5FF 0%, #00A8CC 100%)",
                    }}
                  >
                    {t("pricing.discount")}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleUpgrade}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[14px] text-[#0a1a35] cursor-pointer transition-all duration-200 hover:-translate-y-px shadow-[0_8px_24px_rgba(0,212,255,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]"
                style={{
                  background:
                    "linear-gradient(135deg, #00E5FF 0%, #00A8CC 100%)",
                }}
              >
                {ctaLabel}
                <ArrowRight size={15} />
              </button>

              {/* Secondary */}
              <button
                type="button"
                onClick={onClose}
                className="w-full mt-2.5 py-2.5 rounded-xl text-[12.5px] font-medium text-white/65 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                {t("maybeLater")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
