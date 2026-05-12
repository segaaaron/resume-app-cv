"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useTranslations, useLocale } from "next-intl"

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false)
  const locale = useLocale()
  const t = useTranslations("pricing")

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        toast.error(t("toast_payment_error"))
      }
    } catch {
      toast.error(t("toast_connection_error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="shrink-0 inline-flex items-center justify-center rounded-xl bg-primary text-white text-sm font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-60"
    >
      {loading ? "..." : t("pro_member_manage")}
    </button>
  )
}
