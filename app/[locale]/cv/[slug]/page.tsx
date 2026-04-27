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

  const sections = (resume.sections as unknown as ResumeSection[]) ?? DEFAULT_SECTIONS
  const sectionData: ResumeSections = ResumeSectionsSchema.parse((resume.personalDetails as object) ?? {})

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
