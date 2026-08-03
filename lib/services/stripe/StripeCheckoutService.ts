import type Stripe from "stripe"
import { db } from "@/lib/db"
import { stripeEnabled } from "@/lib/stripe"
import { resend, emailEnabled } from "@/lib/resend"
import { AppError } from "@/lib/services/auth/AppError"
import { blocksNewPurchase } from "@/lib/plans"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

// A stored stripeCustomerId can point at a customer that no longer exists in the
// active Stripe account — the account/mode was switched (test → live, or a brand
// new account) or the customer was deleted. Stripe answers with a resource_missing
// error whose `param` is "customer". Detect exactly that case (never a missing
// price or other resource, which a customer recreation would not fix).
function isMissingCustomerError(e: unknown): boolean {
  const err = e as { code?: string; param?: string; message?: string }
  return err?.code === "resource_missing" &&
    (err?.param === "customer" || /customer/i.test(err?.message ?? ""))
}

export class StripeCheckoutService {
  constructor(
    private readonly stripeClient: IStripeClient,
    private readonly logger: ILogger,
  ) {}

  async createSession(userId: string, plan: "monthly" | "annual" | "basic" | "sprint", locale: string): Promise<{ url: string }> {
    if (!stripeEnabled()) throw new AppError("payments_not_configured", 503)

    // BASIC/SPRINT are one-time purchases (no recurring subscription).
    const isOneTime = plan === "basic" || plan === "sprint"

    const PRICE_IDS: Record<string, string | undefined> = {
      monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
      annual:  process.env.STRIPE_PRICE_ID_ANNUAL,
      basic:   process.env.STRIPE_PRICE_ID_BASIC,
      sprint:  process.env.STRIPE_PRICE_ID_SPRINT,
    }
    const priceId = PRICE_IDS[plan]
    if (!priceId) throw new AppError("plan_not_configured", 503)

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, stripeCustomerId: true, plan: true, subscriptionStatus: true, subscriptionId: true },
    })
    if (!user) throw new AppError("user_not_found", 404)

    // Shared with the pricing UI so the two can never drift — see blocksNewPurchase().
    // Semantics unchanged: ACTIVE/PAST_DUE blocked, NONE (one-time → PRO upgrade) and
    // CANCELED (monthly → annual switch, re-subscribe) allowed.
    if (blocksNewPurchase(user.subscriptionStatus, isOneTime)) {
      throw new AppError("already_subscribed", 400)
    }

    if (!isOneTime && user.subscriptionId && user.subscriptionStatus === "CANCELED") {
      const oldSubId = user.subscriptionId
      let cancelSucceeded = false
      await this.stripeClient.cancelSubscription(oldSubId)
        .then(() => { cancelSucceeded = true })
        .catch(async (e) => {
          this.logger.error("StripeCheckoutService: failed to cancel old sub before checkout", { userId, subscriptionId: oldSubId }, e instanceof Error ? e : undefined)
          if (emailEnabled() && resend && process.env.ADMIN_EMAIL) {
            await resend.emails.send({
              from: process.env.EMAIL_FROM ?? "Valhalla Resume <no-reply@valhallaresume.com>",
              to: process.env.ADMIN_EMAIL,
              subject: `[WARNING] Old subscription NOT canceled before new checkout: ${userId}`,
              text: `User ${userId} started a new checkout but the old subscription (${oldSubId}) could NOT be canceled.\n\nThis may result in two active subscriptions in Stripe.\n\nAction required:\n1. Check Stripe Dashboard for user with subscription ${oldSubId}\n2. Cancel the old subscription manually if still active\n\nError: ${String(e)}`,
            }).catch((emailErr) => this.logger.error("StripeCheckoutService: admin alert email failed", { userId }, emailErr instanceof Error ? emailErr : undefined))
          }
        })
      if (cancelSucceeded) {
        await db.user.update({ where: { id: userId }, data: { subscriptionId: null } })
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) throw new AppError("server_misconfiguration", 500)

    const buildCheckoutParams = (customer: string): Stripe.Checkout.SessionCreateParams => ({
      customer,
      mode: isOneTime ? "payment" : "subscription",
      payment_method_types: ["card"],
      // Turn OFF Stripe's Adaptive Pricing (its ML currency guessing) — it is not
      // deterministic and quoted a Bolivian IP in HKD. The presented currency must come
      // ONLY from what we define on the Price: USD by default, plus any manual
      // currency_options (e.g. EUR / GBP) configured in Stripe, which Checkout still
      // auto-selects by the buyer's location even with Adaptive Pricing off. We do NOT
      // pass a `currency` here on purpose — that would pin one currency and defeat the
      // per-location auto-selection of those currency_options. Pinned per session so this
      // holds even if the Dashboard toggle is (re-)enabled.
      adaptive_pricing: { enabled: false },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl.replace(/\/$/, "")}/${locale}/dashboard/resumes?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      // Where Checkout's back button sends a customer who changes their mind (a declined
      // card does NOT come here — that session stays open for retry). Locale-prefixed
      // because there is no /pricing route outside [locale] and no next-intl middleware.
      cancel_url: `${appUrl.replace(/\/$/, "")}/${locale}/pricing?checkout=cancelled`,
      // One-time → planType drives provisioning (BASIC/SPRINT). Subscription → planInterval.
      // `locale` rides along so the webhook can write emails in the language the customer
      // bought in. The User model stores no language, and a webhook has no request to
      // read Accept-Language from — this is the only place that knows it.
      metadata: isOneTime ? { userId, planType: plan, locale } : { userId, planInterval: plan, locale },
      // Stamp the same metadata on the PaymentIntent so the resulting CHARGE carries it.
      // Refund/dispute/fraud events arrive with a charge and no session, and they must
      // know whether the money being returned paid for a one-time window (revoke it) or
      // for the subscription (leave a separately bought window alone). Stripe's old
      // `charge.invoice` link no longer exists in the current API, so this is the signal.
      ...(isOneTime
        ? { payment_intent_data: { metadata: { userId, planType: plan, locale } } }
        : { subscription_data: { metadata: { userId, planInterval: plan, locale } } }),
    })

    let customerId = await this.resolveCustomerId(userId, user.email!, user.stripeCustomerId)

    let checkoutSession: Stripe.Checkout.Session
    try {
      checkoutSession = await this.stripeClient.createCheckoutSession(buildCheckoutParams(customerId))
    } catch (e) {
      // The stored customer id is stale (Stripe account/mode changed, or the customer
      // was deleted). Drop it, mint a fresh customer in the active account, and retry
      // once — otherwise the buyer hits a 500 they can never clear on their own.
      if (!isMissingCustomerError(e)) throw e
      this.logger.warn("StripeCheckoutService: stale Stripe customer, recreating", { userId, staleCustomerId: customerId })
      await db.user.update({ where: { id: userId }, data: { stripeCustomerId: null } })
      customerId = await this.resolveCustomerId(userId, user.email!, null)
      checkoutSession = await this.stripeClient.createCheckoutSession(buildCheckoutParams(customerId))
    }

    if (!checkoutSession.url) throw new AppError("checkout_url_missing", 500)
    this.logger.info("StripeCheckoutService.createSession", { userId, plan })
    return { url: checkoutSession.url }
  }

  // Returns a usable Stripe customer id for the user, persisting it when one is
  // created. Reuses the stored id when present; otherwise finds a matching customer
  // by email (metadata.userId) before creating a new one, to avoid duplicates.
  private async resolveCustomerId(userId: string, email: string, currentId: string | null): Promise<string> {
    if (currentId) return currentId

    const existing = await this.stripeClient.listCustomers({ email, limit: 10 })
    const match = existing.data.find(c => c.metadata?.userId === userId && !c.deleted)
    const customerId = match ? match.id : (await this.stripeClient.createCustomer({ email, metadata: { userId } })).id

    try {
      await db.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } })
    } catch (e) {
      this.logger.error("StripeCheckoutService: failed to save stripeCustomerId — orphan customer created", { userId, customerId }, e instanceof Error ? e : undefined)
      if (emailEnabled() && resend && process.env.ADMIN_EMAIL) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "Valhalla Resume <no-reply@valhallaresume.com>",
          to: process.env.ADMIN_EMAIL,
          subject: `[WARNING] Orphan Stripe customer created: ${userId}`,
          text: `A Stripe customer (${customerId}) was created for user ${userId} but could NOT be saved to the database.\n\nThis customer is now orphaned in Stripe. Future checkouts may create duplicate customers.\n\nAction required:\n1. Manually set stripeCustomerId = '${customerId}' for user ${userId} in the database\n2. Or run: POST /api/admin/billing/reconcile-user with { "userId": "${userId}" }\n\nError: ${String(e)}`,
        }).catch((emailErr) => this.logger.error("StripeCheckoutService: orphan alert email failed", { userId, customerId }, emailErr instanceof Error ? emailErr : undefined))
      }
      throw new AppError("checkout_failed", 500)
    }
    return customerId
  }
}
