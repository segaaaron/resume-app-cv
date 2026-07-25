// PayPalWebhookService — the money heart. Verifies each webhook OFFLINE, dedups
// it (PaypalEvent), and applies the provisioning action atomically. Mirror of
// StripeWebhookService: same internal plan fields, same sessionVersion bump,
// same "never overwrite a managed (LIMITED) user" rule.
//
// Money-safety rules honored here:
//  1. Verify signature before anything (offline RSA-SHA256).
//  2. Idempotency: each event.id is claimed once in PaypalEvent.
//  3. Re-fetch the subscription from PayPal before granting PRO — webhooks are
//     unreliable, so the authoritative status comes from a GET, not the payload.
//  4. Event record + plan update are one atomic transaction.
import { addMonths, addDays } from "date-fns"
import { db } from "@/lib/db"
import { purgeUserCache } from "@/lib/auth"
import { AppError } from "@/lib/services/auth/AppError"
import type { ILogger } from "@/lib/interfaces/ILogger"
import { paypalConfig } from "@/lib/paypal"
import type { PayPalClientAdapter } from "./PayPalClientAdapter"
import { verifyWebhookOffline, readWebhookHeaders } from "./verify-webhook"
import { interpretEvent, type PayPalAction } from "./event-interpreter"

const TX_OPTS = { timeout: 15000, maxWait: 5000 }
type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0]
type PrismaUniqueError = { code?: string }

/** Claim an event id for idempotent processing. false = already processed. */
async function claimEvent(tx: TxClient, eventId: string, extra?: Record<string, unknown>): Promise<boolean> {
  try {
    await tx.paypalEvent.create({ data: { id: eventId, ...extra } })
    return true
  } catch (e) {
    if ((e as PrismaUniqueError)?.code === "P2002") return false
    throw e
  }
}

export class PayPalWebhookService {
  constructor(
    private readonly client: PayPalClientAdapter,
    private readonly logger: ILogger,
  ) {}

  /**
   * Verify + process one webhook. `rawBody` MUST be the unparsed request body
   * (the offline verifier's crc32 is over the exact bytes). Throws
   * `invalid_signature` (400) so the route rejects forged/failed events; any
   * other error propagates so PayPal retries (idempotency guards duplicates).
   */
  async handleEvent(rawBody: string, headers: Headers): Promise<void> {
    const cfg = paypalConfig()
    if (!cfg) throw new AppError("payments_not_configured", 503)

    const h = readWebhookHeaders(headers)
    if (!h) throw new AppError("invalid_signature", 400)

    const ok = await verifyWebhookOffline(h, cfg.webhookId, rawBody)
    if (!ok) throw new AppError("invalid_signature", 400)

    let event: unknown
    try {
      event = JSON.parse(rawBody)
    } catch {
      throw new AppError("invalid_payload", 400)
    }
    const eventId = (event as { id?: string })?.id
    if (!eventId) throw new AppError("invalid_payload", 400)

    const action = interpretEvent(event, { monthly: cfg.planIdMonthly, annual: cfg.planIdAnnual })
    this.logger.info("PayPalWebhookService.handleEvent", { eventId, kind: action.kind })

    if (action.kind === "ignore") {
      // Still claim it so PayPal stops retrying an event we intentionally skip.
      await db.paypalEvent.create({ data: { id: eventId } }).catch(() => undefined)
      return
    }

    // Re-fetch authoritative subscription state before GRANTING or RENEWING PRO
    // (rule 3). The GET is the source of truth for BOTH the status and the new
    // period end — the recurring PAYMENT.SALE event does not carry the next
    // billing date, so a renewal MUST read it here to advance subscriptionEndsAt.
    if (action.kind === "provision-pro" || action.kind === "renew-pro") {
      let sub
      try {
        sub = await this.client.getSubscription(action.subscriptionId)
      } catch (e) {
        // Re-fetch failed → let PayPal retry rather than act on an unverified payload.
        this.logger.error("PayPalWebhookService: subscription re-fetch failed", { eventId }, e instanceof Error ? e : undefined)
        throw new AppError("refetch_failed", 500)
      }
      if (sub.status !== "ACTIVE") {
        // Not active yet (race with activation) or no longer active. Do NOT claim
        // the event — throw so PayPal retries and the grant lands once the sub is
        // ACTIVE. The reconciliation cron is the final backstop. Claiming here
        // would silently kill the retry and lose the grant.
        this.logger.info("PayPalWebhookService: subscription not ACTIVE on re-fetch", { eventId, status: sub.status })
        throw new AppError("subscription_not_active", 409)
      }
      // Inject the authoritative next period end (advances endsAt on renewal).
      action.endsAt = sub.billing_info?.next_billing_time
    }

    const userId = await this.applyAction(eventId, action)
    if (userId) purgeUserCache(userId)
  }

  /** Apply the action atomically. Returns the affected userId (for cache purge). */
  private async applyAction(eventId: string, action: PayPalAction): Promise<string | null> {
    return db.$transaction(async (tx) => {
      if (!(await claimEvent(tx, eventId))) return null // already processed

      switch (action.kind) {
        case "provision-pro": {
          const user = await this.resolveUser(tx, { userId: action.userId, paypalSubscriptionId: action.subscriptionId })
          if (!user || user.isManaged) return null
          await tx.user.update({
            where: { id: user.id },
            data: {
              plan: "PRO",
              paymentProvider: "PAYPAL",
              paypalSubscriptionId: action.subscriptionId,
              planInterval: action.interval,
              subscriptionStatus: "ACTIVE",
              ...(action.endsAt ? { subscriptionEndsAt: new Date(action.endsAt) } : {}),
              sessionVersion: { increment: 1 },
            },
          })
          return user.id
        }

        case "renew-pro": {
          const user = await this.resolveUser(tx, { paypalSubscriptionId: action.subscriptionId })
          if (!user || user.isManaged) return null
          await tx.user.update({
            where: { id: user.id },
            data: {
              plan: "PRO",
              subscriptionStatus: "ACTIVE",
              ...(action.endsAt ? { subscriptionEndsAt: new Date(action.endsAt) } : {}),
              sessionVersion: { increment: 1 },
            },
          })
          return user.id
        }

        case "cancel-pro": {
          // Canceled but not yet expired — keep access until subscriptionEndsAt.
          const user = await this.resolveUser(tx, { paypalSubscriptionId: action.subscriptionId })
          if (!user || user.isManaged) return null
          await tx.user.update({ where: { id: user.id }, data: { subscriptionStatus: "CANCELED", sessionVersion: { increment: 1 } } })
          return user.id
        }

        case "suspend-pro":
        case "payment-failed": {
          const user = await this.resolveUser(tx, { paypalSubscriptionId: action.subscriptionId })
          if (!user || user.isManaged) return null
          await tx.user.update({ where: { id: user.id }, data: { subscriptionStatus: "PAST_DUE", sessionVersion: { increment: 1 } } })
          return user.id
        }

        case "expire-pro": {
          const user = await this.resolveUser(tx, { paypalSubscriptionId: action.subscriptionId })
          if (!user || user.isManaged) return null
          await tx.user.update({
            where: { id: user.id },
            data: { plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", paypalSubscriptionId: null, subscriptionEndsAt: null, sessionVersion: { increment: 1 } },
          })
          return user.id
        }

        case "provision-onetime": {
          const user = await this.resolveUser(tx, { userId: action.userId })
          if (!user || user.isManaged) return null
          const now = new Date()
          const subscriptionEndsAt = action.plan === "BASIC" ? addMonths(now, 1) : addDays(now, 7)
          await tx.user.update({
            where: { id: user.id },
            data: {
              plan: action.plan,
              paymentProvider: "PAYPAL",
              paypalOrderId: action.orderId ?? null,
              planInterval: null,
              subscriptionId: null,
              subscriptionStatus: "NONE",
              subscriptionEndsAt,
              sessionVersion: { increment: 1 },
            },
          })
          return user.id
        }

        case "refund": {
          const user = await this.resolveUser(tx, { userId: action.userId, paypalSubscriptionId: action.subscriptionId })
          if (!user || user.isManaged) return null
          await tx.user.update({
            where: { id: user.id },
            data: { plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", paypalSubscriptionId: null, subscriptionEndsAt: null, sessionVersion: { increment: 1 } },
          })
          return user.id
        }

        default:
          return null
      }
    }, TX_OPTS)
  }

  /** Find the target user by custom_id userId first, then by stored PayPal ids. */
  private async resolveUser(
    tx: TxClient,
    keys: { userId?: string; paypalSubscriptionId?: string; paypalOrderId?: string },
  ): Promise<{ id: string; isManaged: boolean } | null> {
    if (keys.userId) {
      const u = await tx.user.findUnique({ where: { id: keys.userId }, select: { id: true, isManaged: true } })
      if (u) return u
    }
    if (keys.paypalSubscriptionId) {
      const u = await tx.user.findUnique({ where: { paypalSubscriptionId: keys.paypalSubscriptionId }, select: { id: true, isManaged: true } })
      if (u) return u
    }
    if (keys.paypalOrderId) {
      const u = await tx.user.findFirst({ where: { paypalOrderId: keys.paypalOrderId }, select: { id: true, isManaged: true } })
      if (u) return u
    }
    return null
  }
}
