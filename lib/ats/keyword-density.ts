// lib/ats/keyword-density.ts
//
// EL RELLENO DE KEYWORDS, MEDIDO — no deducido del puntaje.
//
// ── QUÉ AVISÁBAMOS ANTES, Y POR QUÉ NO ALCANZA ─────────────────────────────
//
// El panel avisaba de sobre-optimización cuando el PUNTAJE pasaba cierto techo.
// Eso es un proxy, y de los malos: un CV honesto que de verdad cubre la vacante
// saca un puntaje alto y recibía el reproche; y uno que repite «Salesforce»
// catorce veces en dos puestos puede quedar por debajo del techo y no recibir
// nada. El aviso miraba el resultado en vez de la conducta.
//
// Acá se mide la conducta: cuántas veces dice el CV cada término y qué
// proporción del texto ocupa. Un reclutador humano lo nota en la primera pasada
// —«esto está escrito para la máquina»— y es la única forma de sobre-optimizar
// que un filtro sí penaliza en los sistemas que puntúan.
//
// ── LOS DOS UMBRALES, Y DE DÓNDE SALEN ─────────────────────────────────────
//
// No hay una cifra canónica publicada, así que se eligen de forma DEFENDIBLE y
// se dice que son elegidos, igual que `scoring-config` hace con sus pesos:
//
//   · REPEATS: 6 apariciones del mismo término. Un CV normal nombra su
//     herramienta principal una vez en habilidades y una o dos veces por puesto
//     donde la usó: con tres puestos, cuatro o cinco es lo natural. Seis empieza
//     a ser una decisión, no un relato.
//   · SHARE: 2% del texto ocupado por UN solo término. Con 500 palabras —la
//     banda de mayor tasa de entrevista— eso es diez apariciones de la misma
//     palabra, que ya no se lee como un CV.
//
// Falla del lado de callar: se exige que se cumplan LAS DOS condiciones. Avisar
// de más sobre esto es peor que no avisar, porque empuja a sacar un término que
// el candidato de verdad usa, y ahí perdería la coincidencia que traía.

import { normalizeTerm } from "./vocabulary"

/** Elegidos, no medidos contra un corpus. Ver el comentario de arriba. */
export const STUFFING_REPEATS = 6
export const STUFFING_SHARE = 0.02

export interface StuffedTerm {
  term: string
  /** Veces que aparece en el CV. */
  count: number
  /** Qué proporción del texto ocupa, redondeada a un decimal (2.4 = 2,4%). */
  sharePct: number
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Los términos que el CV repite tanto que se lee escrito para la máquina.
 *
 * Sólo se miran los términos que la VACANTE pide: repetir una palabra cualquiera
 * es un problema de redacción y ya tiene dueño (`repeated-content`). Repetir una
 * keyword es lo que un lector interpreta como relleno deliberado.
 */
export function findStuffedTerms(resumeText: string, postingTerms: readonly string[]): StuffedTerm[] {
  const total = countWords(resumeText)
  if (total < 80 || postingTerms.length === 0) return []
  const hay = normalizeTerm(resumeText)
  const out: StuffedTerm[] = []
  const seen = new Set<string>()

  for (const raw of postingTerms) {
    const term = raw.trim()
    const norm = normalizeTerm(term)
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    const escaped = norm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const count = (hay.match(new RegExp(`\\b${escaped}\\b`, "g")) ?? []).length
    if (count < STUFFING_REPEATS) continue
    // Las palabras que ocupa: un término de dos palabras ocupa el doble.
    const share = (count * norm.split(/\s+/).length) / total
    if (share < STUFFING_SHARE) continue
    out.push({ term, count, sharePct: Math.round(share * 1000) / 10 })
  }
  return out.sort((a, b) => b.count - a.count)
}
