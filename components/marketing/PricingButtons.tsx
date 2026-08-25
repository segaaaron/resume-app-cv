"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { track } from "@/lib/analytics/track"
import type { BillingCycle } from "@/lib/analytics/events"
import { useTranslations, useLocale } from "next-intl"
import PaymentMethodSelector, { type PaymentMethod } from "@/components/marketing/PaymentMethodSelector"
import PendingScreen from "@/components/shared/PendingScreen"

// Maps a pricing card to its analytics plan name + billing cycle (low cardinality).
const PLAN_META: Record<"monthly" | "annual" | "basic" | "sprint", { name: string; cycle: BillingCycle }> = {
  monthly: { name: "PRO", cycle: "monthly" },
  annual: { name: "PRO", cycle: "annual" },
  basic: { name: "BASIC", cycle: "one_time" },
  sprint: { name: "SPRINT", cycle: "one_time" },
}

interface Props {
  plan: "monthly" | "annual" | "basic" | "sprint"
  /**
   * This card's checkout WOULD be rejected by the backend. The caller must pass the
   * value that matches THIS card's direction — `blocksNewPurchase(status, isOneTime)`:
   * recurring cards get the ACTIVE/PAST_DUE rule, one-time cards the stricter one that
   * also covers CANCELED.
   *
   * NOT the same as "has PRO access". When true the card stops offering a purchase
   * and explains when it becomes possible — no request is made either way, because
   * the backend would refuse it.
   */
  blocksPurchase?: boolean
  /**
   * PRO access from the SUPER_ADMIN role with no gateway behind it — nothing to buy,
   * nothing to manage. Resolved server-side by `isStaffAccess(role, status, realBilling)`.
   */
  isStaffAccess?: boolean
  /**
   * The row has PRO access and a purchase-blocking status, but no gateway behind it
   * (no Stripe customer, not a PayPal payer) — typically granted outside checkout.
   * There is nothing to cancel and nothing to buy, so "cancel first to switch" is
   * unfollowable; only support can fix the row.
   */
  billingNeedsSupport?: boolean
  /** Formatted date the current paid period ends, for the downgrade-blocked copy. */
  currentPlanEndsAt?: string | null
  /**
   * The subscription is already cancelled and just winding down. Decides the copy:
   * cancelled → `currentPlanEndsAt` IS a real end date ("available from X"); not
   * cancelled → it is the RENEWAL date, so the user must be told to cancel first.
   */
  alreadyCancelled?: boolean
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

export default function PricingButtons({ plan, blocksPurchase = false, isStaffAccess = false, billingNeedsSupport = false, currentPlanEndsAt = null, alreadyCancelled = false, theme = "light", buttonClassName, isEU = false, paypalAvailable = false }: Props) {
  const [loading, setLoading] = useState(false)
  /** Se enciende al empezar a irse y no se apaga: la navegación desmonta esto. */
  const [leaving, setLeaving] = useState(false)
  const [consented, setConsented] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>("stripe")
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations("pricing")
  // One-time plans (BASIC/SPRINT) do NOT auto-renew → use accurate consent wording.
  const isOneTime = plan === "basic" || plan === "sprint"
  const consentKey = isOneTime ? "checkout_consent_onetime" : "checkout_consent"
  // Two directions, refused for different reasons but with the same answer for the
  // user: wait for the paid period to end, or cancel to end it sooner.
  //   · switchBlocked    — a live subscription already bills them, so a new recurring
  //                        checkout (including monthly → annual) is refused.
  //   · downgradeBlocked — moving DOWN to a one-time plan while any subscription
  //                        still exists.
  // Neither name mentions a portal any more: this component makes no billing-portal
  // request at all (see the render below).
  const switchBlocked = blocksPurchase && !isOneTime
  const downgradeBlocked = blocksPurchase && isOneTime

  // Only ever starts a CHECKOUT now. The portal branch that used to live here is
  // gone: when a subscription blocks the purchase this component renders an
  // explanation instead of a button, so there is nothing left to click.
  async function handleClick() {
    setLoading(true)
    const meta = PLAN_META[plan]
    const analyticsProvider = paypalAvailable && method === "paypal" ? "paypal" : "stripe"
    track("pricing_cta_clicked", { plan: meta.name, billing_cycle: meta.cycle })
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

      // Not signed in → send them to LOGIN (the plan travels with them). Login is the
      // right door for returning buyers; anyone without an account creates one from
      // the "create account" link there, so new users are not turned away either.
      if (res.status === 401) {
        setLeaving(true)
        router.push(`/login?plan=${plan}`)
        return
      }

      // 503 is OUR failure, not the user's: `payments_not_configured` (the gateway has
      // no keys) or `plan_not_configured` (a price id is missing from env). It used to
      // fall into the 401 branch and push a signed-in buyer to /register with no
      // explanation — they lost the pricing page and were asked to create an account
      // they already had. Say what happened and leave them where they are, so they can
      // retry when the service is back.
      if (res.status === 503) {
        toast.error(t("toast_payments_unavailable"))
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
        track("checkout_started", { plan: meta.name, billing_cycle: meta.cycle, provider: analyticsProvider })
        setLeaving(true)
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

  // Tells the user WHEN the switch becomes possible and what to do meanwhile.
  // Two different truths, so two different messages:
  //   · already cancelled → `currentPlanEndsAt` is a real END date → "available from X"
  //   · still active      → it is the RENEWAL date, so "you can switch on X" would be
  //                         false (it renews that day) → they must cancel first
  const blockedNote = alreadyCancelled
    ? currentPlanEndsAt
      ? t("plan_change_available_on", { date: currentPlanEndsAt })
      : t("plan_change_when_current_ends")
    : currentPlanEndsAt
      ? t("plan_change_cancel_first_on", { date: currentPlanEndsAt })
      : t("plan_change_cancel_first")

  const blockedUntilPlanEnds = (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full" disabled>
        {t("plan_change_when_current_ends")}
      </Button>
      <p className="text-center text-[11px] leading-[1.5] opacity-75">{blockedNote}</p>
    </div>
  )

  // Access with no gateway behind it, on ANY card: nothing to cancel, nothing to wait
  // for, and no checkout allowed either (the status still blocks it). Must come before
  // the two blocks below — both tell the user to cancel a plan or wait for it to end,
  // and neither is followable when no such plan exists at Stripe or PayPal.
  if ((downgradeBlocked || switchBlocked) && billingNeedsSupport) {
    return (
      <div className="flex flex-col gap-2">
        <Button size="lg" className="w-full" disabled>
          {t("plan_change_unavailable")}
        </Button>
        <p className="text-center text-[11px] leading-[1.5] opacity-75">{t("plan_change_contact_support")}</p>
      </div>
    )
  }

  // Moving DOWN to a one-time plan while any subscription still exists is refused by
  // the backend: provisioning one clears `subscriptionId`, so a still-ACTIVE sub would
  // keep charging unlinked, and an already-CANCELED one would later fire
  // `subscription.deleted` and wipe the one-time window the user just paid for.
  if (downgradeBlocked) return blockedUntilPlanEnds

  // A live recurring subscription (ACTIVE/PAST_DUE) is billing this user, so
  // `StripeCheckoutService` rejects a new checkout with `already_subscribed`. That is
  // true for a monthly→annual switch too: the switch is not a purchase we can start
  // from here. So the card states the rule instead of offering an action that fails —
  // cancel, or wait for the paid period to end.
  //
  // This card used to open the billing portal, which meant a user aiming for annual
  // clicked "manage subscription" and either landed somewhere that could not do it or,
  // with no `stripeCustomerId`, got a raw error toast. The portal still lives in the
  // Pro banner above (and in Settings), where it is the manage action it claims to be.
  if (switchBlocked) return blockedUntilPlanEnds

  return (
    <div className="flex flex-col gap-3">
      <PendingScreen show={loading || leaving} />
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
