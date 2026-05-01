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
 *   6. fixLayout                → sidebar gradient + height snap + page boundary fixes
 *   7. page.pdf()               → genera PDF; margin=0, el CSS lo controla
 *
 * SIDEBAR GRADIENT PAINTER:
 *   Chrome no repinta el background del sidebar hijo en cada página.
 *   Detectamos el color y lo movemos al background del root como linear-gradient.
 *
 * HEIGHT SNAP:
 *   Fija la altura del root a exactamente N páginas A4 completas.
 *   Si la última página tiene <15% de contenido, recorta a N-1 páginas.
 *
 * PAGE BOUNDARY FIXES (multi-page, sidebar templates):
 *   1. Straddling fix: entries que cruzan un page boundary se empujan a la
 *      página siguiente — evita el overlap visible en página 2+.
 *   2. Padding-top simulation: la columna principal tiene padding-top que Chrome
 *      solo aplica al inicio del elemento (página 1). Para página 2+ se calcula
 *      el padding faltante y se añade como margin-top al primer entry de cada página.
 *
 * BLANK PAGE GUARD (discrete-page templates):
 *   Oculta el último div si tiene <15% de contenido.
 *
 * MARGIN-TOP RESET:
 *   Neutraliza margin-top residual de elementos que caen en los primeros 8px de
 *   una página nueva (aplicado a elementos no cubiertos por el boundary fix).
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
      const layout = root.dataset.printLayout ?? ""
      const isSidebarLeft = layout === "sidebar-left"
      const isSidebarRight = layout === "sidebar-right"
      const isSingleColumn = layout === "single-column"

      // --- Sidebar gradient painter ---
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
            const gradient =
              sidebarSide === "left"
                ? `linear-gradient(to right, ${sidebarBg} 0%, ${sidebarBg} ${ratio}%, transparent ${ratio}%, transparent 100%)`
                : `linear-gradient(to left, ${sidebarBg} 0%, ${sidebarBg} ${100 - ratio}%, transparent ${100 - ratio}%, transparent 100%)`
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

      // --- Page boundary fixes (straddling + padding-top simulation) ---
      // Identify the main content column (opposite side of sidebar).
      let mainCol: HTMLElement = root
      if (isSidebarLeft) {
        mainCol = (root.lastElementChild as HTMLElement) ?? root
      } else if (isSidebarRight) {
        mainCol = (root.firstElementChild as HTMLElement) ?? root
      }

      // padding-top of the content column in CSS px — Chrome only applies it on
      // page 1. Some templates nest the padding one level deeper (e.g. Riviera),
      // so we check mainCol AND its first child and take whichever is larger.
      const _directPadding = parseFloat(window.getComputedStyle(mainCol).paddingTop) || 0
      const _childPadding  = mainCol.firstElementChild
        ? parseFloat(window.getComputedStyle(mainCol.firstElementChild as HTMLElement).paddingTop) || 0
        : 0
      const colPaddingTopCss = Math.max(_directPadding, _childPadding)

      // Query both entry-level AND paragraph-level elements.
      // Paragraph splits are the root cause of the "nce user engagement." overlap:
      // Chrome splits a <p> at the page boundary even when break-inside:avoid is
      // on the parent .resume-entry (known Chrome flex pagination bug).
      const candidates = Array.from(
        mainCol.querySelectorAll<HTMLElement>(
          ".resume-entry, .resume-section-title, p, li",
        ),
      )
      // Track which pages already received the padding-top simulation.
      const pagesHandled = new Set<number>()

      candidates.forEach((el) => {
        const rect    = el.getBoundingClientRect()
        const topVp   = (rect.top    - wrapperRect.top) * zoom
        const botVp   = (rect.bottom - wrapperRect.top) * zoom
        const pageTop = Math.floor(topVp / pagePx)
        const pageBot = Math.floor(botVp / pagePx)

        if (pageBot <= pageTop) return  // fully contained, nothing to do

        // Element straddles a boundary → find the closest .resume-entry ancestor
        // (or the element itself) and push the whole block to the next page.
        const anchor =
          (el.closest(".resume-entry") as HTMLElement | null) ?? el

        const anchorRect  = anchor.getBoundingClientRect()
        const anchorTopVp = (anchorRect.top - wrapperRect.top) * zoom
        const anchorPage  = Math.floor(anchorTopVp / pagePx)
        const targetPage  = anchorPage + 1

        if (pagesHandled.has(targetPage)) return  // already fixed for this page

        const nextPageTopVp = targetPage * pagePx
        let extraMarginCss  = (nextPageTopVp - anchorTopVp) / zoom

        // Add the missing column padding-top for this page.
        extraMarginCss += colPaddingTopCss
        pagesHandled.add(targetPage)

        anchor.style.setProperty("margin-top", `${extraMarginCss}px`, "important")
      })

      // Also simulate padding-top for any page 2+ that has NO straddling element
      // (first entry on that page started cleanly after the boundary).
      candidates.forEach((el) => {
        if (!el.matches(".resume-entry, .resume-section-title")) return
        const rect   = el.getBoundingClientRect()
        const topVp  = (rect.top - wrapperRect.top) * zoom
        const pageN  = Math.floor(topVp / pagePx)
        const offset = topVp % pagePx
        if (pageN > 0 && !pagesHandled.has(pageN) && offset < colPaddingTopCss + 4) {
          el.style.setProperty("margin-top", `${colPaddingTopCss}px`, "important")
          pagesHandled.add(pageN)
        }
      })
    } else {
      // Discrete-page template: each child div is one A4 page.
      const lastDiv = children[children.length - 1]
      const lastH = lastDiv.scrollHeight * zoom - FUDGE_PX
      if (lastH / pagePx < 0.15) {
        lastDiv.style.setProperty("display", "none", "important")
      }
    }

    // --- Margin-top reset for elements at page boundaries ---
    // Catches residual margin-top on headings/entries not covered by the boundary fix above.
    const candidates = Array.from(
      wrapper.querySelectorAll<HTMLElement>("h1, h2, h3, h4"),
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
