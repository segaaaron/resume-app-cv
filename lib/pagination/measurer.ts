/**
 * PageFlow Engine — Measurer (F0 spike).
 *
 * Fase A del motor: recorre un template renderizado oculto a 210mm reales
 * y produce `FlowAtom[]` midiendo cada átomo con `getBoundingClientRect`.
 *
 * Los templates instrumentan sus átomos con data-attributes:
 *   data-block            → unidad atómica medible (obligatorio)
 *   data-keep-next        → header de sección (no puede quedar huérfano)
 *   data-section-start    → primer átomo de una sección (frontera de corte)
 *   data-splittable       → párrafo largo partible (reservado F6)
 *   data-break-before     → fuerza página nueva antes de este átomo
 *
 * Esta es la ÚNICA parte del motor que toca el DOM. Se aísla aquí para que
 * el breaker (breaker.ts) siga siendo puro y testeable.
 */
import type { FlowAtom } from "./types"

/**
 * Mide todos los átomos `[data-block]` dentro de `container`.
 * Debe llamarse tras `document.fonts.ready` para alturas fiables.
 *
 * @param container elemento raíz del template renderizado a 210mm.
 * @returns lista ordenada de átomos con alturas reales en px.
 */
export function measureAtoms(container: HTMLElement): FlowAtom[] {
  const blocks = Array.from(
    container.querySelectorAll<HTMLElement>("[data-block]"),
  )
  const rects = blocks.map(el => el.getBoundingClientRect())

  return blocks.map((el, index) => {
    const rect = rects[index]
    // Gap REAL hasta el siguiente átomo por posición (top siguiente − bottom
    // este). Refleja el margen colapsado real; nunca doble-cuenta. El último
    // átomo no tiene siguiente → gap 0.
    const nextRect = rects[index + 1]
    const gapAfter = nextRect ? Math.max(0, nextRect.top - rect.bottom) : 0

    return {
      id: el.getAttribute("data-block") || `atom-${index}`,
      height: rect.height, // altura propia; los gaps van aparte en gapAfter
      gapAfter,
      keepNext: el.hasAttribute("data-keep-next"),
      sectionStart: el.hasAttribute("data-section-start"),
      splittable: el.hasAttribute("data-splittable"),
      forcedBreakBefore: el.hasAttribute("data-break-before"),
    }
  })
}

/**
 * Mide la altura útil real de una página A4 (297mm menos márgenes de print)
 * insertando un ruler efímero — mismo patrón que PrintLayout.tsx:94.
 * Devuelve px. Cae a un default si no hay DOM (SSR).
 */
export function measureA4UsableHeight(marginMm = 0): number | null {
  if (typeof document === "undefined") return null
  const ruler = document.createElement("div")
  ruler.style.cssText = `position:fixed;top:-9999px;left:0;height:${297 - marginMm * 2}mm;visibility:hidden;pointer-events:none;`
  document.body.appendChild(ruler)
  const px = ruler.getBoundingClientRect().height
  document.body.removeChild(ruler)
  return px > 0 ? px : null
}
