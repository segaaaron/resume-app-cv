/**
 * Plan access rules.
 * PRO users (including the privileged admin) have full access.
 * UNSUBSCRIBED users get a limited freemium experience:
 *   - 1 CV + 1 cover letter
 *   - Lifetime quota per AI endpoint (some endpoints fully blocked)
 *   - No PDF / Word export
 *   - No import
 */

export type Plan = "UNSUBSCRIBED" | "BASIC" | "SPRINT" | "PRO" | "LIMITED"
export type SubscriptionStatus = "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "PAST_DUE"
export type Role = "USER" | "SUPER_ADMIN"

export type AiEndpointName =
  | "fill-profile"
  | "improve-bullet"
  | "improve-summary"
  | "generate-summary"
  | "tailor-cv"
  | "generate-cover-letter"
  | "improve-cover-letter"
  | "ats-score"
  | "review-cv"
  | "translate-cv"

export const AI_ENDPOINT_NAMES: readonly AiEndpointName[] = [
  "fill-profile",
  "improve-bullet",
  "improve-summary",
  "generate-summary",
  "tailor-cv",
  "generate-cover-letter",
  "improve-cover-letter",
  "ats-score",
  "review-cv",
  "translate-cv",
] as const

/**
 * Cap diario anti-abuso para planes con AI ilimitada (PRO/LIMITED).
 * El editor ya impone cooldown de 2 min por experiencia, así que un usuario
 * legítimo intensivo ronda 10-15 llamadas/día — estos topes solo frenan
 * scripting. Ventana de 24h auto-reseteable vía checkAndIncrementRateLimit
 * (sin cron). Costo máximo acotado: ~$0.05/día por usuario.
 */
export const AI_DAILY_CAP: Record<AiEndpointName, number> = {
  "improve-bullet": 30,
  "improve-summary": 20,
  "generate-summary": 20,
  "generate-cover-letter": 20,
  "improve-cover-letter": 20,
  "fill-profile": 10,
  "tailor-cv": 10,
  "ats-score": 10,
  "review-cv": 10,
  // 3/day: translation is idempotent (a CV is translated once and the copy is
  // reused); this cap only bites the re-do case (user deleted the copy).
  "translate-cv": 3,
}

export const AI_DAILY_CAP_WINDOW_MS = 24 * 60 * 60 * 1000

// UNSUBSCRIBED can download their single (basic-template) CV a bounded number of
// times per rolling 24h. This is a deliberate freemium loosening: the hard limits
// that drive conversion stay in place (1 CV, no PRO templates, no translate/clone,
// AI capped), so a few free downloads/day give a taste without removing the wall.
// PRO templates are still blocked at download for this plan (see pdf route).
export const UNSUBSCRIBED_DAILY_PDF_CAP = 3

export type PlanLimits = {
  /** -1 = unlimited */
  maxResumes: number
  /** -1 = unlimited */
  maxCoverLetters: number
  canExportPdf: boolean
  /** Lifetime quota per AI endpoint. 0 = blocked. -1 = unlimited. */
  aiLimitsByEndpoint: Record<AiEndpointName, number>
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN"
}

/**
 * A recurring subscription actually exists at the gateway, so the billing portal
 * and the self-serve cancel have something to act on.
 *
 * Deliberately NOT `isActive()`: that answers "does this user have PRO access?",
 * which is a different question. SUPER_ADMINs get access from their role and
 * BASIC/SPRINT buyers from a one-time payment that leaves subscriptionStatus at
 * "NONE" — neither has billing to manage, and offering them the Stripe portal
 * fails with `no_active_subscription` (StripeBillingService.createPortalSession).
 */
export function hasManageableBilling(subscriptionStatus?: SubscriptionStatus | string | null): boolean {
  return subscriptionStatus === "ACTIVE"
    || subscriptionStatus === "PAST_DUE"
    || subscriptionStatus === "CANCELED"
}

/** PRO access granted purely by the SUPER_ADMIN role — nothing bought, nothing to manage. */
export function isStaffAccess(role?: string | null, subscriptionStatus?: SubscriptionStatus | string | null): boolean {
  return isSuperAdmin(role) && !hasManageableBilling(subscriptionStatus)
}

/**
 * A live recurring subscription is billing this user, so NO new checkout may start.
 *
 * THE SINGLE SOURCE for this rule — `StripeCheckoutService.createSession` throws
 * `already_subscribed` on it, and the pricing UI hides the buy button on it. They
 * must never drift: a UI that offers a purchase the backend rejects produces a raw
 * error toast, and a UI that hides one the backend accepts silently loses a sale.
 *
 * Pass `isOneTimePurchase` for BASIC/SPRINT checkouts — they are stricter, see below.
 *
 * Why it stops at ACTIVE/PAST_DUE for recurring plans — direction matters:
 *   · UPGRADE (BASIC/SPRINT → PRO): status is "NONE", nothing is billing → allowed
 *     immediately. Blocking it would refuse money from a user who wants to pay.
 *   · SWITCH (monthly → annual) or RE-SUBSCRIBE after cancelling: status is
 *     "CANCELED", the subscription is already winding down → allowed, and
 *     createSession cancels the old one before opening the new checkout.
 *   · DOWNGRADE while ACTIVE (PRO → one-time BASIC/SPRINT): blocked. Provisioning a
 *     one-time plan clears `subscriptionId`, which would ORPHAN the live Stripe
 *     subscription — it keeps charging forever with nothing in our DB pointing at
 *     it. The user must cancel first and buy once the paid period ends.
 */
export function blocksNewPurchase(
  subscriptionStatus?: SubscriptionStatus | string | null,
  isOneTimePurchase = false,
): boolean {
  // Buying a one-time plan is a DOWNGRADE, and it clears `subscriptionId`. It must
  // wait until no subscription exists at all — CANCELED included. A cancelled sub is
  // still live until its period end, and Stripe will emit `customer.subscription.deleted`
  // for it later: that handler resolves the user by `stripeCustomerId` and resets them to
  // UNSUBSCRIBED with `subscriptionEndsAt: null`, which would WIPE the one-time month
  // they paid for in between. Blocking here keeps that unreachable.
  if (isOneTimePurchase) return hasManageableBilling(subscriptionStatus)

  return subscriptionStatus === "ACTIVE" || subscriptionStatus === "PAST_DUE"
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  LIMITED: {
    maxResumes: -1,
    maxCoverLetters: -1,
    canExportPdf: true,
    aiLimitsByEndpoint: {
      "fill-profile": -1,
      "improve-bullet": -1,
      "improve-summary": -1,
      "generate-summary": -1,      "tailor-cv": -1,
      "generate-cover-letter": -1,
      "improve-cover-letter": -1,
      "ats-score": -1,
      "review-cv": -1,
      "translate-cv": -1,
    },
  },
  UNSUBSCRIBED: {
    maxResumes: 1,
    maxCoverLetters: 1,
    canExportPdf: false,
    // No AI of any kind: UNSUBSCRIBED fills the CV manually. Every content
    // endpoint is blocked (0). Upgrading unlocks AI.
    aiLimitsByEndpoint: {
      "fill-profile": 0,
      "improve-bullet": 0,
      "improve-summary": 0,
      "generate-summary": 0,      "tailor-cv": 0,
      "generate-cover-letter": 0,
      "improve-cover-letter": 0,
      "ats-score": 0,
      "review-cv": 0,
      "translate-cv": 0,
    },
  },
  // BASIC: one-time, 1 calendar month. Up to 5 CVs, download unlimited times, NO AI.
  // "descarga las veces que quiera" = unlimited downloads (canExportPdf), separate from the CV cap.
  // The 5-CV cap counts clones too — a duplicated CV is 1 CV against the limit.
  BASIC: {
    maxResumes: 5,
    maxCoverLetters: 5,
    canExportPdf: true,
    aiLimitsByEndpoint: {
      "fill-profile": 0,
      "improve-bullet": 0,
      "improve-summary": 0,
      "generate-summary": 0,      "tailor-cv": 0,
      "generate-cover-letter": 0,
      "improve-cover-letter": 0,
      "ats-score": 0,
      "review-cv": 0,
      "translate-cv": 0,
    },
  },
  // SPRINT: one-time, 7 days. Content AI + PRO templates. NO tailor-cv / ats-score / review-cv (PRO only).
  SPRINT: {
    maxResumes: -1,
    maxCoverLetters: -1,
    canExportPdf: true,
    aiLimitsByEndpoint: {
      "fill-profile": -1,
      "improve-bullet": -1,
      "improve-summary": -1,
      "generate-summary": -1,      "tailor-cv": 0,
      "generate-cover-letter": -1,
      "improve-cover-letter": -1,
      "ats-score": 0,
      "review-cv": 0,
      "translate-cv": 0,
    },
  },
  PRO: {
    maxResumes: -1,
    maxCoverLetters: -1,
    canExportPdf: true,
    aiLimitsByEndpoint: {
      "fill-profile": -1,
      "improve-bullet": -1,
      "improve-summary": -1,
      "generate-summary": -1,      "tailor-cv": -1,
      "generate-cover-letter": -1,
      "improve-cover-letter": -1,
      "ats-score": -1,
      "review-cv": -1,
      "translate-cv": -1,
    },
  },
}

/**
 * Whether a plan may use the ADVANCED ATS features — `ats-score` and its two
 * quota-less companions, the deterministic re-score (`ats-rescore`) and the
 * real-PDF verify (`ats-verify-real`). Derived from the single source of truth:
 * a plan whose `ats-score` lifetime quota is 0 must not reach the F3/F4 ATS
 * routes either.
 *
 * WHY THIS EXISTS: the quota'd ATS routes already enforce PRO/LIMITED-only via
 * `enforceAIQuota` (limit 0 → 403 for BASIC/SPRINT/UNSUBSCRIBED). But
 * `ats-rescore` and `ats-verify-real` carry NO quota by design (no LLM), so
 * their only gate was `requireUser({ pro: true })` → `isActive`, which is true
 * for BASIC/SPRINT within their window — letting a non-PRO plan reach a PRO-only
 * feature (and, for verify-real, the expensive PDF render). Those routes call
 * this to close the gap without duplicating the plan policy. PRO/LIMITED → true;
 * BASIC/SPRINT/UNSUBSCRIBED → false.
 */
export function canUseAdvancedAts(plan: string): boolean {
  const limits = PLAN_LIMITS[plan as Plan]
  return !!limits && limits.aiLimitsByEndpoint["ats-score"] !== 0
}


// Anti-abuse import quota per plan — the SINGLE source of truth for whether a
// plan can import and how often. Import is open to EVERY plan (a free import is a
// conversion hook: bring your CV → see it in a template → hit the download gate →
// upgrade), bounded per rolling window so a client loop / abusive user can't rack
// up unbounded LLM cost. superadmin bypasses. Window is rolling (first import
// starts the clock).
const IMPORT_WEEK_WINDOW_MS = 7 * AI_DAILY_CAP_WINDOW_MS

export function getImportQuota(plan: string): { limit: number; windowMs: number } {
  switch (plan) {
    case "PRO":     return { limit: 5,  windowMs: AI_DAILY_CAP_WINDOW_MS }   // 5/day
    case "LIMITED": return { limit: 10, windowMs: AI_DAILY_CAP_WINDOW_MS }   // 10/day (managed)
    case "SPRINT":  return { limit: 3,  windowMs: IMPORT_WEEK_WINDOW_MS }    // 3/week (7-day plan)
    case "BASIC":   return { limit: 3,  windowMs: AI_DAILY_CAP_WINDOW_MS }   // 3/day
    // UNSUBSCRIBED: import is AI-powered (LLM parse) → blocked. Free tier builds
    // from scratch, no AI of any kind. limit 0 = the route hard-gates to upgrade.
    default:        return { limit: 0,  windowMs: AI_DAILY_CAP_WINDOW_MS }   // UNSUBSCRIBED: blocked
  }
}

export function isActive(
  plan: Plan | string,
  subscriptionEndsAt?: Date | null,
  subscriptionStatus?: SubscriptionStatus | string | null,
  role?: string | null,
  isManaged?: boolean,
  managedBlocked?: boolean,
  managedExpiresAt?: Date | null,
): boolean {
  void isManaged
  if (isSuperAdmin(role)) return true
  if (plan === "LIMITED") {
    if (managedBlocked) return false
    if (!managedExpiresAt || new Date() > managedExpiresAt) return false
    return true
  }
  if (plan === "PRO") {
    if (subscriptionStatus === "EXPIRED") return false
    if (subscriptionEndsAt && new Date() > subscriptionEndsAt) return false
    // CANCELED: paid period not yet over — allow access until subscriptionEndsAt
    // PAST_DUE: payment failed, Stripe retrying — user keeps access during retry window
    return subscriptionStatus === "ACTIVE" || subscriptionStatus === "CANCELED" || subscriptionStatus === "PAST_DUE"
  }
  // One-time plans (no Stripe subscription): active strictly while within the
  // purchased window. Expiry is set at purchase (BASIC = +1 calendar month,
  // SPRINT = +7 days). The cron / refund flow downgrades to UNSUBSCRIBED.
  if (plan === "BASIC" || plan === "SPRINT") {
    if (!subscriptionEndsAt) return false
    return new Date() <= subscriptionEndsAt
  }
  return false
}

/**
 * The plan that ACTUALLY applies right now. One-time plans (BASIC/SPRINT) fall
 * back to UNSUBSCRIBED once their window has passed, so every gate must resolve
 * the effective plan before reading limits — never trust the raw `plan` column.
 */
export function effectivePlan(user: { plan: Plan | string; subscriptionEndsAt?: Date | null }): Plan {
  if (user.plan === "BASIC" || user.plan === "SPRINT") {
    if (!user.subscriptionEndsAt || new Date() > user.subscriptionEndsAt) return "UNSUBSCRIBED"
    return user.plan
  }
  return (user.plan as Plan) ?? "UNSUBSCRIBED"
}

/** Premium (PRO) templates: available on SPRINT, PRO and LIMITED. */
export function canUsePremiumTemplates(plan: string): boolean {
  return plan === "SPRINT" || plan === "PRO" || plan === "LIMITED"
}

export function canDownloadPDF(user: { isManaged: boolean; managedDownloadLimit: number | null; managedDownloadsUsed: number }): boolean {
  if (!user.isManaged) return true
  if (user.managedDownloadLimit === null) return true
  return user.managedDownloadsUsed < user.managedDownloadLimit
}

export function getLimits(plan: string): PlanLimits {
  if (plan === "PRO") return PLAN_LIMITS.PRO
  if (plan === "LIMITED") return PLAN_LIMITS.LIMITED
  if (plan === "SPRINT") return PLAN_LIMITS.SPRINT
  if (plan === "BASIC") return PLAN_LIMITS.BASIC
  return PLAN_LIMITS.UNSUBSCRIBED
}
