// lib/services/ai/shared/quota-enforcer.ts
import { db } from "@/lib/db"
import { checkAndIncrementAIQuota, checkAndIncrementRateLimit } from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import { createLogger } from "@/lib/logger"
import { getLimits, AI_DAILY_CAP, AI_DAILY_CAP_WINDOW_MS, type AiEndpointName } from "@/lib/plans"

const logger = createLogger("quota-enforcer")

/**
 * Enforces per-plan AI quota. On failure, emits a fire-and-forget AuditLog entry
 * (FREE_AI_ENDPOINT_BLOCKED for hard-blocked endpoints, FREE_AI_QUOTA_EXHAUSTED for
 * lifetime-quota exhaustion) and throws AppError so the route returns the right status:
 *   - blocked          → 403 feature_pro_only
 *   - exhausted        → 429 free_quota_exhausted
 *   - daily cap (PRO)  → 429 daily_cap_reached
 *
 * Unlimited plans (limit = -1) pass through a self-resetting daily cap instead
 * of the lifetime counter. The `ai-daily:` key prefix keeps these rows separate
 * from lifetime freemium rows (sentinel resetAt 2099) in AIRateLimit — without
 * it, a user upgraded from UNSUBSCRIBED would inherit a counter that never resets.
 */
export async function enforceAIQuota(
  userId: string,
  endpoint: AiEndpointName,
  plan: string,
): Promise<void> {
  const endpointLimit = getLimits(plan).aiLimitsByEndpoint[endpoint]
  if (endpointLimit === -1) {
    const cap = AI_DAILY_CAP[endpoint]
    const ok = await checkAndIncrementRateLimit(userId, `ai-daily:${endpoint}`, cap, AI_DAILY_CAP_WINDOW_MS)
    if (!ok) {
      // Reuses FREE_AI_QUOTA_EXHAUSTED (adding an enum value needs a DB
      // migration); metadata.type distinguishes the daily-cap case in queries.
      db.auditLog
        .create({ data: { userId, action: "FREE_AI_QUOTA_EXHAUSTED", metadata: { type: "daily_cap", endpoint, cap, plan } } })
        .catch((err) => { logger.error("quota-enforcer: auditLog write failed", { userId, endpoint }, err instanceof Error ? err : undefined) })
      throw new AppError("daily_cap_reached", 429, { endpoint })
    }
    // Evidence trail: a paying plan (unlimited for this endpoint) successfully used AI.
    // Used to defend Stripe disputes/refunds — the digital service was consumed.
    db.auditLog
      .create({ data: { userId, action: "AI_USED", metadata: { endpoint, plan } } })
      .catch((err) => { logger.error("quota-enforcer: AI_USED auditLog write failed", { userId, endpoint }, err instanceof Error ? err : undefined) })
    return
  }

  const check = await checkAndIncrementAIQuota(userId, endpoint, plan)
  if (check.allowed) return

  if (check.reason === "blocked") {
    db.auditLog
      .create({ data: { userId, action: "FREE_AI_ENDPOINT_BLOCKED", metadata: { endpoint } } })
      .catch((err) => { logger.error("quota-enforcer: auditLog write failed", { userId, endpoint }, err instanceof Error ? err : undefined) })
    throw new AppError("feature_pro_only", 403, { endpoint })
  }

  // exhausted
  db.auditLog
    .create({
      data: {
        userId,
        action: "FREE_AI_QUOTA_EXHAUSTED",
        metadata: { endpoint, used: check.used, limit: check.limit },
      },
    })
    .catch((err) => { logger.error("quota-enforcer: auditLog write failed", { userId, endpoint }, err instanceof Error ? err : undefined) })
  throw new AppError("free_quota_exhausted", 429, { endpoint, used: check.used, limit: check.limit })
}
