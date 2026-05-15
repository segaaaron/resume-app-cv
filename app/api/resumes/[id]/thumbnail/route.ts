import { NextResponse } from "next/server"
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const url = new URL(req.url)
  const rawLocale = url.searchParams.get("locale") ?? ""
  const locale = ["es", "en"].includes(rawLocale) ? rawLocale : "en"

  const resume = await db.resume.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const printToken = createPrintToken(session.user.id, id)
  const printUrl = `${appUrl}/${locale}/resume/${id}/print?pt=${printToken}&screenshot=1`

  try {
    const webpBuffer = await callScreenshotService(printUrl, "")
    const dataUrl = `data:image/webp;base64,${webpBuffer.toString("base64")}`

    await db.resume.update({
      where: { id },
      data: { thumbnailUrl: dataUrl },
    })

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
