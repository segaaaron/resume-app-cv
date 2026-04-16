import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

type Params = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  status:    z.enum(["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"]).optional(),
  notes:     z.string().max(5000).optional(),
  url:       z.string().url().optional().or(z.literal("")),
  salary:    z.string().max(100).optional(),
  appliedAt: z.string().datetime().optional(),
})

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 422 })
  }

  const existing = await db.application.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.application.update({
    where: { id },
    data: {
      status:    parsed.data.status ?? undefined,
      notes:     parsed.data.notes ?? undefined,
      url:       parsed.data.url ?? undefined,
      salary:    parsed.data.salary ?? undefined,
      appliedAt: parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : undefined,
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await db.application.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.application.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
