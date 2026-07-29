import { NextResponse } from "next/server"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { resumeService } from "@/lib/controllers/resume-deps"

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  try {
    const copy = await resumeService.duplicate(authResult.userId, id)
    return NextResponse.json(copy, { status: 201 })
  } catch (err) {
    return handleError(err, { req })
  }
}
