import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { DEFAULT_SECTIONS, ResumeSectionsSchema } from "@/types/resume"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const resumes = await db.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      templateId: true,
      colorScheme: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json(resumes)
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const defaultData = ResumeSectionsSchema.parse({})

  const resume = await db.resume.create({
    data: {
      userId: session.user.id,
      title: "Mi CV",
      sections: DEFAULT_SECTIONS as object[],
      personalDetails: defaultData as object,
    },
  })

  return NextResponse.json(resume, { status: 201 })
}
