import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { purgeUserCache } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"

const schema = z.object({
  userId: z.string().min(1),
})

export async function POST(req: Request) {
  if (!checkOrigin(req)) {
    return apiError(403, "Forbidden", { req })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return apiError(401, "Unauthorized", { req })
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return apiError(403, "Forbidden", { req })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return apiError(400, "Invalid payload", { req })
  }

  const { userId } = parsed.data

  if (userId === session.user.id) {
    return apiError(400, "Cannot invalidate your own session", { req })
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  })
  if (!target || target.deletedAt) {
    return apiError(404, "User not found", { req })
  }

  const now = new Date()
  const updated = await db.user.update({
    where: { id: userId },
    data:  { sessionVersion: { increment: 1 }, forceLogoutAt: now, activeSessionToken: null },
    select: { sessionVersion: true },
  })

  await db.auditLog.create({
    data: { userId, action: "ADMIN_FORCE_LOGOUT", metadata: { byAdmin: session.user.id, at: now.toISOString() } },
  })

  // purge in-process cache immediately (best-effort for single-instance)
  purgeUserCache(userId)

  return NextResponse.json({ success: true, userId, sessionVersion: updated.sessionVersion })
}
