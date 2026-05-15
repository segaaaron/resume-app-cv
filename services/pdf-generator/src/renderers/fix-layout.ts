// fix-layout
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
 *   4. Corrige margin-top de headings en límites de página (artefacto de 8px).
 */
export async function fixLayout(page: Page): Promise<string | null> {
  const grad = await page.evaluate(browserFixLayout, USABLE_PX_PER_PAGE, FUDGE_PX, PDF_BOTTOM_MARGIN_PX, RESUME_PAGES_SELECTOR, RESUME_HEADING_SELECTOR)
  if (grad) {
    await page.addStyleTag({
      content: `html { background: ${grad} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }`,
    })
  }
  return grad
}

/**
 * Entry point running entirely in browser context.
 * Receives constants from Node.js via page.evaluate() argument passing.
 */
function browserFixLayout(pagePx: number, fudgePx: number, bottomMarginPx: number, resumePagesSelector: string, resumeHeadingSelector: string): string | null {
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
  function paintSidebarGradient(root: HTMLElement): string | null {
    const { sidebarEl, mainEl, side } = getSidebarConfig(root)
    if (!sidebarEl || !mainEl || !side) return null
    const cs = window.getComputedStyle(root)
    const varSidebarBg = cs.getPropertyValue("--pdf-sidebar-bg").trim()
    const varMainBg = cs.getPropertyValue("--pdf-main-bg").trim()
    const varWidth = cs.getPropertyValue("--pdf-sidebar-width").trim()
    const sidebarBg = varSidebarBg || getSolidBg(sidebarEl)
    if (!sidebarBg) return null
    const rawRootBg = window.getComputedStyle(root).backgroundColor
    const isOpaque = (bg: string) => !!bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent"
    const mainBg = varMainBg || (getSolidBg(mainEl) ?? (isOpaque(rawRootBg) ? rawRootBg : "white"))
    let ratio: number
    if (varWidth) {
      const rootW = root.getBoundingClientRect().width
      const sidebarPx = varWidth.endsWith("px")
        ? parseFloat(varWidth)
        : (parseFloat(varWidth) / 100) * rootW
      ratio = rootW > 0 ? (sidebarPx / rootW) * 100 : 33
    } else {
      ratio = (sidebarEl.getBoundingClientRect().width / root.getBoundingClientRect().width) * 100
    }
    const grad = side === "left"
      ? `linear-gradient(to right, ${sidebarBg} 0%, ${sidebarBg} ${ratio}%, ${mainBg} ${ratio}%, ${mainBg} 100%)`
      : `linear-gradient(to left, ${sidebarBg} 0%, ${sidebarBg} ${100 - ratio}%, ${mainBg} ${100 - ratio}%, ${mainBg} 100%)`
    root.style.setProperty("background", grad, "important")
    return grad
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
  const wrapper = document.querySelector<HTMLElement>(resumePagesSelector)
  if (!wrapper) return null
  const root = wrapper.firstElementChild as HTMLElement | null
  if (!root) return null
  const zoom = parseFloat(root.style.zoom || "1") || 1
  const children = Array.from(root.children) as HTMLElement[]
  if (isDiscretePages(children, pagePx, zoom)) { hideEmptyLastPage(children, pagePx, zoom, fudgePx); return null }
  const eff = pagePx - bottomMarginPx
  const grad = paintSidebarGradient(root)
  const contentBottomPx = root.scrollHeight * zoom - fudgePx
  snapRootHeight(root, contentBottomPx, eff, zoom)
  Array.from(wrapper.querySelectorAll<HTMLElement>(resumeHeadingSelector))
    .filter((el) => !(el as HTMLElement & { dataset: DOMStringMap }).dataset.pdfSpacer)
    .forEach((el) => {
      const off = (el.getBoundingClientRect().top - wrapper.getBoundingClientRect().top) % eff
      if (off > 0 && off < 8) el.style.setProperty("margin-top", "0", "important")
    })
  return grad
}
