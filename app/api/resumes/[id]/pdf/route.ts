import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createLogger } from "@/lib/logger"

const logger = createLogger("resume-pdf")
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"
import { isActive, isSuperAdmin, effectivePlan, canUsePremiumTemplates, UNSUBSCRIBED_DAILY_PDF_CAP, AI_DAILY_CAP_WINDOW_MS } from "@/lib/plans"
import { checkAndIncrementRateLimit, refundRateLimit } from "@/lib/rate-limit"
import { PRO_IDS } from "@/components/editor/template-switcher/template-data"
import { claimManagedDownload, refundManagedDownload } from "@/lib/services/downloads/managed-quota"


type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return apiError(401, "Unauthorized", { req })
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
      select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true, isManaged: true, managedBlocked: true, managedExpiresAt: true, managedDownloadLimit: true, managedDownloadsUsed: true },
    }),
  ])

  if (!resume) return apiError(404, "Not found", { req })

  const etag = `"${resume.id}-${resume.updatedAt.getTime()}"`
  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304 })
  }

  const eff = effectivePlan({ plan: user?.plan ?? "UNSUBSCRIBED", subscriptionEndsAt: user?.subscriptionEndsAt })
  const active = isActive(
    user?.plan ?? "UNSUBSCRIBED",
    user?.subscriptionEndsAt,
    user?.subscriptionStatus,
    user?.role,
    user?.isManaged,
    user?.managedBlocked,
    user?.managedExpiresAt,
  )
  // Free tier (UNSUBSCRIBED) gets a bounded number of downloads/day instead of a
  // hard wall — enforced below, AFTER the premium-template gate so a blocked PRO
  // download never burns a daily slot. Other inactive states (expired paid plan
  // that didn't resolve to UNSUBSCRIBED, blocked LIMITED) stay hard-blocked.
  const isFreeTier = !active && eff === "UNSUBSCRIBED"
  if (!active && !isFreeTier) {
    db.auditLog.create({
      data: { userId: session.user.id, action: "FREE_DOWNLOAD_BLOCKED", metadata: { type: "pdf", resumeId: id } },
    }).catch((err) => { logger.error("auditLog FREE_DOWNLOAD_BLOCKED failed", { userId: session.user.id, resumeId: id }, err) })
    return apiError(403, "subscription_required", { req })
  }

  // Premium (PRO) templates require a plan that grants them (SPRINT/PRO/LIMITED/admin).
  // Closes the UI-only soft gate: a BASIC/UNSUBSCRIBED user can't download a PRO
  // template via direct API. Runs BEFORE the free-tier daily count.
  const allowsPremium = isSuperAdmin(user?.role) || canUsePremiumTemplates(eff)
  if (resume.templateId && PRO_IDS.includes(resume.templateId) && !allowsPremium) {
    return apiError(403, "premium_template_requires_upgrade", { req })
  }

  // Free-tier daily download cap (rolling 24h, auto-resetting — no cron, no DB
  // field). Consumed only once the template is validated above.
  if (isFreeTier) {
    const ok = await checkAndIncrementRateLimit(session.user.id, "pdf-daily", UNSUBSCRIBED_DAILY_PDF_CAP, AI_DAILY_CAP_WINDOW_MS)
    if (!ok) {
      db.auditLog.create({
        data: { userId: session.user.id, action: "FREE_DOWNLOAD_BLOCKED", metadata: { type: "pdf", resumeId: id, reason: "daily_cap", cap: UNSUBSCRIBED_DAILY_PDF_CAP } },
      }).catch((err) => { logger.error("auditLog FREE_DOWNLOAD_BLOCKED failed", { userId: session.user.id, resumeId: id }, err) })
      return apiError(429, "free_daily_download_cap", { req, extra: { limit: UNSUBSCRIBED_DAILY_PDF_CAP } })
    }
  }

  const claim = await claimManagedDownload(session.user.id, {
    isManaged: user?.isManaged ?? false,
    managedDownloadLimit: user?.managedDownloadLimit ?? null,
  })
  if (!claim.ok) return apiError(claim.status, claim.error, { req })
  const managedClaimed = claim.claimed

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
    if (managedClaimed) {
      await refundManagedDownload(session.user.id, { resumeId: id })
    }
    // Free tier consumed a daily slot before rendering — give it back on failure.
    if (isFreeTier) {
      await refundRateLimit(session.user.id, "pdf-daily")
    }
    return NextResponse.json({ error: "PDF render failed" }, { status: 500 })
  }
}
