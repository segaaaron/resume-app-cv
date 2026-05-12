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
 * PAGINACIÓN (@page en print-resume.css):
 *   @page { margin: 0 0 10mm 0 } — SOLO bottom margin. El top margin en @page es espacio
 *   FÍSICO fuera del DOM: el sidebar linear-gradient (pintado en el root DOM) no puede
 *   cubrir ese espacio → habría franja blanca sobre el sidebar en páginas 2+.
 *   El padding-top en páginas 2+ se maneja con DOM spacers inyectados en JS.
 *
 * DOM SPACERS (padding-top páginas 2+):
 *   Para cada columna con paddingTop > 0, para cada límite de página N>1:
 *   elementFromPoint(colCenter, boundaryY) → ancestro directo de la columna →
 *   insertBefore(spacer). Funciona para mid-entry breaks (no depende de .resume-entry).
 *   Inserción en orden inverso (página alta → baja) para evitar desplazamiento de cálculos.
 *
 * HEIGHT SNAP:
 *   effectivePagePx = pagePx - bottomMarginPx (~1085px, uniforme para todas las páginas).
 *   TRIM threshold 5%: solo recorta páginas realmente vacías.
 *   KEEP floor: max(snapTarget, scrollHeight) evita que overflow:hidden recorte contenido.
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
    (pagePx: number, fudgePx: number, bottomMarginPx: number) => {
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

          // isSolidBg: returns true for any non-transparent, non-zero-alpha background.
          // Defined early so the detection loops below can use it.
          const isSolidBgDetect = (bg: string) =>
            !!bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && !bg.endsWith(", 0)")

          // hasSolidBgDeep: checks a candidate element up to 2 levels of children.
          // If the element itself has a solid bg, returns true.
          // Otherwise walks its direct children (and their children) to find one.
          // Always uses the candidate (parent) element as sidebarEl — not the child.
          const hasSolidBgDeep = (el: HTMLElement): boolean => {
            if (isSolidBgDetect(window.getComputedStyle(el).backgroundColor)) return true
            for (const c1 of Array.from(el.children)) {
              if (isSolidBgDetect(window.getComputedStyle(c1 as HTMLElement).backgroundColor)) return true
              for (const c2 of Array.from(c1.children)) {
                if (isSolidBgDetect(window.getComputedStyle(c2 as HTMLElement).backgroundColor)) return true
              }
            }
            return false
          }

          if (isSidebarRight) {
            for (let i = rootChildren.length - 1; i >= 0; i--) {
              if (hasSolidBgDeep(rootChildren[i])) {
                sidebarEl = rootChildren[i]
                sidebarSide = "right"
                break
              }
            }
          } else {
            for (let i = 0; i < rootChildren.length; i++) {
              if (hasSolidBgDeep(rootChildren[i])) {
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
              // Resolve the actual sidebar background color, walking up to 2 levels deep
              // in case the sidebar's direct bg is transparent (color lives on a child).
              let sidebarBg = window.getComputedStyle(sidebarEl).backgroundColor
              if (!isSolidBgDetect(sidebarBg)) {
                outer2: for (const c1 of Array.from(sidebarEl.children)) {
                  const bg1 = window.getComputedStyle(c1 as HTMLElement).backgroundColor
                  if (isSolidBgDetect(bg1)) { sidebarBg = bg1; break outer2 }
                  for (const c2 of Array.from(c1.children)) {
                    const bg2 = window.getComputedStyle(c2 as HTMLElement).backgroundColor
                    if (isSolidBgDetect(bg2)) { sidebarBg = bg2; break outer2 }
                  }
                }
              }
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

        // --- Content height + pagination ---
        //
        // @page { margin: 0 0 10mm 0 } — SOLO bottom margin en CSS.
        // Top margin en @page sería espacio FÍSICO fuera del DOM: el sidebar linear-gradient
        // (pintado en el elemento root) no puede cubrirlo → franja blanca sobre el sidebar.
        // Solución: top margin via DOM spacers (ver sección abajo), no via @page.
        //
        // effectivePagePx: altura de contenido por página (A4 - bottom margin).
        const effectivePagePx = pagePx - bottomMarginPx  // ~1085px

        const contentBottomPx = root.scrollHeight * zoom - fudgePx

        // --- DOM spacers para padding-top en páginas 2+ ---
        //
        // Problema previo: buscar .resume-entry al inicio de cada página fallaba cuando
        // el contenido se dividía en medio de un entry (break-inside: auto). El primer
        // elemento visible en la página 2 era una continuación de un entry de la página 1.
        //
        // Solución: elementFromPoint() al centro de cada columna en cada límite de página.
        // Devuelve el elemento más profundo en ese punto. Subimos al ancestro directo de la
        // columna y el spacer se inserta antes de él — funciona para cualquier tipo de break.
        const layout2 = root.dataset.printLayout ?? ""
        const isSidebarLeft2 = layout2 === "sidebar-left"
        const isSidebarRight2 = layout2 === "sidebar-right"

        const cols: { el: HTMLElement; paddingPx: number }[] = []
        const mainColEl2 = isSidebarLeft2
          ? (root.lastElementChild as HTMLElement)
          : isSidebarRight2
            ? (root.firstElementChild as HTMLElement)
            : root
        const sidebarColEl2 = isSidebarLeft2
          ? (root.firstElementChild as HTMLElement)
          : isSidebarRight2
            ? (root.lastElementChild as HTMLElement)
            : null

        for (const colEl of [mainColEl2, sidebarColEl2].filter(Boolean) as HTMLElement[]) {
          const pt = parseFloat(window.getComputedStyle(colEl).paddingTop) || 0
          if (pt > 0) cols.push({ el: colEl, paddingPx: pt })
        }

        const numPagesApprox = Math.ceil(contentBottomPx / effectivePagePx)

        // Limpiar spacers de renders previos
        root.querySelectorAll("[data-pdf-spacer]").forEach((s) => s.remove())

        // Por cada columna con padding, por cada límite de página 2+, insertar spacer.
        // Los spacers se insertan en orden inverso (página más alta primero) para que
        // las inserciones anteriores no desplacen los cálculos de páginas posteriores.
        for (const { el: col, paddingPx } of cols) {
          const colRect = col.getBoundingClientRect()
          const colCenterX = colRect.left + colRect.width / 2

          for (let pN = numPagesApprox - 1; pN >= 1; pN--) {
            // Y del límite de página en coordenadas viewport.
            // effectivePagePx es CSS px a zoom=1 (Puppeteer siempre usa deviceScaleFactor:1,
            // sin CSS zoom en el wrapper). Si se añade CSS zoom al wrapper en el futuro,
            // esta fórmula debe cambiar a: wrapperRect.top + pN * effectivePagePx * zoom.
            const boundaryY = wrapperRect.top + pN * effectivePagePx

            // Elemento en ese punto dentro de esta columna
            const hit = document.elementFromPoint(colCenterX, boundaryY) as HTMLElement | null
            if (!hit || !col.contains(hit)) continue

            // Subir al hijo directo de col
            let ancestor: HTMLElement = hit
            while (ancestor.parentElement && ancestor.parentElement !== col) {
              ancestor = ancestor.parentElement as HTMLElement
            }
            if (ancestor === col) continue
            if ((ancestor as HTMLElement & { dataset: DOMStringMap }).dataset.pdfSpacer) continue

            const gap = parseFloat(window.getComputedStyle(ancestor.parentElement ?? col).gap) || 0
            const spacerH = Math.max(0, paddingPx - gap)
            if (spacerH <= 0) continue

            const spacer = document.createElement("div")
            spacer.dataset.pdfSpacer = "true"
            spacer.style.cssText = `height:${spacerH}px;flex-shrink:0;`
            col.insertBefore(spacer, ancestor)
          }
        }

        // --- Height snap ---
        //
        // Usa effectivePagePx (pagePx - bottomMarginPx) para todos los cálculos.
        // TRIM threshold: 5% (~54px ≈ 2 líneas). Solo recorta páginas realmente vacías.
        // KEEP floor: max(snapTarget, root.scrollHeight) evita que overflow:hidden
        // recorte contenido real cuando scrollHeight > N×effectivePagePx (flex-stretch).
        const numPages = Math.ceil(contentBottomPx / effectivePagePx)
        if (numPages <= 1) return

        const lastFill = (contentBottomPx - (numPages - 1) * effectivePagePx) / effectivePagePx

        if (lastFill < 0.05) {
          const trimPx = ((numPages - 1) * effectivePagePx) / zoom
          root.style.setProperty("height", `${trimPx}px`, "important")
          root.style.setProperty("min-height", "0", "important")
          root.style.setProperty("overflow", "hidden", "important")
        } else {
          const snapPx = (numPages * effectivePagePx) / zoom
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

      // --- Margin-top reset para elementos en límites de página ---
      // Neutraliza margin-top de elementos que caen en los primeros 8px de una página
      // nueva — evita el "gap falso" visible arriba en página 2+.
      // Se ejecuta DESPUÉS del spacer fix para no pisar los spacers.
      const eff = pagePx - bottomMarginPx
      const candidates = Array.from(
        wrapper.querySelectorAll<HTMLElement>(
          ".resume-entry, .resume-section-title, h1, h2, h3, h4",
        ),
      )
      const fixes: HTMLElement[] = []
      candidates.forEach((el) => {
        if ((el as HTMLElement & { dataset: DOMStringMap }).dataset.pdfSpacer) return
        const r = el.getBoundingClientRect()
        const topInWrapper = (r.top - wrapperRect.top) * zoom
        const offsetInPage = topInWrapper % eff
        if (offsetInPage > 0 && offsetInPage < 8) fixes.push(el)
      })
      fixes.forEach((el) =>
        el.style.setProperty("margin-top", "0", "important"),
      )
    },
    USABLE_PX_PER_PAGE,
    FUDGE_PX,
    PDF_BOTTOM_MARGIN_PX,
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
