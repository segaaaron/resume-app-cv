import type Stripe from "stripe"
import { db } from "@/lib/db"
import { purgeUserCache } from "@/lib/auth"
import { checkAndApplyReferralReward } from "@/lib/referral-rewards"
import { resend, emailEnabled } from "@/lib/resend"
import { subscriptionConfirmationHtml, subscriptionConfirmationText } from "@/lib/emails/subscriptionConfirmation"
import { paymentFailedHtml, paymentFailedText } from "@/lib/emails/paymentFailed"
import { AppError } from "@/lib/services/auth/AppError"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

const TX_OPTS = { timeout: 15000, maxWait: 5000 }

type PrismaUniqueError = { code?: string }
function isDuplicate(e: unknown): boolean {
  return (e as PrismaUniqueError)?.code === "P2002"
}

export class StripeWebhookService {
  constructor(
    private readonly stripeClient: IStripeClient,
    private readonly logger: ILogger,
  ) {}

  async handleEvent(rawBody: string, sig: string, webhookSecret: string): Promise<void> {
    let event: Stripe.Event
    try {
      event = this.stripeClient.constructEvent(rawBody, sig, webhookSecret)
    } catch {
      throw new AppError("invalid_signature", 400)
    }

    this.logger.info("StripeWebhookService.handleEvent", { type: event.type, eventId: event.id })

    try {
      switch (event.type) {
        case "checkout.session.completed": await this.handleCheckoutCompleted(event); break
        case "invoice.paid": await this.handleInvoicePaid(event); break
        case "customer.subscription.updated": await this.handleSubscriptionUpdated(event); break
        case "customer.subscription.deleted": await this.handleSubscriptionDeleted(event); break
        case "customer.subscription.created": await this.handleSubscriptionCreated(event); break
        case "charge.refunded": await this.handleChargeRefunded(event); break
        case "charge.dispute.created": await this.handleDisputeCreated(event); break
        case "charge.dispute.closed": await this.handleDisputeClosed(event); break
        case "invoice.payment_failed": await this.handlePaymentFailed(event); break
        case "radar.early_fraud_warning.created": await this.handleFraudWarning(event); break
        case "customer.updated": await this.handleCustomerUpdated(event); break
        case "payment_intent.payment_failed": {
          const pi = event.data.object as Stripe.PaymentIntent
          this.logger.warn("StripeWebhookService: payment_intent.payment_failed", { paymentIntentId: pi.id, customerId: pi.customer })
          break
        }
        case "customer.subscription.trial_will_end": {
          const sub = event.data.object as Stripe.Subscription
          this.logger.info("StripeWebhookService: trial_will_end", { subscriptionId: sub.id, customerId: sub.customer, trialEnd: sub.trial_end })
          break
        }
      }
    } catch (e) {
      if (e instanceof AppError) throw e
      this.logger.error("StripeWebhookService.handleEvent: handler error", { eventId: event.id, type: event.type }, e instanceof Error ? e : undefined)
      throw new AppError("handler_error", 500)
    }
  }

  private async handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    if (!userId) return
    if (session.payment_status !== "paid") return

    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription as Stripe.Subscription | null)?.id ?? null

    const planInterval = (session.metadata?.planInterval === "annual" ? "annual" : "monthly") as "monthly" | "annual"

    let subscriptionEndsAt: Date | undefined
    if (subscriptionId) {
      const sub = await this.stripeClient.retrieveSubscription(subscriptionId)
      const periodEnd = sub.items.data[0]?.current_period_end
      if (periodEnd) subscriptionEndsAt = new Date(periodEnd * 1000)
    }

    const result = await db.$transaction(async (tx) => {
      try { await tx.stripeEvent.create({ data: { id: event.id, userId, checkoutSessionId: session.id } }) }
      catch (e) { if (isDuplicate(e)) return { skip: true }; throw e }
      await tx.user.update({
        where: { id: userId },
        data: { plan: "PRO", trialEndsAt: null, planInterval, subscriptionId: subscriptionId ?? undefined, subscriptionStatus: "ACTIVE", ...(subscriptionEndsAt ? { subscriptionEndsAt } : {}), sessionVersion: { increment: 1 } },
      })
      return { skip: false }
    }, TX_OPTS)

    if (result.skip) return
    purgeUserCache(userId)
    // Fire-and-forget: referral failure must not cause 500 → Stripe retry → idempotency skip → reward permanently lost.
    // Promise.resolve() guards against synchronous throws or non-Promise returns crashing the handler.
    Promise.resolve(checkAndApplyReferralReward(userId)).catch((e) =>
      this.logger.error("checkAndApplyReferralReward failed after checkout", { userId, eventId: event.id }, e instanceof Error ? e : undefined)
    )
  }

  private async handleInvoicePaid(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    const subDetails = invoice.parent?.type === "subscription_details" ? invoice.parent.subscription_details : null
    const subscriptionId = subDetails
      ? typeof subDetails.subscription === "string" ? subDetails.subscription : (subDetails.subscription as Stripe.Subscription | null)?.id ?? null
      // Fallback: older Stripe API versions use invoice.subscription (string or expanded object)
      : (() => {
          const sub = (invoice as unknown as Record<string, unknown>).subscription
          return typeof sub === "string" ? sub : (sub as { id?: string } | null)?.id ?? null
        })()
    if (!subscriptionId) {
      this.logger.warn("handleInvoicePaid: no subscriptionId found — one-time or non-subscription invoice, skipping", { eventId: event.id, customerId })
      return
    }

    const subscription = await this.stripeClient.retrieveSubscription(subscriptionId)
    const firstItem = subscription.items.data[0]
    if (!firstItem) return
    const renewalDate = new Date(firstItem.current_period_end * 1000)

    const result = await db.$transaction(async (tx) => {
      try { await tx.stripeEvent.create({ data: { id: event.id } }) }
      catch (e) { if (isDuplicate(e)) return { skip: true, user: null }; throw e }
      const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true, name: true, email: true, planInterval: true, subscriptionStatus: true } })
      if (!user) return { skip: false, user: null }
      await tx.stripeEvent.update({ where: { id: event.id }, data: { userId: user.id } })
      await tx.user.update({ where: { id: user.id }, data: { plan: "PRO", trialEndsAt: null, subscriptionStatus: "ACTIVE", subscriptionEndsAt: renewalDate, sessionVersion: { increment: 1 } } })
      return { skip: false, user }
    }, TX_OPTS)

    if (result.skip || !result.user) return
    purgeUserCache(result.user.id)

    if (!result.user.email) {
      this.logger.error("handleInvoicePaid: user has no email — confirmation email skipped", { eventId: event.id, userId: result.user.id })
    }
    if (emailEnabled() && resend && result.user.email) {
      const planInterval = (result.user.planInterval ?? "monthly") as "monthly" | "annual"
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "READY CV <no-reply@readycvv.com>",
        to: result.user.email,
        subject: "¡Tu suscripción Pro está activa! 🎉",
        html: subscriptionConfirmationHtml({ userName: result.user.name ?? "Usuario", userId: result.user.id, planInterval, renewalDate }),
        text: subscriptionConfirmationText({ userName: result.user.name ?? "Usuario", userId: result.user.id, planInterval, renewalDate }),
      }).catch((e) => this.logger.error("invoice.paid email failed", { eventId: event.id }, e instanceof Error ? e : undefined))
    }
  }

  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string

    const result = await db.$transaction(async (tx) => {
      try { await tx.stripeEvent.create({ data: { id: event.id } }) }
      catch (e) { if (isDuplicate(e)) return { skip: true, userId: null }; throw e }
      const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } })
      if (!user) return { skip: false, userId: null }
      await tx.stripeEvent.update({ where: { id: event.id }, data: { userId: user.id } })

      if (sub.cancel_at_period_end) {
        let cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000) : undefined
        if (!cancelAt) { const periodEnd = sub.items.data[0]?.current_period_end; if (periodEnd) cancelAt = new Date(periodEnd * 1000) }
        await tx.user.update({ where: { id: user.id }, data: { subscriptionStatus: "CANCELED", ...(cancelAt ? { subscriptionEndsAt: cancelAt } : {}), sessionVersion: { increment: 1 } } })
        await tx.auditLog.create({ data: { userId: user.id, action: "CANCEL_SUBSCRIPTION", metadata: { cancelAt: cancelAt?.toISOString() } } })
      } else if (sub.status === "active") {
        const periodEnd = sub.items.data[0]?.current_period_end
        const interval = sub.items.data[0]?.price?.recurring?.interval
        const planInterval = interval === "year" ? "annual" : "monthly"
        await tx.user.update({ where: { id: user.id }, data: { subscriptionStatus: "ACTIVE", planInterval, ...(periodEnd ? { subscriptionEndsAt: new Date(periodEnd * 1000) } : {}), sessionVersion: { increment: 1 } } })
        await tx.auditLog.create({ data: { userId: user.id, action: "SUBSCRIPTION_UPDATED", metadata: { status: "ACTIVE", planInterval, periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null } } })
      } else if (sub.status === "past_due" || sub.status === "unpaid") {
        await tx.user.update({ where: { id: user.id }, data: { subscriptionStatus: "PAST_DUE", sessionVersion: { increment: 1 } } })
        await tx.auditLog.create({ data: { userId: user.id, action: "SUBSCRIPTION_UPDATED", metadata: { status: "PAST_DUE", stripeStatus: sub.status } } })
      } else if (sub.status === "incomplete_expired" || sub.status === "paused") {
        await tx.user.update({ where: { id: user.id }, data: { plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } } })
        await tx.auditLog.create({ data: { userId: user.id, action: "SUBSCRIPTION_UPDATED", metadata: { status: "EXPIRED", stripeStatus: sub.status } } })
      }
      return { skip: false, userId: user.id }
    }, TX_OPTS)

    if (result.skip || !result.userId) return
    purgeUserCache(result.userId)
  }

  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string

    const result = await db.$transaction(async (tx) => {
      try { await tx.stripeEvent.create({ data: { id: event.id } }) }
      catch (e) { if (isDuplicate(e)) return { skip: true, userId: null }; throw e }
      const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } })
      if (!user) return { skip: false, userId: null }
      await tx.stripeEvent.update({ where: { id: event.id }, data: { userId: user.id } })
      await tx.user.update({ where: { id: user.id }, data: { plan: "UNSUBSCRIBED", trialEndsAt: null, subscriptionId: null, subscriptionEndsAt: null, subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } } })
      await tx.auditLog.create({ data: { userId: user.id, action: "CANCEL_SUBSCRIPTION", metadata: { reason: "subscription_deleted" } } })
      return { skip: false, userId: user.id }
    }, TX_OPTS)

    if (result.skip || !result.userId) return
    purgeUserCache(result.userId)
  }

  private async handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    if (sub.status !== "active") return

    const result = await db.$transaction(async (tx) => {
      try { await tx.stripeEvent.create({ data: { id: event.id } }) }
      catch (e) { if (isDuplicate(e)) return { skip: true, userId: null }; throw e }
      const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } })
      if (!user) return { skip: false, userId: null }
      const periodEnd = sub.items.data[0]?.current_period_end
      await tx.user.update({ where: { id: user.id }, data: { plan: "PRO", subscriptionId: sub.id, subscriptionStatus: "ACTIVE", trialEndsAt: null, ...(periodEnd ? { subscriptionEndsAt: new Date(periodEnd * 1000) } : {}), sessionVersion: { increment: 1 } } })
      await tx.auditLog.create({ data: { userId: user.id, action: "SUBSCRIPTION_CREATED_EXTERNAL", metadata: { subscriptionId: sub.id, status: sub.status } } })
      return { skip: false, userId: user.id }
    }, TX_OPTS)

    if (result.skip || !result.userId) return
    purgeUserCache(result.userId)
  }

  private async handleChargeRefunded(event: Stripe.Event): Promise<void> {
    const charge = event.data.object as Stripe.Charge
    const customerId = charge.customer as string
    if (!customerId) return

    const result = await db.$transaction(async (tx) => {
      try { await tx.stripeEvent.create({ data: { id: event.id } }) }
      catch (e) { if (isDuplicate(e)) return { skip: true, userId: null, partial: false, subscriptionId: null }; throw e }
      const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true, subscriptionId: true } })
      if (!user) return { skip: false, userId: null, partial: false, subscriptionId: null }
      await tx.stripeEvent.update({ where: { id: event.id }, data: { userId: user.id } })
      if (charge.amount_refunded < charge.amount) {
        await tx.auditLog.create({ data: { userId: user.id, action: "PARTIAL_REFUND", metadata: { chargeId: charge.id, amountRefunded: charge.amount_refunded, totalAmount: charge.amount } } })
        return { skip: false, userId: user.id, partial: true, subscriptionId: null }
      }
      await tx.user.update({ where: { id: user.id }, data: { plan: "UNSUBSCRIBED", subscriptionId: null, subscriptionEndsAt: null, subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } } })
      await tx.auditLog.create({ data: { userId: user.id, action: "REFUND_ISSUED", metadata: { chargeId: charge.id, amount: charge.amount_refunded } } })
      return { skip: false, userId: user.id, partial: false, subscriptionId: user.subscriptionId }
    }, TX_OPTS)

    if (result.skip || !result.userId || result.partial) return
    purgeUserCache(result.userId)
    if (result.subscriptionId) {
      await this.stripeClient.cancelSubscription(result.subscriptionId).catch((e) =>
        this.logger.error("charge.refunded sub cancel failed", { eventId: event.id }, e instanceof Error ? e : undefined)
      )
    }
  }

  private async handleDisputeCreated(event: Stripe.Event): Promise<void> {
    const dispute = event.data.object as Stripe.Dispute
    const chargeId = typeof dispute.charge === "string" ? dispute.charge : (dispute.charge as Stripe.Charge | null)?.id ?? null
    let customerId = typeof dispute.charge === "string" ? null : (dispute.charge as Stripe.Charge | null)?.customer as string | null

    if (!customerId && chargeId) {
      const charge = await this.stripeClient.retrieveCharge(chargeId)
      customerId = charge.customer as string | null
    }
    if (!customerId) return
    const resolvedCustomerId = customerId

    const result = await db.$transaction(async (tx) => {
      try { await tx.stripeEvent.create({ data: { id: event.id } }) }
      catch (e) { if (isDuplicate(e)) return { skip: true, userId: null, subscriptionId: null }; throw e }
      const user = await tx.user.findUnique({ where: { stripeCustomerId: resolvedCustomerId }, select: { id: true, subscriptionId: true } })
      if (!user) return { skip: false, userId: null, subscriptionId: null }
      await tx.stripeEvent.update({ where: { id: event.id }, data: { userId: user.id } })
      await tx.user.update({ where: { id: user.id }, data: { plan: "UNSUBSCRIBED", subscriptionId: null, subscriptionEndsAt: null, subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } } })
      await tx.auditLog.create({ data: { userId: user.id, action: "DISPUTE_CHARGEBACK", metadata: { disputeId: dispute.id, chargeId, amount: dispute.amount, reason: dispute.reason } } })
      return { skip: false, userId: user.id, subscriptionId: user.subscriptionId }
    }, TX_OPTS)

    if (result.skip || !result.userId) return
    purgeUserCache(result.userId)
    if (result.subscriptionId) {
      await this.stripeClient.cancelSubscription(result.subscriptionId).catch((e) =>
        this.logger.error("dispute.created sub cancel failed", { eventId: event.id }, e instanceof Error ? e : undefined)
      )
    }
  }

  private async handleDisputeClosed(event: Stripe.Event): Promise<void> {
    const dispute = event.data.object as Stripe.Dispute
    const chargeId = typeof dispute.charge === "string" ? dispute.charge : (dispute.charge as Stripe.Charge | null)?.id ?? null
    let customerId = typeof dispute.charge === "string" ? null : (dispute.charge as Stripe.Charge | null)?.customer as string | null

    if (!customerId && chargeId) {
      const charge = await this.stripeClient.retrieveCharge(chargeId)
      customerId = charge.customer as string | null
    }
    if (!customerId) return
    const resolvedCustomerId = customerId
    const disputeWon = dispute.status === "won"

    const result = await db.$transaction(async (tx) => {
      try { await tx.stripeEvent.create({ data: { id: event.id } }) }
      catch (e) { if (isDuplicate(e)) return { skip: true, userId: null, userEmail: null, userName: null }; throw e }
      const user = await tx.user.findUnique({ where: { stripeCustomerId: resolvedCustomerId }, select: { id: true, email: true, name: true } })
      if (!user) return { skip: false, userId: null, userEmail: null, userName: null }
      await tx.auditLog.create({ data: { userId: user.id, action: disputeWon ? "DISPUTE_WON_MANUAL_REVIEW" : "DISPUTE_CLOSED", metadata: { disputeId: dispute.id, chargeId, status: dispute.status, amount: dispute.amount } } })
      return { skip: false, userId: user.id, userEmail: user.email, userName: user.name }
    }, TX_OPTS)

    if (result.skip || !result.userId) return
    const userId = result.userId
    const userEmail = (result as { userEmail: string | null }).userEmail ?? null
    const userName = (result as { userName: string | null }).userName ?? null

    if (disputeWon) {
      // User was auto-downgraded on dispute.created. Stripe won — manual re-activation required.
      // We cannot auto-recreate the canceled subscription; admin must issue a new one or credit the account.
      this.logger.error("StripeWebhookService: DISPUTE WON — user locked out, manual re-activation required", {
        eventId: event.id, userId, disputeId: dispute.id, amount: dispute.amount,
      })
      if (emailEnabled() && resend && process.env.ADMIN_EMAIL) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "READY CV <no-reply@readycvv.com>",
          to: process.env.ADMIN_EMAIL,
          subject: `[ACTION REQUIRED] Dispute won — user locked out: ${userEmail ?? userId}`,
          text: `Stripe dispute ${dispute.id} was WON.\n\nUser: ${userName ?? "unknown"} (${userEmail ?? "no email"})\nUser ID: ${userId}\nAmount: $${(dispute.amount / 100).toFixed(2)}\n\nThe user lost Pro access when the dispute was created. Their account is currently LOCKED OUT.\n\nTo re-activate:\n1. Go to Stripe Dashboard → create a new subscription for this customer\n2. Then run: POST /api/admin/billing/reconcile-user with { "userId": "${userId}" }\n   This syncs the new subscription to the database and restores Pro access.\n\nAlternatively, issue a manual account credit in Stripe if no new subscription is needed.`,
        }).catch((e) => this.logger.error("dispute won admin email failed", { eventId: event.id }, e instanceof Error ? e : undefined))
      }
    }
  }

  private async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    const invoiceUrl = invoice.hosted_invoice_url ?? null

    const result = await db.$transaction(async (tx) => {
      try { await tx.stripeEvent.create({ data: { id: event.id } }) }
      catch (e) { if (isDuplicate(e)) return { skip: true, user: null }; throw e }
      const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true, name: true, email: true } })
      if (!user) return { skip: false, user: null }
      await tx.stripeEvent.update({ where: { id: event.id }, data: { userId: user.id } })
      await tx.user.update({ where: { id: user.id }, data: { subscriptionStatus: "PAST_DUE", sessionVersion: { increment: 1 } } })
      return { skip: false, user }
    }, TX_OPTS)

    if (result.skip || !result.user) return
    purgeUserCache(result.user.id)

    if (emailEnabled() && resend && result.user.email) {
      const firstName = result.user.name?.split(" ")[0] ?? "Usuario"
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "READY CV <no-reply@readycvv.com>",
        to: result.user.email,
        subject: "Acción requerida: problema con tu pago en READY CV",
        html: paymentFailedHtml({ firstName, userId: result.user.id, invoiceUrl }),
        text: paymentFailedText({ firstName, invoiceUrl }),
      }).catch((e) => this.logger.error("invoice.payment_failed email failed", { eventId: event.id }, e instanceof Error ? e : undefined))
    }
  }

  private async handleFraudWarning(event: Stripe.Event): Promise<void> {
    const warning = event.data.object as Stripe.Radar.EarlyFraudWarning
    const chargeId = typeof warning.charge === "string" ? warning.charge : (warning.charge as Stripe.Charge | null)?.id ?? null
    if (!chargeId) return

    const charge = await this.stripeClient.retrieveCharge(chargeId)
    const customerId = charge.customer as string | null
    if (!customerId) return

    const result = await db.$transaction(async (tx) => {
      try { await tx.stripeEvent.create({ data: { id: event.id } }) }
      catch (e) { if (isDuplicate(e)) return { skip: true, userId: null, subscriptionId: null }; throw e }
      const user = await tx.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true, subscriptionId: true } })
      if (!user) return { skip: false, userId: null, subscriptionId: null }
      await tx.user.update({ where: { id: user.id }, data: { plan: "UNSUBSCRIBED", subscriptionId: null, subscriptionEndsAt: null, subscriptionStatus: "EXPIRED", sessionVersion: { increment: 1 } } })
      await tx.auditLog.create({ data: { userId: user.id, action: "FRAUD_WARNING", metadata: { warningId: warning.id, chargeId, fraudType: warning.fraud_type, actionable: warning.actionable } } })
      return { skip: false, userId: user.id, subscriptionId: user.subscriptionId }
    }, TX_OPTS)

    if (result.skip || !result.userId) return
    purgeUserCache(result.userId)
    if (result.subscriptionId) {
      await this.stripeClient.cancelSubscription(result.subscriptionId).catch((e) =>
        this.logger.error("fraud warning sub cancel failed", { eventId: event.id }, e instanceof Error ? e : undefined)
      )
    }
    this.logger.error("StripeWebhookService: FRAUD WARNING — user auto-downgraded, review required", {
      eventId: event.id, userId: result.userId, warningId: warning.id, fraudType: warning.fraud_type, actionable: warning.actionable,
    })
    if (warning.actionable && emailEnabled() && resend && process.env.ADMIN_EMAIL) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "READY CV <no-reply@readycvv.com>",
        to: process.env.ADMIN_EMAIL,
        subject: `[ACTION REQUIRED] Stripe Radar fraud warning — userId: ${result.userId}`,
        text: `Stripe Radar issued an actionable early fraud warning.\n\nUser ID: ${result.userId}\nWarning ID: ${warning.id}\nFraud type: ${warning.fraud_type}\nCharge ID: ${chargeId}\n\nThe user has been auto-downgraded to UNSUBSCRIBED. Review in Stripe Radar and decide whether to dispute or refund.`,
      }).catch((e) => this.logger.error("fraud warning admin email failed", { eventId: event.id }, e instanceof Error ? e : undefined))
    }
  }

  private async handleCustomerUpdated(event: Stripe.Event): Promise<void> {
    const customer = event.data.object as Stripe.Customer
    const newName = typeof customer.name === "string" ? customer.name : null
    if (!newName) return

    const result = await db.$transaction(async (tx) => {
      try { await tx.stripeEvent.create({ data: { id: event.id } }) }
      catch (e) { if (isDuplicate(e)) return { skip: true, userId: null }; throw e }
      const user = await tx.user.findUnique({ where: { stripeCustomerId: customer.id }, select: { id: true } })
      if (!user) return { skip: false, userId: null }
      await tx.user.update({ where: { id: user.id }, data: { name: newName } })
      await tx.auditLog.create({ data: { userId: user.id, action: "PROFILE_SYNCED_FROM_STRIPE", metadata: { name: newName } } })
      return { skip: false, userId: user.id }
    }, TX_OPTS)

    if (result.skip || !result.userId) return
    purgeUserCache(result.userId)
  }
}
