// lib/controllers/shared.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { AppError } from "@/lib/services/auth/AppError"
import { createLogger } from "@/lib/logger"

const logger = createLogger("controller")

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
  logger.error("unhandled error", {}, err)
  return NextResponse.json({ error: "server_error" }, { status: 500 })
}

/** @deprecated Use requireUser({ pro: true }) to avoid double DB round-trip */
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

interface RequireUserOptions {
  /** When true, checks that the user has an active Pro plan. Returns 403 if not. */
  pro?: boolean
  /** When true, also validates CSRF origin header. Returns 403 if invalid. */
  csrf?: boolean
  /**
   * When true, requires the user's email to be verified. Returns 403 `email_not_verified`
   * otherwise. Use on any endpoint that consumes server resources (AI credits, downloads,
   * new resumes/cover letters) so throwaway / unverified accounts can't abuse the free tier.
   */
  emailVerified?: boolean
}

interface RequireUserSuccess {
  userId: string
  user: {
    id: string
    plan: string
    subscriptionStatus: string | null
    subscriptionEndsAt: Date | null
    role: string
    emailVerified: Date | null
  }
}

/**
 * Single-query auth helper. Replaces the requireAuth + requireProUser two-step:
 * 1. Calls auth() once for the session.
 * 2. Calls db.user.findUnique() once with the fields needed for plan checks.
 * 3. Optionally enforces Pro plan and/or CSRF origin.
 *
 * Returns NextResponse on any auth/authz failure, or RequireUserSuccess on success.
 */
export async function requireUser(
  req: Request,
  opts: RequireUserOptions = {},
): Promise<NextResponse | RequireUserSuccess> {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (opts.csrf && !checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { db } = await import("@/lib/db")
  const { isActive } = await import("@/lib/plans")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true, emailVerified: true },
  })

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (opts.emailVerified && !user.emailVerified) {
    return NextResponse.json({ error: "email_not_verified" }, { status: 403 })
  }

  if (opts.pro && !isActive(user.plan, user.subscriptionEndsAt, user.subscriptionStatus, user.role)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  return { userId: user.id, user }
}
