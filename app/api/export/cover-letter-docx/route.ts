import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isActive, isSuperAdmin } from "@/lib/plans"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from "docx"

function stripHtml(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").trim()
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true },
  })

  const isPro = isSuperAdmin(user?.role) || isActive(
    user?.plan ?? "UNSUBSCRIBED",
    user?.subscriptionEndsAt ?? null,
    user?.subscriptionStatus ?? null,
  )
  if (!isPro) return NextResponse.json({ error: "Pro plan required" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const letter = await db.coverLetter.findFirst({ where: { id, userId: session.user.id } })
  if (!letter) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const c = (letter.content as Record<string, string>) ?? {}

  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  const paragraphs: Paragraph[] = []

  // ── Candidate name + title ────────────────────────────────────────────────
  if (c.candidateName) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: c.candidateName, bold: true, size: 28 })],
        alignment: AlignmentType.LEFT,
        spacing: { after: 40 },
      })
    )
  }
  if (c.candidateJobTitle) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: c.candidateJobTitle, size: 20, color: "555555" })],
        spacing: { after: 80 },
      })
    )
  }

  // ── Contact line ──────────────────────────────────────────────────────────
  const contactParts = [c.candidateEmail, c.candidatePhone, c.candidateAddress, c.candidateLinkedin, c.candidateWebsite].filter(Boolean)
  if (contactParts.length) {
    paragraphs.push(
      new Paragraph({
        children: contactParts.map((part, i) => [
          new TextRun({ text: part, size: 17 }),
          i < contactParts.length - 1 ? new TextRun({ text: "  |  ", size: 17, color: "888888" }) : null,
        ]).flat().filter(Boolean) as TextRun[],
        spacing: { after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } },
      })
    )
  }

  // ── Date ──────────────────────────────────────────────────────────────────
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: today, size: 18, color: "888888" })],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 200 },
    })
  )

  // ── Recipient ─────────────────────────────────────────────────────────────
  if (c.recipientName || c.recipientTitle || c.company) {
    if (c.recipientName) paragraphs.push(new Paragraph({ children: [new TextRun({ text: c.recipientName, bold: true, size: 22 })], spacing: { after: 40 } }))
    if (c.recipientTitle) paragraphs.push(new Paragraph({ children: [new TextRun({ text: c.recipientTitle, size: 20, color: "555555" })], spacing: { after: 40 } }))
    if (c.company) paragraphs.push(new Paragraph({ children: [new TextRun({ text: c.company, size: 20, color: "555555" })], spacing: { after: 120 } }))
  }

  // ── Subject ───────────────────────────────────────────────────────────────
  if (c.subject) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Asunto: ", bold: true, size: 22 }),
          new TextRun({ text: c.subject, size: 22 }),
        ],
        spacing: { after: 160 },
      })
    )
  }

  // ── Salutation ────────────────────────────────────────────────────────────
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: c.recipientName ? `Estimado/a ${c.recipientName}:` : "Estimado/a responsable de selección:", size: 22 })],
      spacing: { after: 160 },
    })
  )

  // ── Body ──────────────────────────────────────────────────────────────────
  if (c.body) {
    const plainBody = stripHtml(c.body)
    for (const para of plainBody.split(/\n\n+/).filter(Boolean)) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: para.replace(/\n/g, " ").trim(), size: 22 })],
          alignment: AlignmentType.BOTH,
          indent: { firstLine: convertInchesToTwip(0.2) },
          spacing: { after: 160 },
        })
      )
    }
  }

  // ── Closing ───────────────────────────────────────────────────────────────
  if (c.closing) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: `${c.closing},`, size: 22 })],
        spacing: { after: 400 },
      })
    )
  }

  // ── Signature ─────────────────────────────────────────────────────────────
  if (c.candidateName) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: c.candidateName, bold: true, size: 22 })], spacing: { after: 40 } }))
  }
  if (c.candidateJobTitle) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: c.candidateJobTitle, size: 20, color: "777777" })] }))
  }

  // ── Build document ────────────────────────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.1),
            right: convertInchesToTwip(1.1),
          },
        },
      },
      children: paragraphs,
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  const filename = `${(letter.title || "carta").replace(/[^a-z0-9]/gi, "_")}.docx`
  const uint8 = new Uint8Array(buffer)

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
