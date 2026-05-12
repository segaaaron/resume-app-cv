import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/ai-client"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const allowed = await checkRateLimit(session.user.id, "post-purchase-status", 60)
  if (!allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, sessionVersion: true },
  })
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    plan:               user.plan,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() ?? null,
    sessionVersion:     user.sessionVersion,
  })
}
