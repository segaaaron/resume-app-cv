import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isActive, isSuperAdmin } from "@/lib/plans"
import { verifyPrintToken } from "@/lib/pdf/print-token"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import { DEFAULT_SECTIONS, ResumeSectionsSchema } from "@/types/resume"
import PrintLayout from "@/components/resume/PrintLayout"

export default async function PrintPage({
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
    db.user.findUnique({ where: { id: userId }, select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true } }),
  ])

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

  const isPro = isSuperAdmin(user?.role) || isActive(
    user?.plan ?? "UNSUBSCRIBED",
    user?.subscriptionEndsAt ?? null,
    user?.subscriptionStatus ?? null,
  )

  return (
    <PrintLayout
      resumeId={resume.id}
      title={resume.title}
      sections={sections}
      sectionData={sectionData}
      config={config}
      isPro={isPro}
    />
  )
}
