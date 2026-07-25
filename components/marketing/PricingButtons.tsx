"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useTranslations, useLocale } from "next-intl"
import PaymentMethodSelector, { type PaymentMethod } from "@/components/marketing/PaymentMethodSelector"

interface Props {
  plan: "monthly" | "annual" | "basic" | "sprint"
  isPro?: boolean
  theme?: "light" | "dark"
  buttonClassName?: string
  isEU?: boolean
  /**
   * Whether the PayPal gateway is configured server-side (`paypalEnabled()`).
   * Defaults to FALSE, so the method selector stays hidden and checkout goes to
   * Stripe exactly as before until PayPal is credentialed and sandbox-tested.
   */
  paypalAvailable?: boolean
}

export default function PricingButtons({ plan, isPro, theme = "light", buttonClassName, isEU = false, paypalAvailable = false }: Props) {
  const [loading, setLoading] = useState(false)
  const [consented, setConsented] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>("stripe")
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations("pricing")
  // One-time plans (BASIC/SPRINT) do NOT auto-renew → use accurate consent wording.
  const isOneTime = plan === "basic" || plan === "sprint"
  const consentKey = isOneTime ? "checkout_consent_onetime" : "checkout_consent"

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
      // PayPal only when the selector is actually available AND chosen; otherwise
      // this is byte-for-byte the previous Stripe-only path.
      const usePayPal = paypalAvailable && method === "paypal"
      const res = await apiFetch(usePayPal ? "/api/paypal/checkout" : "/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          usePayPal
            ? { plan, locale }
            : {
                plan,
                locale,
                consent:     isEU && consented ? true : undefined,
                consentText: isEU && consented ? t(consentKey) : undefined,
              },
        ),
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
      {/* Absent entirely unless the gateway is configured server-side. */}
      {paypalAvailable && (
        <PaymentMethodSelector
          value={method}
          onChange={setMethod}
          theme={theme}
          disabled={loading}
          labels={{ card: t("method_card"), paypal: t("method_paypal"), legend: t("method_legend") }}
        />
      )}
      {isEU && (
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-0.5 shrink-0 accent-current w-3.5 h-3.5"
          />
          <span className={`text-[11px] leading-[1.5] ${theme === "dark" ? "text-white/60" : "opacity-75"}`}>
            {t(consentKey)}
          </span>
        </label>
      )}
      <Button size="lg" className={`w-full ${buttonClassName ?? ""}`} onClick={handleClick} disabled={loading || (isEU && !consented)}>
        {loading ? t("btn_loading") : t("btn_start")}
      </Button>
    </div>
  )
}
