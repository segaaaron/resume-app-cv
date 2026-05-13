import { db } from "@/lib/db"
import { stripeEnabled } from "@/lib/stripe"
import { AppError } from "@/lib/services/auth/AppError"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

export class StripeCheckoutService {
  constructor(
    private readonly stripeClient: IStripeClient,
    private readonly logger: ILogger,
  ) {}

  async createSession(userId: string, plan: "monthly" | "annual", locale: string): Promise<{ url: string }> {
    if (!stripeEnabled()) throw new AppError("payments_not_configured", 503)

    const PRICE_IDS: Record<string, string | undefined> = {
      monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
      annual:  process.env.STRIPE_PRICE_ID_ANNUAL,
    }
    const priceId = PRICE_IDS[plan]
    if (!priceId) throw new AppError("plan_not_configured", 503)

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, stripeCustomerId: true, plan: true, subscriptionStatus: true, subscriptionId: true },
    })
    if (!user) throw new AppError("user_not_found", 404)

    if (user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "PAST_DUE") {
      throw new AppError("already_subscribed", 400)
    }

    if (user.subscriptionId && user.subscriptionStatus === "CANCELED") {
      await this.stripeClient.cancelSubscription(user.subscriptionId).catch(() => {})
      await db.user.update({ where: { id: userId }, data: { subscriptionId: null } })
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
      await db.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } })
    }

    const checkoutSession = await this.stripeClient.createCheckoutSession({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl.replace(/\/$/, "")}/${locale}/dashboard/resumes?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { userId, planInterval: plan },
      subscription_data: { metadata: { userId, planInterval: plan } },
    })

    if (!checkoutSession.url) throw new AppError("checkout_url_missing", 500)
    this.logger.info("StripeCheckoutService.createSession", { userId, plan })
    return { url: checkoutSession.url }
  }
}
