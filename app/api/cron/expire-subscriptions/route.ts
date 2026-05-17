import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { purgeUserCache } from "@/lib/auth"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Users who canceled and whose period has now ended
  const canceled = await db.user.findMany({
    where: {
      plan: "PRO",
      subscriptionStatus: "CANCELED",
      subscriptionEndsAt: { lt: now },
    },
    select: { id: true },
  })

  // Webhook drift guard: PRO/ACTIVE users whose subscriptionEndsAt is in the past
  // (webhook subscription.deleted or invoice.paid failed to process)
  // PAST_DUE excluded — Stripe smart-retry can run up to ~3 weeks; do not downgrade mid-retry
  const activeStale = await db.user.findMany({
    where: {
      plan: "PRO",
      subscriptionStatus: "ACTIVE",
      subscriptionEndsAt: { lt: now },
    },
    select: { id: true },
  })

  const ids = [...new Set([...canceled, ...activeStale].map((u) => u.id))]

  if (ids.length === 0) {
    return NextResponse.json({ downgraded: 0 })
  }

  await db.user.updateMany({
    where: { id: { in: ids } },
    data: {
      plan: "UNSUBSCRIBED",
      subscriptionId: null,
      subscriptionEndsAt: null,
      subscriptionStatus: "EXPIRED",
      sessionVersion: { increment: 1 },
    },
  })

  for (const id of ids) purgeUserCache(id)

  return NextResponse.json({ downgraded: ids.length, canceledCount: canceled.length, stalePROCount: activeStale.length })
}
