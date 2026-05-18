// lib/controllers/shared.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { AppError } from "@/lib/services/auth/AppError"

export async function requireAuth(req: Request): Promise<{ userId: string } | NextResponse> {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return { userId: session.user.id }
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json({ error: err.code, ...err.extra }, { status: err.status })
  }
  console.error("[controller] unhandled error", err)
  return NextResponse.json({ error: "server_error" }, { status: 500 })
}

export async function requireProUser(userId: string): Promise<NextResponse | null> {
  const { db } = await import("@/lib/db")
  const { isActive } = await import("@/lib/plans")
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true },
  })
  if (!isActive(user?.plan ?? "UNSUBSCRIBED", user?.subscriptionEndsAt, user?.subscriptionStatus, user?.role)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }
  return null
}
