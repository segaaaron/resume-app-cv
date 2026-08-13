import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { callScreenshotService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"
import { checkOrigin } from "@/lib/csrf"
import { createLogger } from "@/lib/logger"

const logger = createLogger("thumbnail")

// Node.js fetch wraps ECONNREFUSED in a TypeError with an AggregateError cause.
// The code may sit on the AggregateError itself or inside its nested errors array.
function isServiceUnavailable(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const cause = (err as { cause?: unknown }).cause
  if (!cause) return false
  const code = (cause as { code?: string }).code
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") return true
  const nested = (cause as { errors?: unknown[] }).errors
  if (Array.isArray(nested)) {
    return nested.some((e) => {
      const c = (e as { code?: string }).code
      return c === "ECONNREFUSED" || c === "ENOTFOUND"
    })
  }
  return false
}

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  if (!checkOrigin(req)) {
    return apiError(403, "Forbidden", { req })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return apiError(401, "Unauthorized", { req })
  }

  const { id } = await params
  const url = new URL(req.url)
  const rawLocale = url.searchParams.get("locale") ?? ""
  const locale = ["es", "en"].includes(rawLocale) ? rawLocale : "en"

  const resume = await db.resume.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!resume) return apiError(404, "Not found", { req })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const printToken = createPrintToken(session.user.id, id)
  const printUrl = `${appUrl}/${locale}/resume/${id}/print?pt=${printToken}&screenshot=1`

  try {
    const webpBuffer = await callScreenshotService(printUrl, "")
    const dataUrl = `data:image/webp;base64,${webpBuffer.toString("base64")}`

    // updateMany, not update: the row was checked before the render, and the
    // render takes seconds. Deleting the CV from the dashboard in that window is
    // a normal thing to do, and `update` throws P2025 when the row is gone —
    // which surfaced in Service Errors as "thumbnail render failed", a red entry
    // for a user who did nothing wrong. Zero rows updated is the correct outcome
    // here, not a failure.
    const { count } = await db.resume.updateMany({
      where: { id, userId: session.user.id },
      data: { thumbnailUrl: dataUrl },
    })
    if (count === 0) {
      logger.info("thumbnail discarded: resume deleted during render", { resumeId: id })
      return NextResponse.json({ ok: false, skipped: true })
    }

    logger.info("thumbnail generated", { resumeId: id, sizeBytes: webpBuffer.byteLength })
    return NextResponse.json({ thumbnailUrl: dataUrl })
  } catch (err) {
    if (isServiceUnavailable(err)) {
      logger.warn("PDF microservice unreachable, skipping thumbnail", { resumeId: id })
      return NextResponse.json({ ok: false, skipped: true }, { status: 503 })
    }

    const detail = err instanceof Error ? err.message : String(err)
    logger.error("thumbnail render failed", { resumeId: id, detail }, err)
    const msg = locale === "en"
      ? `Error generating CV preview: ${detail}`
      : `Error al generar la vista previa del CV: ${detail}`
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
