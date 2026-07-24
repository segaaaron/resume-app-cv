// Pure request-param helpers for the OpenAI chat contract. Kept free of any
// client/db import so they are unit-testable in isolation.
import type { ChatParams } from "@/lib/interfaces/IAIClient"

// Reasoning depth for the GPT-5 family. Set DELIBERATELY (not left implicit) so
// cost/latency are predictable.
//
// Default "none" — which is also OpenAI's own default for GPT-5.4 — because this
// product's analysis does NOT live in the model: the ATS score, keyword matching
// and quality checks are deterministic code, and the model is asked to WRITE, not
// to deduce ("el algoritmo detecta, la IA redacta"). Reasoning tokens bill at the
// output rate ($1.25/1M nano · $4.50/1M mini) on EVERY call, so paying for depth
// the prompt doesn't exercise is pure margin loss.
//
// Honest caveat: neither "none" nor the previous "low" has been measured against
// real output. If quality regresses, raise it per deploy without a code change —
// "minimal"/"low" are the next steps up, "medium"/"high"/"xhigh" are thorough and
// expensive. The cost of each setting is visible per service in the admin AI
// dashboard, so a change can be judged on real spend.
export const REASONING_EFFORT = (process.env.AI_REASONING_EFFORT ?? "none") as string

// Last-known-good model to fall back to if the configured one is unavailable to
// this API key (see isModelUnavailableError). Deliberately a NON-reasoning model
// from the previous generation: it has no rollout/tier gating left to fail on.
export const FALLBACK_MODEL = (process.env.AI_MODEL_FALLBACK ?? "gpt-4.1-mini") as string

/**
 * True when the provider rejected the request because the MODEL itself is not
 * usable by this key — wrong/unknown id, not yet rolled out to the org, or a tier
 * that lacks access. Distinguished from every other failure (rate limit, timeout,
 * bad params, content filter) because only this one is fixed by switching models;
 * retrying anything else on a different model would mask real bugs.
 */
export function isModelUnavailableError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false
  const e = err as { status?: number; code?: string; error?: { code?: string; message?: string }; message?: string }
  const code = e.code ?? e.error?.code
  if (code === "model_not_found") return true
  // 404 on chat/completions is always "no such model" — the path itself exists.
  if (e.status === 404) return true
  const message = `${e.error?.message ?? ""} ${e.message ?? ""}`.toLowerCase()
  if (e.status === 403 && (message.includes("model") || message.includes("access"))) return true
  return message.includes("does not exist") || message.includes("do not have access to")
}

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
