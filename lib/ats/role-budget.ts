// lib/ats/role-budget.ts
//
// CUÁNTAS VIÑETAS ADMITE UN PUESTO. Un solo dueño de la pregunta.
//
// ── EL DEFECTO (reportado por el CEO, 2026-08-25) ─────────────────────────────
//
//   «Si ya tenemos como máximo 6 bullets no debería aconsejarme agregar un bullet
//    donde ya tengo 6 bullets… si bien agrego uno luego me sugiere borrarlo
//    porque ya pasamos los 6.»
//
// Y era literal. La misma pregunta —«¿cabe otra línea acá?»— se contestaba en
// cinco lugares distintos, con cinco desigualdades distintas:
//
//   AISkillBulletModule   length <= 6  → un puesto CON 6 tenía «lugar» → escribía la 7ª
//   ATSScorePanel         length >= 6  → avisaba «está lleno» DESPUÉS de escribirla
//   writing-checks        length >  6  → «sobran líneas, cortá»
//   profile-gaps          length <  6  → dejaba de ofrecer
//   merge-candidates      length >  4  → «está recargado»
//
// El `<=` contra el `>=` es el bucle entero: escribir, avisar, pedir que borre.
// Y ninguna de las cinco miraba la ANTIGÜEDAD del puesto, que es la vara que el
// informe ya usaba por otro lado (`roleBalance`) — así que un puesto de hace diez
// años recibía una séptima línea mientras otra tarjeta le pedía bajar a tres.
//
// Acá vive la respuesta, una sola vez, y las cinco preguntan.

import { BULLETS_PER_ROLE_MAX } from "./scoring-config"
import { parseBullets } from "@/lib/services/ai/shared/bullets"

/** Lo mínimo que hace falta para medir un puesto: sus líneas y su antigüedad. */
export interface RoleLike {
  description?: string
  endDate?: string
  currentlyWorking?: boolean
}

export interface RoleBudget {
  /** Líneas que el puesto tiene hoy. */
  count: number
  /** Piso: por debajo, el puesto se lee como si no hubiera pasado nada ahí. */
  min: number
  /** Techo de ESTE puesto, según su antigüedad. */
  max: number
  /** Cuántas admite todavía. Nunca negativo: lo que sobra lo dice `state`. */
  room: number
  /** Cuántas sobran. Cero cuando no sobra ninguna. */
  surplus: number
  state: "empty" | "under" | "ok" | "full" | "over"
}

/**
 * El rango por antigüedad. Movido desde `panel-report.ts`, donde era privado y
 * por eso nadie más podía consultarlo — que es exactamente cómo aparecieron los
 * otros cuatro topes.
 *
 * El techo del puesto ACTUAL no es un número nuevo: sale de `BULLETS_PER_ROLE_MAX`,
 * el mismo que el editor y el chequeo de estructura ya usaban. Si esa constante
 * se mueve, se mueven las cinco preguntas a la vez.
 */
const ROLE_RANGE: ReadonlyArray<{ maxAgeYears: number; min: number; max: number }> = [
  { maxAgeYears: 0, min: 4, max: BULLETS_PER_ROLE_MAX.value }, // el actual
  { maxAgeYears: 5, min: 3, max: 4 },                          // el anterior
  { maxAgeYears: Infinity, min: 2, max: 3 },                   // los viejos
]

/**
 * EL TECHO DURO, que no es el mismo número que el consejo de redacción.
 *
 * ── LA DISTINCIÓN, y por qué existe (cazada por QA, 2026-08-25) ──────────────
 *
 * `roleBand` contesta «¿cuántas líneas se leen mejor acá?» — es un CONSEJO, y
 * para un puesto viejo dice dos o tres. La credibilidad contesta otra cosa:
 * «¿este documento se lee sospechoso?». Cobrarle a alguien cinco puntos de
 * confianza por escribir cuatro líneas en un puesto de 2018 —lo que la doctrina
 * de la casa recomienda, «3-5 por puesto»— es castigar por seguir el consejo.
 * Medido: cuatro puestos viejos bien escritos caían de 100 a 80.
 *
 * Así que la CUENTA se unifica —una sola función mide— pero las dos preguntas
 * conservan su umbral: el consejo usa la banda, el castigo usa este techo.
 */
export const HARD_ROLE_CEILING = BULLETS_PER_ROLE_MAX.value

/** El rango que le toca a un puesto por su antigüedad. */
export function roleBand(job: RoleLike, thisYear = new Date().getFullYear()): { min: number; max: number } {
  const end = job.currentlyWorking
    ? thisYear
    : Number((job.endDate ?? "").match(/(19|20)\d{2}/)?.[0] ?? thisYear)
  const age = Math.max(0, thisYear - end)
  const band = ROLE_RANGE.find((r) => age <= r.maxAgeYears) ?? ROLE_RANGE[ROLE_RANGE.length - 1]
  return { min: band.min, max: band.max }
}

/**
 * El presupuesto de un puesto: lo que tiene, lo que admite, y lo que sobra.
 *
 * Función pura y sin opinión propia: cuenta con `parseBullets` —el único lector
 * de viñetas del proyecto— y mide la antigüedad con la misma fórmula que ya
 * usaba el informe. No decide qué hacer; contesta cuánto entra.
 */
export function roleBudget(job: RoleLike, thisYear = new Date().getFullYear()): RoleBudget {
  const count = parseBullets(job.description ?? "").length
  const { min, max } = roleBand(job, thisYear)
  const room = Math.max(0, max - count)
  const surplus = Math.max(0, count - max)
  const state: RoleBudget["state"] =
    count === 0 ? "empty" : count < min ? "under" : count > max ? "over" : count === max ? "full" : "ok"
  return { count, min, max, room, surplus, state }
}

/**
 * ¿Entra una línea más sin que otra tarjeta pida borrarla?
 *
 * La única pregunta que los cinco lugares querían hacer. Escrita una vez, no se
 * puede volver a escribir con el signo al revés.
 */
export function hasRoomForBullet(job: RoleLike, thisYear = new Date().getFullYear()): boolean {
  return roleBudget(job, thisYear).room > 0
}
