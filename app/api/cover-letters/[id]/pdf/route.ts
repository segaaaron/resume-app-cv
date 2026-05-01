import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import puppeteer from "puppeteer"

type Params = { params: Promise<{ id: string }> }

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

export async function GET(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const url = new URL(req.url)
  const locale = url.searchParams.get("locale") ?? "es"

  const [letter, user] = await Promise.all([
    db.coverLetter.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, title: true },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
    }),
  ])

  if (!letter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date()
  const hasActiveAccess =
    user?.plan === "PRO" &&
    user?.subscriptionStatus === "ACTIVE" &&
    (!user?.subscriptionEndsAt || user.subscriptionEndsAt > now)

  if (!hasActiveAccess) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  // No ?pdf=1 — let the @page rule use 0 margin; we set margins in page.pdf()
  const printUrl = `${appUrl}/${locale}/cover-letter/${id}/print`
  const cookieHeader = req.headers.get("cookie") ?? ""

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: A4_WIDTH_PX, height: A4_HEIGHT_PX, deviceScaleFactor: 1 })

    if (cookieHeader) {
      const hostname = new URL(appUrl).hostname
      const cookies = cookieHeader
        .split(";")
        .map((c) => {
          const eq = c.indexOf("=")
          if (eq < 0) return null
          return { name: c.slice(0, eq).trim(), value: c.slice(eq + 1).trim(), domain: hostname }
        })
        .filter((c): c is { name: string; value: string; domain: string } => !!c?.name && !!c.value)
      if (cookies.length) await page.setCookie(...cookies)
    }

    await page.goto(printUrl, { waitUntil: "networkidle0", timeout: 30000 })
    await page.emulateMediaType("print")
    await page.evaluate(() => document.fonts.ready)

    // Remove min-height so PDF page count matches actual content
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(".cover-letter-page")
      if (!el) return
      el.style.setProperty("min-height", "0", "important")
      el.style.setProperty("height", "auto", "important")
    })

    const rawPdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "0", bottom: "10mm", left: "0" },
    })

    const filename = encodeURIComponent(letter.title || "carta")
    return new Response(Buffer.from(rawPdf), {
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
