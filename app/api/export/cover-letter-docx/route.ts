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
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx"

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n")   // double newline so split(/\n\n+/) separates paragraphs
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim()
}

// Templates that render a full-width colored header block
const HEADER_TEMPLATES = new Set([
  "gradient", "material", "architect", "twotone", "elegant", "classic",
  "executive", "monogram", "diagonal", "timeline", "split", "sidebar",
])

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
const TABLE_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER }

// A4 width in twips (210mm). With 0 page margins the full width is the content area.
// Using DXA (twips) because PERCENTAGE is relative to the content area, which is 0 when margins are 0.
const A4_TWIPS = Math.round((210 / 25.4) * 1440) // 11906
const BODY_INDENT = convertInchesToTwip(1.1)

function makeTable(rows: TableRow[]): Table {
  return new Table({
    width: { size: A4_TWIPS, type: WidthType.DXA },
    columnWidths: [A4_TWIPS],
    borders: TABLE_BORDERS,
    rows,
  })
}

function makeCell(hex: string, children: Paragraph[], padV = 0.45, padH = 1.1): TableCell {
  return new TableCell({
    width: { size: A4_TWIPS, type: WidthType.DXA },
    shading: { fill: hex, type: ShadingType.SOLID, color: hex },
    margins: {
      top: convertInchesToTwip(padV),
      bottom: convertInchesToTwip(padV),
      left: convertInchesToTwip(padH),
      right: convertInchesToTwip(padH),
    },
    borders: TABLE_BORDERS,
    children,
  })
}

function buildHeaderTable(hex: string, c: Record<string, string>): Table {
  const contactParts = [c.candidateEmail, c.candidatePhone, c.candidateAddress, c.candidateLinkedin, c.candidateWebsite].filter(Boolean)

  const headerChildren: Paragraph[] = []

  if (c.candidateName) {
    headerChildren.push(
      new Paragraph({
        children: [new TextRun({ text: c.candidateName, bold: true, size: 44, color: "FFFFFF" })],
        spacing: { after: 80 },
      })
    )
  }

  if (c.candidateJobTitle) {
    headerChildren.push(
      new Paragraph({
        children: [new TextRun({ text: c.candidateJobTitle, size: 24, color: "D8E8FF" })],
        spacing: { after: contactParts.length ? 160 : 0 },
      })
    )
  }

  if (contactParts.length) {
    headerChildren.push(
      new Paragraph({
        children: contactParts.map((part, i) => [
          new TextRun({ text: part, size: 19, color: "C0D4F0" }),
          i < contactParts.length - 1 ? new TextRun({ text: "   ·   ", size: 19, color: "8AAAD0" }) : null,
        ]).flat().filter(Boolean) as TextRun[],
      })
    )
  }

  return makeTable([new TableRow({ children: [makeCell(hex, headerChildren, 0.5, 1.1)] })])
}

// Thin colored horizontal rule — uses a 1-row table with a colored background, no text
function buildDivider(hex: string): Table {
  const DIVIDER_COLOR = hex + "80" // 50% lighter not possible in OOXML, just use hex
  return makeTable([
    new TableRow({
      height: { value: 60, rule: "exact" },
      children: [
        new TableCell({
          width: { size: A4_TWIPS, type: WidthType.DXA },
          shading: { fill: hex, type: ShadingType.SOLID, color: hex },
          borders: TABLE_BORDERS,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          children: [new Paragraph({ children: [] })],
        }),
      ],
    }),
  ])
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
  const templateId = letter.templateId ?? "classic"
  const hex = (letter.colorScheme ?? "#2a72d7").replace("#", "").toUpperCase()
  const useHeader = HEADER_TEMPLATES.has(templateId)

  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = []

  const LINE = { line: 300, lineRule: "auto" as const }
  const I = { left: BODY_INDENT, right: BODY_INDENT }
  const p = (children: TextRun[], opts = {}) => new Paragraph({ children, indent: I, ...opts })

  // ── Header block OR plain name/contact ────────────────────────────────────
  if (useHeader) {
    children.push(buildHeaderTable(hex, c))
    children.push(buildDivider(hex))
    children.push(p([], { spacing: { after: 400 } }))
  } else {
    if (c.candidateName) children.push(p([new TextRun({ text: c.candidateName, bold: true, size: 36, color: hex })], { spacing: { after: 60 } }))
    if (c.candidateJobTitle) children.push(p([new TextRun({ text: c.candidateJobTitle, size: 22, color: "555555" })], { spacing: { after: 100 } }))
    const cp = [c.candidateEmail, c.candidatePhone, c.candidateLinkedin].filter(Boolean)
    if (cp.length) children.push(p(
      cp.flatMap((part, i) => [
        new TextRun({ text: part, size: 19 }),
        i < cp.length - 1 ? new TextRun({ text: "   |   ", size: 19, color: "AAAAAA" }) : null,
      ]).filter(Boolean) as TextRun[],
      { spacing: { after: 480 } }
    ))
  }

  // ── Date ──────────────────────────────────────────────────────────────────
  children.push(p(
    [new TextRun({ text: today, size: 20, color: "888888", italics: true })],
    { alignment: AlignmentType.RIGHT, spacing: { after: 480 } }
  ))

  // ── Recipient ─────────────────────────────────────────────────────────────
  if (c.recipientName || c.recipientTitle || c.company) {
    if (c.recipientName) children.push(p([new TextRun({ text: c.recipientName, bold: true, size: 23 })], { spacing: { after: 60 } }))
    if (c.recipientTitle) children.push(p([new TextRun({ text: c.recipientTitle, size: 21, color: "444444" })], { spacing: { after: 60 } }))
    if (c.company) children.push(p([new TextRun({ text: c.company, size: 21, color: "444444" })], { spacing: { after: 480 } }))
  }

  // ── Subject ───────────────────────────────────────────────────────────────
  if (c.subject) {
    children.push(p(
      [new TextRun({ text: "Asunto:  ", bold: true, size: 22, color: hex }), new TextRun({ text: c.subject, size: 22, bold: true })],
      { spacing: { after: 400 } }
    ))
  }

  // ── Salutation ────────────────────────────────────────────────────────────
  children.push(p(
    [new TextRun({ text: c.recipientName ? `Estimado/a ${c.recipientName}:` : "Estimado/a responsable de selección:", size: 22 })],
    { spacing: { after: 300, ...LINE } }
  ))

  // ── Body ──────────────────────────────────────────────────────────────────
  if (c.body) {
    const paras = stripHtml(c.body).split(/\n\n+/).filter(Boolean)
    paras.forEach((para, idx) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: para.replace(/\n/g, " ").trim(), size: 22 })],
        alignment: AlignmentType.BOTH,
        indent: { ...I, firstLine: convertInchesToTwip(0.4) },
        spacing: { after: idx < paras.length - 1 ? 260 : 560, ...LINE },
      }))
    })
  }

  // ── Closing ───────────────────────────────────────────────────────────────
  if (c.closing) {
    children.push(p(
      [new TextRun({ text: `${c.closing},`, size: 22 })],
      { spacing: { after: 1200 } }
    ))
  }

  // ── Signature ─────────────────────────────────────────────────────────────
  if (c.candidateName) children.push(p([new TextRun({ text: c.candidateName, bold: true, size: 24, color: hex })], { spacing: { after: 60 } }))
  if (c.candidateJobTitle) children.push(p([new TextRun({ text: c.candidateJobTitle, size: 21, color: "777777" })]))

  // ── Build document — zero left/right/top margins so header reaches page edge
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: useHeader ? 0 : convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: 0,
            right: 0,
          },
        },
      },
      children,
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
