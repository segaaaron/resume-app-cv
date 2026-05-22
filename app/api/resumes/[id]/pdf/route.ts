import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("resume-pdf")
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"
import { checkRateLimit } from "@/lib/ai-client"
import { isActive } from "@/lib/plans"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const url = new URL(req.url)
  const rawLocale = url.searchParams.get("locale") ?? ""
  const locale = ["es", "en"].includes(rawLocale) ? rawLocale : "en"

  const [resume, user] = await Promise.all([
    db.resume.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, title: true, templateId: true, updatedAt: true },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true },
    }),
  ])

  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const etag = `"${resume.id}-${resume.updatedAt.getTime()}"`
  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304 })
  }

  if (!isActive(user?.plan ?? "UNSUBSCRIBED", user?.subscriptionEndsAt, user?.subscriptionStatus, user?.role)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const allowed = await checkRateLimit(session.user.id, "pdf-export", 20)
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const internalUrl = process.env.INTERNAL_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const printToken = createPrintToken(session.user.id, id)
  const printUrl = `${internalUrl}/${locale}/resume/${id}/print?pdf=1&pt=${printToken}`

  try {
    const pdf = await callPdfService({
      printUrl,
      cookies: "",
      stretchPages: true, // web app — PDF contract: true = resume renderer in pdf-generator microservice
      resumeTitle: `CV — ${resume.title}`,
      candidateName: session.user.name ?? undefined,
    })
    const filename = encodeURIComponent(resume.title || "resume")
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}.pdf`,
        "Cache-Control": "private, no-cache",
        "ETag": etag,
      },
    })
  } catch (err) {
    logger.error("render failed", { resumeId: id, userId: session.user.id }, err instanceof Error ? err : undefined)
    return NextResponse.json({ error: "PDF render failed" }, { status: 500 })
  }
}
