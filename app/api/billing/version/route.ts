import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })

  const allowed = await checkRateLimit(session.user.id, "billing-version", 120)
  if (!allowed) return apiError(429, "Rate limited", { req })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { sessionVersion: true },
  })
  if (!user) return apiError(404, "Not found", { req })

  return NextResponse.json({ version: user.sessionVersion })
}
