/**
 * Plan access rules.
 * PRO users (including the privileged admin) have no limits.
 * FREE users get limited access.
 * TRIAL users get full access for the trial period.
 */

export type Plan = "FREE" | "TRIAL" | "PRO"
export type SubscriptionStatus = "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "PAST_DUE"
export type Role = "USER" | "SUPER_ADMIN"

export function isSuperAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN"
}

export const PLAN_LIMITS = {
  FREE: {
    maxResumes: 1,
    maxCoverLetters: 1,
    canExportPdf: false,
    canImport: false,
  },
  TRIAL: {
    maxResumes: 10,
    maxCoverLetters: 5,
    canExportPdf: true,
    canImport: true,
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
  trialEndsAt: Date | null,
  subscriptionEndsAt?: Date | null,
  subscriptionStatus?: string | null
): boolean {
  if (plan === "TRIAL" && trialEndsAt && new Date() < trialEndsAt) return true
  if (plan === "PRO") {
    // Canceled or expired subscriptions lose access
    if (subscriptionStatus === "CANCELED" || subscriptionStatus === "EXPIRED") return false
    // If we have an explicit end date, check it hasn't passed
    if (subscriptionEndsAt && new Date() > subscriptionEndsAt) return false
    // PAST_DUE gets a grace period: access allowed until subscriptionEndsAt (set to now+3d by webhook)
    return subscriptionStatus === "ACTIVE" || subscriptionStatus === "PAST_DUE"
  }
  return false
}

export function getLimits(plan: string) {
  if (plan === "PRO") return PLAN_LIMITS.PRO
  if (plan === "TRIAL") return PLAN_LIMITS.TRIAL
  return PLAN_LIMITS.FREE
}
