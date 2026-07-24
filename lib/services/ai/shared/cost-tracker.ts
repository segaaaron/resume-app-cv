// lib/services/ai/shared/cost-tracker.ts
// Token-based cost computation for AI endpoint usage.
// Used by AI modules to persist precise per-call costs in AIUsageLog.

/** Pricing per 1M tokens in USD. Update when OpenAI changes prices. */
export const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  // GPT-5.4 family (reasoning) — active models. Prices verified against the
  // official OpenAI pricing page (developers.openai.com/api/docs/pricing).
  // NOTE: reasoning tokens are billed as OUTPUT tokens and are already included
  // in the API's usage.completion_tokens, so computeCostUsd stays exact for them
  // without any special handling.
  "gpt-5.4-nano":   { inputPer1M: 0.20,  outputPer1M: 1.25  },
  "gpt-5.4-mini":   { inputPer1M: 0.75,  outputPer1M: 4.50  },
  // Embeddings (semantic ATS recall) — active.
  "text-embedding-3-small": { inputPer1M: 0.02, outputPer1M: 0 },
  // Rollback targets: the models our documented env rollback points to
  // (AI_MODEL / AI_MODEL_PROSE = gpt-4.1-*). Kept so a rollback still prices
  // new calls correctly instead of dropping to the conservative fallback.
  "gpt-4.1-nano":   { inputPer1M: 0.10,  outputPer1M: 0.40  },
  "gpt-4.1-mini":   { inputPer1M: 0.40,  outputPer1M: 1.60  },
}

// Conservative anchor for any model not in the table above: over-report rather
// than under-report spend. Was previously the gpt-4-turbo row (now removed).
const FALLBACK_PRICING = { inputPer1M: 10.00, outputPer1M: 30.00 } as const

let unknownModelWarned = false

export function computeCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  let pricing = MODEL_PRICING[model]
  if (!pricing) {
    // Unknown model: assume expensive pricing — under-reporting real spend is
    // worse than over-reporting it.
    pricing = FALLBACK_PRICING
    if (!unknownModelWarned) {
      unknownModelWarned = true
      console.error(`[cost-tracker] modelo "${model}" sin precio en MODEL_PRICING — usando tarifa más cara conocida como estimación conservadora. Actualiza MODEL_PRICING.`)
    }
  }
  return (promptTokens * pricing.inputPer1M + completionTokens * pricing.outputPer1M) / 1_000_000
}
