// lib/services/ai/shared/quota-enforcer.ts
import { db } from "@/lib/db"
import { checkAndIncrementAIQuota } from "@/lib/ai-client"
import { AppError } from "@/lib/services/auth/AppError"
import { createLogger } from "@/lib/logger"
import type { AiEndpointName } from "@/lib/plans"

const logger = createLogger("quota-enforcer")

/**
 * Enforces per-plan AI quota. On failure, emits a fire-and-forget AuditLog entry
 * (FREE_AI_ENDPOINT_BLOCKED for hard-blocked endpoints, FREE_AI_QUOTA_EXHAUSTED for
 * lifetime-quota exhaustion) and throws AppError so the route returns the right status:
 *   - blocked   → 403 feature_pro_only
 *   - exhausted → 429 free_quota_exhausted
 *
 * PRO users (limit = -1) short-circuit with no DB write.
 */
export async function enforceAIQuota(
  userId: string,
  endpoint: AiEndpointName,
  plan: string,
): Promise<void> {
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
