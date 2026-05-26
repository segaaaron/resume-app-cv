import { NextResponse } from "next/server"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { coverLetterService } from "@/lib/controllers/cover-letter-deps"
import { checkAndIncrementRateLimit, PDF_RATE_LIMIT_WINDOW_MS } from "@/lib/rate-limit"
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"
import { createLogger } from "@/lib/logger"
import { db } from "@/lib/db"

const logger = createLogger("cover-letter-pdf")
const PDF_DAILY_LIMIT = 15

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const authResult = await requireUser(req, { pro: true })
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  try {
    const url = new URL(req.url)
    const rawLocale = url.searchParams.get("locale") ?? ""
    const locale = ["es", "en"].includes(rawLocale) ? rawLocale : "es"

    const letter = await coverLetterService.getPdfMeta(authResult.userId, id)

    const allowed = await checkAndIncrementRateLimit(authResult.userId, "pdf-export", PDF_DAILY_LIMIT, PDF_RATE_LIMIT_WINDOW_MS)
    if (!allowed) return NextResponse.json({ error: "Rate limit exceeded. Maximum 15 PDF exports per day (CVs + cover letters combined)." }, { status: 429 })

    const internalUrl = process.env.INTERNAL_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const printToken = createPrintToken(authResult.userId, id)
    const printUrl = `${internalUrl}/${locale}/cover-letter/${id}/print?pdf=1&pt=${printToken}`

    const pdf = await callPdfService({
      printUrl,
      cookies: "",
      stretchPages: false,
      letterTitle: letter.title ?? undefined,
    })
    db.auditLog.create({
      data: { userId: authResult.userId, action: "EXPORT_PDF", metadata: { coverLetterId: id } },
    }).catch((err) => { logger.error("auditLog EXPORT_PDF cover-letter failed", { userId: authResult.userId, coverLetterId: id }, err) })

    const filename = encodeURIComponent(letter.title || "carta")
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}.pdf`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    logger.error("render failed", { letterId: id, userId: authResult.userId }, err instanceof Error ? err : undefined)
    return handleError(err)
  }
}
