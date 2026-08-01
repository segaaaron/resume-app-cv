import { NextResponse } from "next/server"
import { requireAuth, requireUser, handleError , apiError } from "@/lib/controllers/shared"
import { applicationService } from "@/lib/controllers/application-deps"
import { applicationCreateSchema } from "@/lib/services/application/ApplicationService"

export async function DELETE(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult
  try {
    await applicationService.deleteAll(authResult.userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, { req })
  }
}

export async function GET(req: Request) {
  const authResult = await requireUser(req, {})
  if (authResult instanceof NextResponse) return authResult

  try {
    const { searchParams } = new URL(req.url)
    const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50") || 50, 100)
    const cursor = searchParams.get("cursor") ?? undefined

    const result = await applicationService.list(authResult.userId, limit, cursor)
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" },
    })
  } catch (err) {
    return handleError(err, { req })
  }
}

export async function POST(req: Request) {
  // Single DB round-trip: auth + pro-plan check merged via requireUser
  const authResult = await requireUser(req, { pro: true, csrf: true })
  if (authResult instanceof NextResponse) return authResult

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError(400, "Invalid JSON", { req })
    }

    const parsed = applicationCreateSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(422, "Invalid data", { req })
    }

    const app = await applicationService.create(authResult.userId, parsed.data)
    return NextResponse.json(app, { status: 201 })
  } catch (err) {
    return handleError(err, { req })
  }
}
