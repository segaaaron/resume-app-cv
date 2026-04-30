import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { checkOrigin } from "@/lib/csrf"

export async function POST(req: Request) {
  if (!stripeEnabled() || !stripe) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionId: true, subscriptionStatus: true },
  })

  if (!user?.subscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 })
  }

  if (user.subscriptionStatus === "CANCELED") {
    return NextResponse.json({ error: "Subscription already canceled" }, { status: 400 })
  }

  // Cancel at period end — user keeps access until subscriptionEndsAt, no auto-renewal
  await stripe.subscriptions.update(user.subscriptionId, {
    cancel_at_period_end: true,
  })

  // Update DB immediately — webhook will also fire but this keeps UI in sync faster
  await db.user.update({
    where: { id: session.user.id },
    data: { subscriptionStatus: "CANCELED" },
  })

  return NextResponse.json({ success: true })
}
