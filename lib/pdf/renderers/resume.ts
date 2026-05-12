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
 *   6. waitForImages            → asegura imágenes de perfil cargadas
 *   7. fixLayout                → sidebar gradient painter + height snap
 *   8. page.pdf()               → genera PDF con preferCSSPageSize: true
 *   9. embedPdfMetadata         → embebe título/autor con pdf-lib
 *
 * SIDEBAR GRADIENT PAINTER:
 *   Chrome no repinta el background del sidebar hijo en cada página — solo en la primera.
 *   Detectamos el color y lo movemos al background del root como linear-gradient.
 *   El root al ser el elemento paginado, Chrome pinta su background en cada hoja.
 *
 * PAGINACIÓN — DOS NIVELES DE MÁRGENES (@page en print-resume.css):
 *   @page :first { margin: 0 0 10mm 0 }  → página 1: sin margen superior; el template
 *                                           maneja su propio padding interno (ej. pt-9).
 *   @page { margin: 10mm 0 10mm 0 }       → páginas 2+: 10mm arriba Y abajo. Chrome
 *                                           inserta ese espacio automáticamente.
 *   page.pdf() usa preferCSSPageSize:true; margin CDP queda en 0.
 *
 * HEIGHT SNAP (dos niveles):
 *   page1Eff = pagePx - bottomMarginPx           (~1085px, sin margen superior en pág.1)
 *   pageNEff = pagePx - topMarginPx - bottomMarginPx (~1047px, para páginas 2+)
 *   capacity(n) = page1Eff + (n-1)*pageNEff
 *   Si la última página tiene <5% de contenido, recorta a N-1 páginas.
 *
 * BLANK PAGE GUARD (discrete-page templates):
 *   Oculta el último div si tiene <15% de contenido.
 *
 * MARGIN-TOP RESET:
 *   Neutraliza margin-top de elementos que caen en los primeros 8px de
 *   una página nueva — evita el "gap falso" visible arriba en página 2+.
 */

import { PDFDocument } from "pdf-lib"
import type { Page } from "puppeteer"
import { applyCookies } from "../cookie-forwarder"
import {
  FUDGE_PX,
  PDF_BOTTOM_MARGIN_PX,
  PDF_TOP_MARGIN_PX,
  USABLE_PX_PER_PAGE,
} from "../constants"
import {
  gotoAndWaitForContent,
  setA4Viewport,
  waitForFonts,
  waitForImages,
} from "../print-helpers"

const WRAPPER_SELECTOR = ".resume-pages > div"

export async function renderResumePdf(
  page: Page,
  opts: {
    printUrl: string
    cookieHeader: string
    appUrl: string
    candidateName?: string
    resumeTitle?: string
  },
): Promise<Buffer> {
  await setA4Viewport(page)
  await applyCookies(page, opts.cookieHeader, opts.appUrl)
  await gotoAndWaitForContent(page, opts.printUrl, WRAPPER_SELECTOR)
  await page.emulateMediaType("print")
  await waitForFonts(page)
  await waitForImages(page)

  page.on("console", (msg) => console.warn("[pdf-chrome]", msg.text()))

  await page.evaluate(
    (pagePx: number, fudgePx: number, bottomMarginPx: number, topMarginPx: number) => {
      const wrapper = document.querySelector<HTMLElement>(".resume-pages")
      if (!wrapper) return

      wrapper.style.setProperty("width", "210mm", "important")
      wrapper.style.setProperty("min-height", "0", "important")

      const zoom = parseFloat(window.getComputedStyle(wrapper).zoom || "1") || 1
      const wrapperRect = wrapper.getBoundingClientRect()

      const children = Array.from(
        wrapper.querySelectorAll<HTMLElement>(":scope > div"),
      )
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
                sidebarEl = rootChildren[i]
                sidebarSide = "right"
                break
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
              const mainColEl =
                sidebarSide === "left"
                  ? (root.lastElementChild as HTMLElement)
                  : (root.firstElementChild as HTMLElement)
              // Detect main column's background. mainCol is often transparent — the
              // actual color lives on a child div. Walk up to 2 levels deep to find it.
              const isSolidBg = (bg: string) =>
                !!bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && !bg.endsWith(", 0)")
              let mainBg = "white"
              if (mainColEl) {
                const direct = window.getComputedStyle(mainColEl).backgroundColor
                if (isSolidBg(direct)) {
                  mainBg = direct
                } else {
                  outer: for (const c1 of Array.from(mainColEl.children)) {
                    const bg1 = window.getComputedStyle(c1 as HTMLElement).backgroundColor
                    if (isSolidBg(bg1)) { mainBg = bg1; break }
                    for (const c2 of Array.from(c1.children)) {
                      const bg2 = window.getComputedStyle(c2 as HTMLElement).backgroundColor
                      if (isSolidBg(bg2)) { mainBg = bg2; break outer }
                    }
                  }
                }
              }
              const gradient =
                sidebarSide === "left"
                  ? `linear-gradient(to right, ${sidebarBg} 0%, ${sidebarBg} ${ratio}%, ${mainBg} ${ratio}%, ${mainBg} 100%)`
                  : `linear-gradient(to left, ${sidebarBg} 0%, ${sidebarBg} ${100 - ratio}%, ${mainBg} ${100 - ratio}%, ${mainBg} 100%)`
              root.style.setProperty("background", gradient, "important")
            }
          }
        }

        // --- Content height measurement ---
        //
        // Two-tier pagination:
        //   page 1  → @page :first { margin: 0 0 10mm 0 } → effective = pagePx - bottomMarginPx
        //   pages 2+ → @page { margin: 10mm 0 10mm 0 }   → effective = pagePx - topMarginPx - bottomMarginPx
        //
        // Chrome provides 10mm top breathing room on pages 2+ natively via @page — no spacer
        // divs needed. root.scrollHeight is used as an upper bound for content height.
        const page1Eff = pagePx - bottomMarginPx                   // ~1085px
        const pageNEff = pagePx - topMarginPx - bottomMarginPx     // ~1047px

        const contentBottomPx = root.scrollHeight * zoom - fudgePx

        // capacity(n): total DOM pixels for n full pages
        function capacity(n: number): number {
          if (n <= 0) return 0
          return n === 1 ? page1Eff : page1Eff + (n - 1) * pageNEff
        }

        const numPages = contentBottomPx <= page1Eff
          ? 1
          : 1 + Math.ceil((contentBottomPx - page1Eff) / pageNEff)

        if (numPages <= 1) return

        const lastFill = (contentBottomPx - capacity(numPages - 1)) / pageNEff

        if (lastFill < 0.05) {
          // TRIM: last page < 5% full — cut it.
          const trimPx = capacity(numPages - 1) / zoom
          root.style.setProperty("height", `${trimPx}px`, "important")
          root.style.setProperty("min-height", "0", "important")
          root.style.setProperty("overflow", "hidden", "important")
        } else {
          // KEEP: snap to N full pages for clean sidebar gradient coverage.
          // max() prevents overflow:hidden from clipping content that slightly exceeds
          // the snap boundary (e.g. flex-stretch inflation in sidebar column).
          const snapPx = capacity(numPages) / zoom
          const finalTarget = Math.max(snapPx, root.scrollHeight)
          root.style.setProperty("height", `${finalTarget}px`, "important")
          root.style.setProperty("min-height", `${finalTarget}px`, "important")
          root.style.setProperty("overflow", "hidden", "important")
        }
      } else {
        // Discrete-page template: cada child div es una página A4.
        const lastDiv = children[children.length - 1]
        const lastH = lastDiv.scrollHeight * zoom - fudgePx
        if (lastH / pagePx < 0.15) {
          lastDiv.style.setProperty("display", "none", "important")
        }
      }

      // --- Margin-top reset for elements landing within 8px of a page boundary ---
      // Neutralises default element margins that create a visible gap at the top of pages 2+.
      // Uses two-tier page boundaries: page 1 ends at page1Eff, pages 2+ at pageNEff intervals.
      const p1e = pagePx - bottomMarginPx
      const pne = pagePx - topMarginPx - bottomMarginPx
      const candidates = Array.from(
        wrapper.querySelectorAll<HTMLElement>(
          ".resume-entry, .resume-section-title, h1, h2, h3, h4",
        ),
      )
      const fixes: HTMLElement[] = []
      candidates.forEach((el) => {
        const r = el.getBoundingClientRect()
        const topInWrapper = (r.top - wrapperRect.top) * zoom
        const offsetInPage = topInWrapper < p1e
          ? topInWrapper % p1e
          : (topInWrapper - p1e) % pne
        if (offsetInPage > 0 && offsetInPage < 8) fixes.push(el)
      })
      fixes.forEach((el) =>
        el.style.setProperty("margin-top", "0", "important"),
      )
    },
    USABLE_PX_PER_PAGE,
    FUDGE_PX,
    PDF_BOTTOM_MARGIN_PX,
    PDF_TOP_MARGIN_PX,
  )

  // preferCSSPageSize: true — Chrome uses @page CSS for both size AND margins.
  // @page :first + @page in print-resume.css are the sole source of truth.
  // CDP margin params are ignored when preferCSSPageSize is true.
  const rawPdf = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  })

  return embedPdfMetadata(Buffer.from(rawPdf), {
    title: opts.resumeTitle,
    author: opts.candidateName,
  })
}

async function embedPdfMetadata(
  pdfBuffer: Buffer,
  meta: { title?: string; author?: string },
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    if (meta.title) pdfDoc.setTitle(meta.title)
    if (meta.author) pdfDoc.setAuthor(meta.author)
    pdfDoc.setProducer("ReadyCV")
    pdfDoc.setCreator("ReadyCV — readycvv.com")
    pdfDoc.setCreationDate(new Date())
    const bytes = await pdfDoc.save()
    return Buffer.from(bytes)
  } catch {
    return pdfBuffer
  }
}
