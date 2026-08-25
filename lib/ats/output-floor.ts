// lib/ats/output-floor.ts
//
// EL PISO DE SALIDA, EN UN SOLO SITIO.
//
// ── QUÉ PROBLEMA CIERRA (reportado por el CEO, 2026-08-24) ──────────────────
//
// «Vi bullets muy básicos que la IA está generando, como que no se esfuerza».
// Los guards que ya corrían comprueban que una reescritura NO PIERDA nada —la
// cifra, un término de la vacante, contenido— y ninguno comprueba que GANE. Una
// línea podía conservarlo todo, no ser trivial, y seguir siendo floja.
//
// ── POR QUÉ ACÁ Y NO DENTRO DE CADA MÓDULO ─────────────────────────────────
//
// Porque escrito dos veces se desincroniza: es exactamente cómo `hasHardCodedFact`
// y `hardCodedFactKind` terminaron dando veredictos distintos sobre el mismo
// texto. Un solo dueño, y cada escritor declara que lo usa.
//
// ── LAS PIEZAS SON LAS QUE YA EXISTEN ──────────────────────────────────────
//
// `scoreBullet` es el mismo juez con el que el informe marca una línea como
// floja: si el panel la señalaría, no tiene sentido que nosotros la escribamos.
// Y el mínimo de palabras es el de la doctrina, citado y no reinventado.
import { scoreBullet } from "@/lib/ats/bullet-strength"

/**
 * El piso de la doctrina: «menos de doce palabras no dice nada que no dijera ya
 * el nombre del puesto». Es un PISO — arriba NO hay techo, porque el largo no es
 * la prueba, el valor sí: cuatro renglones que nombren volumen, herramienta y
 * efecto le ganan a una línea telegráfica.
 */
export const MIN_BULLET_WORDS = 12

/** Por qué una línea no alcanza el piso. Viaja al reintento tal cual. */
export type FloorMiss = "duty_opener" | "empty_phrasing" | "too_short" | "no_gain"

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Qué le falta a una línea para entregarse. Vacío = pasa.
 *
 * `original` ausente = la línea nace de cero (una habilidad que se demuestra por
 * primera vez): ahí no hay contra qué comparar la ganancia, y las otras tres
 * condiciones siguen valiendo.
 */
export function bulletFloorMisses(
  text: string,
  opts: { original?: string; gainedTerm?: boolean; saysMore?: boolean } = {},
): FloorMiss[] {
  const misses: FloorMiss[] = []
  const { reasons, score } = scoreBullet(text)

  if (reasons.includes("duty_opener")) misses.push("duty_opener")
  if (reasons.includes("empty_phrasing")) misses.push("empty_phrasing")
  if (countWords(text) < MIN_BULLET_WORDS) misses.push("too_short")

  if (opts.original) {
    const antes = scoreBullet(opts.original).score
    const mejora = score > antes || !!opts.gainedTerm || !!opts.saysMore
    if (!mejora) misses.push("no_gain")
  }
  return misses
}

/** Lo que se le dice al modelo cuando una línea no llegó. En su idioma. */
export function floorNudge(misses: readonly FloorMiss[], language: string): string {
  const en = language === "en"
  const parts: string[] = []
  if (misses.includes("duty_opener")) parts.push(en ? "it opened with a duty phrase instead of an action verb" : "abrió con una frase de tarea en vez de un verbo de acción")
  if (misses.includes("empty_phrasing")) parts.push(en ? "it claimed a quality instead of stating the work" : "afirmó una cualidad en vez de decir el trabajo")
  if (misses.includes("too_short")) parts.push(en ? `it ran under ${MIN_BULLET_WORDS} words` : `quedó por debajo de ${MIN_BULLET_WORDS} palabras`)
  if (misses.includes("no_gain")) parts.push(en ? "it said nothing the original did not" : "no dijo nada que la original no dijera")
  return en
    ? `a line came back weak: ${parts.join(", ")} — name the work, the tools or documents it runs on, and its result or scale. There is no upper limit on length.`
    : `una línea volvió floja: ${parts.join(", ")} — nombrá el trabajo, las herramientas o documentos con los que opera, y su resultado o alcance. No hay límite superior de largo.`
}
