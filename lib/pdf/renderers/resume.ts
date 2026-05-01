/**
 * lib/pdf/renderers/resume.ts
 *
 * RESPONSABILIDAD: orquestar el render de un CV a PDF con Puppeteer.
 *
 * FLUJO:
 *   1. setA4Viewport            → viewport A4 @ 96dpi, scale 1
 *   2. applyCookies             → reenvía sesión NextAuth al Chrome headless
 *   3. gotoAndWaitForContent    → carga /print, espera el wrapper del template
 *   4. emulateMediaType("print")→ activa @media print
 *   5. waitForFonts             → asegura fuentes custom listas (con log si timeout)
 *   6. fixLayout                → sidebar gradient + height snap + margin reset
 *   7. page.pdf()               → genera PDF; margin=0, el CSS lo controla
 *
 * SIDEBAR GRADIENT PAINTER:
 *   Para templates con sidebar de color (columna lateral), Chrome no repinta
 *   el background del sidebar hijo en cada página — solo en la primera.
 *   Detectamos el color del sidebar y lo movemos al background del root como
 *   linear-gradient. El root al ser el elemento paginado, Chrome pinta su
 *   background en cada hoja automáticamente.
 *
 * HEIGHT SNAP:
 *   Fija la altura del root a exactamente N páginas A4 completas.
 *   Esto garantiza que el sidebar de color llegue al borde inferior de
 *   la última página y elimina el espacio en blanco por redondeo de zoom.
 *   Si la última página tiene <15% de contenido, recorta a N-1 páginas.
 *
 * BLANK PAGE GUARD (discrete-page templates):
 *   Templates con múltiples divs hijos (uno por página): oculta el último
 *   si tiene <15% de contenido.
 *
 * MARGIN-TOP RESET:
 *   Neutraliza margin-top de elementos que caen en los primeros 8px de
 *   una página nueva — evita el "gap falso" visible arriba en página 2+.
 */

import type { Page } from "puppeteer"
import { applyCookies } from "../cookie-forwarder"
import {
  gotoAndWaitForContent,
  setA4Viewport,
  waitForFonts,
} from "../print-helpers"

const WRAPPER_SELECTOR = ".resume-pages > div"
const A4_HEIGHT_MM = 297
const MM_TO_PX = 96 / 25.4
const A4_PAGE_PX = A4_HEIGHT_MM * MM_TO_PX  // ~1122.5px at 96dpi

export async function renderResumePdf(
  page: Page,
  opts: { printUrl: string; cookieHeader: string; appUrl: string },
): Promise<Buffer> {
  await setA4Viewport(page)
  await applyCookies(page, opts.cookieHeader, opts.appUrl)
  await gotoAndWaitForContent(page, opts.printUrl, WRAPPER_SELECTOR)
  await page.emulateMediaType("print")
  await waitForFonts(page)

  await page.evaluate((pagePx: number) => {
    const wrapper = document.querySelector<HTMLElement>(".resume-pages")
    if (!wrapper) return

    wrapper.style.setProperty("width", "210mm", "important")
    wrapper.style.setProperty("min-height", "0", "important")

    const zoom = parseFloat(window.getComputedStyle(wrapper).zoom || "1") || 1
    // Absorb subpixel rounding from zoom — avoids phantom extra page.
    const FUDGE_PX = 4

    const children = Array.from(wrapper.querySelectorAll<HTMLElement>(":scope > div"))
    if (children.length === 0) return

    if (children.length === 1) {
      const root = children[0]

      // --- Sidebar gradient painter ---
      // Detect sidebar (first or last direct child of root with a solid background).
      // Move its color to root's background as a linear-gradient so Chrome
      // repaints it on every page, not just the first.
      const rootChildren = Array.from(root.children) as HTMLElement[]
      let sidebarEl: HTMLElement | null = null
      let sidebarSide: "left" | "right" = "left"

      for (let i = 0; i < rootChildren.length; i++) {
        const child = rootChildren[i]
        const bg = window.getComputedStyle(child).backgroundColor
        if (
          bg &&
          bg !== "rgba(0, 0, 0, 0)" &&
          bg !== "transparent" &&
          !bg.endsWith(", 0)")
        ) {
          sidebarEl = child
          sidebarSide = i === 0 ? "left" : "right"
          break
        }
      }

      if (sidebarEl) {
        const sidebarWidth = sidebarEl.getBoundingClientRect().width
        const rootWidth = root.getBoundingClientRect().width
        if (rootWidth > 0 && sidebarWidth > 0 && sidebarWidth < rootWidth) {
          const ratio = (sidebarWidth / rootWidth) * 100
          const sidebarBg = window.getComputedStyle(sidebarEl).backgroundColor
          const gradient =
            sidebarSide === "left"
              ? `linear-gradient(to right, ${sidebarBg} 0%, ${sidebarBg} ${ratio}%, transparent ${ratio}%, transparent 100%)`
              : `linear-gradient(to left, ${sidebarBg} 0%, ${sidebarBg} ${100 - ratio}%, transparent ${100 - ratio}%, transparent 100%)`
          root.style.setProperty("background", gradient, "important")
        }
      }

      // --- Height snap to exact N A4 pages ---
      const rawH = root.scrollHeight * zoom - FUDGE_PX
      const numPages = Math.ceil(rawH / pagePx)
      if (numPages <= 1) return

      const lastPageContent = rawH - (numPages - 1) * pagePx
      const lastFill = lastPageContent / pagePx

      if (lastFill < 0.15) {
        // Last page nearly empty → clip to N-1 complete pages.
        const targetPx = ((numPages - 1) * pagePx) / zoom
        root.style.setProperty("height", `${targetPx}px`, "important")
        root.style.setProperty("min-height", "0", "important")
        root.style.setProperty("overflow", "hidden", "important")
      } else {
        // Snap to exactly N pages so sidebar gradient fills to bottom edge.
        const targetPx = (numPages * pagePx) / zoom
        root.style.setProperty("height", `${targetPx}px`, "important")
        root.style.setProperty("min-height", `${targetPx}px`, "important")
      }
    } else {
      // Discrete-page template: each child div is one A4 page.
      const lastDiv = children[children.length - 1]
      const lastH = lastDiv.scrollHeight * zoom - FUDGE_PX
      if (lastH / pagePx < 0.15) {
        lastDiv.style.setProperty("display", "none", "important")
      }
    }

    // --- Margin-top reset for elements at page boundaries ---
    // Elements whose top falls within 8px of a new page boundary carry their
    // margin-top as visible whitespace. Batch-collect then batch-apply to
    // minimize reflow impact.
    const wrapperRect = wrapper.getBoundingClientRect()
    const candidates = Array.from(
      wrapper.querySelectorAll<HTMLElement>(
        ".resume-entry, .resume-section-title, h1, h2, h3, h4",
      ),
    )
    const fixes: HTMLElement[] = []
    candidates.forEach((el) => {
      const r = el.getBoundingClientRect()
      const topInWrapper = (r.top - wrapperRect.top) * zoom
      const offsetInPage = topInWrapper % pagePx
      // offsetInPage === 0 means top of page 1 (or exact boundary) — skip.
      if (offsetInPage > 0 && offsetInPage < 8) fixes.push(el)
    })
    fixes.forEach((el) => el.style.setProperty("margin-top", "0", "important"))
  }, A4_PAGE_PX)

  const rawPdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  })

  return Buffer.from(rawPdf)
}
