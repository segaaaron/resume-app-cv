import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Users who canceled and whose period has now ended
  const expired = await db.user.findMany({
    where: {
      plan: "PRO",
      subscriptionStatus: "CANCELED",
      subscriptionEndsAt: { lt: now },
    },
    select: { id: true },
  })

  if (expired.length === 0) {
    return NextResponse.json({ downgraded: 0 })
  }

  const ids = expired.map((u) => u.id)

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

  return NextResponse.json({ downgraded: ids.length })
}
