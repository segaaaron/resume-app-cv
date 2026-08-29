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
  | "generate-summary"
  | "tailor-cv"
  | "skill-bullet"
  | "merge-bullets"
  | "generate-cover-letter"
  | "improve-cover-letter"
  | "ats-score"
  | "ats3"
  | "review-cv"
  | "translate-cv"

export const AI_ENDPOINT_NAMES: readonly AiEndpointName[] = [
  "fill-profile",
  "improve-bullet",
  "generate-summary",
  "tailor-cv",
  "skill-bullet",
  "merge-bullets",
  "generate-cover-letter",
  "improve-cover-letter",
  "ats-score",
  // El motor v3. Hereda EXACTAMENTE lo de "ats-score" en los cinco planes: una
  // petición, una cuota, el mismo tope diario y las mismas puertas. Ningún plan
  // gana ni pierde nada por esto — lo que cambia es qué motor contesta.
  "ats3",
  "review-cv",
  "translate-cv",
] as const

/**
 * Cap diario anti-abuso para planes con AI ilimitada (PRO/LIMITED).
 * El editor ya impone cooldown de 2 min por experiencia, así que un usuario
 * legítimo intensivo ronda 10-15 llamadas/día — estos topes solo frenan
 * scripting. Ventana de 24h auto-reseteable vía checkAndIncrementRateLimit
 * (sin cron). Costo máximo acotado: ~$0.05/día por usuario.
 *
 * ats-score y tailor-cv van a 20: corren JUNTOS en cada análisis, así que el tope
 * se agota al doble de velocidad de lo que sugiere el número. Con el reembolso de
 * cupo por respuesta cacheada (ver refundDailyQuota), solo cuentan los análisis
 * que de verdad procesan algo nuevo.
 *
 * Las tres acciones por-bullet subieron a 50 tras medirlo contra un CV real: el
 * panel ATS ofrece un botón por skill sin evidencia y otro por bullet débil, así
 * que un solo repaso serio de un CV con cinco puestos consume decenas de llamadas
 * sin nada de abuso. El tope viejo cortaba a mitad de la primera pasada y se leía
 * como un producto roto. Son las llamadas más baratas que hacemos (un bullet,
 * ~150 tokens de salida), así que el techo de costo apenas se mueve.
 */
export const AI_DAILY_CAP: Record<AiEndpointName, number> = {
  "improve-bullet": 50,
  "generate-summary": 20,
  "generate-cover-letter": 20,
  "improve-cover-letter": 20,
  // 20, not 10: the guided assistant makes several fill-profile calls to build
  // ONE résumé — the opening draft, the duties menu per role, the certifications
  // list. At 10 a PRO user on an "unlimited" plan hit the anti-abuse wall after
  // two CVs in a day, which is a support ticket, not abuse.
  "fill-profile": 20,
  "tailor-cv": 20,
  "skill-bullet": 50,
  // Mirrors skill-bullet exactly: same surface (one bullet written into one
  // role) and the same PRO/LIMITED-only grant, so no plan gains or loses.
  "merge-bullets": 50,
  "ats-score": 20,
  // Igual que ats-score, y por la misma razón: una corrida es UNA petición y
  // una cuota. Con el reembolso por respuesta servida del caché, reanalizar un
  // CV que no cambió no gasta ranura, porque no gasta una llamada.
  "ats3": 20,
  "review-cv": 10,
  // 3/day: translation is idempotent (a CV is translated once and the copy is
  // reused); this cap only bites the re-do case (user deleted the copy).
  "translate-cv": 3,
}

export const AI_DAILY_CAP_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * Days a PAST_DUE subscriber keeps access AFTER the period they paid for has ended.
 *
 * Stripe retries a failed renewal for up to 14 days (Smart Retries). Without a grace
 * window, access ended the moment the paid period did — the customer lost the product
 * on day one of a recovery process that usually succeeds, over an expired card or a
 * bank block they need a few days to resolve. Failed payments are 20-40% of SaaS churn,
 * and most of it is recoverable; cutting access first is what makes it unrecoverable.
 *
 * Seven days is the industry norm: long enough to replace a card or call a bank, short
 * enough that it neither inflates MRR with non-payers nor removes the urgency to fix it.
 *
 * ONLY for PAST_DUE. A CANCELED subscriber chose to leave and gets exactly the period
 * they paid for — extending that would be giving away service nobody is trying to
 * collect. If Stripe cancels the subscription before the window is over, the deletion
 * event downgrades the user immediately and this never applies.
 */
export const PAST_DUE_GRACE_DAYS = 7

/**
 * Days after the last paid period ends before the expiry cron force-downgrades a
 * subscription still stuck in PAST_DUE.
 *
 * The cron cannot touch PAST_DUE rows earlier than this: Stripe Smart Retries run for
 * up to ~14 days, and downgrading mid-retry would clobber a subscription Stripe might
 * still recover. But it MUST touch them eventually. If the Dashboard is set to "cancel
 * after retries", `customer.subscription.deleted` cleans the row up first and this never
 * fires. If set to "mark unpaid", `customer.subscription.updated` (status `unpaid`) now
 * revokes access directly in the webhook, so that path never reaches PAST_DUE either.
 * Only "leave past due" emits NO terminating event — and without this backstop that user
 * is stranded: `isActive` cut their access at PAST_DUE_GRACE_DAYS, yet
 * `blocksNewPurchase(PAST_DUE)` still refuses any new checkout, so they have no access AND
 * cannot buy again. This makes the cleanup independent of a Dashboard setting we do not control.
 *
 * 21 days clears the whole documented retry window with margin; measured from
 * `subscriptionEndsAt`, which for a PAST_DUE row still holds the last PAID period end
 * (payment_failed never advances it).
 */
export const PAST_DUE_DOWNGRADE_AFTER_DAYS = 21

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
  /**
   * Whether the plan may download a PDF AT ALL, before any daily cap.
   *
   * DO NOT read this as "how many downloads": UNSUBSCRIBED had `false` here while the
   * route hands it UNSUBSCRIBED_DAILY_PDF_CAP downloads a day, so the field disagreed
   * with the product. The whole download policy — plan window, premium template, free
   * daily cap, managed quota — is decided in `app/api/resumes/[id]/pdf/route.ts`; this
   * flag only answers the coarse question the UI asks when it decides whether to show a
   * download button or an upgrade CTA.
   */
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

/**
 * The Stripe-hosted billing portal can actually be opened for this user.
 *
 * THE SINGLE SOURCE for that question — it mirrors the only two things
 * `StripeBillingService.createPortalSession` needs, so no surface can offer a
 * portal button the route then rejects with `no_active_subscription` (400), which
 * the UI can only render as a generic error toast.
 *
 * `hasManageableBilling` alone is NOT enough, and that gap shipped: a row can carry
 * subscriptionStatus = ACTIVE with stripeCustomerId = null whenever the plan was
 * granted outside checkout (admin grant, manual DB fix, migrated data). Status says
 * yes, Stripe has no customer to open, the request 400s.
 *
 * PayPal payers are a different question — they never get a stripeCustomerId and
 * PayPal has no hosted portal at all, so callers route them to the in-app cancel
 * instead. Ask `hasManageableBilling` for them, not this.
 */
export function hasStripeBillingPortal(
  subscriptionStatus?: SubscriptionStatus | string | null,
  stripeCustomerId?: string | null,
): boolean {
  return hasManageableBilling(subscriptionStatus) && Boolean(stripeCustomerId)
}

/**
 * SOME gateway is really billing this user — Stripe with a customer to act on, or
 * PayPal, which never writes a `stripeCustomerId` and is managed in-app instead.
 *
 * The question `subscriptionStatus` alone cannot answer. A status can outlive (or
 * precede) any real billing relationship: rows granted outside checkout carry
 * ACTIVE with nothing behind it at either gateway. Everything the UI offers a
 * subscriber — the portal, "cancel first to switch", a renewal date — is a lie for
 * such a row, because there is nothing to open, cancel or renew.
 */
export function hasGatewayBilling(
  subscriptionStatus?: SubscriptionStatus | string | null,
  stripeCustomerId?: string | null,
  paymentProvider?: string | null,
): boolean {
  if (!hasManageableBilling(subscriptionStatus)) return false
  return paymentProvider === "PAYPAL" || Boolean(stripeCustomerId)
}

/**
 * PRO access granted purely by the SUPER_ADMIN role — nothing bought, nothing to manage.
 *
 * `hasGatewayBilling` defaults to the status-only answer so existing callers keep
 * their behaviour. Pass it explicitly wherever the customer id is available: an
 * admin row whose ACTIVE status has no gateway behind it IS staff access, and
 * treating it as a subscription tells them their plan renews, offers a portal that
 * 400s, and blocks the one-time cards behind a date that never arrives.
 */
export function isStaffAccess(
  role?: string | null,
  subscriptionStatus?: SubscriptionStatus | string | null,
  gatewayBilling: boolean = hasManageableBilling(subscriptionStatus),
): boolean {
  return isSuperAdmin(role) && !gatewayBilling
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
  isManaged = false,
): boolean {
  // A managed (LIMITED) account cannot buy ANY plan, ever. Its access is granted and
  // revoked by an administrator, and the provisioning webhooks refuse to touch it
  // (`if (targetUser?.isManaged) return { skip: true }` in Stripe,
  // `if (!user || user.isManaged) return null` in PayPal). So a purchase could only end
  // one way: the money taken and nothing delivered.
  //
  // It belongs HERE and not in each checkout service. This function is the single source
  // the pricing UI and both gateways read, precisely so the rule cannot be true in one
  // place and missing in another — which is exactly what happened: the refusal existed
  // only at the webhook, AFTER the charge.
  if (isManaged) return true

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
      "generate-summary": -1,      "tailor-cv": -1,
      "skill-bullet": -1,
      "merge-bullets": -1,
      "generate-cover-letter": -1,
      "improve-cover-letter": -1,
      "ats-score": -1,
      "ats3": -1,
      "review-cv": -1,
      "translate-cv": -1,
    },
  },
  UNSUBSCRIBED: {
    maxResumes: 1,
    maxCoverLetters: 1,
    // true, with UNSUBSCRIBED_DAILY_PDF_CAP per rolling 24h enforced in the route. It
    // read `false` for a long time after the free tier was loosened, which is how a
    // surface that trusted this field would have hidden a download the server allows.
    canExportPdf: true,
    // No AI of any kind: UNSUBSCRIBED fills the CV manually. Every content
    // endpoint is blocked (0). Upgrading unlocks AI.
    aiLimitsByEndpoint: {
      "fill-profile": 0,
      "improve-bullet": 0,
      "generate-summary": 0,      "tailor-cv": 0,
      "skill-bullet": 0,
      "merge-bullets": 0,
      "generate-cover-letter": 0,
      "improve-cover-letter": 0,
      "ats-score": 0,
      "ats3": 0,
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
      "generate-summary": 0,      "tailor-cv": 0,
      "skill-bullet": 0,
      "merge-bullets": 0,
      "generate-cover-letter": 0,
      "improve-cover-letter": 0,
      "ats-score": 0,
      "ats3": 0,
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
      "generate-summary": -1,      "tailor-cv": 0,
      "skill-bullet": 0,
      "merge-bullets": 0,
      "generate-cover-letter": -1,
      "improve-cover-letter": -1,
      "ats-score": 0,
      "ats3": 0,
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
      "generate-summary": -1,      "tailor-cv": -1,
      "skill-bullet": -1,
      "merge-bullets": -1,
      "generate-cover-letter": -1,
      "improve-cover-letter": -1,
      "ats-score": -1,
      "ats3": -1,
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
    if (subscriptionEndsAt) {
      // PAST_DUE gets a grace window ON TOP of the paid period; every other status gets
      // exactly what was paid for. See PAST_DUE_GRACE_DAYS for why.
      const graceMs = subscriptionStatus === "PAST_DUE" ? PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000 : 0
      if (Date.now() > subscriptionEndsAt.getTime() + graceMs) return false
    }
    // CANCELED: paid period not yet over — allow access until subscriptionEndsAt
    // PAST_DUE: payment failed, Stripe retrying — access continues through the grace window
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
 * The purchase the user just made has landed in the database.
 *
 * Used by the post-checkout screen, which polls until the webhook has provisioned the
 * plan and then signs the user out so they come back with a token that carries it.
 *
 * It used to ask `plan === "PRO"` inline, so BASIC and SPRINT buyers never matched:
 * they watched a spinner for the full 30s timeout after a payment that had already
 * succeeded, and were then told to check for "Pro access" they had not bought.
 * Every paid plan has to be recognised, each by its own signal — a subscription by its
 * status, a one-time plan by a window that has not elapsed.
 */
export function purchaseConfirmed(user: {
  plan?: string | null
  subscriptionStatus?: SubscriptionStatus | string | null
  subscriptionEndsAt?: Date | string | null
}): boolean {
  if (user.plan === "PRO") {
    // PAST_DUE counts: the plan is provisioned and access is granted while Stripe retries.
    return user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "PAST_DUE"
  }
  if (user.plan === "BASIC" || user.plan === "SPRINT") {
    if (!user.subscriptionEndsAt) return false
    return new Date(user.subscriptionEndsAt) > new Date()
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

/**
 * DEAD as a gate — kept only because deleting it would suggest the question it answers
 * is not asked anywhere, and it is: the real enforcement lives in
 * `claimManagedDownload`, which reserves the slot ATOMICALLY. This version reads a
 * counter that a concurrent download has already moved, so two tabs could both pass it
 * and spend one slot twice. Do not reintroduce it in a route.
 */
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

// LIMITED (managed) accounts are capped by the admin per user. When the admin
// leaves the field blank (NULL in DB), this default applies. Only LIMITED uses
// these — every other plan keeps its PLAN_LIMITS value untouched.
export const LIMITED_DEFAULT_RESUME_LIMIT = 5
export const LIMITED_DEFAULT_COVER_LETTER_LIMIT = 5

/**
 * "Sin límite", escrito.
 *
 * ES -1 Y NO 0 porque -1 ya es el idioma de esta casa: `PLAN_LIMITS` dice
 * `maxResumes: -1` para los planes ilimitados y `enforceResumeLimit` ya sale
 * temprano al verlo. Un 0 habria significado "infinito" en un archivo donde 0
 * significa "bloqueado" en la tabla de al lado (`aiLimitsByEndpoint`), que es
 * como se escriben los errores caros.
 *
 * POR QUE HACIA FALTA. Dejar el campo vacio no servia: `null` significa cosas
 * OPUESTAS segun el campo — ilimitado en descargas, cinco en CVs y cartas. Y el
 * schema de admin exigia `positive()`, asi que no habia ningun valor que un
 * administrador pudiera escribir para decir "sin tope". Un usuario LIMITED no
 * podia tener CVs ilimitados ni pidiendolo, aunque `PLAN_LIMITS.LIMITED` los
 * declare.
 */
export const MANAGED_UNLIMITED = -1

/** True cuando un tope de managed significa "sin limite". */
export function isManagedUnlimited(limit: number | null | undefined): boolean {
  return limit === MANAGED_UNLIMITED
}

/**
 * Los valores que un administrador puede escribir en un tope de managed.
 *
 * Vive aca, junto a la constante, para que crear y editar no puedan aceptar
 * cosas distintas: eran dos `z.number().int().positive()` sueltos en dos rutas,
 * y bastaba tocar uno para que un usuario se pudiera crear "sin limite" y no
 * editar, o al reves.
 */
export function isValidManagedLimit(n: number): boolean {
  return Number.isInteger(n) && (n === MANAGED_UNLIMITED || n > 0)
}

/**
 * Effective resume cap. For LIMITED, the admin's per-user value or the default
 * (5). For every other plan, the plan's own PLAN_LIMITS.maxResumes — unchanged.
 * `effPlan` must already be the EFFECTIVE plan (see effectivePlan).
 */
export function resolveResumeLimit(effPlan: Plan | string, managedResumeLimit: number | null | undefined): number {
  if (effPlan === "LIMITED") return managedResumeLimit ?? LIMITED_DEFAULT_RESUME_LIMIT
  return getLimits(effPlan).maxResumes
}

/** Effective cover-letter cap — same rule as resolveResumeLimit. */
export function resolveCoverLetterLimit(effPlan: Plan | string, managedCoverLetterLimit: number | null | undefined): number {
  if (effPlan === "LIMITED") return managedCoverLetterLimit ?? LIMITED_DEFAULT_COVER_LETTER_LIMIT
  return getLimits(effPlan).maxCoverLetters
}
