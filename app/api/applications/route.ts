import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { requireProUser, handleError } from "@/lib/controllers/shared"
import { applicationService } from "@/lib/controllers/application-deps"
import { applicationCreateSchema } from "@/lib/services/application/ApplicationService"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const limit  = parseInt(searchParams.get("limit") ?? "100")
    const cursor = searchParams.get("cursor") ?? undefined

    const result = await applicationService.list(session.user.id, limit, cursor)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const proCheck = await requireProUser(session.user.id)
    if (proCheck) return proCheck

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

    const app = await applicationService.create(session.user.id, parsed.data)
    return NextResponse.json(app, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
