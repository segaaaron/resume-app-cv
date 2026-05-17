import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { requireProUser, handleError } from "@/lib/controllers/shared"
import { coverLetterService } from "@/lib/controllers/cover-letter-deps"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const limit  = parseInt(searchParams.get("limit") ?? "50")
    const cursor = searchParams.get("cursor") ?? undefined

    const result = await coverLetterService.list(session.user.id, limit, cursor)
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

    const body = await req.json().catch(() => ({}))
    const title = typeof body?.title === "string" ? body.title.slice(0, 200) : undefined
    const letter = await coverLetterService.create(session.user.id, title)
    return NextResponse.json(letter, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
