import { NextResponse } from "next/server"
import { auth, purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { checkOrigin } from "@/lib/csrf"
import { z } from "zod"
import type Stripe from "stripe"
import { SubscriptionStatus, Prisma } from "@prisma/client"

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
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (!stripeEnabled() || !stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 422 })

  const { userId } = parsed.data

  const user = await db.user.findUnique({
    where:  { id: userId },
    select: { id: true, stripeCustomerId: true, plan: true, subscriptionStatus: true, subscriptionEndsAt: true, deletedAt: true },
  })
  if (!user || user.deletedAt) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: "User has no Stripe customer" }, { status: 400 })
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
    console.error("[reconcile] Stripe API error", { userId, error: e })
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
