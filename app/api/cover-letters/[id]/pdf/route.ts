import { NextResponse } from "next/server"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { coverLetterService } from "@/lib/controllers/cover-letter-deps"
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"
import { createLogger } from "@/lib/logger"
import { isActive } from "@/lib/plans"
import { db } from "@/lib/db"

const logger = createLogger("cover-letter-pdf")

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const { id } = await params

  const authResult = await requireUser(req, {})
  if (authResult instanceof NextResponse) return authResult

  if (!isActive(authResult.user.plan, authResult.user.subscriptionEndsAt, authResult.user.subscriptionStatus, authResult.user.role, authResult.user.isManaged, authResult.user.managedBlocked, authResult.user.managedExpiresAt)) {
    db.auditLog.create({
      data: { userId: authResult.userId, action: "FREE_DOWNLOAD_BLOCKED", metadata: { type: "pdf", coverLetterId: id } },
    }).catch((err) => { logger.error("auditLog FREE_DOWNLOAD_BLOCKED cover-letter failed", { userId: authResult.userId, coverLetterId: id }, err) })
    return NextResponse.json({ error: "subscription_required" }, { status: 403 })
  }

  const url = new URL(req.url)
  const rawLocale = url.searchParams.get("locale") ?? ""
  const locale = ["es", "en"].includes(rawLocale) ? rawLocale : "es"

  let managedClaimed = false
  if (authResult.user.isManaged && authResult.user.managedDownloadLimit !== null) {
    const claimed = await db.user.updateMany({
      where: { id: authResult.userId, isManaged: true, managedDownloadsUsed: { lt: authResult.user.managedDownloadLimit } },
      data: { managedDownloadsUsed: { increment: 1 } },
    })
    if (claimed.count === 0) {
      return NextResponse.json({ error: "Has alcanzado el límite de descargas de tu plan." }, { status: 403 })
    }
    managedClaimed = true
  }

  try {
    const letter = await coverLetterService.getPdfMeta(authResult.userId, id)

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
    if (managedClaimed) {
      db.user.update({ where: { id: authResult.userId }, data: { managedDownloadsUsed: { decrement: 1 } } })
        .catch(() => undefined)
    }
    return handleError(err)
  }
}
