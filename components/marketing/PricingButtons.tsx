"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useTranslations, useLocale } from "next-intl"

interface Props {
  plan: "monthly" | "annual" | "basic" | "sprint"
  isPro?: boolean
  theme?: "light" | "dark"
  buttonClassName?: string
  isEU?: boolean
}

export default function PricingButtons({ plan, isPro, theme = "light", buttonClassName, isEU = false }: Props) {
  const [loading, setLoading] = useState(false)
  const [consented, setConsented] = useState(false)
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations("pricing")

  async function handleClick() {
    if (isPro) {
      setLoading(true)
      try {
        const res = await apiFetch("/api/stripe/portal", {
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
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          locale,
          consent:     isEU && consented ? true : undefined,
          consentText: isEU && consented ? t("checkout_consent") : undefined,
        }),
      })

      if (res.status === 401) {
        router.push(`/register?plan=${plan}`)
        return
      }

      if (res.status === 503) {
        router.push(`/register?plan=${plan}`)
        return
      }

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? t("toast_payment_error"))
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error(t("toast_connection_error"))
    } finally {
      setLoading(false)
    }
  }

  if (isPro) {
    return (
      <Button size="lg" className="w-full" onClick={handleClick} disabled={loading}>
        {loading ? t("btn_loading") : t("pro_member_manage")}
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {isEU && (
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-0.5 shrink-0 accent-current w-3.5 h-3.5"
          />
          <span className={`text-[11px] leading-[1.5] ${theme === "dark" ? "text-white/60" : "opacity-75"}`}>
            {t("checkout_consent")}
          </span>
        </label>
      )}
      <Button size="lg" className={`w-full ${buttonClassName ?? ""}`} onClick={handleClick} disabled={loading || (isEU && !consented)}>
        {loading ? t("btn_loading") : t("btn_start")}
      </Button>
    </div>
  )
}
