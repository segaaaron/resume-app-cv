import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { checkOrigin } from "@/lib/csrf"
import { handleError , apiError } from "@/lib/controllers/shared"
import { coverLetterService, } from "@/lib/controllers/cover-letter-deps"
import { coverLetterPatchSchema } from "@/lib/services/cover-letter/CoverLetterService"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })

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
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError(400, "Invalid JSON", { req })
    }

    const parsed = coverLetterPatchSchema.safeParse(body)
    if (!parsed.success) {
      return apiError(422, "Invalid data", { req })
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
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })
  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  try {
    const { id } = await params
    await coverLetterService.delete(session.user.id, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, { req })
  }
}
