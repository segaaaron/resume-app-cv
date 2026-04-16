import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const resume = await db.resume.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(resume)
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, sections, sectionData, config } = body

  const resume = await db.resume.updateMany({
    where: { id, userId: session.user.id },
    data: {
      title,
      sections: sections ?? undefined,
      personalDetails: sectionData ?? undefined,
      templateId: config?.templateId ?? undefined,
      colorScheme: config?.colorScheme ?? undefined,
      fontFamily: config?.fontFamily ?? undefined,
      fontSize: config?.fontSize ?? undefined,
      spacing: config?.spacing ?? undefined,
      photoUrl: config?.photoUrl ?? undefined,
      language: config?.language ?? undefined,
    },
  })

  if (resume.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.resume.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ success: true })
}
