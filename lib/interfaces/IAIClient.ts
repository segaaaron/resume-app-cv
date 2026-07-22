// lib/interfaces/IAIClient.ts
import type OpenAI from "openai"

export type ChatParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
export type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion

export interface IAIClient {
  chat(params: ChatParams): Promise<ChatCompletion>
  /** Returns one embedding vector per input string (same order). Used for
   *  semantic keyword matching (cosine similarity) in the ATS score. */
  embed(texts: string[]): Promise<number[][]>
}
