/**
 * PageFlow Engine — Breaker (F0 spike).
 *
 * Programación dinámica estilo Knuth-Plass aplicada a saltos de página
 * VERTICALES. Elige la secuencia GLOBAL de cortes con badness total mínima
 * (no el mejor corte local/greedy), evitando huérfanos, páginas casi vacías
 * y respetando cortes forzados; prefiere cortar en fronteras de sección.
 *
 * Puro y determinista → testeable sin DOM. Consume `FlowAtom[]` medidos.
 */
import {
  type FlowAtom,
  type PageLayout,
  type ComposedPage,
  type BadnessWeights,
  DEFAULT_WEIGHTS,
  A4_USABLE_PX,
} from "./types"

export interface BreakOptions {
  pageHeight?: number
  weights?: BadnessWeights
}

/**
 * Badness de una página que contiene atoms[i..j-1] (j exclusivo).
 * `Infinity` = distribución prohibida (no debe elegirse).
 */
function pageBadness(
  atoms: FlowAtom[],
  i: number,
  j: number,
  pageHeight: number,
  w: BadnessWeights,
): number {
  const n = atoms.length
  const isLastPage = j === n
  const isSingleAtom = j - i === 1

  // Suma de alturas + gaps INTERNOS + veto por corte forzado.
  let used = 0
  for (let k = i; k < j; k++) {
    // Un forcedBreakBefore DENTRO del rango (no en el primer átomo) obliga a
    // haber cortado antes → esta página es inválida.
    if (k > i && atoms[k].forcedBreakBefore) return Infinity
    used += atoms[k].height
    // Gap sólo entre átomos de la MISMA página; el gap del último átomo
    // (frontera de corte) no se renderiza y se descarta.
    if (k < j - 1) used += atoms[k].gapAfter ?? 0
  }

  // Overflow: sólo permitido si es un único átomo más alto que la página
  // (inevitable). Cualquier otro overflow está prohibido.
  if (used > pageHeight && !isSingleAtom) return Infinity

  const deadSpace = Math.max(0, pageHeight - used)
  let badness = 0

  if (isLastPage) {
    // La última página corta y natural no penaliza por espacio muerto,
    // pero sí si queda ridículamente vacía (salvo que sea la única página).
    const fillRatio = used / pageHeight
    if (i > 0 && fillRatio < w.underfullRatio) badness += w.underfullLastPage
  } else {
    // Espacio muerto al pie penaliza proporcional.
    badness += w.deadSpacePerPx * deadSpace
    // Header huérfano: keepNext no puede ser el último átomo antes del corte.
    if (atoms[j - 1].keepNext) badness += w.orphanHeader
    // Bonus: el corte cae justo antes de un inicio de sección (frontera natural).
    if (atoms[j].sectionStart) badness -= w.sectionBoundaryBonus
  }

  return badness
}

/**
 * Descompone la secuencia de átomos en páginas con cortes de badness mínima.
 * Devuelve `PageLayout` = fuente única de verdad para preview y print.
 */
export function breakIntoPages(
  atoms: FlowAtom[],
  opts: BreakOptions = {},
): PageLayout {
  const pageHeight = opts.pageHeight ?? A4_USABLE_PX
  const w = opts.weights ?? DEFAULT_WEIGHTS
  const n = atoms.length

  if (n === 0) {
    return { pages: [], pageHeight, totalBadness: 0 }
  }

  // dp[i] = badness mínima de paginar atoms[i..n-1]. next[i] = j elegido.
  const dp = new Array<number>(n + 1).fill(Infinity)
  const next = new Array<number>(n + 1).fill(-1)
  dp[n] = 0

  for (let i = n - 1; i >= 0; i--) {
    for (let j = i + 1; j <= n; j++) {
      const pb = pageBadness(atoms, i, j, pageHeight, w)
      if (pb === Infinity) {
        // Si ya no cabe nada más (overflow con >1 átomo o corte forzado),
        // extender j sólo empeora → podemos parar de crecer esta página.
        if (j > i + 1) break
        continue
      }
      const cost = pb + dp[j]
      if (cost < dp[i]) {
        dp[i] = cost
        next[i] = j
      }
    }
  }

  // Reconstrucción de páginas.
  const pages: ComposedPage[] = []
  let i = 0
  while (i < n) {
    const j = next[i]
    const atomIndices: number[] = []
    let usedHeight = 0
    for (let k = i; k < j; k++) {
      atomIndices.push(k)
      usedHeight += atoms[k].height
      if (k < j - 1) usedHeight += atoms[k].gapAfter ?? 0 // gaps internos, no el de frontera
    }
    pages.push({
      atomIndices,
      usedHeight,
      fillHeight: Math.max(0, pageHeight - usedHeight),
    })
    i = j
  }

  return { pages, pageHeight, totalBadness: dp[0] }
}
