import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import EditorLayout from "@/components/editor/EditorLayout"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import { DEFAULT_SECTIONS, ResumeSectionsSchema } from "@/types/resume"

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const resume = await db.resume.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!resume) notFound()

  const sections = (resume.sections as unknown as ResumeSection[]) ?? DEFAULT_SECTIONS
  const rawData = (resume.personalDetails as object) ?? {}

  // Merge stored data into schema defaults
  const sectionData: ResumeSections = ResumeSectionsSchema.parse(rawData)

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
    <EditorLayout
      resumeId={resume.id}
      title={resume.title}
      sections={sections}
      sectionData={sectionData}
      config={config}
    />
  )
}
