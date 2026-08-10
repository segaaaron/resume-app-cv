import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/lib/db"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import { DEFAULT_SECTIONS, ResumeSectionsSchema } from "@/types/resume"
import PublicResumeView from "@/components/resume/PublicResumeView"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}): Promise<Metadata> {
  const { slug, locale } = await params
  const resume = await db.resume.findFirst({
    where: { publicSlug: slug, isPublic: true },
    select: { title: true, publicSlug: true },
  })
  if (!resume) return {}

  const title = resume.title
    ? `${resume.title} — CV`
    : "CV profesional"
  const description =
    locale === "es"
      ? `Mira el CV profesional creado con Valhalla Resume. Crea el tuyo con IA en minutos.`
      : `View this professional resume created with Valhalla Resume. Build yours with AI in minutes.`
  const url = `https://www.valhallaresume.com/${locale}/cv/${slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "profile",
      url,
      images: [{ url: "https://www.valhallaresume.com/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://www.valhallaresume.com/og-image.png"],
    },
    /**
     * Shared by link, not published to the world.
     *
     * This page exists because the candidate pressed "share" to send it to a
     * recruiter. Indexing it turns that into something else: their name, email,
     * phone and employer history answering a public search, forever, and a dead
     * URL in Google the day they stop sharing. Nobody warned them of either.
     *
     * The link keeps working for anyone who has it — that is what they asked
     * for — it simply does not enter search results.
     */
    robots: { index: false, follow: false },
  }
}

export default async function PublicCVPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>
}) {
  const { slug } = await params

  const resume = await db.resume.findFirst({
    where: { publicSlug: slug, isPublic: true },
  })

  if (!resume) notFound()

  // Fire-and-forget view tracking
  db.cVView.create({ data: { resumeId: resume.id } }).catch(() => {})

  const sections = (resume.sections as unknown as ResumeSection[]) ?? DEFAULT_SECTIONS
  const parsed = ResumeSectionsSchema.safeParse((resume.personalDetails as object) ?? {})
  if (!parsed.success) notFound()
  const sectionData: ResumeSections = parsed.data

  const config: ResumeConfig = {
    templateId: (resume.templateId as ResumeConfig["templateId"]) ?? "classic",
    colorScheme: resume.colorScheme,
    fontFamily: resume.fontFamily,
    fontSize: resume.fontSize,
    spacing: resume.spacing,
    photoUrl: resume.photoUrl,
    photoPosition: resume.photoPosition,
    language: (resume.language as ResumeConfig["language"]) ?? "es",
  }

  return (
    <PublicResumeView
      title={resume.title}
      sections={sections}
      sectionData={sectionData}
      config={config}
    />
  )
}
