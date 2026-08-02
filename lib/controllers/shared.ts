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

// Human-readable "why it failed" for the terse AppError codes, so the Service
// Errors panel shows a real explanation instead of a bare code like "off_topic".
// The code is kept as a prefix so it stays searchable. Unknown codes fall back
// to the code itself; genuine unhandled throws already log their real message.
const ERROR_DESCRIPTIONS: Record<string, string> = {
  // ── AI / content generation ────────────────────────────────────────────────
  off_topic: "the AI returned an empty result — the input lacked enough job/career context (no target role or company, or too thin) to write anything, or was off-topic",
  invalid_response_format: "the AI replied in an unexpected shape (not the JSON the app expected) — a model or parsing failure",
  parse_error: "could not parse the AI response as JSON",
  missing_content: "no content was provided to process",
  not_enough_data: "the input had too little content for the AI to produce a useful result",
  not_enough_resume_data: "the résumé lacks enough content (experience/skills) to run this AI action",
  not_extractable: "could not extract text from the uploaded file (scanned image, empty, or unsupported PDF)",
  nothing_to_translate: "the résumé had no translatable content",
  empty: "the generated/exported output came back empty",

  // ── Input / validation ─────────────────────────────────────────────────────
  invalid_input: "the submitted text failed validation (empty, too long, or malformed)",
  invalid_data: "the request body did not match the expected schema",
  invalid_payload: "the request/webhook body was malformed or failed schema validation",
  invalid: "a submitted value was invalid (e.g. a wrong verification code)",
  invalid_name: "the provided name is invalid (empty or unsupported characters)",
  invalid_email: "the email address is invalid",
  invalid_code: "the code entered is invalid or does not match",
  invalid_token: "the token is missing, malformed, or was tampered with",
  token_expired: "the token has expired and is no longer valid",
  expired: "the link or challenge has expired",

  // ── Quota / rate limit / plan gate ─────────────────────────────────────────
  quota_exceeded: "the user reached their AI usage limit for their plan",
  free_quota_exhausted: "the user used up their free-tier allowance for this action",
  daily_cap_reached: "the daily usage cap for this action was reached",
  free_daily_download_cap: "the free-tier daily PDF download limit was reached",
  rate_limited: "too many requests in a short window — the caller was throttled",
  rate_limit_exceeded: "request rate limit exceeded — the caller was throttled",
  too_many_attempts: "too many failed attempts — temporarily locked out",
  max_attempts: "the maximum number of attempts was reached",
  pro_required: "the action requires an active Pro plan",
  feature_pro_only: "this feature is available on Pro plans only",
  premium_template_requires_upgrade: "the chosen template requires a paid plan",
  subscription_required: "an active subscription is required for this action",
  plan_not_allowed: "the user's plan is not allowed to perform the requested action",
  plan_limit_resume: "the user hit the résumé count limit for their plan",
  plan_limit_cover_letter: "the user hit the cover-letter count limit for their plan",
  managed_account: "a managed (admin-provisioned) account cannot perform this itself — it must contact its administrator",
  eu_consent_required: "EU consent must be accepted before starting checkout",

  // ── Auth / session / account ───────────────────────────────────────────────
  email_not_verified: "the user's email is not verified — action requires a verified account",
  user_not_found: "no user matches the request",
  email_taken: "the email address is already registered",
  email_exists: "the email address is already registered",
  blocked: "temporarily blocked after repeated failed attempts",
  no_challenge: "no active verification challenge exists for this session",
  invalid_or_no_challenge: "the verification challenge is missing or the submitted code is wrong",
  no_pending: "no pending registration/verification to confirm",
  no_reset_request: "no password-reset request is pending for this account",
  already_used: "the reset link/token was already used",
  server_misconfiguration: "a required server setting is missing or misconfigured",

  // ── Payments — Stripe / PayPal ─────────────────────────────────────────────
  payments_not_configured: "the payment gateway is not configured (API keys missing) — checkout/billing is disabled",
  plan_not_configured: "the requested plan has no configured price ID on the gateway",
  checkout_failed: "the checkout session could not be created at the gateway",
  checkout_url_missing: "the gateway returned no checkout/redirect URL",
  paypal_no_approval_url: "PayPal returned no approval URL to redirect the buyer to",
  invalid_signature: "the webhook signature failed verification — the event was not trusted",
  handler_error: "the webhook handler threw while processing the event (the gateway will retry)",
  refetch_failed: "could not re-fetch the resource from the payment gateway",
  subscription_not_active: "there is no active subscription to act on",
  already_subscribed: "the user already has an active subscription",
  already_canceled: "the subscription is already canceled",
  no_active_subscription: "no active subscription to manage/cancel",

  // ── Resources ──────────────────────────────────────────────────────────────
  not_found: "the requested resource does not exist or does not belong to this user",
  snapshot_corrupted: "the stored résumé snapshot is corrupted or unreadable",
  unavailable: "the service or data is temporarily unavailable",
  forbidden: "the caller is not allowed to access this resource",
}
function describeError(code: string, status: number): string {
  const d = ERROR_DESCRIPTIONS[code]
  return d ? `${code} (${status}) — ${d}` : code
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
    logHandledFailure(describeError(err.code, err.status), err.status, ctx, err)
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
    logHandledFailure(describeError(code, status), status, ctx && { userId: ctx.userId, userEmail: ctx.userEmail, route: ctx.route, req: ctx.req, payload: ctx.payload }, undefined)
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
