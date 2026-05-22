import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { requireUser, handleError } from "@/lib/controllers/shared"
import { applicationService } from "@/lib/controllers/application-deps"
import { applicationCreateSchema } from "@/lib/services/application/ApplicationService"

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  try {
    await applicationService.deleteAll(session.user.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const limit  = parseInt(searchParams.get("limit") ?? "50")
    const cursor = searchParams.get("cursor") ?? undefined

    const result = await applicationService.list(session.user.id, limit, cursor)
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" },
    })
  } catch (err) {
    return handleError(err)
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
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const parsed = applicationCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 422 })
    }

    const app = await applicationService.create(authResult.userId, parsed.data)
    return NextResponse.json(app, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
