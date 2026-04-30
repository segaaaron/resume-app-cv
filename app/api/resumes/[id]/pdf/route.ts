import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import puppeteer from "puppeteer"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const url = new URL(req.url)
  const locale = url.searchParams.get("locale") ?? "en"

  const [resume, user] = await Promise.all([
    db.resume.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, title: true },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
    }),
  ])

  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date()
  const hasActiveAccess =
    user?.plan === "PRO" &&
    user?.subscriptionStatus === "ACTIVE" &&
    (!user?.subscriptionEndsAt || user.subscriptionEndsAt > now)

  if (!hasActiveAccess) return NextResponse.json({ error: "Pro plan required" }, { status: 403 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const printUrl = `${appUrl}/${locale}/resume/${id}/print`
  const cookieHeader = req.headers.get("cookie") ?? ""

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  })

  try {
    const page = await browser.newPage()

    // A4 at 96dpi = 794×1123px — exact viewport avoids layout reflows
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })

    // Pass session cookies so print page loads authenticated
    if (cookieHeader) {
      const hostname = new URL(appUrl).hostname
      const parsed = cookieHeader.split(";").map((c) => {
        const eq = c.indexOf("=")
        return { name: c.slice(0, eq).trim(), value: c.slice(eq + 1).trim(), domain: hostname }
      }).filter((c) => c.name && c.value)
      if (parsed.length) await page.setCookie(...parsed)
    }

    await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 30000 })

    // Switch to print media so CSS @media print rules apply, then measure
    await page.emulateMediaType("print")

    // Pad last page only when content fills >50% of it (avoids nearly-blank last page)
    await page.evaluate(() => {
      const wrapper = document.querySelector<HTMLElement>(".resume-pages")
      const el = document.querySelector<HTMLElement>(".resume-pages > div")
      if (!el) return
      const A4_PX = (297 * 96) / 25.4 // 1122.52 CSS px
      // Force exact A4 width and zoom=1 regardless of font-size setting
      if (wrapper) {
        wrapper.style.zoom = "1"
        wrapper.style.width = "210mm"
        wrapper.style.minHeight = "0"
      }
      el.style.minHeight = "0"
      const h = el.scrollHeight
      const rem = h % A4_PX
      // Only pad if last page is more than half-full (rem > 50% of A4)
      if (rem > A4_PX * 0.5 && rem < A4_PX - 2) {
        el.style.paddingBottom = `${Math.ceil(A4_PX - rem)}px`
      }
    })

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    })

    const pdf = Buffer.from(pdfBuffer)
    const filename = encodeURIComponent(resume.title || "resume")
    return new Response(pdf, {
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
