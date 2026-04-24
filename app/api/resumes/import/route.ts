import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { buildSections, ResumeSectionsSchema } from "@/types/resume"
import { getLimits, isSuperAdmin } from "@/lib/plans"
import mammoth from "mammoth"
import { parseResumeText, detectLanguage } from "@/lib/parseResumeText"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer) => Promise<{ text: string; numpages: number }> = require("pdf-parse")

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true, role: true } })
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!isSuperAdmin(dbUser.role) && !getLimits(dbUser.plan).canImport) {
    return NextResponse.json({ error: "Upgrade your plan to import resumes" }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const ALLOWED_MIME = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ]
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (!["pdf", "docx", "doc"].includes(ext ?? "") || !ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Formato no soportado. Usa PDF o DOCX." }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "El archivo no puede superar 5 MB" }, { status: 400 })
  }

  // Validate magic bytes: PDF starts with %PDF, DOCX/DOC starts with PK (ZIP)
  const header = Buffer.from(await file.slice(0, 4).arrayBuffer())
  const isPdf  = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46
  const isZip  = header[0] === 0x50 && header[1] === 0x4b
  if (!isPdf && !isZip) {
    return NextResponse.json({ error: "Formato no soportado. Usa PDF o DOCX." }, { status: 400 })
  }

  // ── 1. Extract raw text ──────────────────────────────────────────────────
  let rawText = ""
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    if (ext === "pdf") {
      const data = await pdfParse(buffer)
      rawText = data.text
    } else {
      const result = await mammoth.extractRawText({ buffer })
      rawText = result.value
    }
  } catch (err) {
    console.error("[import] text extraction failed:", err)
    return NextResponse.json({ error: "No se pudo leer el archivo. Asegúrate de que no esté protegido con contraseña." }, { status: 422 })
  }

  if (!rawText.trim()) {
    return NextResponse.json({ error: "El archivo está vacío o no tiene texto legible" }, { status: 422 })
  }

  // ── 2. Detect language ───────────────────────────────────────────────────
  const lang = detectLanguage(rawText.slice(0, 14000))

  // ── 3. Parse with heuristic extractor ───────────────────────────────────
  const extracted = parseResumeText(rawText.slice(0, 14000))

  // ── 4. Validate and fill defaults ────────────────────────────────────────
  const sectionData = ResumeSectionsSchema.parse(extracted)

  // ── 5. Build sections with correct language labels ────────────────────────
  const hasData: Record<string, boolean> = {
    certifications: (sectionData.certifications?.length ?? 0) > 0,
    projects:       (sectionData.projects?.length ?? 0) > 0,
    volunteer:      (sectionData.volunteer?.length ?? 0) > 0,
    references:     (sectionData.references?.length ?? 0) > 0,
    hobbies:        !!sectionData.hobbies,
  }

  const sections = buildSections(lang).map((s) =>
    hasData[s.id] ? { ...s, visible: true } : s
  )

  // ── 6. Save to DB ─────────────────────────────────────────────────────────
  const pd = sectionData.personalDetails
  const name = [pd.firstName, pd.lastName].filter(Boolean).join(" ")
  const title = name
    ? (lang === "en" ? `${name}'s Resume` : `CV de ${name}`)
    : `CV importado — ${file.name}`

  const resume = await db.resume.create({
    data: {
      userId: session.user.id,
      title,
      sections: sections as object[],
      personalDetails: sectionData as object,
      language: lang,
    },
  })

  return NextResponse.json({ id: resume.id }, { status: 201 })
}
