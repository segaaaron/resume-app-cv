import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/ai-client"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })

  const allowed = await checkRateLimit(session.user.id, "post-purchase-status", 60)
  if (!allowed) return apiError(429, "Rate limited", { req })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, sessionVersion: true },
  })
  if (!user) return apiError(404, "Not found", { req })

  return NextResponse.json({
    plan:               user.plan,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() ?? null,
    sessionVersion:     user.sessionVersion,
  })
}
