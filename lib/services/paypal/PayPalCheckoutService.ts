// PayPalCheckoutService — starts a payment for any plan and returns the PayPal
// approval URL the buyer is redirected to. Mirror of StripeCheckoutService.
//   PRO monthly/annual → recurring subscription (Subscriptions API).
//   BASIC / SPRINT     → one-time order (Orders API).
// The user is provisioned ONLY by the webhook (never here) — this just creates
// the PayPal object and hands back the approve link.
import { db } from "@/lib/db"
import { paypalConfig } from "@/lib/paypal"
import { AppError } from "@/lib/services/auth/AppError"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { PayPalClientAdapter, approvalUrl } from "./PayPalClientAdapter"

export type PayPalPlan = "monthly" | "annual" | "basic" | "sprint"

// One-time prices (USD). SINGLE SOURCE for the PayPal side — must stay in sync
// with the pricing page and the Stripe price IDs. BASIC = 1 month, SPRINT = 7 days.
const ONE_TIME_PRICE: Record<"basic" | "sprint", { value: string; plan: "BASIC" | "SPRINT" }> = {
  basic: { value: "2.99", plan: "BASIC" },
  sprint: { value: "7.99", plan: "SPRINT" },
}

export class PayPalCheckoutService {
  constructor(
    private readonly client: PayPalClientAdapter,
    private readonly logger: ILogger,
  ) {}

  async createCheckout(userId: string, plan: PayPalPlan, locale: string): Promise<{ url: string }> {
    const cfg = paypalConfig()
    if (!cfg) throw new AppError("payments_not_configured", 503)

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")
    const returnUrl = `${appUrl}/${locale}/dashboard/resumes?upgraded=true`
    const cancelUrl = `${appUrl}/${locale}/pricing`

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, subscriptionStatus: true, isManaged: true },
    })
    if (!user) throw new AppError("user_not_found", 404)

    const isOneTime = plan === "basic" || plan === "sprint"

    // Block ANY purchase (sub OR one-time) while a subscription is active. This
    // prevents a double subscription AND stops an active PRO from self-downgrading
    // by buying a one-time BASIC/SPRINT (whose webhook would overwrite plan=PRO).
    if (user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "PAST_DUE") {
      throw new AppError("already_subscribed", 400)
    }

    if (isOneTime) {
      const price = ONE_TIME_PRICE[plan as "basic" | "sprint"]
      const order = await this.client.createOrder({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: price.value },
            // custom_id carries userId + which plan so the webhook can provision it.
            custom_id: `${userId}|${price.plan}`,
            description: `ReadyCVV ${price.plan}`,
          },
        ],
        application_context: { return_url: returnUrl, cancel_url: cancelUrl, user_action: "PAY_NOW", brand_name: "ReadyCVV" },
      })
      const url = approvalUrl(order.links)
      if (!url) throw new AppError("paypal_no_approval_url", 502)
      this.logger.info("PayPalCheckoutService: order created", { userId, plan, orderId: order.id })
      return { url }
    }

    // Recurring PRO.
    const planId = plan === "monthly" ? cfg.planIdMonthly : cfg.planIdAnnual
    if (!planId) throw new AppError("plan_not_configured", 503)

    const sub = await this.client.createSubscription(planId, { customId: userId, returnUrl, cancelUrl })
    const url = approvalUrl(sub.links)
    if (!url) throw new AppError("paypal_no_approval_url", 502)
    this.logger.info("PayPalCheckoutService: subscription created", { userId, plan, subscriptionId: sub.id })
    return { url }
  }
}
