import { NextResponse } from "next/server"
import { requireUser, handleError , apiError } from "@/lib/controllers/shared"
import { coverLetterService } from "@/lib/controllers/cover-letter-deps"
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"
import { createLogger } from "@/lib/logger"
import { isActive, isSuperAdmin, effectivePlan, canUsePremiumTemplates, UNSUBSCRIBED_DAILY_PDF_CAP, AI_DAILY_CAP_WINDOW_MS } from "@/lib/plans"
import { checkAndIncrementRateLimit, refundRateLimit } from "@/lib/rate-limit"
import { isProCoverLetterTemplate } from "@/lib/cover-letter/pro-templates"
import { db } from "@/lib/db"
import { claimManagedDownload, refundManagedDownload } from "@/lib/services/downloads/managed-quota"

const logger = createLogger("cover-letter-pdf")

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const { id } = await params

  const authResult = await requireUser(req, {})
  if (authResult instanceof NextResponse) return authResult

  const eff = effectivePlan(authResult.user)
  const active = isActive(authResult.user.plan, authResult.user.subscriptionEndsAt, authResult.user.subscriptionStatus, authResult.user.role, authResult.user.isManaged, authResult.user.managedBlocked, authResult.user.managedExpiresAt)

  // The free tier downloads its cover letter under the SAME rule as its résumé: a bounded
  // number per rolling 24h instead of a wall (CEO decision). Before this, a free user got
  // three CV downloads a day and zero letters — one document was a taste of the product
  // and the other was a locked door, for no reason either of them could see. Every other
  // inactive state (expired paid plan that has not resolved to UNSUBSCRIBED, blocked
  // LIMITED) stays hard-blocked, exactly as on the résumé side.
  const isFreeTier = !active && eff === "UNSUBSCRIBED"
  if (!active && !isFreeTier) {
    db.auditLog.create({
      data: { userId: authResult.userId, action: "FREE_DOWNLOAD_BLOCKED", metadata: { type: "pdf", coverLetterId: id } },
    }).catch((err) => { logger.error("auditLog FREE_DOWNLOAD_BLOCKED cover-letter failed", { userId: authResult.userId, coverLetterId: id }, err) })
    return apiError(403, "subscription_required", { req })
  }

  const url = new URL(req.url)
  const rawLocale = url.searchParams.get("locale") ?? ""
  const locale = ["es", "en"].includes(rawLocale) ? rawLocale : "es"

  // ETag check runs BEFORE the managed claim — a 304 must not consume a slot.
  let letter: { id: string; title: string | null; updatedAt: Date; templateId: string | null }
  try {
    letter = await coverLetterService.getPdfMeta(authResult.userId, id)
  } catch (err) {
    return handleError(err, { req })
  }
  // Premium templates require a plan that INCLUDES them (SPRINT/PRO/LIMITED/admin), which
  // is a different question from "is this user active": BASIC is active and does not have
  // them. Mirrors the résumé route; without it the padlock in the picker was the only
  // thing standing between a $2.99 one-time buyer and all 54 premium letter designs.
  // Runs before the ETag so a 304 can never serve a gated template either.
  const allowsPremium = isSuperAdmin(authResult.user.role) || canUsePremiumTemplates(eff)
  if (isProCoverLetterTemplate(letter.templateId) && !allowsPremium) {
    return apiError(403, "premium_template_requires_upgrade", { req })
  }

  const etag = `"${letter.id}-${letter.updatedAt.getTime()}"`
  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304 })
  }

  // Its OWN counter, not the résumé's: sharing one would let three letter downloads
  // lock the CV the user actually applies with. Same size, separate document.
  if (isFreeTier) {
    const ok = await checkAndIncrementRateLimit(authResult.userId, "cover-letter-pdf-daily", UNSUBSCRIBED_DAILY_PDF_CAP, AI_DAILY_CAP_WINDOW_MS)
    if (!ok) {
      db.auditLog.create({
        data: { userId: authResult.userId, action: "FREE_DOWNLOAD_BLOCKED", metadata: { type: "pdf", coverLetterId: id, reason: "daily_cap", cap: UNSUBSCRIBED_DAILY_PDF_CAP } },
      }).catch((err) => { logger.error("auditLog FREE_DOWNLOAD_BLOCKED cover-letter failed", { userId: authResult.userId, coverLetterId: id }, err) })
      return apiError(429, "free_daily_download_cap", { req, extra: { limit: UNSUBSCRIBED_DAILY_PDF_CAP } })
    }
  }

  const claim = await claimManagedDownload(authResult.userId, {
    isManaged: authResult.user.isManaged,
    managedDownloadLimit: authResult.user.managedDownloadLimit,
  })
  if (!claim.ok) return apiError(claim.status, claim.error, { req })
  const managedClaimed = claim.claimed

  try {
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
        "ETag": etag,
      },
    })
  } catch (err) {
    logger.error("render failed", { letterId: id, userId: authResult.userId }, err instanceof Error ? err : undefined)
    if (managedClaimed) {
      await refundManagedDownload(authResult.userId, { coverLetterId: id })
    }
    // The free slot was spent before rendering — give it back when the render failed.
    if (isFreeTier) {
      await refundRateLimit(authResult.userId, "cover-letter-pdf-daily")
    }
    return handleError(err, { req })
  }
}
