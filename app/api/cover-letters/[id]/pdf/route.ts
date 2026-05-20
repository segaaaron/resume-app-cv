import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { handleError, requireProUser } from "@/lib/controllers/shared"
import { coverLetterService } from "@/lib/controllers/cover-letter-deps"
import { checkAndIncrementRateLimit } from "@/lib/ai-client"
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { createPrintToken } from "@/lib/pdf/print-token"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const url = new URL(req.url)
    const rawLocale = url.searchParams.get("locale") ?? ""
    const locale = ["es", "en"].includes(rawLocale) ? rawLocale : "es"

    const proCheck = await requireProUser(session.user.id)
    if (proCheck) return proCheck

    const letter = await coverLetterService.getPdfMeta(session.user.id, id)

    const allowed = await checkAndIncrementRateLimit(session.user.id, "cover-letter-pdf-export", 20)
    if (!allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

    const internalUrl = process.env.INTERNAL_APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const printToken = createPrintToken(session.user.id, id)
    const printUrl = `${internalUrl}/${locale}/cover-letter/${id}/print?pdf=1&pt=${printToken}`

    const pdf = await callPdfService({
      printUrl,
      cookies: "",
      stretchPages: false,
      candidateName: session.user.name ?? undefined,
      letterTitle: letter.title ?? undefined,
    })
    const filename = encodeURIComponent(letter.title || "carta")
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[cover-letter pdf] render failed", err)
    return handleError(err)
  }
}
