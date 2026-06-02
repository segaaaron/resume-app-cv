import { NextResponse, type NextRequest } from "next/server"
import { createHash, randomBytes } from "crypto"
import { z } from "zod"
import { db } from "@/lib/db"
import { analyzeAts } from "@/lib/ats/analyzer"
import { extractTextFromPDF } from "@/lib/ats/pdf-parser"
import { checkAtsRateLimit } from "@/lib/ats/store"
import { checkOrigin } from "@/lib/csrf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_PDF_BYTES = 5 * 1024 * 1024 // 5 MB
const MIN_JD_LEN = 50
const MAX_JD_LEN = 10000

const fieldsSchema = z.object({
  jobDescription: z.string().min(MIN_JD_LEN).max(MAX_JD_LEN),
  locale: z.enum(["en", "es"]),
  sessionId: z.string().min(8).max(64).optional(),
})

function hashIp(ip: string): string {
  return createHash("sha256").update(ip + (process.env.AUTH_SECRET ?? "")).digest("hex").slice(0, 32)
}

function hashShort(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 32)
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  const real = req.headers.get("x-real-ip")
  if (real) return real.trim()
  return "unknown"
}

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // -------------------- rate limit (per IP) --------------------
  const ip = getClientIp(req)
  const ipHash = hashIp(ip)
  const rl = checkAtsRateLimit(ipHash)
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many checks from your IP. Try again in an hour.",
        resetAt: rl.resetAt,
      },
      { status: 429 },
    )
  }

  // -------------------- parse multipart --------------------
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 })
  }

  const file = form.get("resume")
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "missing_resume" }, { status: 400 })
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "file_too_large", maxBytes: MAX_PDF_BYTES }, { status: 413 })
  }
  if (file.type && !file.type.includes("pdf")) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 415 })
  }

  const fields = {
    jobDescription: form.get("jobDescription"),
    locale: form.get("locale"),
    sessionId: form.get("sessionId"),
  }
  const parsed = fieldsSchema.safeParse({
    jobDescription: typeof fields.jobDescription === "string" ? fields.jobDescription : "",
    locale: typeof fields.locale === "string" ? fields.locale : "",
    sessionId: typeof fields.sessionId === "string" ? fields.sessionId : undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_data", details: parsed.error.flatten() }, { status: 422 })
  }
  const { jobDescription, locale } = parsed.data
  const sessionId = parsed.data.sessionId ?? randomBytes(16).toString("hex")

  // -------------------- extract PDF --------------------
  let resumeText: string
  try {
    const buf = Buffer.from(await file.arrayBuffer())
    const extracted = await extractTextFromPDF(buf)
    if (!extracted.hasExtractableText) {
      return NextResponse.json(
        {
          error: "pdf_not_extractable",
          message:
            locale === "es"
              ? "No se pudo extraer texto del PDF. Asegúrate de que no sea una imagen escaneada."
              : "Could not extract text from the PDF. Make sure it is not a scanned image.",
        },
        { status: 422 },
      )
    }
    resumeText = extracted.text
  } catch (err) {
    console.error("[ats-check] pdf parse error", err)
    return NextResponse.json({ error: "pdf_parse_failed" }, { status: 500 })
  }

  // -------------------- analyze --------------------
  const result = analyzeAts({ resumeText, jobDescription, locale })

  // -------------------- persist (best-effort, anonymous analytics) --------------------
  try {
    await db.atsCheck.create({
      data: {
        sessionId,
        scoreOverall: result.scoreOverall,
        scoreKeywords: result.breakdown.keywords.score,
        scoreFormat: result.breakdown.format.score,
        scoreSections: result.breakdown.sections.score,
        scoreLength: result.breakdown.length.score,
        scoreContact: result.breakdown.contact.score,
        locale,
        country: req.headers.get("x-vercel-ip-country") ?? null,
        userAgent: (req.headers.get("user-agent") ?? "").slice(0, 500),
        jdHash: hashShort(jobDescription),
        resumeHash: hashShort(resumeText),
        ip: ipHash,
      },
    })
  } catch (err) {
    // do not block UX if DB is unavailable
    console.error("[ats-check] db insert failed", err)
  }

  // -------------------- response (FULL result, no email gate) --------------------
  return NextResponse.json(
    {
      sessionId,
      scoreOverall: result.scoreOverall,
      breakdown: result.breakdown,
      allMissingKeywords: result.full.allMissingKeywords,
      allQuickWins: result.full.allQuickWins,
      detailedSuggestions: result.full.detailedSuggestions,
      upgradePath: result.full.upgradePath,
      rateLimit: { remaining: rl.remaining, resetAt: rl.resetAt },
    },
    { status: 200 },
  )
}
