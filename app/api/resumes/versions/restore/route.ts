import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { snapshotSchema } from "@/app/api/resumes/versions/route"

// POST /api/resumes/versions/restore — restore a version snapshot into the resume
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const { versionId } = body ?? {}
  if (!versionId) return NextResponse.json({ error: "versionId required" }, { status: 400 })

  const version = await db.resumeVersion.findFirst({
    where: { id: versionId },
    include: { resume: { select: { userId: true } } },
  })

  if (!version || version.resume.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Validate snapshot against schema before writing back to DB
  const parsed = snapshotSchema.safeParse(version.snapshot)
  if (!parsed.success) {
    return NextResponse.json({ error: "Snapshot data is corrupted and cannot be restored" }, { status: 422 })
  }

  const snap = parsed.data

  await db.resume.update({
    where: { id: version.resumeId },
    data: {
      ...(snap.title       !== undefined ? { title: snap.title }                                        : {}),
      ...(snap.sections    !== undefined ? { sections: snap.sections as object[] }                      : {}),
      ...(snap.sectionData !== undefined ? { personalDetails: snap.sectionData as object }              : {}),
      ...(snap.config?.templateId    !== undefined ? { templateId: snap.config.templateId }             : {}),
      ...(snap.config?.colorScheme   !== undefined ? { colorScheme: snap.config.colorScheme }           : {}),
      ...(snap.config?.fontFamily    !== undefined ? { fontFamily: snap.config.fontFamily }             : {}),
      ...(snap.config?.fontSize      !== undefined ? { fontSize: snap.config.fontSize }                 : {}),
      ...(snap.config?.spacing       !== undefined ? { spacing: snap.config.spacing }                   : {}),
      ...(snap.config?.photoUrl      !== undefined ? { photoUrl: snap.config.photoUrl ?? null }         : {}),
      ...(snap.config?.photoPosition !== undefined ? { photoPosition: snap.config.photoPosition }       : {}),
      ...(snap.config?.language      !== undefined ? { language: snap.config.language }                 : {}),
    },
  })

  return NextResponse.json({ success: true, resumeId: version.resumeId })
}
