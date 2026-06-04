/**
 * Plan access rules.
 * PRO users (including the privileged admin) have full access.
 * UNSUBSCRIBED users get a limited freemium experience:
 *   - 1 CV + 1 cover letter
 *   - Lifetime quota per AI endpoint (some endpoints fully blocked)
 *   - No PDF / Word export
 *   - No import
 */

export type Plan = "UNSUBSCRIBED" | "PRO" | "LIMITED"
export type SubscriptionStatus = "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "PAST_DUE"
export type Role = "USER" | "SUPER_ADMIN"

export type AiEndpointName =
  | "fill-profile"
  | "improve-bullet"
  | "improve-summary"
  | "generate-summary"
  | "suggest-skills"
  | "tailor-cv"
  | "generate-cover-letter"
  | "improve-cover-letter"
  | "ats-score"
  | "review-cv"

export const AI_ENDPOINT_NAMES: readonly AiEndpointName[] = [
  "fill-profile",
  "improve-bullet",
  "improve-summary",
  "generate-summary",
  "suggest-skills",
  "tailor-cv",
  "generate-cover-letter",
  "improve-cover-letter",
  "ats-score",
  "review-cv",
] as const

export type PlanLimits = {
  /** -1 = unlimited */
  maxResumes: number
  /** -1 = unlimited */
  maxCoverLetters: number
  canExportPdf: boolean
  canImport: boolean
  /** Lifetime quota per AI endpoint. 0 = blocked. -1 = unlimited. */
  aiLimitsByEndpoint: Record<AiEndpointName, number>
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN"
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  LIMITED: {
    maxResumes: -1,
    maxCoverLetters: -1,
    canExportPdf: true,
    canImport: true,
    aiLimitsByEndpoint: {
      "fill-profile": -1,
      "improve-bullet": -1,
      "improve-summary": -1,
      "generate-summary": -1,
      "suggest-skills": -1,
      "tailor-cv": -1,
      "generate-cover-letter": -1,
      "improve-cover-letter": -1,
      "ats-score": -1,
      "review-cv": -1,
    },
  },
  UNSUBSCRIBED: {
    maxResumes: 1,
    maxCoverLetters: 1,
    canExportPdf: false,
    canImport: false,
    aiLimitsByEndpoint: {
      "fill-profile": 1,
      "improve-bullet": 2,
      "improve-summary": 2,
      "generate-summary": 2,
      "suggest-skills": 2,
      "tailor-cv": 1,
      "generate-cover-letter": 2,
      "improve-cover-letter": 2,
      "ats-score": 0,
      "review-cv": 0,
    },
  },
  PRO: {
    maxResumes: -1,
    maxCoverLetters: -1,
    canExportPdf: true,
    canImport: true,
    aiLimitsByEndpoint: {
      "fill-profile": -1,
      "improve-bullet": -1,
      "improve-summary": -1,
      "generate-summary": -1,
      "suggest-skills": -1,
      "tailor-cv": -1,
      "generate-cover-letter": -1,
      "improve-cover-letter": -1,
      "ats-score": -1,
      "review-cv": -1,
    },
  },
}

export function isPro(plan: string): boolean {
  return plan === "PRO" || plan === "LIMITED"
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
  return false
}

export function canDownloadPDF(user: { isManaged: boolean; managedDownloadLimit: number | null; managedDownloadsUsed: number }): boolean {
  if (!user.isManaged) return true
  if (user.managedDownloadLimit === null) return true
  return user.managedDownloadsUsed < user.managedDownloadLimit
}

export function getLimits(plan: string): PlanLimits {
  if (plan === "PRO") return PLAN_LIMITS.PRO
  if (plan === "LIMITED") return PLAN_LIMITS.LIMITED
  return PLAN_LIMITS.UNSUBSCRIBED
}
