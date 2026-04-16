import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { nanoid } from "nanoid"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const original = await db.resume.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const copy = await db.resume.create({
    data: {
      userId: session.user.id,
      title: `${original.title} (copia)`,
      templateId: original.templateId,
      colorScheme: original.colorScheme,
      fontFamily: original.fontFamily,
      fontSize: original.fontSize,
      spacing: original.spacing,
      sections: original.sections ?? undefined,
      personalDetails: original.personalDetails ?? undefined,
      photoUrl: original.photoUrl,
      language: original.language,
    },
  })

  return NextResponse.json(copy, { status: 201 })
}
