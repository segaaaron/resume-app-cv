import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("resume-pdf")
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"
import { checkAndIncrementRateLimit, PDF_RATE_LIMIT_WINDOW_MS } from "@/lib/rate-limit"
import { isActive } from "@/lib/plans"

const PDF_DAILY_LIMIT = 15

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
    db.auditLog.create({
      data: { userId: session.user.id, action: "FREE_DOWNLOAD_BLOCKED", metadata: { type: "pdf", resumeId: id } },
    }).catch((err) => { logger.error("auditLog FREE_DOWNLOAD_BLOCKED failed", { userId: session.user.id, resumeId: id }, err) })
    return NextResponse.json({ error: "subscription_required" }, { status: 403 })
  }

  const allowed = await checkAndIncrementRateLimit(session.user.id, "pdf-export", PDF_DAILY_LIMIT, PDF_RATE_LIMIT_WINDOW_MS)
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Maximum 15 PDF exports per day (CVs + cover letters combined)." }, { status: 429 })
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

    db.auditLog.create({
      data: { userId: session.user.id, action: "EXPORT_PDF", metadata: { resumeId: id } },
    }).catch((err) => { logger.error("auditLog EXPORT_PDF failed", { userId: session.user.id, resumeId: id }, err) })

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
