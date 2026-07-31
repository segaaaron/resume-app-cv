// lib/controllers/shared.ts
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { AppError } from "@/lib/services/auth/AppError"
import { createLogger } from "@/lib/logger"

const logger = createLogger("controller")

/**
 * Map a request path to a service family for the Service Errors dashboard:
 * "/api/ai/tailor-cv" → "ai", "/api/stripe/webhook" → "stripe", "/api/user/x" → "user".
 * Falls back to the first segment (or "app") for non-/api routes.
 */
function serviceFromRoute(route: string): string {
  const segs = route.split("/").filter(Boolean)
  if (segs[0] === "api" && segs[1]) return segs[1]
  return segs[0] ?? "app"
}

export async function requireAuth(req: Request): Promise<{ userId: string } | NextResponse> {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  return { userId: session.user.id }
}

export function handleError(
  err: unknown,
  ctx?: { userId?: string; userEmail?: string; route?: string; req?: Request },
): NextResponse {
  if (err instanceof AppError) {
    // A 5xx AppError is a REAL server failure — the AI returned malformed JSON
    // ("invalid_response_format"), a parse blew up ("parse_error"), etc. It was
    // returned to the user as a 500 but never logged, so the Service Errors panel
    // showed "all clear" while review/tailor were actually failing. Log it exactly
    // like an unhandled throw. A 4xx AppError is an EXPECTED client outcome (bad
    // input, quota, off-topic) and must stay OUT of the panel.
    if (err.status >= 500) logHandledFailure(err.code, err.status, ctx, err)
    return NextResponse.json({ error: err.code, ...err.extra }, { status: err.status })
  }
  // Unhandled throw — always a 500, always logged.
  const message = err instanceof Error && err.message ? err.message : "unhandled error"
  logHandledFailure(message, 500, ctx, err)
  return NextResponse.json({ error: "server_error" }, { status: 500 })
}

/**
 * Send a server failure to the Service Errors sink (via logger.error → __errorLogSink).
 *
 * The message MUST be the actual error text, not a fixed constant: a constant
 * collapses every 500 into ONE unsearchable fingerprint with no endpoint. The
 * dashboard groups by (source|endpoint|message) and searches message/userEmail/userId,
 * so a real message + endpoint + who-hit-it is what makes a failure visible and
 * attributable. The service label is derived from the route (ai / stripe / paypal /
 * user / cron …) so "which service failed" is answerable and the per-service colour
 * lights up.
 */
function logHandledFailure(
  message: string,
  status: number,
  ctx: { userId?: string; userEmail?: string; route?: string; req?: Request } | undefined,
  err: unknown,
): void {
  let route = ctx?.route
  if (!route && ctx?.req) {
    try { route = new URL(ctx.req.url).pathname } catch { /* url unpar. — leave route unset */ }
  }
  const source = route ? serviceFromRoute(route) : undefined
  logger.error(
    message,
    {
      status,
      ...(source ? { source } : {}),
      ...(route ? { route } : {}),
      ...(ctx?.userId ? { userId: ctx.userId } : {}),
      ...(ctx?.userEmail ? { userEmail: ctx.userEmail } : {}),
    },
    err instanceof Error ? err : undefined,
  )
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
    email: string
    plan: string
    subscriptionStatus: string | null
    subscriptionEndsAt: Date | null
    role: string
    emailVerified: Date | null
    isManaged: boolean
    managedBlocked: boolean
    managedExpiresAt: Date | null
    managedDownloadLimit: number | null
    managedDownloadsUsed: number
    managedResumeLimit: number | null
    managedCoverLetterLimit: number | null
  }
}

/**
 * Single-query auth helper. Combines session check + plan check in one DB round-trip:
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
  const { isActive, effectivePlan } = await import("@/lib/plans")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true, emailVerified: true, isManaged: true, managedBlocked: true, managedExpiresAt: true, managedDownloadLimit: true, managedDownloadsUsed: true, managedResumeLimit: true, managedCoverLetterLimit: true },
  })

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (opts.emailVerified && !user.emailVerified) {
    return NextResponse.json({ error: "email_not_verified" }, { status: 403 })
  }

  if (opts.pro && !isActive(
    user.plan,
    user.subscriptionEndsAt,
    user.subscriptionStatus,
    user.role,
    user.isManaged,
    user.managedBlocked,
    user.managedExpiresAt,
  )) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  // Resolve the EFFECTIVE plan (expired BASIC/SPRINT → UNSUBSCRIBED) so every
  // downstream consumer (AI quota, cover-letter limits, …) gates correctly even
  // before the cron downgrades the row.
  user.plan = effectivePlan(user) as typeof user.plan

  return { userId: user.id, user }
}
