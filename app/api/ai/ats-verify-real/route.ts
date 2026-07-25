// POST /api/ai/ats-verify-real
// The pioneer check: renders the user's ACTUAL exported PDF, extracts the text a
// real ATS would read, and scores THAT (via the same deterministic analyzer the
// free tool uses). Surfaces the gap between the structured score and what a strict
// parser actually sees — e.g. a two-column template that reorders content.
// PRO only. Does NOT consume a managed download claim (this is a check, not a download).
import { NextResponse } from "next/server"
import { z } from "zod"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { canUseAdvancedAts } from "@/lib/plans"
import { db } from "@/lib/db"
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"
import { extractTextFromPDF } from "@/lib/ats/pdf-parser"
import { analyzeAts } from "@/lib/ats/analyzer"
import { createLogger } from "@/lib/logger"

const logger = createLogger("ats-verify-real")

const schema = z.object({
  resumeId: z.string().min(1).max(64),
  jobDescription: z.string().min(20).max(10000),
  locale: z.enum(["es", "en"]).optional(),
})

export async function POST(req: Request) {
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult
  // PRO/LIMITED only (see route header). `pro: true` (isActive) also passes
  // BASIC/SPRINT; gate them out BEFORE the expensive PDF render below.
  if (!canUseAdvancedAts(authResult.user.plan)) {
    return NextResponse.json({ error: "feature_pro_only" }, { status: 403 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 })
  const { resumeId, jobDescription } = parsed.data
  const locale = parsed.data.locale ?? "en"

  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId: authResult.userId },
    select: { id: true, title: true },
  })
  if (!resume) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const internalUrl = process.env.INTERNAL_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const printToken = createPrintToken(authResult.userId, resumeId)
  const printUrl = `${internalUrl}/${locale}/resume/${resumeId}/print?pdf=1&pt=${printToken}`

  try {
    const pdf = await callPdfService({
      printUrl,
      cookies: "",
      stretchPages: true,
      resumeTitle: `CV — ${resume.title}`,
    })
    const extracted = await extractTextFromPDF(pdf)
    if (!extracted.hasExtractableText) {
      return NextResponse.json({ error: "not_extractable" }, { status: 422 })
    }

    const analysis = analyzeAts({ resumeText: extracted.text, jobDescription, locale })
    return NextResponse.json({
      realScore: analysis.scoreOverall,
      breakdown: analysis.breakdown,
      extractedText: extracted.text.slice(0, 2000),
      wordCount: extracted.wordCount,
    })
  } catch (err) {
    logger.error("ats-verify-real failed", { resumeId }, err instanceof Error ? err : undefined)
    return handleError(err)
  }
}
