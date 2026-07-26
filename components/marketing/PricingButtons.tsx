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
  /**
   * This card's checkout WOULD be rejected by the backend. The caller must pass the
   * value that matches THIS card's direction — `blocksNewPurchase(status, isOneTime)`:
   * recurring cards get the ACTIVE/PAST_DUE rule, one-time cards the stricter one that
   * also covers CANCELED.
   *
   * NOT the same as "has PRO access". Drives two states by direction: on the PRO card
   * it becomes "manage subscription"; on the one-time cards (a DOWNGRADE) it becomes
   * "available when your plan ends".
   */
  blocksPurchase?: boolean
  /** PRO access comes from the SUPER_ADMIN role — nothing to buy, nothing to manage. */
  isStaffAccess?: boolean
  /** Formatted date the current paid period ends, for the downgrade-blocked copy. */
  currentPlanEndsAt?: string | null
  /**
   * The subscription is already cancelled and just winding down. Decides the copy:
   * cancelled → `currentPlanEndsAt` IS a real end date ("available from X"); not
   * cancelled → it is the RENEWAL date, so the user must be told to cancel first.
   */
  alreadyCancelled?: boolean
  /**
   * Current plan was provisioned by PayPal. PayPal has no hosted billing portal, so
   * `/api/stripe/portal` would 400 for them — route the manage action to Settings,
   * where the provider-aware cancel lives (same rule as the Pro banner).
   */
  isPayPalPayer?: boolean
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

export default function PricingButtons({ plan, blocksPurchase = false, isStaffAccess = false, currentPlanEndsAt = null, alreadyCancelled = false, isPayPalPayer = false, theme = "light", buttonClassName, isEU = false, paypalAvailable = false }: Props) {
  const [loading, setLoading] = useState(false)
  const [consented, setConsented] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>("stripe")
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations("pricing")
  // One-time plans (BASIC/SPRINT) do NOT auto-renew → use accurate consent wording.
  const isOneTime = plan === "basic" || plan === "sprint"
  const consentKey = isOneTime ? "checkout_consent_onetime" : "checkout_consent"
  // Upgrades/switches keep the recurring card actionable (portal); moving DOWN to a
  // one-time plan has to wait for the paid period to end.
  const showPortal = blocksPurchase && !isOneTime
  const downgradeBlocked = blocksPurchase && isOneTime

  async function handleClick() {
    if (showPortal) {
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
        // Map the backend's machine codes to localized copy — they used to reach the
        // toast raw, showing English internals like "already_subscribed" to users.
        const KNOWN_ERRORS: Record<string, string> = {
          already_subscribed: t("toast_already_subscribed"),
          eu_consent_required: t("toast_consent_required"),
        }
        const code = typeof data.error === "string" ? data.error : ""
        toast.error(KNOWN_ERRORS[code] ?? t("toast_payment_error"))
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

  // Staff already have full access through their role: buying is pointless and
  // the billing portal has no customer to open.
  if (isStaffAccess) {
    return (
      <Button size="lg" className="w-full" disabled>
        {t("staff_access")}
      </Button>
    )
  }

  // Moving DOWN to a one-time plan while any subscription still exists is refused by
  // the backend: provisioning one clears `subscriptionId`, so a still-ACTIVE sub would
  // keep charging unlinked, and an already-CANCELED one would later fire
  // `subscription.deleted` and wipe the one-time window the user just paid for.
  //
  // Two different truths, so two different messages:
  //   · already cancelled → `currentPlanEndsAt` is a real END date → "available from X"
  //   · still active      → it is the RENEWAL date → they must cancel first, and saying
  //                         "you can switch on X" would be false (it renews that day)
  if (downgradeBlocked) {
    const note = alreadyCancelled
      ? currentPlanEndsAt
        ? t("plan_change_available_on", { date: currentPlanEndsAt })
        : t("plan_change_when_current_ends")
      : currentPlanEndsAt
        ? t("plan_change_cancel_first_on", { date: currentPlanEndsAt })
        : t("plan_change_cancel_first")

    return (
      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full" disabled>
          {t("plan_change_when_current_ends")}
        </Button>
        <p className="text-center text-[11px] leading-[1.5] opacity-75">{note}</p>
      </div>
    )
  }

  if (showPortal) {
    // PayPal has no hosted portal — Settings holds the provider-aware cancel.
    if (isPayPalPayer) {
      return (
        <Button size="lg" className="w-full" asChild>
          <a href={`/${locale}/dashboard/settings`}>{t("pro_member_manage")}</a>
        </Button>
      )
    }
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
