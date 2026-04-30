import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { ResumeSectionsSchema } from "@/types/resume"

const MAX_VERSIONS = 10

// Snapshot schema — mirrors the Resume fields saved by EditorLayout autosave
export const snapshotConfigSchema = z.object({
  templateId:    z.string().optional(),
  colorScheme:   z.string().optional(),
  fontFamily:    z.string().optional(),
  fontSize:      z.number().optional(),
  spacing:       z.number().optional(),
  photoUrl:      z.string().optional().nullable(),
  photoPosition: z.number().optional(),
  language:      z.string().optional(),
}).optional()

export const snapshotSchema = z.object({
  title:       z.string().optional(),
  sections:    z.array(z.any()).optional(),
  sectionData: ResumeSectionsSchema.optional(),
  config:      snapshotConfigSchema,
})

export type ResumeSnapshot = z.infer<typeof snapshotSchema>

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
    select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
  })

  const now = new Date()
  const hasActiveAccess =
    user?.plan === "PRO" &&
    user?.subscriptionStatus === "ACTIVE" &&
    (!user?.subscriptionEndsAt || user.subscriptionEndsAt > now)

  if (!hasActiveAccess) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const { resumeId, label } = body

  if (!resumeId || typeof resumeId !== "string") {
    return NextResponse.json({ error: "resumeId required" }, { status: 400 })
  }

  // Validate snapshot shape before persisting
  const parsed = snapshotSchema.safeParse(body.snapshot)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid snapshot format", details: parsed.error.flatten() }, { status: 400 })
  }

  // Verify ownership
  const resume = await db.resume.findFirst({ where: { id: resumeId, userId: session.user.id } })
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Create the new version and prune old ones atomically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let version: any
  await db.$transaction(async (tx) => {
    version = await tx.resumeVersion.create({
      data: { resumeId, label: typeof label === "string" ? label : null, snapshot: parsed.data as object },
    })
    const all = await tx.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    })
    if (all.length > MAX_VERSIONS) {
      const toDelete = all.slice(MAX_VERSIONS).map((v) => v.id)
      await tx.resumeVersion.deleteMany({ where: { id: { in: toDelete } } })
    }
  })

  return NextResponse.json({ version: version! })
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
