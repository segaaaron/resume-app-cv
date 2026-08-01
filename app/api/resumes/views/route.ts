import { NextResponse } from "next/server"
import { requireAuth, handleError , apiError } from "@/lib/controllers/shared"
import { resumeService } from "@/lib/controllers/resume-deps"

// GET /api/resumes/views?resumeId=xxx
export async function GET(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(req.url)
  const resumeId = searchParams.get("resumeId")
  if (!resumeId) return apiError(400, "Missing resumeId", { req })

  try {
    const stats = await resumeService.getViewStats(authResult.userId, resumeId)
    return NextResponse.json(stats)
  } catch (err) {
    return handleError(err, { req })
  }
}
