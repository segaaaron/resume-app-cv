import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isActive } from "@/lib/plans"
import { checkAndIncrementRateLimit, PDF_RATE_LIMIT_WINDOW_MS } from "@/lib/rate-limit"

const DOWNLOAD_DAILY_LIMIT = 15
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
  UnderlineType,
} from "docx"

// Strip ALL HTML including inline styles — prevents color leaking into Word
function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim()
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
const ALL_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideH: NO_BORDER, insideV: NO_BORDER }

// A4 full width in twips — page margins are 0 so header/divider reach edges
const A4_TWIPS = Math.round((210 / 25.4) * 1440) // 11906 twips
// Body indentation — 1in each side for content area
const MARGIN = convertInchesToTwip(1)
const I = { left: MARGIN, right: MARGIN }

// Thin accent line — colored 3pt rule spanning full page width
function buildAccentLine(hex: string): Table {
  return new Table({
    width: { size: A4_TWIPS, type: WidthType.DXA },
    columnWidths: [A4_TWIPS],
    borders: ALL_BORDERS,
    rows: [
      new TableRow({
        height: { value: 45, rule: "exact" },
        children: [
          new TableCell({
            width: { size: A4_TWIPS, type: WidthType.DXA },
            shading: { fill: hex, type: ShadingType.SOLID, color: hex },
            borders: ALL_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [new Paragraph({ children: [] })],
          }),
        ],
      }),
    ],
  })
}

const LINE = { line: 240, lineRule: "auto" as const } // single spacing
const p = (runs: TextRun[], opts: Record<string, unknown> = {}) =>
  new Paragraph({ children: runs, indent: I, ...opts })

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
      data: { userId: session.user.id, action: "FREE_DOWNLOAD_BLOCKED", metadata: { type: "docx", target: "cover-letter" } },
    }).catch(() => undefined)
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Shared DOCX-only bucket with CV DOCX export — independent of PDF quotas
  // (PDF exports use a different bucket). 15 DOCX/day per user combined.
  const allowed = await checkAndIncrementRateLimit(session.user.id, "download-export", DOWNLOAD_DAILY_LIMIT, PDF_RATE_LIMIT_WINDOW_MS)
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Maximum 15 exports per day.", code: "RATE_LIMIT_EXCEEDED" }, { status: 429 })
  }

  let managedClaimed = false
  if (user?.isManaged && user.managedDownloadLimit !== null) {
    const claimed = await db.user.updateMany({
      where: { id: session.user.id, isManaged: true, managedDownloadsUsed: { lt: user.managedDownloadLimit } },
      data: { managedDownloadsUsed: { increment: 1 } },
    })
    if (claimed.count === 0) {
      return NextResponse.json({ error: "Has alcanzado el límite de descargas de tu plan." }, { status: 403 })
    }
    managedClaimed = true
  }

  const letter = await db.coverLetter.findFirst({ where: { id, userId: session.user.id } })
  if (!letter) {
    if (managedClaimed) {
      db.user.update({ where: { id: session.user.id }, data: { managedDownloadsUsed: { decrement: 1 } } })
        .catch(() => undefined)
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const c = (letter.content as Record<string, string>) ?? {}
  const rawHex = (letter.colorScheme ?? "#2a72d7").replace(/#/g, "").toUpperCase()
  const hex = /^[0-9A-F]{6}$/.test(rawHex) ? rawHex : "2A72D7"
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = []

  // ── HEADER — Arquetipo B: full colored block (name + job title + contacts) ─
  const contacts = [c.candidateEmail, c.candidatePhone, c.candidateLinkedin, c.candidateWebsite]
    .filter(Boolean) as string[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headerCellChildren: any[] = []

  if (c.candidateName) {
    headerCellChildren.push(new Paragraph({
      children: [new TextRun({
        text: c.candidateName.toUpperCase(),
        bold: true,
        size: 36,
        color: "FFFFFF",
        characterSpacing: 30,
      })],
      spacing: { after: 60 },
    }))
  }

  if (c.candidateJobTitle) {
    headerCellChildren.push(new Paragraph({
      children: [new TextRun({
        text: c.candidateJobTitle,
        size: 22,
        // OOXML doesn't support alpha — literal hex approximating ~80% white on color bg
        color: "E0E0E0",
      })],
      spacing: { after: contacts.length ? 100 : 0 },
    }))
  }

  if (contacts.length) {
    headerCellChildren.push(new Paragraph({
      children: contacts.flatMap((part, i) => [
        new TextRun({ text: part, size: 19, color: "CCCCCC" }),
        i < contacts.length - 1 ? new TextRun({ text: "   |   ", size: 19, color: "CCCCCC" }) : null,
      ]).filter(Boolean) as TextRun[],
      spacing: { after: 0 },
    }))
  }

  // Empty paragraph fallback — TableCell requires at least one child
  if (headerCellChildren.length === 0) {
    headerCellChildren.push(new Paragraph({ children: [] }))
  }

  children.push(new Table({
    width: { size: A4_TWIPS, type: WidthType.DXA },
    columnWidths: [A4_TWIPS],
    borders: ALL_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: A4_TWIPS, type: WidthType.DXA },
            shading: { fill: hex, type: ShadingType.SOLID, color: hex },
            borders: ALL_BORDERS,
            margins: {
              top: convertInchesToTwip(0.3),
              bottom: convertInchesToTwip(0.3),
              left: convertInchesToTwip(1.1),
              right: convertInchesToTwip(1.1),
            },
            children: headerCellChildren,
          }),
        ],
      }),
    ],
  }))

  // Thin accent rule immediately after the colored header block
  children.push(buildAccentLine(hex))

  // Spacer after accent line
  children.push(p([], { spacing: { after: 180 } }))

  // ── DATE — right-aligned, italic ─────────────────────────────────────────
  children.push(p(
    [new TextRun({ text: today, size: 20, color: "777777", italics: true })],
    { alignment: AlignmentType.RIGHT, spacing: { after: 200 } }
  ))

  // ── RECIPIENT ─────────────────────────────────────────────────────────────
  if (c.recipientName || c.recipientTitle || c.company) {
    if (c.recipientName) children.push(p(
      [new TextRun({ text: c.recipientName, bold: true, size: 22, color: "111111" })],
      { spacing: { after: 40 } }
    ))
    if (c.recipientTitle) children.push(p(
      [new TextRun({ text: c.recipientTitle, size: 22, color: "444444" })],
      { spacing: { after: 40 } }
    ))
    if (c.company) children.push(p(
      [new TextRun({ text: c.company, size: 22, color: "444444" })],
      { spacing: { after: 200 } }
    ))
  }

  // ── SUBJECT — bold, color accent on label ─────────────────────────────────
  if (c.subject) {
    children.push(p(
      [
        new TextRun({ text: "Asunto: ", bold: true, size: 22, color: hex }),
        new TextRun({ text: c.subject, bold: true, size: 22, color: "111111" }),
      ],
      { spacing: { after: 160 } }
    ))
  }

  // ── SALUTATION — colon (ES standard) ─────────────────────────────────────
  children.push(p(
    [new TextRun({
      text: c.recipientName
        ? `Estimado/a ${c.recipientName}:`
        : "Estimado/a responsable de selección:",
      size: 22,
      color: "111111",
    })],
    { spacing: { after: 160, ...LINE } }
  ))

  // ── BODY — LEFT aligned, no indent, single spacing, clean black text ───────
  if (c.body) {
    const paras = stripHtml(c.body).split(/\n\n+/).filter(Boolean)
    paras.forEach((para, idx) => {
      children.push(new Paragraph({
        children: [new TextRun({ text: para.replace(/\n/g, " ").trim(), size: 22, color: "111111" })],
        alignment: AlignmentType.LEFT,
        indent: I,
        spacing: { after: idx < paras.length - 1 ? 160 : 200, ...LINE },
      }))
    })
  }

  // ── CLOSING ───────────────────────────────────────────────────────────────
  if (c.closing) {
    children.push(p(
      [new TextRun({ text: `${c.closing},`, size: 22, color: "111111" })],
      { spacing: { after: 480 } }
    ))
  }

  // ── SIGNATURE — pushed toward bottom ─────────────────────────────────────
  if (c.candidateName) {
    // Short underline rule before name
    children.push(p(
      [new TextRun({ text: "_".repeat(18), size: 20, color: hex, underline: { type: UnderlineType.NONE } })],
      { spacing: { before: 960, after: 60 } }
    ))
    children.push(p(
      [new TextRun({ text: c.candidateName, bold: true, size: 23, color: "111111" })],
      { spacing: { after: 40 } }
    ))
  }
  if (c.candidateJobTitle) children.push(p(
    [new TextRun({ text: c.candidateJobTitle, size: 20, color: "555555" })],
    { spacing: { after: 40 } }
  ))
  if (c.candidateEmail) children.push(p(
    [new TextRun({ text: c.candidateEmail, size: 19, color: "777777" })],
    { spacing: { after: 0 } }
  ))

  // ── DOCUMENT — standard 1in margins, no tricks ────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 0,           // header bleeds to top edge (accent line)
            bottom: convertInchesToTwip(0.75),
            left: 0,
            right: 0,
          },
        },
      },
      children,
    }],
  })

  try {
    const buffer = await Packer.toBuffer(doc)
    const filename = `${(letter.title || "carta").replace(/[^a-z0-9]/gi, "_")}.docx`

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    if (managedClaimed) {
      db.user.update({ where: { id: session.user.id }, data: { managedDownloadsUsed: { decrement: 1 } } })
        .catch(() => undefined)
    }
    throw err
  }
}
