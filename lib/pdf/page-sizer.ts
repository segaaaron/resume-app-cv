/**
 * lib/pdf/page-sizer.ts
 *
 * RESPONSABILIDAD: calcular el número de páginas necesarias y ajustar la
 * altura del wrapper para que el PDF tenga el número exacto de páginas
 * sin páginas en blanco.
 *
 * BUG QUE RESUELVE: el código previo asumía que `@page :first { margin-top: 0 }`
 * funcionaba en Puppeteer y compensaba con un `PAGE1_EXTRA_PX`. Esa regla
 * CSS es ignorada cuando se pasa `margin` explícito al API page.pdf(), por
 * lo que el `targetH` quedaba ~30px más alto que la altura utilizable real,
 * forzando una segunda página vacía.
 *
 * ALGORITMO ACTUAL (sin PAGE1_EXTRA, margin=0):
 *   Con margin=0 en page.pdf(), USABLE_PX_PER_PAGE = altura completa A4
 *   (~1123px). Cada página del PDF mide exactamente A4 — los templates
 *   manejan su propio padding interno.
 *   1. Reset min-height/height del wrapper interno a "auto" para medir
 *      el contenido real.
 *   2. Medir con getBoundingClientRect().height (sub-pixel preciso, mejor
 *      que scrollHeight que redondea hacia arriba).
 *   3. Restar 1px defensivo para evitar overflow por sub-pixel rounding
 *      de Chrome.
 *   4. pages = max(1, ceil(effectiveHeight / USABLE_PX_PER_PAGE)).
 *   5. targetH = pages * USABLE_PX_PER_PAGE   (uniforme, sin extras).
 *   6. Aplicar targetH al wrapper si stretchPages: true.
 *
 * FLAGS:
 *   - stretchPages: true  → CVs con sidebar. El wrapper debe llegar al
 *                            final de la última página para que el color
 *                            del sidebar se extienda completo.
 *   - stretchPages: false → Cartas. Altura libre — el PDF se corta
 *                            naturalmente al contenido.
 *
 * NO debe: pintar nada, detectar layout, ni invocar page.pdf(). Solo
 * mide y ajusta dimensiones del DOM.
 */

import type { Page } from "puppeteer"
import { USABLE_PX_PER_PAGE } from "./constants"

export async function computeAndApplyPageHeight(
  page: Page,
  wrapperSelector: string,
  opts: { stretchPages: boolean },
): Promise<{ pages: number; targetHeightPx: number }> {
  return await page.evaluate(
    ({ selector, usable, stretch }) => {
      const inner = document.querySelector<HTMLElement>(selector)
      if (!inner) return { pages: 1, targetHeightPx: usable }

      // 1. Reset a auto para medir contenido real (no inflado por estilos
      //    inline previos)
      inner.style.setProperty("min-height", "0", "important")
      inner.style.setProperty("height", "auto", "important")

      // Forzar reflow antes de medir
      void inner.getBoundingClientRect()

      // 2. Medir con sub-pixel precision
      const rect = inner.getBoundingClientRect()
      const measured = rect.height

      // 3. Sub-pixel defensivo: Chrome redondea hacia arriba en algunos
      //    casos, lo que empuja contenido a una página extra
      const effective = Math.max(0, measured - 1)

      // 4. Calcular páginas necesarias
      const pages = Math.max(1, Math.ceil(effective / usable))

      // 5. Altura objetivo uniforme (sin PAGE1_EXTRA)
      const targetH = pages * usable

      // 6. Aplicar solo si el caller lo pide
      if (stretch) {
        inner.style.setProperty("min-height", `${targetH}px`, "important")
        inner.style.setProperty("height", `${targetH}px`, "important")
      }

      return { pages, targetHeightPx: targetH }
    },
    {
      selector: wrapperSelector,
      usable: USABLE_PX_PER_PAGE,
      stretch: opts.stretchPages,
    },
  )
}
