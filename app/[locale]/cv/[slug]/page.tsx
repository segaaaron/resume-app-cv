import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import { DEFAULT_SECTIONS, ResumeSectionsSchema } from "@/types/resume"
import PublicResumeView from "@/components/resume/PublicResumeView"

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
