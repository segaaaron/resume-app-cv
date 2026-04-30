import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// GET /api/resumes/views?resumeId=xxx
// Returns view counts for a public resume owned by the authenticated user
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const resumeId = searchParams.get("resumeId")
  if (!resumeId) return NextResponse.json({ error: "Missing resumeId" }, { status: 400 })

  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId: session.user.id },
    select: { id: true, isPublic: true, publicSlug: true },
  })
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date()
  const [total, last7d, last30d] = await Promise.all([
    db.cVView.count({ where: { resumeId } }),
    db.cVView.count({ where: { resumeId, viewedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } }),
    db.cVView.count({ where: { resumeId, viewedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } }),
  ])

  return NextResponse.json({ total, last7d, last30d, isPublic: resume.isPublic, publicSlug: resume.publicSlug })
}
