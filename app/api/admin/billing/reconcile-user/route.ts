import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth, purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { checkOrigin } from "@/lib/csrf"
import { createLogger } from "@/lib/logger"
import { z } from "zod"
import type Stripe from "stripe"
import { SubscriptionStatus, Prisma } from "@prisma/client"

const logger = createLogger("reconcile-user")

const schema = z.object({
  userId: z.string().min(1),
})

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":             return SubscriptionStatus.ACTIVE
    case "canceled":           return SubscriptionStatus.CANCELED
    case "past_due":           return SubscriptionStatus.PAST_DUE
    case "unpaid":             return SubscriptionStatus.PAST_DUE
    case "incomplete":         return SubscriptionStatus.PAST_DUE
    case "incomplete_expired": return SubscriptionStatus.EXPIRED
    case "paused":             return SubscriptionStatus.CANCELED
    case "trialing":           return SubscriptionStatus.ACTIVE
    default:                   return SubscriptionStatus.EXPIRED
  }
}

export async function POST(req: Request) {
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (session.user.role !== "SUPER_ADMIN") return apiError(403, "Forbidden", { req })

  if (!stripeEnabled() || !stripe) {
    return apiError(503, "Stripe not configured", { req })
  }

  let body: unknown
  try { body = await req.json() } catch { return apiError(400, "Invalid JSON", { req }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return apiError(422, "Invalid payload", { req })

  const { userId } = parsed.data

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { id: true, stripeCustomerId: true, plan: true, subscriptionStatus: true, subscriptionEndsAt: true, deletedAt: true },
  })
  if (!user || user.deletedAt) return apiError(404, "User not found", { req })

  if (!user.stripeCustomerId) {
    return apiError(400, "User has no Stripe customer", { req })
  }

  const before = { plan: user.plan, subscriptionStatus: user.subscriptionStatus, subscriptionEndsAt: user.subscriptionEndsAt }

  // Fetch subscriptions from Stripe — source of truth
  let subscriptions: Stripe.ApiList<Stripe.Subscription>
  try {
    subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      limit:    10,
      status:   "all",
      expand:   ["data.items"],
    })
  } catch (e) {
    logger.error("reconcile-user: Stripe API error", { userId }, e instanceof Error ? e : undefined)
    await db.auditLog.create({
      data: { userId, action: "ADMIN_RECONCILE_USER", metadata: { byAdmin: session.user.id, error: String(e), outcome: "stripe_error" } },
    })
    return NextResponse.json({ error: "Stripe API error" }, { status: 502 })
  }

  // Sort by created desc (most recent first), pick the first non-canceled, fall back to most recent
  const sorted = [...subscriptions.data].sort((a, b) => b.created - a.created)
  const sub    = sorted.find((s) => s.status !== "canceled") ?? sorted[0] ?? null

  let reconciled: Record<string, unknown>

  if (!sub) {
    reconciled = await db.user.update({
      where: { id: userId },
      data: {
        plan:               "UNSUBSCRIBED",
        subscriptionId:     null,
        subscriptionStatus: "EXPIRED",
        subscriptionEndsAt: null,
        sessionVersion:     { increment: 1 },
      },
      select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, sessionVersion: true },
    })
    purgeUserCache(userId)

    await db.auditLog.create({
      data: { userId, action: "ADMIN_RECONCILE_USER", metadata: { byAdmin: session.user.id, before, after: reconciled, source: "no_stripe_subscription" } as Prisma.InputJsonValue },
    })
    return NextResponse.json({ userId, before, reconciled, source: "no_stripe_subscription" })
  }

  const firstItem      = sub.items.data[0]
  const interval       = firstItem?.price?.recurring?.interval === "year" ? "annual" : "monthly"
  const internalStatus = mapStripeStatus(sub.status)
  const periodEnd      = firstItem?.current_period_end
  const endsAt         = periodEnd ? new Date(periodEnd * 1000) : null
  const plan           = internalStatus === SubscriptionStatus.EXPIRED ? "UNSUBSCRIBED" : "PRO"

  reconciled = await db.user.update({
    where: { id: userId },
    data: {
      plan,
      planInterval:       interval,
      subscriptionId:     sub.id,
      subscriptionStatus: internalStatus,
      ...(endsAt ? { subscriptionEndsAt: endsAt } : {}),
      sessionVersion:     { increment: 1 },
    },
    select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, sessionVersion: true },
  })

  purgeUserCache(userId)

  await db.auditLog.create({
    data: { userId, action: "ADMIN_RECONCILE_USER", metadata: { byAdmin: session.user.id, before, after: reconciled, stripeSubId: sub.id, stripeStatus: sub.status } as Prisma.InputJsonValue },
  })

  return NextResponse.json({ userId, before, reconciled, stripeSubId: sub.id, stripeStatus: sub.status, source: "stripe_subscription" })
}
