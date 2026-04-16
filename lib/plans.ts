/**
 * Plan access rules.
 * PRO users (including the privileged admin) have no limits.
 * FREE users get limited access.
 * TRIAL users get full access for the trial period.
 */

export type Plan = "FREE" | "TRIAL" | "PRO"

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

export function isActive(plan: string, trialEndsAt: Date | null): boolean {
  if (plan === "PRO") return true
  if (plan === "TRIAL" && trialEndsAt && new Date() < trialEndsAt) return true
  return false
}

export function getLimits(plan: string) {
  if (plan === "PRO") return PLAN_LIMITS.PRO
  if (plan === "TRIAL") return PLAN_LIMITS.TRIAL
  return PLAN_LIMITS.FREE
}
