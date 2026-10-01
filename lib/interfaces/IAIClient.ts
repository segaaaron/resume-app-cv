// lib/interfaces/IAIClient.ts
import type OpenAI from "openai"

export type ChatParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming
export type ChatCompletion = OpenAI.Chat.Completions.ChatCompletion

/**
 * Límites de UNA petición, para el llamador que sabe cuánto tarda la suya. El
 * cliente global corta a los 60 s y reintenta tres veces: vale para una llamada
 * corta, y mata a una que tarda 70 s cuatro veces seguidas.
 */
export interface ChatRequestOptions {
  timeoutMs?: number
  maxRetries?: number
}

export interface IAIClient {
  chat(params: ChatParams, options?: ChatRequestOptions): Promise<ChatCompletion>
  /** Returns one embedding vector per input string (same order). Used for
   *  semantic keyword matching (cosine similarity) in the ATS score. */
  /**
   * @param onUsage Tokens que consumió ESTA llamada. Sin esto el gasto de embeddings
   * quedaba sólo en un log de texto y nunca llegaba al costo por usuario: cada análisis
   * ATS embebe el CV y las keywords, así que el número del panel salía por debajo del real.
   */
  embed(texts: string[], onUsage?: (usage: { tokens: number }) => void): Promise<number[][]>
}
