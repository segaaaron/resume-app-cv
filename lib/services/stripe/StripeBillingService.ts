import { db } from "@/lib/db"
import { purgeUserCache } from "@/lib/auth"
import { stripeEnabled } from "@/lib/stripe"
import { AppError } from "@/lib/services/auth/AppError"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

export class StripeBillingService {
  constructor(
    private readonly stripeClient: IStripeClient,
    private readonly logger: ILogger,
  ) {}

  async createPortalSession(userId: string, locale: string): Promise<{ url: string }> {
    if (!stripeEnabled()) throw new AppError("payments_not_configured", 503)
    const user = await db.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } })
    if (!user?.stripeCustomerId) throw new AppError("no_active_subscription", 400)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const session = await this.stripeClient.createPortalSession({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/${locale}/dashboard/settings`,
    })
    this.logger.info("StripeBillingService.createPortalSession", { userId })
    return { url: session.url }
  }

  async cancelSubscription(userId: string): Promise<{ success: true }> {
    if (!stripeEnabled()) throw new AppError("payments_not_configured", 503)
    const user = await db.user.findUnique({ where: { id: userId }, select: { subscriptionId: true, subscriptionStatus: true } })
    if (!user?.subscriptionId) throw new AppError("no_active_subscription", 400)
    if (user.subscriptionStatus === "CANCELED") throw new AppError("already_canceled", 400)
    await this.stripeClient.updateSubscription(user.subscriptionId, { cancel_at_period_end: true })
    await db.$transaction([
      db.user.update({ where: { id: userId }, data: { subscriptionStatus: "CANCELED", sessionVersion: { increment: 1 } } }),
      db.auditLog.create({ data: { userId, action: "CANCEL_SUBSCRIPTION", metadata: { source: "user_self_cancel", subscriptionId: user.subscriptionId } } }),
    ])
    purgeUserCache(userId)
    this.logger.info("StripeBillingService.cancelSubscription", { userId })
    return { success: true }
  }

  async createRefund(adminId: string, targetUserId: string, amount?: number): Promise<{ success: true }> {
    if (!stripeEnabled()) throw new AppError("payments_not_configured", 503)

    const user = await db.user.findUnique({ where: { id: targetUserId }, select: { stripeCustomerId: true, subscriptionId: true } })
    if (!user?.stripeCustomerId) throw new AppError("user_not_found", 404)

    const refund = await this.stripeClient.createRefund({ customer: user.stripeCustomerId, ...(amount ? { amount } : {}) })

    // Cancel Stripe subscription (best-effort — webhook charge.refunded will also fire, belt-and-suspenders)
    if (user.subscriptionId) {
      await this.stripeClient.cancelSubscription(user.subscriptionId).catch((e) =>
        this.logger.error("StripeBillingService.createRefund: sub cancel failed — manual cancel required in Stripe", { adminId, targetUserId, subscriptionId: user.subscriptionId }, e instanceof Error ? e : undefined)
      )
    }

    await db.$transaction([
      db.user.update({ where: { id: targetUserId }, data: { plan: "UNSUBSCRIBED", subscriptionId: null, subscriptionEndsAt: null, subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } } }),
      db.auditLog.create({ data: { userId: targetUserId, action: "REFUND_ISSUED", metadata: { adminId, amount, refundId: refund.id, subscriptionId: user.subscriptionId } } }),
    ])
    purgeUserCache(targetUserId)

    this.logger.info("StripeBillingService.createRefund", { adminId, targetUserId, amount, refundId: refund.id })
    return { success: true }
  }
}
