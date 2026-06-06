// lib/services/ai/shared/cost-tracker.ts
// Token-based cost computation for AI endpoint usage.
// Used by AI modules to persist precise per-call costs in AIUsageLog.

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
