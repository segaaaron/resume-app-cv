// PayPalBillingService — self-serve subscription management for PayPal payers.
// Mirror of StripeBillingService.cancelSubscription, with one structural
// difference: PayPal has NO hosted customer portal (Stripe's Billing Portal has
// no equivalent), so cancelling has to happen in OUR UI against this service.
//
// Access policy matches the Stripe side and the webhook's `cancel-pro` action:
// cancelling stops future billing but the user KEEPS PRO until
// subscriptionEndsAt. We never revoke access the user already paid for.
import { db } from "@/lib/db"
import { purgeUserCache } from "@/lib/auth"
import { paypalEnabled } from "@/lib/paypal"
import { AppError } from "@/lib/services/auth/AppError"
import type { ILogger } from "@/lib/interfaces/ILogger"
import type { PayPalClientAdapter } from "./PayPalClientAdapter"

export class PayPalBillingService {
  constructor(
    private readonly client: PayPalClientAdapter,
    private readonly logger: ILogger,
  ) {}

  async cancelSubscription(userId: string, reason = "User requested cancellation"): Promise<{ success: true }> {
    if (!paypalEnabled()) throw new AppError("payments_not_configured", 503)

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { paypalSubscriptionId: true, subscriptionStatus: true, isManaged: true },
    })
    if (!user?.paypalSubscriptionId) throw new AppError("no_active_subscription", 400)
    // LIMITED users are admin-provisioned — they have no self-serve billing to cancel.
    if (user.isManaged) throw new AppError("managed_account", 403)
    if (user.subscriptionStatus === "CANCELED") throw new AppError("already_canceled", 400)

    await this.client.cancelSubscription(user.paypalSubscriptionId, reason)

    // CAS guard: concurrent cancel clicks must not double-write CANCELED or
    // duplicate the audit entry (same pattern as StripeBillingService).
    const claimed = await db.user.updateMany({
      where: { id: userId, subscriptionStatus: { not: "CANCELED" } },
      data: { subscriptionStatus: "CANCELED", sessionVersion: { increment: 1 } },
    })
    if (claimed.count > 0) {
      await db.auditLog.create({
        data: {
          userId,
          action: "CANCEL_SUBSCRIPTION",
          metadata: { source: "user_self_cancel", provider: "PAYPAL", subscriptionId: user.paypalSubscriptionId },
        },
      })
      purgeUserCache(userId)
    }

    this.logger.info("PayPalBillingService.cancelSubscription", { userId })
    return { success: true }
  }
}
