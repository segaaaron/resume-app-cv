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
//
// Acá vive la respuesta, una sola vez, y las cinco preguntan. El rango que
// devuelve es el del editor y ningún otro: ver el bloque de abajo.

import { BULLETS_PER_ROLE_MAX, BULLETS_PER_ROLE_MIN } from "./scoring-config"
import { parseBullets } from "@/lib/services/ai/shared/bullets"

/**
 * Lo mínimo que hace falta para medir un puesto: sus líneas.
 *
 * Las fechas siguen aceptándose porque los llamadores pasan el puesto entero, y
 * rechazarlas obligaría a que cada uno arme un objeto recortado. Nadie las lee:
 * el rango dejó de depender de la antigüedad.
 */
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
  /** Techo del puesto. El mismo para todos, y el mismo que el editor aplica. */
  max: number
  /** Cuántas admite todavía. Nunca negativo: lo que sobra lo dice `state`. */
  room: number
  /** Cuántas sobran. Cero cuando no sobra ninguna. */
  surplus: number
  state: "empty" | "under" | "ok" | "full" | "over"
}

/**
 * EL RANGO, Y ES UNO SOLO PARA TODO PUESTO.
 *
 * ── EL SEGUNDO DEFECTO, REPORTADO POR EL CEO (2026-08-27) ────────────────────
 *
 *   «Cuando aprieto el ATS me dice que elimine, y cuando creo otro bullet me
 *    sugiere eliminar el mismo.»
 *
 * Unificar los cinco topes en un dueño no alcanzó, porque el dueño contestaba
 * con una BANDA POR ANTIGÜEDAD —6 el actual, 4 el anterior, 3 los viejos— que
 * nadie pidió y que el editor no comparte: `WorkExperience.tsx` deja escribir
 * hasta `BULLETS_PER_ROLE_MAX` en CUALQUIER puesto y lo anuncia en su ayuda.
 * Medido antes de tocar, con el mismo CV:
 *
 *   editor: máximo 6 en todos   ·   ATS: puesto de 2024 con 5 → «sobra 1»
 *
 * Un puesto no actual nunca salía de «sobra», porque el techo del ATS era 4 y el
 * del editor 6. Escribir la línea que el producto te ofrece y recibir la orden de
 * borrarla es el bucle entero, y la antigüedad era su única fuente.
 *
 * La regla del CEO es 3 a 6 POR PUESTO, sin distinguir antigüedad. Los dos
 * números salen de `scoring-config`, donde ya vivía el techo que el editor usa:
 * mover cualquiera de los dos mueve el editor y el informe a la vez, y ninguna
 * capa puede volver a inventarse un tope propio.
 */
const ROLE_MIN = BULLETS_PER_ROLE_MIN.value
const ROLE_MAX = BULLETS_PER_ROLE_MAX.value

/**
 * EL TECHO DURO — hoy el MISMO número que el consejo, y por eso sigue existiendo.
 *
 * Nació cuando la banda castigaba por antigüedad: la credibilidad no podía cobrar
 * cinco puntos de confianza por cuatro líneas en un puesto de 2018, que es lo que
 * la doctrina de la casa recomienda. Con la banda plana las dos preguntas dan lo
 * mismo, pero conservan su nombre porque no son la misma pregunta: «¿cuántas se
 * leen mejor acá?» es un consejo, «¿este documento se lee sospechoso?» es un
 * castigo. Si algún día una se mueve, la otra no tiene que seguirla.
 */
export const HARD_ROLE_CEILING = BULLETS_PER_ROLE_MAX.value

/**
 * El rango de un puesto. Igual para todos: la firma conserva el puesto porque
 * sus llamadores lo tienen a mano, pero ya no hay nada que leerle.
 */
export function roleBand(_job?: RoleLike, _thisYear?: number): { min: number; max: number } {
  return { min: ROLE_MIN, max: ROLE_MAX }
}

/**
 * El presupuesto de un puesto: lo que tiene, lo que admite, y lo que sobra.
 *
 * Función pura y sin opinión propia: cuenta con `parseBullets` —el único lector
 * de viñetas del proyecto— y compara contra el único rango. No decide qué hacer;
 * contesta cuánto entra.
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
