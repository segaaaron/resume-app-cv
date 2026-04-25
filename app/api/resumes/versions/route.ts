import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const MAX_VERSIONS = 10

// GET /api/resumes/versions?resumeId=xxx — list versions
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const resumeId = searchParams.get("resumeId")
  if (!resumeId) return NextResponse.json({ error: "resumeId required" }, { status: 400 })

  // Verify ownership
  const resume = await db.resume.findFirst({ where: { id: resumeId, userId: session.user.id } })
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const versions = await db.resumeVersion.findMany({
    where: { resumeId },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, createdAt: true },
  })

  return NextResponse.json({ versions })
}

// POST /api/resumes/versions — save a new version snapshot
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true },
  })

  if (user?.plan !== "PRO" || user?.subscriptionStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const { resumeId, label, snapshot } = await req.json()
  if (!resumeId || !snapshot) return NextResponse.json({ error: "resumeId and snapshot required" }, { status: 400 })

  // Verify ownership
  const resume = await db.resume.findFirst({ where: { id: resumeId, userId: session.user.id } })
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Create the new version
  const version = await db.resumeVersion.create({
    data: { resumeId, label: label || null, snapshot },
  })

  // Keep only the last MAX_VERSIONS — delete oldest ones
  const all = await db.resumeVersion.findMany({
    where: { resumeId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  })

  if (all.length > MAX_VERSIONS) {
    const toDelete = all.slice(MAX_VERSIONS).map((v) => v.id)
    await db.resumeVersion.deleteMany({ where: { id: { in: toDelete } } })
  }

  return NextResponse.json({ version })
}

// DELETE /api/resumes/versions?id=xxx — delete a specific version
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  // Verify ownership via join
  const version = await db.resumeVersion.findFirst({
    where: { id },
    include: { resume: { select: { userId: true } } },
  })

  if (!version || version.resume.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await db.resumeVersion.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
