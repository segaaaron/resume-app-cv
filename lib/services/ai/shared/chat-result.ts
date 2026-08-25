// lib/services/ai/shared/chat-result.ts
//
// TRUNCADO, NEGATIVA Y RESPUESTA VÁLIDA SON TRES COSAS DISTINTAS.
//
// ── EL DEFECTO (auditoría, 2026-08-25) ─────────────────────────────────────
//
// `finish_reason` se registraba en dos sitios y no se actuaba nunca. Una
// respuesta cortada por el techo de tokens llegaba como JSON inválido, es decir
// indistinguible de una mala respuesta: el usuario veía una pantalla vacía
// habiendo pagado el uso, y el log decía «unparseable» sin decir por qué.
//
// La diferencia importa porque el arreglo es distinto en cada caso:
//   · truncado  → pedir menos ítems o subir el techo. Reintentar igual no sirve.
//   · negativa  → el modelo no va a hacerlo. Reintentar es gastar dos veces.
//   · inválido  → reintentar UNA vez nombrando lo que falló.
//
// Un solo lector para las tres, así ningún módulo tiene que acordarse.
import type { ChatCompletion } from "@/lib/interfaces/IAIClient"

export interface ChatRead {
  /** El contenido, ya recortado. Cadena vacía si no vino nada. */
  text: string
  /** El techo de tokens cortó la respuesta: el JSON está incompleto por diseño. */
  truncated: boolean
  /** El modelo se negó. No es un fallo transitorio: reintentar no lo cambia. */
  refusal: string | null
}

export function readChat(response: ChatCompletion | null | undefined): ChatRead {
  const choice = response?.choices?.[0]
  const message = choice?.message as { content?: string | null; refusal?: string | null } | undefined
  return {
    text: (message?.content ?? "").trim(),
    truncated: choice?.finish_reason === "length",
    refusal: message?.refusal?.trim() || null,
  }
}

/** Lo que se le dice al modelo cuando su respuesta no entró en el techo. */
export function truncatedNudge(language: string): string {
  return language === "en"
    ? "\n\nYOUR LAST ANSWER WAS CUT OFF because it did not fit. Return the SAME quality on FEWER items: only the ones that matter most, complete, with valid JSON."
    : "\n\nTU RESPUESTA ANTERIOR SE CORTÓ porque no entró. Devolvé la MISMA calidad sobre MENOS ítems: sólo los que más importan, completos y con el JSON válido."
}
