import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import EditorLayout from "@/components/editor/EditorLayout"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import { DEFAULT_SECTIONS, ResumeSectionsSchema } from "@/types/resume"

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/es/login")

  const plan = session.user.plan ?? "FREE"
  const subscriptionStatus = session.user.subscriptionStatus ?? "NONE"
  const subscriptionEndsAt = session.user.subscriptionEndsAt ?? null
  const role = session.user.role ?? "USER"

  const { id } = await params
  const [resume, dbUser] = await Promise.all([
    db.resume.findFirst({ where: { id, userId: session.user.id } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { trialEndsAt: true } }),
  ])
  const trialEndsAt = dbUser?.trialEndsAt?.toISOString() ?? null

  if (!resume) notFound()

  // Parse sections safely — fall back to defaults if DB data is malformed
  let sections: ResumeSection[] = DEFAULT_SECTIONS
  try {
    const raw = resume.sections
    if (Array.isArray(raw) && raw.length > 0) {
      sections = raw as unknown as ResumeSection[]
    }
  } catch {
    sections = DEFAULT_SECTIONS
  }

  // Merge stored data through Zod schema to fill any missing fields safely
  const sectionData: ResumeSections = ResumeSectionsSchema.parse(
    typeof resume.personalDetails === "object" && resume.personalDetails !== null
      ? resume.personalDetails
      : {}
  )

  const config: ResumeConfig = {
    templateId: (resume.templateId as ResumeConfig["templateId"]) ?? "classic",
    colorScheme: resume.colorScheme,
    fontFamily: resume.fontFamily,
    fontSize: resume.fontSize,
    spacing: resume.spacing,
    photoUrl: resume.photoUrl,
    photoPosition: resume.photoPosition ?? 15,
    language: (resume.language as ResumeConfig["language"]) ?? "es",
  }

  return (
    <EditorLayout
      resumeId={resume.id}
      title={resume.title}
      sections={sections}
      sectionData={sectionData}
      config={config}
      plan={plan}
      subscriptionStatus={subscriptionStatus}
      subscriptionEndsAt={subscriptionEndsAt}
      trialEndsAt={trialEndsAt}
      role={role}
    />
  )
}
