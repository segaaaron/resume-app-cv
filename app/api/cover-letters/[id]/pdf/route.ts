import { NextResponse } from "next/server"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { coverLetterService } from "@/lib/controllers/cover-letter-deps"
import { checkAndIncrementRateLimit } from "@/lib/ai-client"
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"
import { createLogger } from "@/lib/logger"

const logger = createLogger("cover-letter-pdf")

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

    const allowed = await checkAndIncrementRateLimit(authResult.userId, "cover-letter-pdf-export", 20)
    if (!allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

    const internalUrl = process.env.INTERNAL_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const printToken = createPrintToken(authResult.userId, id)
    const printUrl = `${internalUrl}/${locale}/cover-letter/${id}/print?pdf=1&pt=${printToken}`

    const pdf = await callPdfService({
      printUrl,
      cookies: "",
      stretchPages: false,
      letterTitle: letter.title ?? undefined,
    })
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
