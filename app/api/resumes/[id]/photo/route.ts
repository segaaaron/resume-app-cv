import { NextResponse } from "next/server"
import sharp from "sharp"
import { requireAuth, handleError } from "@/lib/controllers/shared"
import { resumeService } from "@/lib/controllers/resume-deps"

type Params = { params: Promise<{ id: string }> }

// Upload photo — stores as base64 data URL directly in photoUrl field
export async function POST(req: Request, { params }: Params) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params

  const formData = await req.formData()
  const file = formData.get("photo") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Solo se permiten imágenes JPEG, PNG, WebP o GIF" }, { status: 400 })
  }

  // Limit: 300 KB
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
  const isPng  = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  const isGif  = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38
  if (!isPng && !isJpeg && !isWebp && !isGif) {
    return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
  }

  // Compress and normalise to WebP: max 400px wide, quality 82 — ~15-40 KB
  let compressed: Buffer
  try {
    compressed = await sharp(buffer)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la imagen" }, { status: 400 })
  }

  const base64 = `data:image/webp;base64,${compressed.toString("base64")}`

  try {
    const result = await resumeService.updatePhoto(authResult.userId, id, base64)
    return NextResponse.json(result)
  } catch (err) {
    return handleError(err, { req })
  }
}

// Delete photo
export async function DELETE(req: Request, { params }: Params) {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  const { id } = await params
  try {
    await resumeService.deletePhoto(authResult.userId, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, { req })
  }
}
