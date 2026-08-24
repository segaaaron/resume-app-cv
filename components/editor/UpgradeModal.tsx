"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Check, Crown, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track } from "@/lib/analytics/track"
import PendingScreen from "@/components/shared/PendingScreen"

interface Props {
  open: boolean
  onClose: () => void
}

export default function UpgradeModal({ open, onClose }: Props) {
  const t = useTranslations("editor.upgrade")
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null)
  /** Se enciende al empezar a irse y no se apaga: la navegación desmonta esto. */
  const [leaving, setLeaving] = useState(false)
  const router = useRouter()
  const locale = useLocale()

  const features = [
    t("feature_1"),
    t("feature_2"),
    t("feature_3"),
    t("feature_4"),
    t("feature_5"),
    t("feature_6"),
  ]

  async function handleCheckout(plan: "monthly" | "annual") {
    setLoading(plan)
    const cycle = plan === "annual" ? "annual" : "monthly"
    track("upgrade_cta_clicked", { from_feature: "editor" })
    try {
      const res = await apiFetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (res.status === 401) {
        setLeaving(true)
        router.push(`/${locale}/login?plan=${plan}`)
        return
      }

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? t("toast_payment_error"))
        return
      }

      if (data.url) {
        track("checkout_started", { plan: "PRO", billing_cycle: cycle, provider: "stripe" })
        setLeaving(true)
        window.location.href = data.url
      }
    } catch {
      toast.error(t("toast_connection_error"))
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <PendingScreen show={leaving} />
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-md border border-[#D9E1ED] shadow-[0_40px_100px_rgba(0,212,255,0.10)] gap-0">
        {/* Head — premium gradient */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-[#1a2e4a] via-[#1e3a5f] to-[#0f2040] text-white overflow-hidden">
          {/* Glow orb */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#00D4FF] opacity-10 blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-40" />

          <div className="flex items-center justify-center w-12 h-12 rounded-2xl mb-4 relative bg-[rgba(0,212,255,0.18)] border-[1.5px] border-[rgba(0,212,255,0.35)]">
            <Crown className="h-6 w-6 text-[#00D4FF]" />
          </div>
          <h2
            className="text-[24px] font-bold mb-1 tracking-[-0.03em]"
            style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
          >
            {t("title")}
          </h2>
          <p className="text-[13px] text-[rgba(255,255,255,0.65)]">{t("subtitle")}</p>
        </div>

        {/* Features + pricing */}
        <div className="px-8 py-6 bg-white">
          <ul className="space-y-2 mb-6">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[13px] text-[#1a2e4a]">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] shrink-0">
                  <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-[#E2E8F0] bg-gradient-to-br from-[#F5F7FB] to-white px-4 py-3 mb-5">
            <div className="flex items-baseline gap-1">
              <span className="text-[32px] font-bold text-[#1a2e4a] tracking-[-0.03em]">$15</span>
              <span className="text-[#6B7A8C] text-[13px]">{t("monthly_per")}</span>
            </div>
            <p className="text-[11.5px] text-[#94A3B8] mt-0.5">{t("annual_detail")}</p>
          </div>

          <button
            type="button"
            onClick={() => handleCheckout("monthly")}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 py-[13px] text-[14px] font-semibold text-white rounded-xl border-none cursor-pointer bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] shadow-[0_4px_16px_rgba(0,212,255,0.3)] transition-all duration-150 hover:shadow-[0_6px_20px_rgba(0,212,255,0.4)] hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading === "monthly" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t("redirecting")}</>
            ) : t("start_now")}
          </button>

          <button
            type="button"
            onClick={() => handleCheckout("annual")}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 mt-2 py-[13px] text-[13px] font-medium text-[#1a2e4a] rounded-xl border border-[#E2E8F0] bg-white cursor-pointer transition-all duration-150 hover:border-[#00D4FF] hover:text-[#00A8CC] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading === "annual" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t("redirecting")}</>
            ) : t("best_price")}
          </button>

          <p className="text-center text-[11.5px] text-[#94A3B8] mt-4">
            {t("footer_note")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
