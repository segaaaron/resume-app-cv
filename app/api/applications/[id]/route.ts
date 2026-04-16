import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  await db.application.updateMany({
    where: { id, userId: session.user.id },
    data: {
      status: body.status ?? undefined,
      notes: body.notes ?? undefined,
      url: body.url ?? undefined,
      salary: body.salary ?? undefined,
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.application.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ success: true })
}
