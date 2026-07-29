import { NextResponse } from "next/server"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { resumeService, } from "@/lib/controllers/resume-deps"
import { resumePatchSchema } from "@/lib/services/resume/ResumeService"
import { AppError } from "@/lib/services/auth/AppError"

type Params = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Params) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  try {
    const resume = await resumeService.get(authResult.userId, id)
    return NextResponse.json(resume)
  } catch (err) {
    return handleError(err, { req })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = resumePatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 422 })
  }

  try {
    await resumeService.update(authResult.userId, id, parsed.data)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, { req })
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  try {
    await resumeService.delete(authResult.userId, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    // Already deleted — idempotent DELETE: treat as success
    if (err instanceof AppError && err.status === 404) {
      return NextResponse.json({ success: true })
    }
    return handleError(err, { req })
  }
}
