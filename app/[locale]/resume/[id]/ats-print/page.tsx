import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isActive, isSuperAdmin } from "@/lib/plans"
import { verifyPrintToken } from "@/lib/pdf/print-token"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import { DEFAULT_SECTIONS, ResumeSectionsSchema, TEMPLATES } from "@/types/resume"
import { getTemplateAtsSafety } from "@/lib/ats/template-ats-safety"
import PrintLayout from "@/components/resume/PrintLayout"

export const dynamic = "force-dynamic"

// The modern ATS-safe template the export falls back to when the user's own
// template is NOT clean (two-column, or single-column but photo-bearing). Meridian
// is single-column, image-free, system-font — elegant AND parse-clean everywhere.
const DEFAULT_ATS_TEMPLATE = "atsmeridian"

const FONT_FILES: Record<string, string[]> = {
  Inter:              ["inter-400", "inter-600", "inter-700"],
  Poppins:            ["poppins-400", "poppins-600", "poppins-700"],
  Roboto:             ["roboto-400", "roboto-700"],
  Lato:               ["lato-400", "lato-700"],
  Montserrat:         ["montserrat-400", "montserrat-600", "montserrat-700"],
  "Playfair Display": ["playfair-400", "playfair-700", "playfair-400-italic", "playfair-700-italic"],
  Merriweather:       ["merriweather-400", "merriweather-700"],
  "Open Sans":        ["open-sans-400", "open-sans-600", "open-sans-700"],
  Raleway:            ["raleway-400", "raleway-600", "raleway-700"],
  "Source Sans 3":    ["source-sans-400", "source-sans-600", "source-sans-700"],
}

function FontPreload({ fontFamily }: { fontFamily: string }) {
  const files = [
    ...(FONT_FILES["Inter"] ?? []),
    ...(FONT_FILES[fontFamily] ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <>
      {files.map((f) => (
        <link key={f} rel="preload" as="font" type="font/woff2" href={`/fonts/${f}.woff2`} crossOrigin="anonymous" />
      ))}
    </>
  )
}

/**
 * Picks the template the ATS export renders in. Keeps the user's own design when it
 * is already ATS-clean — single-column AND photo-free (an embedded image is not
 * parseable, so a photo-bearing single-column template still isn't ATS-safe). Any
 * other template falls back to the modern default. Same source of truth as the ATS
 * score (getTemplateAtsSafety → TEMPLATES[].columns).
 */
function resolveAtsTemplate(templateId: string | null | undefined): string {
  if (!templateId) return DEFAULT_ATS_TEMPLATE
  const meta = TEMPLATES.find((t) => t.id === templateId)
  const clean = getTemplateAtsSafety(templateId) === "safe" && !meta?.hasPhoto
  return clean ? templateId : DEFAULT_ATS_TEMPLATE
}

/**
 * Print surface for the ATS-safe PDF. The pdf-generator microservice fetches this URL
 * (with a signed print token) and renders it to PDF. Renders the resume through the
 * SAME PrintLayout the normal export uses, but forced into a modern ATS-safe template
 * and with the photo stripped — so the machine-readable twin is now elegant instead of
 * a bare text dump, while staying single-column, image-free and fully parseable. The
 * .txt export (toAtsSafeResumeText) remains the plainest fallback.
 */
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

  const [resume, user] = await Promise.all([
    db.resume.findFirst({ where: { id, userId } }),
    db.user.findUnique({ where: { id: userId }, select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true, isManaged: true, managedBlocked: true, managedExpiresAt: true } }),
  ])
  if (!resume) notFound()

  const sections = (resume.sections as unknown as ResumeSection[]) ?? DEFAULT_SECTIONS
  const sectionData: ResumeSections = ResumeSectionsSchema.parse((resume.personalDetails as object) ?? {})

  const config: ResumeConfig = {
    templateId: resolveAtsTemplate(resume.templateId) as ResumeConfig["templateId"],
    colorScheme: resume.colorScheme,
    fontFamily: resume.fontFamily,
    fontSize: resume.fontSize,
    spacing: resume.spacing,
    // The ATS twin never carries a photo — an embedded image is unparseable and the
    // point of this export is a clean, machine-readable document.
    photoUrl: null,
    photoPosition: resume.photoPosition,
    language: (resume.language as ResumeConfig["language"]) ?? "es",
  }

  const isPro = isSuperAdmin(user?.role) || isActive(
    user?.plan ?? "UNSUBSCRIBED",
    user?.subscriptionEndsAt ?? null,
    user?.subscriptionStatus ?? null,
    user?.role,
    user?.isManaged,
    user?.managedBlocked,
    user?.managedExpiresAt,
  )

  return (
    <>
      <FontPreload fontFamily={config.fontFamily ?? "Poppins"} />
      <PrintLayout
        resumeId={resume.id}
        title={resume.title}
        sections={sections}
        sectionData={sectionData}
        config={config}
        isPro={isPro}
      />
    </>
  )
}
