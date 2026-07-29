// POST /api/ai/ats-safe-export
// Returns the ATS-safe twin of the user's resume: single column, standard section
// labels, plain "-" bullets, one date format — the version that parses clean in every
// engine. Two formats: "txt" (deterministic text, default) and "pdf" (the same text
// rendered single-column by the PDF microservice). No LLM, no quota.
// PRO/LIMITED only, same gate as the other advanced-ATS routes.
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { canUseAdvancedAts } from "@/lib/plans"
import { db } from "@/lib/db"
import { ResumeSectionsSchema } from "@/types/resume"
import { toAtsSafeResumeText } from "@/lib/ats/ats-safe"
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"
import { claimManagedDownload, refundManagedDownload } from "@/lib/services/downloads/managed-quota"
import { createLogger } from "@/lib/logger"

const logger = createLogger("ats-safe-export")

const schema = z.object({
  resumeId: z.string().min(1).max(64),
  locale: z.enum(["es", "en"]).optional(),
  format: z.enum(["txt", "pdf"]).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult
  // `pro: true` (isActive) also lets BASIC/SPRINT through; advanced ATS is PRO/LIMITED.
  if (!canUseAdvancedAts(authResult.user.plan)) {
    return NextResponse.json({ error: "feature_pro_only" }, { status: 403 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 })
  const { resumeId } = parsed.data
  const locale = parsed.data.locale ?? "en"
  const format = parsed.data.format ?? "txt"

  let managedClaimed = false
  try {
    // `personalDetails` is the JSON column that stores the full section data.
    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId: authResult.userId },
      select: { id: true, title: true, personalDetails: true },
    })
    if (!resume) return NextResponse.json({ error: "not_found" }, { status: 404 })

    const sectionData = ResumeSectionsSchema.parse((resume.personalDetails as object) ?? {})
    const text = toAtsSafeResumeText(sectionData, locale)
    if (!text.trim()) return NextResponse.json({ error: "empty" }, { status: 422 })

    // This produces a downloadable resume file (txt or pdf) — for a managed (LIMITED)
    // user it counts against their download cap, exactly like the normal PDF export, so
    // the ATS export can't be used to slip past that cap. No-op for everyone else.
    const claim = await claimManagedDownload(authResult.userId, {
      isManaged: authResult.user.isManaged,
      managedDownloadLimit: authResult.user.managedDownloadLimit,
    })
    if (!claim.ok) return NextResponse.json({ error: claim.error }, { status: claim.status })
    managedClaimed = claim.claimed

    if (format === "txt") {
      return NextResponse.json({ text })
    }

    // PDF: the microservice fetches the ats-print page (signed token) and renders it.
    const internalUrl = process.env.INTERNAL_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const printToken = createPrintToken(authResult.userId, resumeId)
    const printUrl = `${internalUrl}/${locale}/resume/${resumeId}/ats-print?pt=${printToken}`

    const pdf = await callPdfService({
      printUrl,
      cookies: "",
      stretchPages: true, // resume renderer in the pdf-generator microservice
      resumeTitle: `ATS — ${resume.title}`,
    })

    const filename = encodeURIComponent(`${resume.title || "resume"}_ATS`)
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}.pdf`,
        "Cache-Control": "private, no-cache",
      },
    })
  } catch (err) {
    // The render failed after we charged a managed slot — give it back.
    if (managedClaimed) {
      await refundManagedDownload(authResult.userId, { resumeId, type: "ats_export" }).catch(() => {})
    }
    logger.error("ats-safe-export failed", { resumeId, format }, err instanceof Error ? err : undefined)
    return handleError(err, { req, userId: authResult.userId, userEmail: authResult.user.email })
  }
}
