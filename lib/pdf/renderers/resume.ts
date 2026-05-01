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
 *   6. fixLayout                → sidebar gradient + height snap + padding-top fix
 *   7. page.pdf()               → genera PDF; margin=0, el CSS lo controla
 *
 * SIDEBAR GRADIENT PAINTER:
 *   Chrome no repinta el background del sidebar hijo en cada página — solo en la primera.
 *   Detectamos el color y lo movemos al background del root como linear-gradient.
 *   El root al ser el elemento paginado, Chrome pinta su background en cada hoja.
 *
 * HEIGHT SNAP:
 *   Fija la altura del root a exactamente N páginas A4 completas.
 *   Si la última página tiene <15% de contenido, recorta a N-1 páginas.
 *
 * PADDING-TOP FIX (página 2+):
 *   Chrome solo aplica el padding-top del contenedor al primer fragmento (página 1).
 *   Para página 2+, el primer entry que cae en Y=0 recibe margin-top igual al
 *   padding-top de la columna principal, restaurando el espaciado visual.
 *
 * BLANK PAGE GUARD (discrete-page templates):
 *   Oculta el último div si tiene <15% de contenido.
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
    const FUDGE_PX = 4
    const wrapperRect = wrapper.getBoundingClientRect()

    const children = Array.from(wrapper.querySelectorAll<HTMLElement>(":scope > div"))
    if (children.length === 0) return

    if (children.length === 1) {
      const root = children[0]

      // --- Sidebar gradient painter ---
      const layout = root.dataset.printLayout ?? ""
      const isSidebarLeft = layout === "sidebar-left"
      const isSidebarRight = layout === "sidebar-right"
      const isSingleColumn = layout === "single-column"

      if (!isSingleColumn) {
        const rootChildren = Array.from(root.children) as HTMLElement[]
        let sidebarEl: HTMLElement | null = null
        let sidebarSide: "left" | "right" = "left"

        if (isSidebarRight) {
          for (let i = rootChildren.length - 1; i >= 0; i--) {
            const bg = window.getComputedStyle(rootChildren[i]).backgroundColor
            if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && !bg.endsWith(", 0)")) {
              sidebarEl = rootChildren[i]; sidebarSide = "right"; break
            }
          }
        } else {
          for (let i = 0; i < rootChildren.length; i++) {
            const bg = window.getComputedStyle(rootChildren[i]).backgroundColor
            if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && !bg.endsWith(", 0)")) {
              sidebarEl = rootChildren[i]
              sidebarSide = isSidebarLeft ? "left" : i === 0 ? "left" : "right"
              break
            }
          }
        }

        if (sidebarEl) {
          const sidebarWidth = sidebarEl.getBoundingClientRect().width
          const rootWidth = root.getBoundingClientRect().width
          if (rootWidth > 0 && sidebarWidth > 0 && sidebarWidth < rootWidth) {
            const ratio = (sidebarWidth / rootWidth) * 100
            const sidebarBg = window.getComputedStyle(sidebarEl).backgroundColor
            // Detect main column background — use it instead of "transparent" to
            // avoid the dark seam that transparent/rgba(0,0,0,0) produces in
            // Puppeteer's print renderer at page boundaries.
            const mainColEl = sidebarSide === "left"
              ? (root.lastElementChild as HTMLElement)
              : (root.firstElementChild as HTMLElement)
            const rawMainBg = mainColEl ? window.getComputedStyle(mainColEl).backgroundColor : ""
            const mainBg = (!rawMainBg || rawMainBg === "rgba(0, 0, 0, 0)" || rawMainBg === "transparent" || rawMainBg.endsWith(", 0)"))
              ? "white"
              : rawMainBg
            const gradient =
              sidebarSide === "left"
                ? `linear-gradient(to right, ${sidebarBg} 0%, ${sidebarBg} ${ratio}%, ${mainBg} ${ratio}%, ${mainBg} 100%)`
                : `linear-gradient(to left, ${sidebarBg} 0%, ${sidebarBg} ${100 - ratio}%, ${mainBg} ${100 - ratio}%, ${mainBg} 100%)`
            root.style.setProperty("background", gradient, "important")
          }
        }
      }

      // --- Height snap to exact N A4 pages ---
      const rawH = root.scrollHeight * zoom - FUDGE_PX
      const numPages = Math.ceil(rawH / pagePx)
      if (numPages <= 1) return

      const lastFill = (rawH - (numPages - 1) * pagePx) / pagePx

      if (lastFill < 0.15) {
        const targetPx = ((numPages - 1) * pagePx) / zoom
        root.style.setProperty("height", `${targetPx}px`, "important")
        root.style.setProperty("min-height", "0", "important")
        root.style.setProperty("overflow", "hidden", "important")
      } else {
        const targetPx = (numPages * pagePx) / zoom
        root.style.setProperty("height", `${targetPx}px`, "important")
        root.style.setProperty("min-height", `${targetPx}px`, "important")
      }

      // --- Padding-top fix for page 2+ ---
      // Chrome only applies the container's padding-top on the first fragment.
      // Detect the main column and add its padding-top as margin-top to the
      // first entry that lands at (or very near) Y=0 on each subsequent page.
      let mainCol: HTMLElement = root
      if (isSidebarLeft) {
        mainCol = (root.lastElementChild as HTMLElement) ?? root
      } else if (isSidebarRight) {
        mainCol = (root.firstElementChild as HTMLElement) ?? root
      }

      const colPaddingTopCss =
        Math.max(
          parseFloat(window.getComputedStyle(mainCol).paddingTop) || 0,
          mainCol.firstElementChild
            ? parseFloat(window.getComputedStyle(mainCol.firstElementChild as HTMLElement).paddingTop) || 0
            : 0,
        )

      if (colPaddingTopCss > 0) {
        const entries = Array.from(
          mainCol.querySelectorAll<HTMLElement>(".resume-entry, .resume-section-title"),
        )
        const pagesFixed = new Set<number>()
        entries.forEach((el) => {
          const r = el.getBoundingClientRect()
          const topVp = (r.top - wrapperRect.top) * zoom
          const pageN = Math.floor(topVp / pagePx)
          const offset = topVp % pagePx
          // First entry that lands within colPaddingTopCss px of a page top gets the fix.
          if (pageN > 0 && !pagesFixed.has(pageN) && offset < colPaddingTopCss + 4) {
            el.style.setProperty("margin-top", `${colPaddingTopCss}px`, "important")
            pagesFixed.add(pageN)
          }
        })
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
