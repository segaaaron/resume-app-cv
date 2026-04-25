import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// POST /api/resumes/versions/restore — restore a version snapshot into the resume
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { versionId } = await req.json()
  if (!versionId) return NextResponse.json({ error: "versionId required" }, { status: 400 })

  const version = await db.resumeVersion.findFirst({
    where: { id: versionId },
    include: { resume: { select: { userId: true } } },
  })

  if (!version || version.resume.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const snap = version.snapshot as Record<string, unknown>

  await db.resume.update({
    where: { id: version.resumeId },
    data: {
      title:           (snap.title as string) ?? undefined,
      sections:        (snap.sections as object[]) ?? undefined,
      personalDetails: (snap.sectionData as object) ?? undefined,
      templateId:      (snap.config as Record<string, unknown>)?.templateId as string ?? undefined,
      colorScheme:     (snap.config as Record<string, unknown>)?.colorScheme as string ?? undefined,
      fontFamily:      (snap.config as Record<string, unknown>)?.fontFamily as string ?? undefined,
      fontSize:        (snap.config as Record<string, unknown>)?.fontSize as number ?? undefined,
      spacing:         (snap.config as Record<string, unknown>)?.spacing as number ?? undefined,
      photoUrl:        (snap.config as Record<string, unknown>)?.photoUrl as string ?? undefined,
      photoPosition:   (snap.config as Record<string, unknown>)?.photoPosition as number ?? undefined,
      language:        (snap.config as Record<string, unknown>)?.language as string ?? undefined,
    },
  })

  return NextResponse.json({ success: true, resumeId: version.resumeId })
}
