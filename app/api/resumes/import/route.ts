import { NextResponse } from "next/server"
import { apiError } from "@/lib/controllers/shared"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"
import { buildSections, ResumeSectionsSchema, type ResumeSections, DEFAULT_TEMPLATE_ID } from "@/types/resume"
import { getImportQuota, isSuperAdmin, effectivePlan } from "@/lib/plans"
import { checkAndIncrementRateLimit } from "@/lib/rate-limit"
import { aiService } from "@/lib/controllers/ai-deps"
import { createLogger } from "@/lib/logger"
import mammoth from "mammoth"
import { parseResumeText, detectLanguage, PARSE_LIMITS } from "@/lib/parseResumeText"
import { extractPdfText } from "@/lib/resume-parser/extract-pdf"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer) => Promise<{ text: string; numpages: number }> = require("pdf-parse")

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("pdf_parse_timeout")), ms)
    ),
  ])
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return apiError(401, "Unauthorized", { req })

  if (!checkOrigin(req)) return apiError(403, "Forbidden", { req })

  const dbUser = await db.user.findUnique({ where: { id: session.user.id }, select: { plan: true, role: true, subscriptionEndsAt: true } })
  if (!dbUser) return apiError(401, "Unauthorized", { req })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return apiError(400, "No file provided", { req })

  const ALLOWED_MIME = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ]
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (!["pdf", "docx", "doc"].includes(ext ?? "") || !ALLOWED_MIME.includes(file.type)) {
    return apiError(400, "Formato no soportado. Usa PDF o DOCX.", { req })
  }

  if (file.size > 5 * 1024 * 1024) {
    return apiError(400, "El archivo no puede superar 5 MB", { req })
  }

  // Validate magic bytes: PDF starts with %PDF, DOCX/DOC starts with PK (ZIP)
  const header = Buffer.from(await file.slice(0, 4).arrayBuffer())
  const isPdf  = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46
  const isZip  = header[0] === 0x50 && header[1] === 0x4b
  if (!isPdf && !isZip) {
    return apiError(400, "Formato no soportado. Usa PDF o DOCX.", { req })
  }

  // ── Anti-abuse import quota (per plan, rolling window) ────────────────────
  // Checked AFTER cheap validations so a wrong-format upload never burns a slot,
  // and BEFORE the expensive extraction + LLM call so an exhausted user pays no
  // compute. Every plan can import (free = conversion hook); the window bounds it.
  if (!isSuperAdmin(dbUser.role)) {
    const quota = getImportQuota(effectivePlan(dbUser))
    // limit 0 = the plan can't import at all (UNSUBSCRIBED): a hard plan gate, not
    // a "come back later" quota. Surface it as upgrade-required, before any compute.
    if (quota.limit === 0) {
      return NextResponse.json(
        { error: "import_requires_upgrade", message: "La importación de CV no está disponible en tu plan. Mejora tu plan para importar." },
        { status: 403 },
      )
    }
    const allowed = await checkAndIncrementRateLimit(session.user.id, "import-cv", quota.limit, quota.windowMs)
    if (!allowed) {
      return NextResponse.json(
        {
          error: "import_quota_reached",
          message: "Alcanzaste tu límite de importaciones para este período. Inténtalo más tarde o mejora tu plan.",
        },
        { status: 429 },
      )
    }
  }

  // ── 1. Extract raw text ──────────────────────────────────────────────────
  let rawText = ""
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    if (ext === "pdf") {
      // Extracción posicional (columnas + celdas) — fallback a pdf-parse plano
      try {
        const data = await withTimeout(extractPdfText(buffer), 10_000)
        rawText = data.text
      } catch {
        const data = await withTimeout(pdfParse(buffer), 10_000)
        rawText = data.text
      }
    } else {
      const result = await withTimeout(mammoth.extractRawText({ buffer }), 10_000)
      rawText = result.value
    }
  } catch (err) {
    const msg = err instanceof Error && err.message === "pdf_parse_timeout"
      ? "El archivo tardó demasiado en procesarse."
      : "No se pudo leer el archivo. Asegúrate de que no esté protegido con contraseña."
    return apiError(422, String(msg), { req })
  }

  // Strip null bytes — some PDFs embed them; PostgreSQL rejects 0x00 in UTF-8 columns
  rawText = rawText.replace(/\x00/g, "")

  if (!rawText.trim()) {
    return apiError(422, "El archivo está vacío o no tiene texto legible", { req })
  }

  // ── 2. Detect language ───────────────────────────────────────────────────
  const lang = detectLanguage(rawText.slice(0, 14000))
  const truncated = rawText.length > PARSE_LIMITS.rawTextChars

  // ── 3. Extract structured data — AI-primary, deterministic fallback ───────
  // The grounded LLM extractor reads the layout-reconstructed text and returns
  // validated ResumeSections. It NEVER invents (every entity is verified against
  // the source). If it returns null (not a resume, model/parse error) we fall
  // back to the heuristic parser — so import always works, zero regression.
  let sectionData: ResumeSections | null = null
  try {
    // Bound the AI step to 25s (tighter than the SDK's 60s×retries) so a slow
    // provider falls back to the deterministic parser fast instead of hanging
    // the upload — consistent with the 10s timeouts on the extraction steps above.
    sectionData = await withTimeout(
      aiService.importResume(session.user.id, { rawText, language: lang }, effectivePlan(dbUser)),
      25_000,
    )
  } catch (err) {
    createLogger("import").warn("[import] AI extraction failed, falling back", {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  // ── 4. Fallback + validate/fill defaults ─────────────────────────────────
  if (!sectionData) {
    // The import still succeeds, but with the weaker heuristic parser — the user
    // gets a worse extraction and never knows. The throw path above was logged
    // and this one was not, so a model returning "nothing usable" (the common
    // case: not-a-resume detection, or a parse the schema rejected) degraded
    // every import in silence, with no way to see how often it happens.
    createLogger("import").warn("[import] AI extraction returned nothing, using heuristic parser", {
      language: lang,
      rawTextChars: rawText.length,
      truncated,
    })
    const extracted = parseResumeText(rawText.slice(0, PARSE_LIMITS.rawTextChars))
    sectionData = ResumeSectionsSchema.parse(extracted)
  }

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
      templateId: DEFAULT_TEMPLATE_ID,
    },
  })

  return NextResponse.json({ id: resume.id, truncated }, { status: 201 })
}
