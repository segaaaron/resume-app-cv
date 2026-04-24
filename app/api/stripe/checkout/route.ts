import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { z } from "zod"

const schema = z.object({
  plan: z.enum(["trial", "pro"]),
})

const PRICE_IDS: Record<string, string | undefined> = {
  trial: process.env.STRIPE_PRICE_ID_TRIAL,
  pro: process.env.STRIPE_PRICE_ID_PRO,
}

export async function POST(req: Request) {
  if (!stripeEnabled() || !stripe) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 422 })
  }

  const priceId = PRICE_IDS[parsed.data.plan]
  if (!priceId) {
    return NextResponse.json({ error: "Plan not configured" }, { status: 503 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, stripeCustomerId: true, plan: true, subscriptionStatus: true },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  // Prevent re-purchasing a trial if already used
  if (parsed.data.plan === "trial" && (user.plan === "TRIAL" || user.plan === "PRO")) {
    return NextResponse.json({ error: "Trial already used" }, { status: 400 })
  }

  // Block checkout if already has active subscription
  if (user.subscriptionStatus === "ACTIVE") {
    return NextResponse.json({ error: "Already subscribed" }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })

  // Create or reuse Stripe customer
  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await db.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard/resumes?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
