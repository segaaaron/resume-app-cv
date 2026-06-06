// lib/services/ai/shared/cost-tracker.ts
// Structured cost logging for AI endpoint usage. NO cron, NO DB writes, NO email.
// Emits a single JSON log line per successful AI call so external systems
// (Dokploy logs, Sentry, Datadog) can aggregate and alert on cost anomalies.
import type { ILogger } from "@/lib/interfaces/ILogger"
import type { AiEndpointName } from "@/lib/plans"

/** Pricing per 1M tokens in USD. Update when OpenAI changes prices. */
export const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  "gpt-4o-mini":   { inputPer1M: 0.15,  outputPer1M: 0.60  },
  "gpt-4o":        { inputPer1M: 2.50,  outputPer1M: 10.00 },
  "gpt-4-turbo":   { inputPer1M: 10.00, outputPer1M: 30.00 },
  "gpt-3.5-turbo": { inputPer1M: 0.50,  outputPer1M: 1.50  },
}

export function computeCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING["gpt-4o-mini"]
  return (promptTokens * pricing.inputPer1M + completionTokens * pricing.outputPer1M) / 1_000_000
}

/** Estimated USD cost per successful AI endpoint call. Update when models change. */
export const ENDPOINT_COSTS_USD: Record<AiEndpointName, number> = {
  "fill-profile": 0.0010,
  "improve-bullet": 0.0007,
  "improve-summary": 0.0007,
  "generate-summary": 0.0008,
  "suggest-skills": 0.0006,
  "tailor-cv": 0.0015,
  "generate-cover-letter": 0.0010,
  "improve-cover-letter": 0.0010,
  "ats-score": 0.0012,
  "review-cv": 0.0015,
}

/**
 * Emits a structured "ai_usage_cost" log line for post-deploy alerts.
 * Safe to call after any successful AI endpoint. Never throws.
 */
export function logAICost(
  logger: ILogger,
  userId: string,
  endpoint: AiEndpointName,
  plan: string,
): void {
  try {
    const costUSD = ENDPOINT_COSTS_USD[endpoint] ?? 0
    logger.info("ai_usage_cost", {
      userId,
      endpoint,
      plan,
      costUSD,
      timestamp: new Date().toISOString(),
    })
  } catch {
    /* fire-and-forget — never break the request because of logging */
  }
}
