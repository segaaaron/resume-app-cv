// lib/services/ai/shared/cost-tracker.ts
// Token-based cost computation for AI endpoint usage.
// Used by AI modules to persist precise per-call costs in AIUsageLog.

/**
 * Precio del prompt CACHEADO, por modelo (`cachedInputPer1M` en MODEL_PRICING).
 *
 * OpenAI cobra más barato el prompt que ya vio (`usage.prompt_tokens_details.cached_tokens`).
 * El descuento NO es uno solo: la familia 5.4 descuenta 90% (0.20 → 0.02) y la 4.1 descuenta
 * 75% (0.10 → 0.025). Por eso el precio vive por modelo y no como una proporción global —
 * una sola constante habría sobrecobrado la 4.1 o subcobrado la 5.4.
 *
 * Verificado contra la página oficial de precios (developers.openai.com/api/docs/pricing).
 *
 * Precios por 1M de tokens en USD. Actualizar cuando OpenAI cambie sus tarifas.
 */
export const MODEL_PRICING: Record<string, { inputPer1M: number; cachedInputPer1M: number; outputPer1M: number }> = {
  // GPT-5.4 family (reasoning) — active models. Prices verified against the
  // official OpenAI pricing page (developers.openai.com/api/docs/pricing).
  // NOTE: reasoning tokens are billed as OUTPUT tokens and are already included
  // in the API's usage.completion_tokens, so computeCostUsd stays exact for them
  // without any special handling.
  "gpt-5.4-nano":   { inputPer1M: 0.20,  cachedInputPer1M: 0.02,  outputPer1M: 1.25  },
  "gpt-5.4-mini":   { inputPer1M: 0.75,  cachedInputPer1M: 0.075, outputPer1M: 4.50  },
  // Embeddings (semantic ATS recall) — active. La API de embeddings no cachea prompts
  // ni devuelve `cached_tokens`, así que el precio cacheado nunca se aplica: se iguala
  // al de entrada para que un cero accidental no vuelva gratis una llamada real.
  "text-embedding-3-small": { inputPer1M: 0.02, cachedInputPer1M: 0.02, outputPer1M: 0 },
  // Rollback targets: the models our documented env rollback points to
  // (AI_MODEL / AI_MODEL_PROSE = gpt-4.1-*). Kept so a rollback still prices
  // new calls correctly instead of dropping to the conservative fallback.
  "gpt-4.1-nano":   { inputPer1M: 0.10,  cachedInputPer1M: 0.025, outputPer1M: 0.40  },
  "gpt-4.1-mini":   { inputPer1M: 0.40,  cachedInputPer1M: 0.10,  outputPer1M: 1.60  },
}

// Conservative anchor for any model not in the table above: over-report rather
// than under-report spend. Was previously the gpt-4-turbo row (now removed).
// `cachedInputPer1M` iguala al de entrada a propósito: de un modelo desconocido tampoco
// sabemos su descuento, y suponer uno abarataría el gasto de algo que no sabemos pricear.
const FALLBACK_PRICING = { inputPer1M: 10.00, cachedInputPer1M: 10.00, outputPer1M: 30.00 } as const

let unknownModelWarned = false

/**
 * EL COSTO DE UNA LLAMADA, LEYENDO LO QUE LA API YA DEVUELVE.
 *
 * ── EL DEFECTO (auditoría, 2026-08-25) ─────────────────────────────────────
 *
 * `computeCostUsd` acepta los tokens cacheados desde hace tiempo y `MODEL_PRICING`
 * lleva el precio cacheado POR MODELO —0.02 contra 0.20 en la 5.4-nano, un
 * descuento del 90%—. Y de los veinte sitios que costean una llamada, NINGUNO
 * los pasaba: el parámetro quedaba en 0 y todo prompt reusado se cobraba a precio
 * completo. El panel de admin sobre-reporta el gasto.
 *
 * El dato estaba disponible en todos: `chat()` devuelve el objeto de la API tal
 * cual, y ahí viene `usage.prompt_tokens_details.cached_tokens`. No faltaba
 * información — faltaba leerla.
 *
 * Por eso esto recibe el `usage` entero en vez de tres números: quien costea una
 * llamada no puede olvidarse de un campo que no tiene que escribir.
 */
export interface ChatUsageLike {
  prompt_tokens?: number
  completion_tokens?: number
  prompt_tokens_details?: { cached_tokens?: number | null } | null
}

export function costOfChat(model: string, usage: ChatUsageLike | null | undefined): number {
  return computeCostUsd(
    model,
    usage?.prompt_tokens ?? 0,
    usage?.completion_tokens ?? 0,
    usage?.prompt_tokens_details?.cached_tokens ?? 0,
  )
}

export function computeCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
  /** De `usage.prompt_tokens_details.cached_tokens`. Va INCLUIDO en promptTokens. */
  cachedTokens = 0,
): number {
  let pricing = MODEL_PRICING[model]
  if (!pricing) {
    // Unknown model: assume expensive pricing — under-reporting real spend is
    // worse than over-reporting it.
    pricing = FALLBACK_PRICING
    if (!unknownModelWarned) {
      unknownModelWarned = true
      console.error(`[cost-tracker] modelo "${model}" sin precio en MODEL_PRICING — usando tarifa más cara conocida como estimación conservadora. Actualiza MODEL_PRICING.`)
    }
  }
  // Los cacheados vienen DENTRO de promptTokens: se separan para no cobrarlos dos veces.
  const cached = Math.min(Math.max(cachedTokens, 0), promptTokens)
  const fresh = promptTokens - cached
  return (
    fresh * pricing.inputPer1M +
    cached * pricing.cachedInputPer1M +
    completionTokens * pricing.outputPer1M
  ) / 1_000_000
}
