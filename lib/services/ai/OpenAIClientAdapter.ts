// lib/services/ai/OpenAIClientAdapter.ts
import { getOpenAI } from "@/lib/ai-client"
import type { IAIClient, ChatParams, ChatCompletion } from "@/lib/interfaces/IAIClient"

export class OpenAIClientAdapter implements IAIClient {
  async chat(params: ChatParams): Promise<ChatCompletion> {
    return getOpenAI().chat.completions.create(params)
  }
}
