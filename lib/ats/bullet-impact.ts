// lib/ats/bullet-impact.ts
//
// CUÁL DE ESTAS LÍNEAS APORTA MENOS A ESTA VACANTE. Un solo dueño.
//
// ── EL DEFECTO (reportado con captura por el CEO, 2026-08-25) ─────────────────
//
//   «Parece que me aconseja borrar el más fuerte… debería decirme borrar al más
//    débil o el que menos aporta.»
//
// Y lo hacía. La tarjeta de líneas gemelas borraba la SEGUNDA en orden del
// documento —`writing-checks` marca la repetida, no la peor— así que entre
//
//   «…improving app functionality and user experience by 5%.»   ← con cifra
//   «…enhancing user experience.»                                ← pelada
//
// se llevaba la de la cifra si el CV la escribía segunda. Un volado.
//
// ── POR QUÉ NO ALCANZABA `scoreBullet` ───────────────────────────────────────
//
// `bullet-strength` puntúa REDACCIÓN —verbo, cifra, concreción, largo— y es
// ciega a la oferta: no sabe si la línea aterriza un término que esta vacante
// pide. El informe SÍ lo sabe (`report.bullets[].keywords`, contado con el mismo
// matcher que puntúa), y `build-report` ya lo usaba a mano para ordenar los
// cortes. Acá esas dos mitades quedan en una sola función, y todo lo que borra,
// corta o reemplaza pregunta lo mismo.
//
// EL ORDEN DE LAS DOS SEÑALES NO ES ARBITRARIO: primero la vacante, después la
// redacción. Una línea impecable que no le habla a este puesto vale menos, acá,
// que una floja que aterriza el término que la oferta repite. Es la misma
// prioridad que el CEO fijó para los cortes.

import { isImprovableLine, scoreBullet } from "./bullet-strength"

export interface ImpactBullet {
  index: number
  text: string
  /** Términos de la vacante que esta línea aterriza. Ausente = no hay vacante. */
  keywords?: readonly string[]
}

export interface RankedImpact extends ImpactBullet {
  /** Lo que le aporta a ESTA vacante. 0 = no nombra nada que la oferta pida. */
  relevance: number
  /** Lo que vale como redacción, con la vara que ya existe. */
  writing: number
  /**
   * ¿Se puede sacrificar sin perder algo que el CV necesita?
   *
   * Sólo dos motivos la vuelven prescindible, y los dos son verificables: no le
   * habla a la vacante, o tiene un defecto de redacción que el proyecto ya sabe
   * nombrar. Una línea sin ninguno de los dos es simplemente buena, y que sea la
   * última del ranking no la convierte en descartable — es la diferencia entre
   * «sobra» y «es la sexta mejor», que este panel ya pagó una vez por confundir.
   */
  expendable: boolean
}

/** El peso de un término de la vacante. Sin mapa, todas pesan igual: falla abierto. */
export type WeightOf = (term: string) => number

const DEFAULT_WEIGHT: WeightOf = () => 1

export function impactOf(b: ImpactBullet, weightOf: WeightOf = DEFAULT_WEIGHT): RankedImpact {
  const relevance = (b.keywords ?? []).reduce((sum, term) => sum + (Number.isFinite(weightOf(term)) ? weightOf(term) : 1), 0)
  const writing = scoreBullet(b.text).score
  return { ...b, relevance, writing, expendable: relevance === 0 || isImprovableLine(b.text) }
}

/**
 * De la que menos aporta a la que más.
 *
 * EL EMPATE NO SE ROMPE ACÁ, y es deliberado: dos líneas que miden exactamente
 * igual las ordena quien llama, en el orden en que las entrega (`sort` es
 * estable). Inventar acá un desempate —«la de más abajo primero»— habría
 * cambiado en silencio el orden de los cortes, que ya venía decidido por el
 * ranking de redacción, para arreglar un caso que el llamador puede resolver
 * entregando las dos líneas en el orden que corresponde.
 */
export function compareImpact(a: RankedImpact, b: RankedImpact): number {
  return a.relevance - b.relevance || a.writing - b.writing
}

export function rankByImpact(bullets: readonly ImpactBullet[], weightOf?: WeightOf): RankedImpact[] {
  return bullets.map((b) => impactOf(b, weightOf)).sort(compareImpact)
}

/**
 * La línea que menos aporta, o `null` si no hay ninguna que se pueda sacrificar.
 *
 * `null` NO es un fallo: es la respuesta honesta cuando todas las líneas del
 * puesto le hablan a la vacante y están bien escritas. Quien pregunta tiene que
 * poder distinguir «sacá ésta» de «acá no sobra nada» — si en ese caso
 * devolviéramos igual la última del ranking, el producto le estaría pidiendo
 * borrar trabajo bueno para hacerle lugar a una línea nueva.
 */
export function weakestBullet(bullets: readonly ImpactBullet[], weightOf?: WeightOf): RankedImpact | null {
  const ranked = rankByImpact(bullets, weightOf)
  return ranked.find((b) => b.expendable) ?? null
}
