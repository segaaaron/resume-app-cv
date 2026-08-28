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
import { isImprovableLine, scoreBullet } from "@/lib/ats/bullet-strength"

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
  /**
   * EL LARGO NO SE LE EXIGE A UNA LÍNEA QUE YA DECÍA ALGO.
   *
   * ── LA CONTRADICCIÓN, MEDIDA DE PUNTA A PUNTA (2026-08-28) ────────────────
   *
   * `MIN_BULLET_WORDS` es un PROXY de una pregunta que en este proyecto ya tiene
   * dueño: «¿esta línea dice algo más que el nombre del puesto?». Quien la
   * contesta es `isImprovableLine`, con evidencia —verbo, concreción, cifra— y
   * es la misma vara con la que el panel decide si le da tarjeta. Contar
   * palabras es la aproximación; el juez es la respuesta.
   *
   * Y las dos discrepaban, con consecuencia. Se creía que el choque era un
   * artefacto del harness, porque el panel «sólo manda líneas con hallazgo».
   * Medido sobre `strong-set` (40 viñetas de CVs bien escritos): DOS líneas que
   * `isImprovableLine` declara sanas y el piso rechazaba por cortas —
   *
   *   9 palabras, score 7  «Led the weekly count for a team of 11»
   *   9 palabras, score 2  «Introduced a returns log adopted by three other branches»
   *
   * — y la puerta de producción existe: la tarjeta de la cifra (`tips.metric`,
   * `build-report`) elige por impacto entre las líneas SIN cifra detectable y
   * NUNCA pregunta `isImprovableLine`. La primera de esas dos es exactamente el
   * caso que el rubric marcó como invención: con nueve palabras el piso pedía
   * `too_short`, el modelo tenía que estirarla para pasar, y de ahí salió
   * «… across store stockrooms and sales floor areas» — un ámbito que el
   * candidato nunca nombró.
   *
   * El piso le pedía al modelo lo único que la doctrina le prohíbe: rellenar.
   *
   * ── POR QUÉ ESTA CONDICIÓN Y NO OTRA ──────────────────────────────────────
   *
   * No se toca el número ni se silencia la tarjeta. Se deriva el alcance: el
   * piso existe para que NO ENTREGUEMOS UNA LÍNEA FLOJA, y una línea cuyo
   * original el propio panel llama sano no se vuelve floja por ser corta. Lo que
   * sí se le sigue exigiendo es GANAR algo (`no_gain`), no abrir con una frase
   * de tarea y no afirmar una cualidad — las tres condiciones que miden valor y
   * no volumen. Y donde la queja del CEO nació —una línea floja, o una que nace
   * de cero sin original que juzgar— el piso conserva todos sus dientes.
   */
  const originalYaDecíaAlgo = !!opts.original && !isImprovableLine(opts.original)
  if (!originalYaDecíaAlgo && countWords(text) < MIN_BULLET_WORDS) misses.push("too_short")

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
