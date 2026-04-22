import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import { DEFAULT_SECTIONS, ResumeSectionsSchema } from "@/types/resume"
import PrintLayout from "@/components/resume/PrintLayout"

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/es/login")

  const { id } = await params
  const resume = await db.resume.findFirst({
    where: { id, userId: session.user.id },
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
    language: (resume.language as ResumeConfig["language"]) ?? "es",
  }

  return (
    <PrintLayout
      resumeId={resume.id}
      title={resume.title}
      sections={sections}
      sectionData={sectionData}
      config={config}
    />
  )
}
