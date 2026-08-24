"use client"

import { useState } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track } from "@/lib/analytics/track"
import { useTranslations, useLocale } from "next-intl"
import PendingScreen from "@/components/shared/PendingScreen"

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false)
  /** Se enciende al empezar a irse y no se apaga: la navegación desmonta esto. */
  const [leaving, setLeaving] = useState(false)
  const locale = useLocale()
  const t = useTranslations("pricing")

  async function handleClick() {
    setLoading(true)
    try {
      const res = await apiFetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        track("billing_portal_opened", { provider: "stripe" })
        setLeaving(true)
        window.location.href = data.url
      } else {
        // The banner only renders this button when a Stripe customer exists, so a
        // 400 here means the row changed under us. Name the real cause instead of
        // "Error starting the payment", which describes a checkout that never ran.
        toast.error(data.error === "no_active_subscription" ? t("toast_no_billing_to_manage") : t("toast_payment_error"))
      }
    } catch {
      toast.error(t("toast_connection_error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PendingScreen show={leaving} />
      <button
      onClick={handleClick}
      disabled={loading}
      className="shrink-0 inline-flex items-center justify-center rounded-xl bg-primary text-white text-sm font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-60"
    >
      {loading ? "..." : t("pro_member_manage")}
      </button>
    </>
  )
}
