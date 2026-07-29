import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { handleError } from "@/lib/controllers/shared"
import { coverLetterService, } from "@/lib/controllers/cover-letter-deps"
import { coverLetterPatchSchema } from "@/lib/services/cover-letter/CoverLetterService"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const letter = await coverLetterService.get(session.user.id, id)
    return NextResponse.json(letter)
  } catch (err) {
    return handleError(err, { req })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const parsed = coverLetterPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 422 })
    }

    const { id } = await params
    await coverLetterService.update(session.user.id, id, parsed.data)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, { req })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { id } = await params
    await coverLetterService.delete(session.user.id, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, { req })
  }
}
