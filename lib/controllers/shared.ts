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
  ctx?: { userId?: string; userEmail?: string; route?: string; req?: Request; payload?: unknown },
): NextResponse {
  if (err instanceof AppError) {
    // Log EVERY handled failure — 4xx and 5xx alike (CEO directive: the Service
    // Errors panel must surface ALL server errors, not only 500s). A 5xx is a real
    // server fault (AI returned malformed JSON, a parse blew up). A 4xx is a
    // rejected request (bad input, quota, off-topic, plan gate) — still a failure
    // the admin wants to see (e.g. a user who couldn't generate a cover letter).
    // The status is stored so the panel can tell a rejection from a crash.
    // Pure auth challenges (401) never reach here — requireUser/requireAuth return
    // before the try — so this does not flood with unauthenticated bot traffic.
    logHandledFailure(err.code, err.status, ctx, err)
    return NextResponse.json({ error: err.code, ...err.extra }, { status: err.status })
  }
  // Unhandled throw — always a 500, always logged.
  const message = err instanceof Error && err.message ? err.message : "unhandled error"
  logHandledFailure(message, 500, ctx, err)
  return NextResponse.json({ error: "server_error" }, { status: 500 })
}

/**
 * Build an error RESPONSE that is also recorded in the Service Errors sink.
 *
 * The gap this closes: a route that `return NextResponse.json({error}, {status})`
 * — validation 422s, quota 429s, manual 5xx — never throws, so neither
 * `handleError` nor Next's `onRequestError` ever sees it. Those failures were
 * invisible in the admin dashboard. Route every returned error through here and
 * the panel becomes exhaustive: one sink, every failure, with real message +
 * status + endpoint + who hit it.
 *
 * 401 (unauthenticated) is deliberately NOT logged: it is an auth challenge, not
 * a service fault, and logging every logged-out/bot request would bury the real
 * errors. Everything else (403/404/422/429/5xx) is recorded.
 */
export function apiError(
  status: number,
  code: string,
  ctx?: { req?: Request; route?: string; userId?: string; userEmail?: string; payload?: unknown; extra?: Record<string, unknown> },
): NextResponse {
  if (status !== 401) {
    logHandledFailure(code, status, ctx && { userId: ctx.userId, userEmail: ctx.userEmail, route: ctx.route, req: ctx.req, payload: ctx.payload }, undefined)
  }
  return NextResponse.json({ error: code, ...(ctx?.extra ?? {}) }, { status })
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
  ctx: { userId?: string; userEmail?: string; route?: string; req?: Request; payload?: unknown } | undefined,
  err: unknown,
): void {
  let route = ctx?.route
  let method: string | undefined
  let query: string | undefined
  if (ctx?.req) {
    try {
      const u = new URL(ctx.req.url)
      if (!route) route = u.pathname
      query = u.search || undefined
      method = ctx.req.method
    } catch { /* url unpar. — leave route/method unset */ }
  }
  const source = route ? serviceFromRoute(route) : undefined
  const payload = ctx?.payload !== undefined ? safePayload(ctx.payload) : undefined
  logger.error(
    message,
    {
      status,
      ...(source ? { source } : {}),
      ...(route ? { route } : {}),
      ...(method ? { method } : {}),
      ...(query ? { query } : {}),
      ...(ctx?.userId ? { userId: ctx.userId } : {}),
      ...(ctx?.userEmail ? { userEmail: ctx.userEmail } : {}),
      ...(payload ? { payload } : {}),
    },
    err instanceof Error ? err : undefined,
  )
}

/** Serialize the request body for the error log, bounded so a huge résumé JSON
 *  can't bloat the row. Best-effort — a non-serializable payload is just skipped. */
function safePayload(p: unknown): string | undefined {
  try {
    const s = typeof p === "string" ? p : JSON.stringify(p)
    if (!s) return undefined
    return s.length > 2000 ? s.slice(0, 2000) + "…(truncated)" : s
  } catch {
    return undefined
  }
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
