import { NextResponse } from "next/server"
import { requireAuth, requireUser, handleError } from "@/lib/controllers/shared"
import { coverLetterService } from "@/lib/controllers/cover-letter-deps"

export async function GET(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(req.url)
    const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50") || 50, 100)
    const cursor = searchParams.get("cursor") ?? undefined

    const result = await coverLetterService.list(authResult.userId, limit, cursor)
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" },
    })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: Request) {
  // UNSUBSCRIBED gets 1 cover letter (freemium). Quota enforced inside the service.
  const authResult = await requireUser(req, { csrf: true, emailVerified: true })
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await req.json().catch(() => ({}))
    const title = typeof body?.title === "string" ? body.title.slice(0, 200) : undefined
    const letter = await coverLetterService.create(authResult.userId, title, authResult.user.plan)
    return NextResponse.json(letter, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
