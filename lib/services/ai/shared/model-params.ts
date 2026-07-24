// Pure request-param helpers for the OpenAI chat contract. Kept free of any
// client/db import so they are unit-testable in isolation.
import type { ChatParams } from "@/lib/interfaces/IAIClient"

// Reasoning depth for the GPT-5 family. Set DELIBERATELY (not left to the API's
// implicit default) so cost/latency are predictable: "low" gives a small
// accuracy lift on extraction/ATS/rewrite for a modest reasoning-token cost.
// Tune per deploy: "none"/"minimal" = cheapest, "medium"/"high" = more thorough.
export const REASONING_EFFORT = (process.env.AI_REASONING_EFFORT ?? "low") as string

/** True for OpenAI reasoning models (GPT-5 family, o-series) that use a different
 *  request contract than the GPT-4 family. */
export function isReasoningModel(model: string): boolean {
  return /^(gpt-5|o[1-9])/i.test(model)
}

/**
 * Reasoning models (GPT-5 family) reject the GPT-4-era request shape: they need
 * `max_completion_tokens` instead of `max_tokens` and do NOT accept `temperature`,
 * `top_p`, `presence_penalty`, `frequency_penalty` or `logit_bias` (the API 400s).
 *
 * Rather than fork every AI module, callers keep sending the classic shape and
 * this normalizes it per model at the single choke point (OpenAIClientAdapter).
 * GPT-4-family models pass through untouched. Pure function → unit-tested without
 * hitting the API.
 */
export function normalizeParamsForModel(params: ChatParams): ChatParams {
  if (!isReasoningModel(params.model)) return params

  const {
    max_tokens,
    temperature,
    top_p,
    presence_penalty,
    frequency_penalty,
    logit_bias,
    ...rest
  } = params as ChatParams & { logit_bias?: unknown }
  void temperature
  void top_p
  void presence_penalty
  void frequency_penalty
  void logit_bias

  const normalized = { ...rest } as ChatParams
  // Preserve the caller's token cap under the new field name (only if they set one).
  if (max_tokens != null && normalized.max_completion_tokens == null) {
    normalized.max_completion_tokens = max_tokens
  }
  // Pin reasoning depth deliberately unless the caller already chose one.
  if (normalized.reasoning_effort == null) {
    normalized.reasoning_effort = REASONING_EFFORT as unknown as typeof normalized.reasoning_effort
  }
  // temperature/top_p/penalties/logit_bias are intentionally dropped — unsupported.
  return normalized
}
