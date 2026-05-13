import { NextResponse } from "next/server"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { resumeService } from "@/lib/controllers/resume-deps"

// GET /api/resumes/views?resumeId=xxx
export async function GET(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(req.url)
  const resumeId = searchParams.get("resumeId")
  if (!resumeId) return NextResponse.json({ error: "Missing resumeId" }, { status: 400 })

  try {
    const stats = await resumeService.getViewStats(authResult.userId, resumeId)
    return NextResponse.json(stats)
  } catch (err) {
    return handleError(err)
  }
}
