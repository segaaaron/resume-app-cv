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
import { normalizeParamsForModel } from "./shared/model-params"

export class OpenAIClientAdapter implements IAIClient {
  async chat(params: ChatParams): Promise<ChatCompletion> {
    return limit(() => getOpenAI().chat.completions.create(normalizeParamsForModel(params)))
  }

  async embed(texts: string[]): Promise<number[][]> {
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
    // The API preserves input order; map straight through.
    return res.data.map((d) => d.embedding)
  }
}
