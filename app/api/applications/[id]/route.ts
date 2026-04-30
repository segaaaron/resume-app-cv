import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { checkOrigin } from "@/lib/csrf"

type Params = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  status:     z.enum(["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"]).optional(),
  notes:      z.string().max(5000).optional(),
  url:        z.string().url().optional().or(z.literal("")),
  salary:     z.string().max(100).optional(),
  appliedAt:  z.string().datetime().optional(),
  followUpAt: z.string().datetime().optional().nullable(),
})

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 422 })
  }

  const existing = await db.application.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.application.update({
    where: { id },
    data: {
      status:     parsed.data.status ?? undefined,
      notes:      parsed.data.notes ?? undefined,
      url:        parsed.data.url ?? undefined,
      salary:     parsed.data.salary ?? undefined,
      appliedAt:  parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : undefined,
      followUpAt: parsed.data.followUpAt === null ? null
                : parsed.data.followUpAt ? new Date(parsed.data.followUpAt)
                : undefined,
      // Reset reminderSentAt when followUpAt changes so reminder fires again
      ...(parsed.data.followUpAt !== undefined ? { reminderSentAt: null } : {}),
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const existing = await db.application.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.application.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
