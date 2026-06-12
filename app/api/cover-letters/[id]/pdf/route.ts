import { NextResponse } from "next/server"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { coverLetterService } from "@/lib/controllers/cover-letter-deps"
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"
import { createLogger } from "@/lib/logger"
import { isActive } from "@/lib/plans"
import { db } from "@/lib/db"
import { claimManagedDownload, refundManagedDownload } from "@/lib/services/downloads/managed-quota"

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

  const claim = await claimManagedDownload(authResult.userId, {
    isManaged: authResult.user.isManaged,
    managedDownloadLimit: authResult.user.managedDownloadLimit,
  })
  if (!claim.ok) return NextResponse.json({ error: claim.error }, { status: claim.status })
  const managedClaimed = claim.claimed

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
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (err) {
    logger.error("render failed", { letterId: id, userId: authResult.userId }, err instanceof Error ? err : undefined)
    if (managedClaimed) {
      await refundManagedDownload(authResult.userId, { coverLetterId: id })
    }
    return handleError(err)
  }
}
