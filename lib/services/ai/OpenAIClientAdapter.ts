// lib/services/ai/OpenAIClientAdapter.ts
import { getOpenAI } from "@/lib/ai-client"
import type { IAIClient, ChatParams, ChatCompletion } from "@/lib/interfaces/IAIClient"
import pLimit from "p-limit"

// Backpressure: cap concurrent OpenAI calls per instance. Without this, a traffic
// spike fans out unbounded requests → memory pressure (each awaits the provider
// holding its context) + provider 429 cascades. Excess calls queue instead of
// stampeding. Tunable via env; defaults to 8.
const AI_CONCURRENCY = Math.max(1, Number(process.env.AI_CONCURRENCY_LIMIT ?? 8))
const limit = pLimit(AI_CONCURRENCY)

export class OpenAIClientAdapter implements IAIClient {
  async chat(params: ChatParams): Promise<ChatCompletion> {
    return limit(() => getOpenAI().chat.completions.create(params))
  }
}
