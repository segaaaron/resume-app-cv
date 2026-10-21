// lib/services/ai/AnthropicClientAdapter.ts
//
// CLAUDE ES LA IA PRINCIPAL; OPENAI ES EL RESPALDO (CEO, 2026-10-20).
//
// Los nueve módulos de IA de este proyecto hablan el dialecto de OpenAI: un
// array de `messages` con el sistema adentro, `response_format`, `temperature`,
// `reasoning_effort`, y una respuesta con `choices[0].message.content`. Este
// adapter traduce ese dialecto al de Claude y traduce la respuesta de vuelta,
// así que NINGÚN módulo cambió: la costura es `IAIClient`, que ya existía.
//
// Rutea por el nombre del modelo: lo que no empieza con `claude-` va a OpenAI
// tal como iba antes. Eso hace que encender o apagar Claude en una ranura sea
// una env (`CLAUDE_MODEL_PROSE`, …) y no un cambio de código.

import Anthropic from "@anthropic-ai/sdk"
import pLimit from "p-limit"
import { ANTHROPIC_API_KEY, OPENAI_BACKUP } from "@/lib/ai-client"
import { createLogger } from "@/lib/logger"
import type { ChatCompletion, ChatParams, ChatRequestOptions, IAIClient } from "@/lib/interfaces/IAIClient"
import { OpenAIClientAdapter } from "./OpenAIClientAdapter"
import { REASONING_EFFORT } from "./shared/model-params"

const logger = createLogger("ai-claude")

// Mismo freno que el adapter de OpenAI y por la misma razón: una ráfaga de
// tráfico sin tope abre llamadas sin límite y termina en 429 en cascada.
const limit = pLimit(Math.max(1, Number(process.env.AI_CONCURRENCY_LIMIT ?? 8)))

// Lazy singleton — nunca en el nivel del módulo: el build de Docker corre sin
// ANTHROPIC_API_KEY y construir el cliente ahí lo rompería.
let _anthropic: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
      // El SDK de Anthropic cuenta el timeout en MILISEGUNDOS (el de Python, en
      // segundos). Mismo default que OpenAI para que las dos ranuras esperen lo mismo.
      timeout: Math.max(5_000, Number(process.env.ANTHROPIC_TIMEOUT_MS ?? 60_000)),
      maxRetries: 3,
    })
  }
  return _anthropic
}

/**
 * EL EFFORT: `low` en Claude es `low`, pero «none» y «minimal» no existen.
 *
 * `AI_REASONING_EFFORT` nació para la familia GPT-5, donde «none» es válido. En
 * Claude los niveles son low/medium/high/xhigh/max, y en Opus 5.5 y Sonnet 5.5 el
 * razonamiento NO se puede apagar: un `thinking: disabled` devuelve 400. Lo más
 * barato que acepta es `low`, así que ahí caen los dos valores que no existen.
 */
const EFFORT = (() => {
  const e = REASONING_EFFORT.toLowerCase()
  return e === "none" || e === "minimal" ? "low" : e
})()

/**
 * CUÁNDO SE LE PREGUNTA A OPENAI (CEO, 2026-10-20): sólo cuando el error no es
 * culpa nuestra.
 *
 * 429, 5xx, timeout, caída de red y modelo inexistente (404) son del proveedor:
 * ahí el respaldo es lo que salva la pantalla del usuario. Un 400 (params mal) o
 * un 401/403 (clave mal o sin permiso) NO se respaldan a propósito: son bugs o
 * configuración, y taparlos los esconde meses mientras el motor parece sano.
 */
function debeRespaldar(err: unknown): boolean {
  // Cubre también APIConnectionTimeoutError, que extiende esta clase.
  if (err instanceof Anthropic.APIConnectionError) return true
  if (!(err instanceof Anthropic.APIError)) return false
  const status = err.status
  if (status === undefined) return false
  return status === 429 || status === 404 || status >= 500
}

export class AnthropicClientAdapter implements IAIClient {
  /** El respaldo, y el dueño de los embeddings. */
  private readonly openai = new OpenAIClientAdapter()

  async chat(params: ChatParams, options?: ChatRequestOptions): Promise<ChatCompletion> {
    if (!params.model.startsWith("claude-")) return this.openai.chat(params, options)

    try {
      const res = await limit(() => getAnthropic().messages.create(aClaude(params), {
        ...(options?.timeoutMs !== undefined ? { timeout: options.timeoutMs } : {}),
        ...(options?.maxRetries !== undefined ? { maxRetries: options.maxRetries } : {}),
      }))
      /**
       * UNA NEGATIVA ES UN ERROR DEL PROVEEDOR, NO UNA RESPUESTA (HTTP 200).
       * Claude puede declinar por sus clasificadores de seguridad y devolver 200
       * con `stop_reason: "refusal"` y contenido vacío. Sin esto, el usuario vería
       * una pantalla en blanco con el uso ya cobrado.
       */
      if (res.stop_reason === "refusal") {
        return this.respaldar(params, options, `refusal (${res.stop_details?.category ?? "sin categoría"})`)
      }
      return deClaude(res)
    } catch (err) {
      if (!debeRespaldar(err)) throw err
      return this.respaldar(params, options, mensajeDe(err))
    }
  }

  /**
   * ANTHROPIC NO TIENE API DE EMBEDDINGS, así que esto NO es un respaldo: es el
   * único camino. El recall semántico del ATS (`semantic-match.ts`) va siempre con
   * `text-embedding-3-small` de OpenAI, y por eso su clave sigue siendo obligatoria
   * aunque Claude sea la IA principal.
   */
  embed(texts: string[], onUsage?: (usage: { tokens: number }) => void): Promise<number[][]> {
    return this.openai.embed(texts, onUsage)
  }

  /** La misma petición, al modelo de OpenAI que respalda a ese modelo de Claude. */
  private respaldar(params: ChatParams, options: ChatRequestOptions | undefined, motivo: string): Promise<ChatCompletion> {
    const backup = OPENAI_BACKUP[params.model]
    if (!backup) {
      // Sin respaldo configurado no se inventa uno: el error sube tal cual.
      throw new Error(`Claude "${params.model}" falló (${motivo}) y no tiene respaldo en OPENAI_BACKUP`)
    }
    logger.warn(`Claude "${params.model}" falló (${motivo}) — respondiendo con OpenAI "${backup}"`, { model: params.model, backup, motivo })
    return this.openai.chat({ ...params, model: backup }, options)
  }
}

function mensajeDe(err: unknown): string {
  if (err instanceof Anthropic.APIError) return `${err.status ?? "sin status"} ${err.message}`
  return err instanceof Error ? err.message : String(err)
}

/** El texto de un `content` de OpenAI, que puede venir como string o como bloques. */
function textoDe(content: unknown): string {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  return content
    .map((b) => (typeof b === "object" && b !== null && "text" in b ? String((b as { text?: unknown }).text ?? "") : ""))
    .filter(Boolean)
    .join("\n")
}

/**
 * LA PETICIÓN, TRADUCIDA.
 *
 * - El sistema sale del array y va al campo `system`: en Claude no es un mensaje.
 *   Los `developer` de OpenAI cuentan como sistema.
 * - `temperature` se descarta: Opus 5.5 y Sonnet 5.5 devuelven 400 si llega.
 * - `response_format: json_object` se descarta porque no hay esquema que pasar —
 *   los módulos no mandan uno y el JSON ya lo pide el prompt y lo valida Zod.
 *   ponytail: el equivalente real es `output_config.format` con JSON Schema;
 *   vale la pena donde el esquema ya existe (el ATS), medido y aparte.
 */
function aClaude(params: ChatParams): Anthropic.MessageCreateParamsNonStreaming {
  const system = params.messages
    .filter((m) => m.role === "system" || m.role === "developer")
    .map((m) => textoDe(m.content))
    .filter(Boolean)
    .join("\n\n")

  const messages: Anthropic.MessageParam[] = params.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m): Anthropic.MessageParam => ({ role: m.role === "assistant" ? "assistant" : "user", content: textoDe(m.content) }))
    .filter((m) => m.content !== "")

  return {
    model: params.model,
    // Claude exige max_tokens. Los módulos mandan uno de los dos nombres; 16000 es
    // el default seguro para una petición sin stream (no llega al timeout HTTP).
    // `max_tokens` está deprecado en el contrato de OpenAI pero los módulos de
    // este repo todavía lo mandan: se lee por cast, no se vuelve a escribir.
    max_tokens: params.max_completion_tokens ?? (params as { max_tokens?: number | null }).max_tokens ?? 16_000,
    ...(system ? { system } : {}),
    messages,
    output_config: { effort: EFFORT },
  } as Anthropic.MessageCreateParamsNonStreaming
}

/**
 * LA RESPUESTA, TRADUCIDA A LA FORMA DE OPENAI.
 *
 * `usage.prompt_tokens` tiene que INCLUIR los cacheados, porque así lo espera
 * `computeCostUsd` (los resta para no cobrarlos dos veces). Caveat medible: los
 * tokens de ESCRITURA de caché se cobran 1,25x en Anthropic y acá entran al
 * precio de entrada normal, así que el costo de una primera llamada cacheada se
 * subestima en ese 25%. Arreglarlo exacto pide una cuarta columna en
 * MODEL_PRICING; mientras no exista, queda dicho acá y no escondido.
 */
function deClaude(res: Anthropic.Message): ChatCompletion {
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
  const cacheRead = res.usage.cache_read_input_tokens ?? 0
  const promptTokens = res.usage.input_tokens + cacheRead + (res.usage.cache_creation_input_tokens ?? 0)

  return {
    id: res.id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: res.model,
    choices: [
      {
        index: 0,
        // El motor sólo distingue un caso: la respuesta que se cortó por largo.
        finish_reason: res.stop_reason === "max_tokens" ? "length" : "stop",
        message: { role: "assistant", content: text, refusal: null },
        logprobs: null,
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: res.usage.output_tokens,
      total_tokens: promptTokens + res.usage.output_tokens,
      prompt_tokens_details: { cached_tokens: cacheRead },
    },
  } as ChatCompletion
}
