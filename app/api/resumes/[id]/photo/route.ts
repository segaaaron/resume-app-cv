import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"

type Params = { params: Promise<{ id: string }> }

// Upload photo — stores as base64 data URL directly in photoUrl field
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const formData = await req.formData()
  const file = formData.get("photo") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Solo se permiten imágenes JPEG, PNG, WebP o GIF" }, { status: 400 })
  }

  // Limit: 300 KB — compressImage client-side reduce a ~40-80KB a 600px/88%; límite es red de seguridad
  if (file.size > 300 * 1024) {
    return NextResponse.json({ error: "La imagen no puede superar 300 KB" }, { status: 400 })
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo" }, { status: 400 })
  }

  // Magic-byte validation
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38
  if (!isPng && !isJpeg && !isWebp && !isGif) {
    return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
  }

  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

  const existing = await db.resume.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.resume.update({
    where: { id },
    data: { photoUrl: base64 },
  })

  return NextResponse.json({ photoUrl: base64 })
}

// Delete photo
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!checkOrigin(_req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const existing = await db.resume.findFirst({ where: { id, userId: session.user.id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.resume.update({
    where: { id },
    data: { photoUrl: null },
  })

  return NextResponse.json({ success: true })
}
