"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Check, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface Props {
  open: boolean
  onClose: () => void
}

export default function UpgradeModal({ open, onClose }: Props) {
  const t = useTranslations("editor.upgrade")
  const [loading, setLoading] = useState<"monthly" | "annual" | null>(null)
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
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (res.status === 401) {
        router.push(`/${locale}/register?plan=${plan}`)
        return
      }

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? t("toast_payment_error"))
        return
      }

      if (data.url) window.location.href = data.url
    } catch {
      toast.error(t("toast_connection_error"))
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-br from-primary to-[#1D4ED8] px-8 py-8 text-white">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">{t("title")}</h2>
          <p className="text-blue-100 text-sm">{t("subtitle")}</p>
        </div>

        <div className="px-8 py-6">
          <ul className="space-y-2 mb-6">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 shrink-0 text-primary" /> {f}
              </li>
            ))}
          </ul>

          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold text-foreground mb-1">$15</span>
            <span className="text-muted-foreground text-sm">{t("monthly_per")}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">{t("annual_detail")}</p>

          <Button
            className="w-full shadow-brand-md"
            size="lg"
            onClick={() => handleCheckout("monthly")}
            disabled={!!loading}
          >
            {loading === "monthly" ? t("redirecting") : t("start_now")}
          </Button>

          <Button
            variant="outline"
            className="w-full mt-2"
            size="lg"
            onClick={() => handleCheckout("annual")}
            disabled={!!loading}
          >
            {loading === "annual" ? t("redirecting") : t("best_price")}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {t("footer_note")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
