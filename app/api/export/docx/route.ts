import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isActive } from "@/lib/plans"
import { checkAndIncrementRateLimit, PDF_RATE_LIMIT_WINDOW_MS } from "@/lib/rate-limit"
import { claimManagedDownload, refundManagedDownload } from "@/lib/services/downloads/managed-quota"

const DOWNLOAD_DAILY_LIMIT = 15
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  convertInchesToTwip,
} from "docx"
import { ResumeSectionsSchema } from "@/types/resume"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true,
      isManaged: true, managedBlocked: true, managedExpiresAt: true,
      managedDownloadLimit: true, managedDownloadsUsed: true,
    },
  })

  if (!isActive(
    user?.plan ?? "UNSUBSCRIBED",
    user?.subscriptionEndsAt,
    user?.subscriptionStatus,
    user?.role,
    user?.isManaged,
    user?.managedBlocked,
    user?.managedExpiresAt,
  )) {
    db.auditLog.create({
      data: { userId: session.user.id, action: "FREE_DOWNLOAD_BLOCKED", metadata: { type: "docx" } },
    }).catch(() => undefined)
    return NextResponse.json({ error: "subscription_required" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Separate rate-limit bucket from PDF exports (15 DOCX/day per user,
  // independent of PDF quota). This bucket is shared with cover-letter DOCX.
  // Counter applies before managed-claim so rate-limited requests don't
  // consume managedDownloadLimit slots.
  const allowed = await checkAndIncrementRateLimit(session.user.id, "download-export", DOWNLOAD_DAILY_LIMIT, PDF_RATE_LIMIT_WINDOW_MS)
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Maximum 15 exports per day.", code: "RATE_LIMIT_EXCEEDED" }, { status: 429 })
  }

  const claim = await claimManagedDownload(session.user.id, {
    isManaged: user?.isManaged ?? false,
    managedDownloadLimit: user?.managedDownloadLimit ?? null,
  })
  if (!claim.ok) return NextResponse.json({ error: claim.error }, { status: claim.status })
  const managedClaimed = claim.claimed

  const resume = await db.resume.findFirst({ where: { id, userId: session.user.id } })
  if (!resume) {
    if (managedClaimed) {
      await refundManagedDownload(session.user.id, { resumeId: id, type: "docx" })
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const data = ResumeSectionsSchema.parse((resume.personalDetails as object) ?? {})
  const pd = data.personalDetails
  const lang = (resume.language as string) === "en" ? "en" : "es"

  const SECTION_LABELS: Record<string, Record<"es" | "en", string>> = {
    summary: { es: "Perfil Profesional", en: "Professional Summary" },
    workExperience: { es: "Experiencia Laboral", en: "Work Experience" },
    education: { es: "Educación", en: "Education" },
    skills: { es: "Habilidades", en: "Skills" },
    languages: { es: "Idiomas", en: "Languages" },
    certifications: { es: "Certificaciones", en: "Certifications" },
    projects: { es: "Proyectos", en: "Projects" },
  }

  const LEVEL_LABELS: Record<"es" | "en", Record<string, string>> = {
    es: { elementary: "Básico", limited: "Limitado", professional: "Profesional", full_professional: "Avanzado", native: "Nativo" },
    en: { elementary: "Basic", limited: "Limited", professional: "Professional", full_professional: "Advanced", native: "Native" },
  }

  const label = (key: string) => SECTION_LABELS[key]?.[lang] ?? key
  const levelLabel = (level: string) => LEVEL_LABELS[lang][level] ?? level
  const presentLabel = lang === "en" ? "Present" : "Presente"

  const paragraphs: Paragraph[] = []

  // ── Name ──────────────────────────────────────────────────────────────────
  paragraphs.push(
    new Paragraph({
      text: `${pd.firstName} ${pd.lastName}`.trim() || "Nombre",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    })
  )

  // ── Job title ─────────────────────────────────────────────────────────────
  if (pd.jobTitle) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: pd.jobTitle, size: 22, color: "555555" })],
        spacing: { after: 80 },
      })
    )
  }

  // ── Contact line ──────────────────────────────────────────────────────────
  const contactParts = [pd.email, pd.phone, pd.city, pd.country, pd.linkedin, pd.website].filter(Boolean)
  if (contactParts.length) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: contactParts.map((part, i) => [
          new TextRun({ text: part, size: 18 }),
          i < contactParts.length - 1 ? new TextRun({ text: "  |  ", size: 18, color: "888888" }) : null,
        ]).flat().filter(Boolean) as TextRun[],
        spacing: { after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } },
      })
    )
  }

  // ── Helper: section heading ───────────────────────────────────────────────
  function sectionHeading(label: string) {
    return new Paragraph({
      children: [new TextRun({ text: label.toUpperCase(), bold: true, size: 20, color: "1a1a1a" })],
      spacing: { before: 240, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "4F46E5" } },
    })
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  if (data.summary) {
    paragraphs.push(sectionHeading(label("summary")))
    paragraphs.push(
      new Paragraph({ text: data.summary, spacing: { after: 120 } })
    )
  }

  // ── Work Experience ───────────────────────────────────────────────────────
  if (data.workExperience?.length) {
    paragraphs.push(sectionHeading(label("workExperience")))
    for (const job of data.workExperience) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: job.jobTitle || "", bold: true, size: 22 }),
            new TextRun({ text: job.employer ? `  ·  ${job.employer}` : "", size: 22, color: "555555" }),
          ],
          spacing: { before: 120, after: 40 },
        })
      )
      const dateStr = [job.startDate, job.currentlyWorking ? presentLabel : job.endDate].filter(Boolean).join(" – ")
      if (dateStr || job.city) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: [dateStr, job.city].filter(Boolean).join("  ·  "), size: 18, color: "777777", italics: true })],
            spacing: { after: 60 },
          })
        )
      }
      if (job.description) {
        for (const line of job.description.split("\n").filter(Boolean)) {
          paragraphs.push(new Paragraph({ text: line, bullet: { level: 0 }, spacing: { after: 40 } }))
        }
      }
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────
  if (data.education?.length) {
    paragraphs.push(sectionHeading(label("education")))
    for (const edu of data.education) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree || "", bold: true, size: 22 }),
            new TextRun({ text: edu.institution ? `  ·  ${edu.institution}` : "", size: 22, color: "555555" }),
          ],
          spacing: { before: 120, after: 40 },
        })
      )
      const dateStr = [edu.startDate, edu.currentlyStudying ? presentLabel : edu.endDate].filter(Boolean).join(" – ")
      if (dateStr) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: dateStr, size: 18, color: "777777", italics: true })],
            spacing: { after: 60 },
          })
        )
      }
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  if (data.skills?.length) {
    paragraphs.push(sectionHeading(label("skills")))
    const skillNames = data.skills.map((s) => s.name).filter(Boolean).join("   ·   ")
    paragraphs.push(new Paragraph({ text: skillNames, spacing: { after: 120 } }))
  }

  // ── Languages ─────────────────────────────────────────────────────────────
  if (data.languages?.length) {
    paragraphs.push(sectionHeading(label("languages")))
    for (const langEntry of data.languages) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: langEntry.name, bold: true }),
            new TextRun({ text: `  —  ${levelLabel(langEntry.level)}`, color: "555555" }),
          ],
          bullet: { level: 0 },
          spacing: { after: 40 },
        })
      )
    }
  }

  // ── Certifications ────────────────────────────────────────────────────────
  if (data.certifications?.length) {
    paragraphs.push(sectionHeading(label("certifications")))
    for (const cert of data.certifications) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: cert.name, bold: true }),
            cert.issuer ? new TextRun({ text: `  ·  ${cert.issuer}`, color: "555555" }) : null,
            cert.date ? new TextRun({ text: `  (${cert.date})`, color: "777777", italics: true }) : null,
          ].filter(Boolean) as TextRun[],
          bullet: { level: 0 },
          spacing: { after: 40 },
        })
      )
    }
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if (data.projects?.length) {
    paragraphs.push(sectionHeading(label("projects")))
    for (const proj of data.projects) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: proj.name, bold: true, size: 22 })],
          spacing: { before: 100, after: 40 },
        })
      )
      if (proj.description) {
        for (const line of proj.description.split("\n").filter(Boolean)) {
          paragraphs.push(new Paragraph({ text: line, bullet: { level: 0 }, spacing: { after: 40 } }))
        }
      }
    }
  }

  // ── Build document ────────────────────────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.8),
            bottom: convertInchesToTwip(0.8),
            left: convertInchesToTwip(0.9),
            right: convertInchesToTwip(0.9),
          },
        },
      },
      children: paragraphs,
    }],
  })

  try {
    const buffer = await Packer.toBuffer(doc)
    const filename = encodeURIComponent(resume.title || "resume")

    // Convert Node Buffer to Uint8Array for compatibility with NextResponse BodyInit
    const uint8 = new Uint8Array(buffer)

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}.docx`,
      },
    })
  } catch (err) {
    if (managedClaimed) {
      await refundManagedDownload(session.user.id, { resumeId: id, type: "docx" })
    }
    void err
    return NextResponse.json({ error: "DOCX render failed" }, { status: 500 })
  }
}
