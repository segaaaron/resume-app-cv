"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useTranslations, useLocale } from "next-intl"
import { AlertTriangle, X, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track } from "@/lib/analytics/track"
import PendingScreen from "@/components/shared/PendingScreen"

export default function PastDueBanner() {
  const t = useTranslations("dashboard.past_due_banner")
  const locale = useLocale()
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)
  /** Se enciende al empezar a irse y no se apaga: la navegación desmonta esto. */
  const [leaving, setLeaving] = useState(false)

  if (dismissed) return null
  if (session?.user?.plan === "LIMITED") return null

  async function openPortal() {
    setLoading(true)
    track("past_due_recover_clicked")
    try {
      const res = await apiFetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(t("error"))
        return
      }
      if (data.url) {
        track("billing_portal_opened", { provider: "stripe" })
        setLeaving(true)
        window.location.href = data.url
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 mx-4 mt-4 text-sm">
      <PendingScreen show={loading || leaving} />
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{t("title")}</p>
        <p className="text-amber-800 mt-0.5">{t("description")}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={openPortal}
          disabled={loading}
          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
        >
          <ExternalLink className="h-3 w-3" />
          {t("cta")}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 transition-colors"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
