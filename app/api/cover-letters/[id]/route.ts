import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

type Params = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  title:       z.string().max(200).optional(),
  content:     z.any().optional(),
  colorScheme: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fontFamily:  z.string().max(100).optional(),
  templateId:  z.string().max(50).optional(),
})

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
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    let parsed: ReturnType<typeof patchSchema.safeParse>
    try {
      parsed = patchSchema.safeParse(body)
    } catch (err) {
      console.error("[cover-letters PATCH] Zod parse error", err)
      return NextResponse.json({ error: "Validation error" }, { status: 422 })
    }

    if (!parsed.success) {
      console.error("[cover-letters PATCH] Invalid data", parsed.error)
      return NextResponse.json({ error: "Invalid data" }, { status: 422 })
    }

    const existing = await db.coverLetter.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await db.coverLetter.update({
      where: { id },
      data: {
        title:       parsed.data.title ?? undefined,
        content:     parsed.data.content ? (parsed.data.content as object) : undefined,
        colorScheme: parsed.data.colorScheme ?? undefined,
        fontFamily:  parsed.data.fontFamily ?? undefined,
        templateId:  parsed.data.templateId ?? undefined,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[cover-letters PATCH] Unhandled error", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await db.coverLetter.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.coverLetter.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
