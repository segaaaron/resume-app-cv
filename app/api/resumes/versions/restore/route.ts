import { NextResponse } from "next/server"
import { requireAuth, handleError , apiError } from "@/lib/controllers/shared"
import { resumeService } from "@/lib/controllers/resume-deps"

// POST /api/resumes/versions/restore — restore a version snapshot into the resume
export async function POST(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const body = await req.json().catch(() => null)
  const { versionId } = body ?? {}
  if (!versionId) return apiError(400, "versionId required", { req })

  try {
    const result = await resumeService.restoreVersion(authResult.userId, versionId)
    return NextResponse.json({ success: true, resumeId: result.resumeId })
  } catch (err) {
    return handleError(err, { req })
  }
}
