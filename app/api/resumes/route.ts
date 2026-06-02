import { NextResponse } from "next/server"
import { requireAuth, requireUser, handleError } from "@/lib/controllers/shared"
import { resumeService } from "@/lib/controllers/resume-deps"

export async function GET(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50") || 50, 100)
  const cursor = searchParams.get("cursor") ?? undefined

  try {
    const result = await resumeService.list(authResult.userId, limit, cursor)
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" },
    })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(request: Request) {
  // Freemium guard: UNSUBSCRIBED can create 1 resume. ResumeService.create enforces the
  // count limit per plan. Email verification is required to prevent throwaway accounts.
  const authResult = await requireUser(request, { csrf: true, emailVerified: true })
  if (authResult instanceof NextResponse) return authResult

  let templateId: string | undefined
  try {
    const body = await request.json()
    if (body?.templateId) templateId = body.templateId
  } catch {}

  try {
    const resume = await resumeService.create(authResult.userId, templateId)
    return NextResponse.json(resume, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
