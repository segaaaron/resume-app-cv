import type { Page } from "puppeteer-core"
import { FUDGE_PX, PDF_BOTTOM_MARGIN_PX, USABLE_PX_PER_PAGE } from "../constants"
import { RESUME_PAGES_SELECTOR, RESUME_HEADING_SELECTOR } from "../contracts"

/**
 * Ejecuta el pase de corrección de layout en contexto de browser.
 *
 * ESTRATEGIA DE FONDOS FULL-BLEED PARA SIDEBARS:
 * Chrome NO extiende background-color de flex/grid children más allá del
 * contenido en modo print multi-página. Un sidebar con fondo oscuro queda
 * en blanco a partir de la página 2.
 *
 * SOLUCIÓN ACTUAL (dinámica):
 *   browserFixLayout() detecta el color del sidebar en runtime via
 *   getComputedStyle(), calcula el ratio sidebar/total, y pinta un
 *   linear-gradient() en el elemento ROOT:
 *   `root.style.background = "linear-gradient(to right, #1E2733 30%, #FFF 30%)"`
 *   Chrome re-pinta el canvas del root en cada página → fondo continuo.
 *
 * ALTERNATIVA CSS PURA (para templates nuevos con color fijo):
 *   ```css
 *   html {
 *     background: linear-gradient(
 *       to right,
 *       var(--sidebar-color) var(--sidebar-width),
 *       var(--main-color) var(--sidebar-width)
 *     );
 *     -webkit-print-color-adjust: exact;
 *     print-color-adjust: exact;
 *   }
 *   ```
 *   Ventaja: cero JS en runtime, más predecible y declarativo.
 *   Desventaja: el color debe ser fijo (CSS var), no configurable por usuario.
 *
 * DECISIÓN ARQUITECTÓNICA:
 *   - Templates con color de sidebar configurable por usuario → fixLayout (JS)
 *   - Templates nuevos con color fijo de diseño → CSS puro en el template
 *
 * Pasos del pase:
 *   1. Pinta gradient del sidebar en el root element.
 *   2. Inyecta spacers en límites de página para evitar clip de contenido.
 *   3. Snap de altura del root a número entero de páginas.
 *   4. Estira el sidebar al alto total del root para que su background cubra todas las páginas.
 *   5. Corrige margin-top de headings en límites de página (artefacto de 8px).
 */
export async function fixLayout(page: Page): Promise<void> {
  await page.evaluate(browserFixLayout, USABLE_PX_PER_PAGE, FUDGE_PX, PDF_BOTTOM_MARGIN_PX, RESUME_PAGES_SELECTOR, RESUME_HEADING_SELECTOR)
}

/**
 * Entry point running entirely in browser context.
 * Receives constants from Node.js via page.evaluate() argument passing.
 */
function browserFixLayout(pagePx: number, fudgePx: number, bottomMarginPx: number, resumePagesSelector: string, resumeHeadingSelector: string): void {
  function isDiscretePages(children: HTMLElement[], ppx: number, z: number): boolean {
    return children.length > 1 && children.every((c) => Math.abs(c.scrollHeight * z - ppx) < ppx * 0.15)
  }
  function hideEmptyLastPage(children: HTMLElement[], ppx: number, z: number, fpx: number): void {
    const last = children[children.length - 1]
    if ((last.scrollHeight * z - fpx) / ppx < 0.15) last.style.setProperty("display", "none", "important")
  }
  function getSidebarConfig(root: HTMLElement): { sidebarEl: HTMLElement | null; mainEl: HTMLElement | null; side: "left" | "right" | null } {
    const layout = root.dataset.printLayout ?? ""
    if (layout === "sidebar-left") return { sidebarEl: root.firstElementChild as HTMLElement, mainEl: root.lastElementChild as HTMLElement, side: "left" }
    if (layout === "sidebar-right") return { sidebarEl: root.lastElementChild as HTMLElement, mainEl: root.firstElementChild as HTMLElement, side: "right" }
    return { sidebarEl: null, mainEl: null, side: null }
  }
  function getSolidBg(el: HTMLElement): string | null {
    const ok = (bg: string) => bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent"
    const direct = window.getComputedStyle(el).backgroundColor
    if (ok(direct)) return direct
    for (const c1 of Array.from(el.children) as HTMLElement[]) {
      const bg1 = window.getComputedStyle(c1).backgroundColor
      if (ok(bg1)) return bg1
      for (const c2 of Array.from(c1.children) as HTMLElement[]) {
        const bg2 = window.getComputedStyle(c2 as HTMLElement).backgroundColor
        if (ok(bg2)) return bg2
      }
    }
    return null
  }
  function paintSidebarGradient(root: HTMLElement): void {
    const { sidebarEl, mainEl, side } = getSidebarConfig(root)
    if (!sidebarEl || !mainEl || !side) return
    const sidebarBg = getSolidBg(sidebarEl)
    if (!sidebarBg) return
    const ratio = (sidebarEl.getBoundingClientRect().width / root.getBoundingClientRect().width) * 100
    const mainBg = getSolidBg(mainEl) ?? "white"
    const grad = side === "left"
      ? `linear-gradient(to right, ${sidebarBg} 0%, ${sidebarBg} ${ratio}%, ${mainBg} ${ratio}%, ${mainBg} 100%)`
      : `linear-gradient(to left, ${sidebarBg} 0%, ${sidebarBg} ${100 - ratio}%, ${mainBg} ${100 - ratio}%, ${mainBg} 100%)`
    root.style.setProperty("background", grad, "important")
  }
  function insertSpacerAt(col: HTMLElement, cx: number, boundaryY: number, paddingPx: number): void {
    const hit = document.elementFromPoint(cx, boundaryY) as HTMLElement | null
    if (!hit || !col.contains(hit)) return
    let ancestor: HTMLElement = hit
    while (ancestor.parentElement && ancestor.parentElement !== col) ancestor = ancestor.parentElement as HTMLElement
    if (ancestor === col || (ancestor as HTMLElement & { dataset: DOMStringMap }).dataset.pdfSpacer) return
    const gap = parseFloat(window.getComputedStyle(ancestor.parentElement ?? col).gap) || 0
    const spacerH = Math.max(0, paddingPx - gap)
    if (spacerH <= 0) return
    const spacer = document.createElement("div")
    spacer.setAttribute("data-pdf-spacer", "true")
    spacer.style.cssText = `height:${spacerH}px;flex-shrink:0;`
    col.insertBefore(spacer, ancestor)
  }
  function injectColumnSpacers(root: HTMLElement, wrapperTop: number, eff: number, numPages: number): void {
    const { sidebarEl, mainEl } = getSidebarConfig(root)
    const cols = [(mainEl ?? root), sidebarEl].filter(Boolean) as HTMLElement[]
    cols.map((el) => ({ el, paddingPx: parseFloat(window.getComputedStyle(el).paddingTop) || 0 }))
      .filter((c) => c.paddingPx > 0)
      .forEach(({ el, paddingPx }) => {
        const colRect = el.getBoundingClientRect()
        const cx = colRect.left + colRect.width / 2
        el.querySelectorAll("[data-pdf-spacer]").forEach((s) => s.remove())
        for (let pN = numPages - 1; pN >= 1; pN--) insertSpacerAt(el, cx, wrapperTop + pN * eff, paddingPx)
      })
  }
  function snapRootHeight(root: HTMLElement, contentBottomPx: number, eff: number, z: number): void {
    const numPages = Math.ceil(contentBottomPx / eff)
    if (numPages <= 1) return
    const lastFill = (contentBottomPx - (numPages - 1) * eff) / eff
    const h = lastFill < 0.05 ? ((numPages - 1) * eff) / z : Math.max((numPages * eff) / z, root.scrollHeight)
    root.style.setProperty("height", `${h}px`, "important")
    root.style.setProperty("min-height", lastFill < 0.05 ? "0" : `${h}px`, "important")
    root.style.setProperty("overflow", "hidden", "important")
  }
  // After snapRootHeight sets the total document height, explicitly stretch the sidebar
  // to that same height. Chrome print mode does not reliably re-layout flex children
  // after JS modifies the container height, so align-items:stretch doesn't apply,
  // leaving the sidebar background truncated at its content height on pages 2+.
  function stretchSidebarToRootHeight(root: HTMLElement): void {
    const { sidebarEl } = getSidebarConfig(root)
    if (!sidebarEl) return
    const rootH = parseFloat(root.style.height) || 0
    if (rootH <= 0) return
    sidebarEl.style.setProperty("height", `${rootH}px`, "important")
    sidebarEl.style.setProperty("min-height", `${rootH}px`, "important")
  }

  const wrapper = document.querySelector<HTMLElement>(resumePagesSelector)
  if (!wrapper) return
  const root = wrapper.firstElementChild as HTMLElement | null
  if (!root) return
  // Zoom is applied to the wrapper (.resume-pages), not to root — read it from there.
  const zoom = parseFloat(wrapper.style.zoom || root.style.zoom || "1") || 1
  const children = Array.from(root.children) as HTMLElement[]
  if (isDiscretePages(children, pagePx, zoom)) { hideEmptyLastPage(children, pagePx, zoom, fudgePx); return }
  const eff = pagePx - bottomMarginPx
  paintSidebarGradient(root)
  const contentBottomPx = root.scrollHeight * zoom - fudgePx
  const numPages = Math.ceil(contentBottomPx / eff)
  injectColumnSpacers(root, wrapper.getBoundingClientRect().top, eff, numPages)
  snapRootHeight(root, contentBottomPx, eff, zoom)
  stretchSidebarToRootHeight(root)
  Array.from(wrapper.querySelectorAll<HTMLElement>(resumeHeadingSelector))
    .filter((el) => !(el as HTMLElement & { dataset: DOMStringMap }).dataset.pdfSpacer)
    .forEach((el) => {
      const off = (el.getBoundingClientRect().top - wrapper.getBoundingClientRect().top) % eff
      if (off > 0 && off < 8) el.style.setProperty("margin-top", "0", "important")
    })
}
