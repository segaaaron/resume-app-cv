import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import puppeteer from "puppeteer"
import { PDFDocument, rgb } from "pdf-lib"

type Params = { params: Promise<{ id: string }> }

/**
 * PDF export — renders the /print page in Chromium and converts to PDF.
 *
 * Margins: ?pdf=1 in the URL tells PrintLayout to emit `@page { margin: 8mm 0 }`
 * instead of `margin: 0` (which is needed for browser window.print). No CSS
 * cascade fight — the source controls its own @page rule.
 *
 * Sidebar gutter color: Chromium always renders @page margin areas white.
 * We post-process with pdf-lib: detect whether the template is a CSS Grid
 * (sidebar layout) or single-column, read background colors from the DOM,
 * and draw colored rectangles into the gutter strips on every page.
 */

const A4_WIDTH_PX  = 794   // 210mm @ 96 dpi
const A4_HEIGHT_PX = 1123  // 297mm @ 96 dpi
const PAGE_MARGIN_MM = 8

export async function GET(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const url = new URL(req.url)
  const locale = url.searchParams.get("locale") ?? "en"

  const [resume, user] = await Promise.all([
    db.resume.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, title: true, templateId: true },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
    }),
  ])

  if (!resume) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const now = new Date()
  const hasActiveAccess =
    user?.plan === "PRO" &&
    user?.subscriptionStatus === "ACTIVE" &&
    (!user?.subscriptionEndsAt || user.subscriptionEndsAt > now)

  if (!hasActiveAccess) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  // ?pdf=1 switches PrintLayout's @page rule to 8mm top/bottom for all templates.
  const printUrl = `${appUrl}/${locale}/resume/${id}/print?pdf=1`
  const cookieHeader = req.headers.get("cookie") ?? ""

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, deviceScaleFactor: 1 })

    // Forward the user's session cookies so the /print page authenticates as them.
    if (cookieHeader) {
      const hostname = new URL(appUrl).hostname
      const cookies = cookieHeader
        .split(";")
        .map((c) => {
          const eq = c.indexOf("=")
          if (eq < 0) return null
          return {
            name: c.slice(0, eq).trim(),
            value: c.slice(eq + 1).trim(),
            domain: hostname,
          }
        })
        .filter((c): c is { name: string; value: string; domain: string } => !!c?.name && !!c.value)
      if (cookies.length) await page.setCookie(...cookies)
    }

    await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 30000 })
    await page.emulateMediaType("print")
    await page.evaluate(() => document.fonts.ready)

    // Always normalize the resume wrapper (strips screen zoom/min-height).
    await page.evaluate(() => {
      const wrapper = document.querySelector<HTMLElement>(".resume-pages")
      const inner = document.querySelector<HTMLElement>(".resume-pages > div")
      if (wrapper) {
        wrapper.style.setProperty("zoom", "1", "important")
        wrapper.style.setProperty("width", "210mm", "important")
        wrapper.style.setProperty("min-height", "0", "important")
      }
      if (inner) {
        inner.style.setProperty("min-height", "0", "important")
        inner.style.setProperty("height", "auto", "important")
      }
    })

    // All templates use 8mm margins. Extend template height to fill the last
    // page so the template background reaches the bottom gutter (no white gap).
    //
    // Page 1 has no top margin (@page :first), so its content area is 289mm.
    // Pages 2-N: 281mm each. Total for N pages = N × USABLE_PX + PAGE1_EXTRA_PX.
    const USABLE_PX      = ((297 - 2 * PAGE_MARGIN_MM) / 25.4) * 96  // ≈ 1062px
    const PAGE1_EXTRA_PX = (PAGE_MARGIN_MM / 25.4) * 96               // ≈ 30px

    // Detect template layout and background colors for gutter painting.
    // Inspects direct children of the template root only — pixel sampling was
    // removed because decorative absolute elements (circles, blobs) caused
    // false positives on single-color full-bleed templates.
    // resolvedBg walks up the DOM to resolve transparent elements.
    const gutterInfo = await page.evaluate(() => {
      function resolvedBg(el: Element | null): string {
        let cur = el as HTMLElement | null
        while (cur && cur !== document.body) {
          const bg = window.getComputedStyle(cur).backgroundColor
          if (bg && bg !== "rgba(0, 0, 0, 0)") return bg
          cur = cur.parentElement
        }
        return "rgb(255, 255, 255)"
      }

      const WHITE = "rgb(255, 255, 255)"
      const inner = document.querySelector<HTMLElement>(".resume-pages > div")
      if (!inner) return null

      const children = Array.from(inner.children) as HTMLElement[]
      if (children.length >= 2) {
        const innerW = inner.getBoundingClientRect().width || 794

        // Left sidebar: children[0] is narrow (< 50%) and has a distinct bg.
        const first = children[0]
        const firstRect = first.getBoundingClientRect()
        if (firstRect.width > 10 && firstRect.width < innerW * 0.5) {
          const bg0 = resolvedBg(first)
          const bg1 = resolvedBg(children[1])
          if (bg0 !== bg1 && bg0 !== WHITE) {
            return { type: "grid" as const, sidebarColor: bg0, mainColor: bg1, sidebarWidth: firstRect.width }
          }
        }

        // Right sidebar: children[last] is narrow (< 50%) and has a distinct bg.
        // sidebarWidth = width of the left (main) section so pdf-lib boundary is correct.
        const last = children[children.length - 1]
        const lastRect = last.getBoundingClientRect()
        if (lastRect.width > 10 && lastRect.width < innerW * 0.5) {
          const bgLast = resolvedBg(last)
          const bgFirst = resolvedBg(first)
          if (bgLast !== bgFirst && bgLast !== WHITE) {
            return { type: "grid" as const, sidebarColor: bgFirst, mainColor: bgLast, sidebarWidth: innerW - lastRect.width }
          }
        }
      }

      // Solid single-color template
      return { type: "solid" as const, color: resolvedBg(inner) }
    })

    await page.evaluate(({ USABLE_PX, PAGE1_EXTRA_PX }) => {
      const inner = document.querySelector<HTMLElement>(".resume-pages > div")
      if (!inner) return
      void inner.getBoundingClientRect()
      const pages = Math.max(1, Math.ceil((inner.scrollHeight - PAGE1_EXTRA_PX) / USABLE_PX))
      const targetH = pages * USABLE_PX + PAGE1_EXTRA_PX
      inner.style.setProperty("min-height", `${targetH}px`, "important")
      inner.style.setProperty("height", `${targetH}px`, "important")
    }, { USABLE_PX, PAGE1_EXTRA_PX })

    const rawPdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: `${PAGE_MARGIN_MM}mm`, right: "0", bottom: `${PAGE_MARGIN_MM}mm`, left: "0" },
    })

    const pdfDoc = await PDFDocument.load(rawPdf)
    const marginPts = (PAGE_MARGIN_MM / 25.4) * 72  // 8mm → points

    function parseCssRgb(css: string | null | undefined) {
      if (!css) return null
      const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      return m ? rgb(+m[1] / 255, +m[2] / 255, +m[3] / 255) : null
    }

    for (const [i, p] of pdfDoc.getPages().entries()) {
      const { width, height } = p.getSize()

      if (gutterInfo?.type === "grid") {
        // Two-column layout: paint sidebar and main areas separately
        const sidebarColor = parseCssRgb(gutterInfo.sidebarColor)
        const mainColor    = parseCssRgb(gutterInfo.mainColor)
        const sidebarW     = (gutterInfo.sidebarWidth / 96) * 72  // px → pts

        if (sidebarColor && mainColor && sidebarW > 0) {
          const mainW = width - sidebarW
          if (i > 0) {
            p.drawRectangle({ x: 0,        y: height - marginPts, width: sidebarW, height: marginPts,     color: sidebarColor })
            p.drawRectangle({ x: sidebarW, y: height - marginPts, width: mainW,    height: marginPts,     color: mainColor })
          }
          p.drawRectangle({ x: 0,        y: 0, width: sidebarW, height: marginPts + 3, color: sidebarColor })
          p.drawRectangle({ x: sidebarW, y: 0, width: mainW,    height: marginPts + 3, color: mainColor })
        }
      } else if (gutterInfo?.type === "solid") {
        // Single-color template: fill full-width gutter with root background
        const bgColor = parseCssRgb(gutterInfo.color)
        if (bgColor) {
          if (i > 0) p.drawRectangle({ x: 0, y: height - marginPts, width, height: marginPts,     color: bgColor })
          p.drawRectangle({ x: 0, y: 0, width, height: marginPts + 3, color: bgColor })
        }
      }
    }

    const pdf = await pdfDoc.save()
    const filename = encodeURIComponent(resume.title || "resume")
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } finally {
    await browser.close()
  }
}
