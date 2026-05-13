// lib/interfaces/IAIClient.ts
import type OpenAI from "openai"

export type ChatParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
export type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion

export interface IAIClient {
  chat(params: ChatParams): Promise<ChatCompletion>
}
