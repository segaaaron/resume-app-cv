import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { verifyPrintToken } from "@/lib/pdf/print-token"
import { ResumeSectionsSchema } from "@/types/resume"
import { toAtsSafeResumeText } from "@/lib/ats/ats-safe"

export const dynamic = "force-dynamic"

/**
 * Print surface for the ATS-safe PDF. The pdf-generator microservice fetches this URL
 * (with a signed print token) and renders it to PDF. Deliberately plain: one column,
 * system font, black on white, real text — the machine-readable twin of the user's
 * designed CV. Same deterministic text as the .txt export (toAtsSafeResumeText).
 */
function AtsSafeDocument({ text }: { text: string }) {
  const lines = text.split("\n")
  const blocks: React.ReactNode[] = []
  let bullets: string[] = []
  let key = 0

  const flushBullets = () => {
    if (bullets.length === 0) return
    blocks.push(
      <ul key={`u${key++}`} style={{ margin: "2pt 0 6pt", paddingLeft: "16pt" }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ marginBottom: "2pt" }}>{b}</li>
        ))}
      </ul>,
    )
    bullets = []
  }

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flushBullets()
      return
    }
    if (line.startsWith("- ")) {
      bullets.push(line.slice(2))
      return
    }
    flushBullets()
    // First line is the name (largest); a header line is ALL-CAPS with letters.
    const isName = idx === 0
    const letters = line.replace(/[^A-Za-zÀ-ÿ]/g, "")
    const isHeader = letters.length > 0 && line === line.toUpperCase() && line.length <= 40
    if (isName) {
      blocks.push(<h1 key={`h${key++}`} style={{ fontSize: "18pt", fontWeight: 700, margin: "0 0 2pt" }}>{line}</h1>)
    } else if (isHeader) {
      blocks.push(
        <h2 key={`h${key++}`} style={{ fontSize: "11pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5pt", margin: "12pt 0 4pt", paddingBottom: "2pt", borderBottom: "1px solid #000" }}>{line}</h2>,
      )
    } else {
      blocks.push(<p key={`p${key++}`} style={{ margin: "0 0 3pt" }}>{line}</p>)
    }
  })
  flushBullets()

  return <>{blocks}</>
}

export default async function AtsPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; locale: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { id, locale } = await params
  const sp = await searchParams
  const pt = sp.pt as string | undefined

  let userId: string
  if (pt) {
    const tokenData = verifyPrintToken(pt, id)
    if (!tokenData) notFound()
    userId = tokenData.userId
  } else {
    const session = await auth()
    if (!session?.user) redirect(`/${locale}/login`)
    userId = session.user.id
  }

  const resume = await db.resume.findFirst({
    where: { id, userId },
    select: { id: true, personalDetails: true },
  })
  if (!resume) notFound()

  const sectionData = ResumeSectionsSchema.parse((resume.personalDetails as object) ?? {})
  const text = toAtsSafeResumeText(sectionData, locale === "es" ? "es" : "en")

  // A fragment, not a full <html> document — the root app/layout.tsx owns <html>/<body>,
  // exactly like the existing resume print page. The <style> below hoists to <head>.
  //
  // The DOM MUST expose ".resume-pages > div[data-print-layout]": the pdf-generator
  // microservice (resume renderer, stretchPages=true) waits for that exact selector
  // before capturing and TIMES OUT without it (see services/pdf-generator contracts.ts,
  // RESUME_CONTENT_SELECTOR). single-column = no sidebar, so its layout-fix pass is a
  // no-op on the background gradient. This is why the plain doc still wears those classes.
  return (
    <>
      <style>{`
        /* margin: 0 to match the app's print CSS — the pdf-generator computes usable
           page height as the FULL A4 (USABLE_PX_PER_PAGE, margin 0 assumed). A non-zero
           @page margin would desync its page-break math and clip content. The visible
           margin is padding on .ats-doc instead, exactly like the real templates. */
        @page { size: A4; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        body {
          color: #000 !important;
          font-family: Arial, Helvetica, "Liberation Sans", sans-serif !important;
          font-size: 10.5pt;
          line-height: 1.4;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .ats-doc { max-width: 100%; margin: 0; padding: 16mm; box-sizing: border-box; }
        .ats-doc h1, .ats-doc h2, .ats-doc p, .ats-doc ul, .ats-doc li { orphans: 3; widows: 3; }
        .ats-doc ul { page-break-inside: auto; }
        .ats-doc li, .ats-doc p { page-break-inside: avoid; }
        .ats-doc h2 { page-break-after: avoid; }
      `}</style>
      <div className="resume-pages">
        <div data-print-layout="single-column" className="ats-doc">
          <AtsSafeDocument text={text} />
        </div>
      </div>
    </>
  )
}
