import { NextResponse } from "next/server"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { resumeService } from "@/lib/controllers/resume-deps"
import { snapshotSchema } from "@/lib/services/resume/ResumeService"

// Re-export for restore route (backward compat)
export { snapshotSchema }
export type { ResumeSnapshot } from "@/lib/services/resume/ResumeService"

// GET /api/resumes/versions?resumeId=xxx — list versions
export async function GET(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(req.url)
  const resumeId = searchParams.get("resumeId")
  if (!resumeId) return NextResponse.json({ error: "resumeId required" }, { status: 400 })

  try {
    const versions = await resumeService.getVersions(authResult.userId, resumeId)
    return NextResponse.json({ versions })
  } catch (err) {
    return handleError(err)
  }
}

// POST /api/resumes/versions — save a new version snapshot
export async function POST(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const { resumeId, label } = body

  if (!resumeId || typeof resumeId !== "string") {
    return NextResponse.json({ error: "resumeId required" }, { status: 400 })
  }

  const parsed = snapshotSchema.safeParse(body.snapshot)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid snapshot format", details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const version = await resumeService.createVersion(
      authResult.userId,
      resumeId,
      parsed.data,
      typeof label === "string" ? label : undefined,
    )
    return NextResponse.json({ version })
  } catch (err) {
    return handleError(err)
  }
}

// DELETE /api/resumes/versions?id=xxx — delete a specific version
export async function DELETE(req: Request) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  try {
    await resumeService.deleteVersion(authResult.userId, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err)
  }
}
