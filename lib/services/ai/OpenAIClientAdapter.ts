// lib/services/ai/OpenAIClientAdapter.ts
import { getOpenAI } from "@/lib/ai-client"
import type { IAIClient, ChatParams, ChatCompletion } from "@/lib/interfaces/IAIClient"
import { computeCostUsd } from "./shared/cost-tracker"
import { createLogger } from "@/lib/logger"
import pLimit from "p-limit"

const embedLogger = createLogger("embed")

// Backpressure: cap concurrent OpenAI calls per instance. Without this, a traffic
// spike fans out unbounded requests → memory pressure (each awaits the provider
// holding its context) + provider 429 cascades. Excess calls queue instead of
// stampeding. Tunable via env; defaults to 8.
const AI_CONCURRENCY = Math.max(1, Number(process.env.AI_CONCURRENCY_LIMIT ?? 8))
const limit = pLimit(AI_CONCURRENCY)

// Cheap, high-recall embedding model (~$0.02 / 1M tokens). Same subscription/key
// as chat; used only to catch semantic keyword matches the exact matcher misses.
export const EMBEDDING_MODEL = (process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small") as string

// Re-export the pure param helpers (defined in a db-free module for testability).
export { isReasoningModel, normalizeParamsForModel } from "./shared/model-params"
import { normalizeParamsForModel, isModelUnavailableError, FALLBACK_MODEL } from "./shared/model-params"

const modelLogger = createLogger("ai-model")

/**
 * Models this process has already proven unusable with the current API key.
 * Populated on the first "model unavailable" rejection so later requests skip
 * straight to the fallback instead of paying a doomed round trip every call.
 * In-memory on purpose: a deploy or restart re-probes, so granting access to the
 * model later needs no code change or flag flip.
 */
const unavailableModels = new Set<string>()

export class OpenAIClientAdapter implements IAIClient {
  /**
   * Sends the chat request, normalizing params for the target model family.
   *
   * Survives a model outage: if the configured model is not available to this key
   * (unknown id, not rolled out to the org, tier without access), the request is
   * retried ONCE on FALLBACK_MODEL rather than failing the user. The retry rebuilds
   * params from the ORIGINAL request so the fallback gets its own normalization —
   * a non-reasoning model keeps temperature/max_tokens, which the GPT-5 pass strips.
   * Every other error (rate limit, timeout, bad params) propagates untouched: only a
   * model-availability failure is fixed by switching models, and masking the rest
   * would hide real bugs.
   */
  async chat(params: ChatParams): Promise<ChatCompletion> {
    const useFallback = unavailableModels.has(params.model) && params.model !== FALLBACK_MODEL
    const model = useFallback ? FALLBACK_MODEL : params.model
    const send = (m: string) =>
      limit(() => getOpenAI().chat.completions.create(normalizeParamsForModel({ ...params, model: m })))

    try {
      return await send(model)
    } catch (err) {
      if (model === FALLBACK_MODEL || !isModelUnavailableError(err)) throw err
      unavailableModels.add(model)
      modelLogger.error("model unavailable — falling back", { model, fallback: FALLBACK_MODEL }, err)
      return send(FALLBACK_MODEL)
    }
  }

  async embed(texts: string[], onUsage?: (usage: { tokens: number }) => void): Promise<number[][]> {
    if (texts.length === 0) return []
    const res = await limit(() =>
      getOpenAI().embeddings.create({ model: EMBEDDING_MODEL, input: texts }),
    )
    // Observability: embeddings are cheap (~$0.02/1M) but not free — log the real
    // token usage + cost so total AI spend is fully accounted for.
    const tokens = res.usage?.total_tokens ?? 0
    embedLogger.info("embedding call", {
      model: EMBEDDING_MODEL,
      inputs: texts.length,
      tokens,
      costUsd: computeCostUsd(EMBEDDING_MODEL, tokens, 0),
    })
    onUsage?.({ tokens })
    // The API preserves input order; map straight through.
    return res.data.map((d) => d.embedding)
  }
}
