import { PDFDocument } from "pdf-lib"
import type { Page } from "puppeteer-core"
import { applyCookies } from "../cookie-forwarder"
import { FUDGE_PX, PDF_BOTTOM_MARGIN_PX, USABLE_PX_PER_PAGE } from "../constants"
import { gotoAndWaitForContent, setA4Viewport, waitForFonts, waitForImages } from "../print-helpers"

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
  await fixLayout(page)
  const rawPdf = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  })
  return embedPdfMetadata(Buffer.from(rawPdf), { title: opts.resumeTitle, author: opts.candidateName })
}

async function fixLayout(page: Page): Promise<void> {
  await page.evaluate(
    (pagePx, fudgePx, bottomMarginPx) => {
      const wrapper = document.querySelector<HTMLElement>(".resume-pages")
      if (!wrapper) return
      const root = wrapper.firstElementChild as HTMLElement | null
      if (!root) return
      const wrapperRect = wrapper.getBoundingClientRect()
      const children = Array.from(root.children) as HTMLElement[]
      const zoom = parseFloat(root.style.zoom || "1") || 1
      const isDiscretePages = children.length > 1 && children.every(
        (c) => Math.abs(c.scrollHeight * zoom - pagePx) < pagePx * 0.15
      )

      if (!isDiscretePages) {
        // Sidebar gradient painter
        const layout = root.dataset.printLayout ?? ""
        const isSidebarLeft = layout === "sidebar-left"
        const isSidebarRight = layout === "sidebar-right"
        if (isSidebarLeft || isSidebarRight) {
          const sidebarColEl = isSidebarLeft
            ? (root.firstElementChild as HTMLElement)
            : (root.lastElementChild as HTMLElement)
          const mainColEl = isSidebarLeft
            ? (root.lastElementChild as HTMLElement)
            : (root.firstElementChild as HTMLElement)
          const sidebarSide = isSidebarLeft ? "left" : "right"

          if (sidebarColEl && mainColEl) {
            const rootWidth = root.getBoundingClientRect().width
            const sidebarWidth = sidebarColEl.getBoundingClientRect().width
            const ratio = (sidebarWidth / rootWidth) * 100

            function isSolidBg(bg: string) {
              return bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent"
            }

            function hasSolidBgDeep(el: HTMLElement): string | null {
              const direct = window.getComputedStyle(el).backgroundColor
              if (isSolidBg(direct)) return direct
              for (const c1 of Array.from(el.children)) {
                const bg1 = window.getComputedStyle(c1 as HTMLElement).backgroundColor
                if (isSolidBg(bg1)) return bg1
                for (const c2 of Array.from(c1.children)) {
                  const bg2 = window.getComputedStyle(c2 as HTMLElement).backgroundColor
                  if (isSolidBg(bg2)) return bg2
                }
              }
              return null
            }

            const sidebarBg = hasSolidBgDeep(sidebarColEl)
            if (sidebarBg) {
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

        const effectivePagePx = pagePx - bottomMarginPx
        const contentBottomPx = root.scrollHeight * zoom - fudgePx

        const layout2 = root.dataset.printLayout ?? ""
        const isSidebarLeft2 = layout2 === "sidebar-left"
        const isSidebarRight2 = layout2 === "sidebar-right"

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

        const cols: { el: HTMLElement; paddingPx: number }[] = []
        for (const colEl of [mainColEl2, sidebarColEl2].filter(Boolean) as HTMLElement[]) {
          const pt = parseFloat(window.getComputedStyle(colEl).paddingTop) || 0
          if (pt > 0) cols.push({ el: colEl, paddingPx: pt })
        }

        const numPagesApprox = Math.ceil(contentBottomPx / effectivePagePx)
        root.querySelectorAll("[data-pdf-spacer]").forEach((s) => s.remove())

        for (const { el: col, paddingPx } of cols) {
          const colRect = col.getBoundingClientRect()
          const colCenterX = colRect.left + colRect.width / 2
          for (let pN = numPagesApprox - 1; pN >= 1; pN--) {
            const boundaryY = wrapperRect.top + pN * effectivePagePx
            const hit = document.elementFromPoint(colCenterX, boundaryY) as HTMLElement | null
            if (!hit || !col.contains(hit)) continue
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
        const lastDiv = children[children.length - 1]
        const lastH = lastDiv.scrollHeight * zoom - fudgePx
        if (lastH / pagePx < 0.15) {
          lastDiv.style.setProperty("display", "none", "important")
        }
      }

      const eff = pagePx - bottomMarginPx
      const candidates = Array.from(
        wrapper.querySelectorAll<HTMLElement>(".resume-entry, .resume-section-title, h1, h2, h3, h4")
      )
      const fixes: HTMLElement[] = []
      candidates.forEach((el) => {
        if ((el as HTMLElement & { dataset: DOMStringMap }).dataset.pdfSpacer) return
        const r = el.getBoundingClientRect()
        const topInWrapper = (r.top - wrapperRect.top) * zoom
        const offsetInPage = topInWrapper % eff
        if (offsetInPage > 0 && offsetInPage < 8) fixes.push(el)
      })
      fixes.forEach((el) => el.style.setProperty("margin-top", "0", "important"))
    },
    USABLE_PX_PER_PAGE,
    FUDGE_PX,
    PDF_BOTTOM_MARGIN_PX,
  )
}

async function embedPdfMetadata(pdfBuffer: Buffer, meta: { title?: string; author?: string }): Promise<Buffer> {
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
