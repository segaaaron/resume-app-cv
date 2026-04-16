import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const letter = await db.coverLetter.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!letter) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(letter)
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, content, colorScheme, fontFamily } = body

  const result = await db.coverLetter.updateMany({
    where: { id, userId: session.user.id },
    data: {
      title: title ?? undefined,
      content: content ?? undefined,
      colorScheme: colorScheme ?? undefined,
      fontFamily: fontFamily ?? undefined,
    },
  })

  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.coverLetter.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ success: true })
}
