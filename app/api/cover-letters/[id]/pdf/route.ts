import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/ai-client"
import { renderToPdf } from "@/lib/pdf/render-page"
import { isActive } from "@/lib/plans"

type Params = { params: Promise<{ id: string }> }

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

  if (!isActive(user?.plan ?? "UNSUBSCRIBED", user?.subscriptionEndsAt, user?.subscriptionStatus)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const allowed = await checkRateLimit(session.user.id, "cover-letter-pdf-export", 20)
  if (!allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const printUrl = `${appUrl}/${locale}/cover-letter/${id}/print?pdf=1`
  const cookieHeader = req.headers.get("cookie") ?? ""

  try {
    const pdf = await renderToPdf({
      printUrl,
      cookieHeader,
      appUrl,
      stretchPages: false,
      candidateName: session.user.name ?? undefined,
      letterTitle: letter.title ?? undefined,
    })
    const filename = encodeURIComponent(letter.title || "carta")
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[cover-letter pdf] render failed", err)
    return NextResponse.json({ error: "PDF render failed" }, { status: 500 })
  }
}
