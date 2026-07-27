import { db } from "@/lib/db"
import { stripeEnabled } from "@/lib/stripe"
import { resend, emailEnabled } from "@/lib/resend"
import { AppError } from "@/lib/services/auth/AppError"
import { blocksNewPurchase } from "@/lib/plans"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

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
              from: process.env.EMAIL_FROM ?? "READY CV <no-reply@readycvv.com>",
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

    let customerId = user.stripeCustomerId
    if (!customerId) {
      const existing = await this.stripeClient.listCustomers({ email: user.email!, limit: 10 })
      const match = existing.data.find(c => c.metadata?.userId === userId && !c.deleted)
      if (match) {
        customerId = match.id
      } else {
        const customer = await this.stripeClient.createCustomer({ email: user.email!, metadata: { userId } })
        customerId = customer.id
      }
      try {
        await db.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } })
      } catch (e) {
        this.logger.error("StripeCheckoutService: failed to save stripeCustomerId — orphan customer created", { userId, customerId }, e instanceof Error ? e : undefined)
        if (emailEnabled() && resend && process.env.ADMIN_EMAIL) {
          await resend.emails.send({
            from: process.env.EMAIL_FROM ?? "READY CV <no-reply@readycvv.com>",
            to: process.env.ADMIN_EMAIL,
            subject: `[WARNING] Orphan Stripe customer created: ${userId}`,
            text: `A Stripe customer (${customerId}) was created for user ${userId} but could NOT be saved to the database.\n\nThis customer is now orphaned in Stripe. Future checkouts may create duplicate customers.\n\nAction required:\n1. Manually set stripeCustomerId = '${customerId}' for user ${userId} in the database\n2. Or run: POST /api/admin/billing/reconcile-user with { "userId": "${userId}" }\n\nError: ${String(e)}`,
          }).catch((emailErr) => this.logger.error("StripeCheckoutService: orphan alert email failed", { userId, customerId }, emailErr instanceof Error ? emailErr : undefined))
        }
        throw new AppError("checkout_failed", 500)
      }
    }

    const checkoutSession = await this.stripeClient.createCheckoutSession({
      customer: customerId,
      mode: isOneTime ? "payment" : "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl.replace(/\/$/, "")}/${locale}/dashboard/resumes?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      // Where Checkout's back button sends a customer who changes their mind (a declined
      // card does NOT come here — that session stays open for retry).
      // It used to be `${appUrl}/pricing`: no locale, and no trailing-slash strip. There
      // is no next-intl middleware and no /pricing route outside [locale], so that URL
      // is a 404 — the buyer who clicked "back" to compare plans landed on an error page
      // instead of the pricing table. PayPal's checkout already built this correctly.
      cancel_url: `${appUrl.replace(/\/$/, "")}/${locale}/pricing`,
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

    if (!checkoutSession.url) throw new AppError("checkout_url_missing", 500)
    this.logger.info("StripeCheckoutService.createSession", { userId, plan })
    return { url: checkoutSession.url }
  }
}
