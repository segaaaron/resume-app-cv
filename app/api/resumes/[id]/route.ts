import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

type Params = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  sections:    z.array(z.any()).optional(),
  sectionData: z.any().optional(),
  config: z.object({
    templateId:  z.string().optional(),
    colorScheme: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    fontFamily:  z.string().max(100).optional(),
    fontSize:    z.number().int().min(8).max(24).optional(),
    spacing:     z.number().min(0.5).max(3).optional(),
    photoUrl:      z.string().refine(
      (v) => v.startsWith("data:image/") || /^https?:\/\//.test(v),
      "Invalid photo URL"
    ).nullable().optional(),
    photoPosition: z.number().int().min(0).max(100).optional(),
    language:      z.enum(["es", "en"]).optional(),
  }).optional(),
})

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

  const { title, sections, sectionData, config } = parsed.data

  const existing = await db.resume.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.resume.update({
    where: { id },
    data: {
      title:           title ?? undefined,
      sections:        sections ? (sections as object[]) : undefined,
      personalDetails: sectionData ? (sectionData as object) : undefined,
      templateId:      config?.templateId ?? undefined,
      colorScheme:     config?.colorScheme ?? undefined,
      fontFamily:      config?.fontFamily ?? undefined,
      fontSize:        config?.fontSize ?? undefined,
      spacing:         config?.spacing ?? undefined,
      photoUrl:        config?.photoUrl !== undefined ? config.photoUrl : undefined,
      photoPosition:   config?.photoPosition ?? undefined,
      language:        config?.language ?? undefined,
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await db.resume.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.resume.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
