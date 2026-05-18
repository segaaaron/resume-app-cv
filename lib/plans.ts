/**
 * Plan access rules.
 * PRO users (including the privileged admin) have full access.
 * UNSUBSCRIBED users have no active plan — all features blocked.
 */

export type Plan = "UNSUBSCRIBED" | "PRO"
export type SubscriptionStatus = "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "PAST_DUE"
export type Role = "USER" | "SUPER_ADMIN"

export function isSuperAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN"
}

export const PLAN_LIMITS = {
  UNSUBSCRIBED: {
    maxResumes: 0,
    maxCoverLetters: 0,
    canExportPdf: false,
    canImport: false,
  },
  PRO: {
    maxResumes: Infinity,
    maxCoverLetters: Infinity,
    canExportPdf: true,
    canImport: true,
  },
} as const

export function isPro(plan: string): boolean {
  return plan === "PRO"
}

export function isActive(
  plan: string,
  subscriptionEndsAt?: Date | null,
  subscriptionStatus?: string | null,
  role?: string | null,
): boolean {
  if (isSuperAdmin(role)) return true
  if (plan === "PRO") {
    if (subscriptionStatus === "EXPIRED") return false
    if (subscriptionEndsAt && new Date() > subscriptionEndsAt) return false
    // CANCELED: paid period not yet over — allow access until subscriptionEndsAt
    // PAST_DUE: payment failed, Stripe retrying — user keeps access during retry window
    return subscriptionStatus === "ACTIVE" || subscriptionStatus === "CANCELED" || subscriptionStatus === "PAST_DUE"
  }
  return false
}

export function getLimits(plan: string) {
  if (plan === "PRO") return PLAN_LIMITS.PRO
  return PLAN_LIMITS.UNSUBSCRIBED
}
