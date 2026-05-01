import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { renderToPdf } from "@/lib/pdf/render-page"

type Params = { params: Promise<{ id: string }> }

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

  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date()
  const hasActiveAccess =
    user?.plan === "PRO" &&
    user?.subscriptionStatus === "ACTIVE" &&
    (!user?.subscriptionEndsAt || user.subscriptionEndsAt > now)

  if (!hasActiveAccess) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const printUrl = `${appUrl}/${locale}/resume/${id}/print?pdf=1`
  const cookieHeader = req.headers.get("cookie") ?? ""

  try {
    const pdf = await renderToPdf({ printUrl, cookieHeader, appUrl, stretchPages: true })
    const filename = encodeURIComponent(resume.title || "resume")
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[resume pdf] render failed", err)
    return NextResponse.json({ error: "PDF render failed" }, { status: 500 })
  }
}
