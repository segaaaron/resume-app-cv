import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { DEFAULT_SECTIONS, ResumeSectionsSchema } from "@/types/resume"
import { getLimits } from "@/lib/plans"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100)
  const cursor = searchParams.get("cursor") ?? undefined

  const resumes = await db.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      title: true,
      templateId: true,
      colorScheme: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  const nextCursor = resumes.length === limit ? resumes[resumes.length - 1].id : null
  return NextResponse.json({ data: resumes, nextCursor })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Plan limit check
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true } })
  const limits = getLimits(user?.plan ?? "FREE")
  if (limits.maxResumes !== Infinity) {
    const count = await db.resume.count({ where: { userId: session.user.id } })
    if (count >= limits.maxResumes) {
      return NextResponse.json(
        { error: `Tu plan permite máximo ${limits.maxResumes} CV(s). Actualiza a Pro para crear más.` },
        { status: 403 }
      )
    }
  }

  let templateId: string | undefined
  try {
    const body = await request.json()
    if (body?.templateId) templateId = body.templateId
  } catch {}

  const defaultData = ResumeSectionsSchema.parse({})

  const resume = await db.resume.create({
    data: {
      userId: session.user.id,
      title: "Mi CV",
      sections: DEFAULT_SECTIONS as object[],
      personalDetails: defaultData as object,
      ...(templateId ? { templateId } : {}),
    },
  })

  return NextResponse.json(resume, { status: 201 })
}
