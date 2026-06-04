import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import EditorLayout from "@/components/editor/EditorLayout"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import { DEFAULT_SECTIONS, ResumeSectionsSchema } from "@/types/resume"

export const dynamic = "force-dynamic"

export default async function EditorPage({ params, searchParams }: { params: Promise<{ id: string; locale: string }>; searchParams: Promise<{ new?: string; upgraded?: string; session_id?: string }> }) {
  const session = await auth()
  const { id, locale } = await params
  const { new: isNewParam, upgraded, session_id } = await searchParams
  const isNew = isNewParam === "1"
  if (!session?.user) redirect(`/${locale}/login`)

  // When coming from a Stripe purchase redirect (upgraded=true or session_id present),
  // bypass the JWT (which is stale) and read plan directly from DB — single cheap query.
  const comingFromPurchase = upgraded === "true" || !!session_id
  const [resume, freshUser] = await Promise.all([
    db.resume.findFirst({ where: { id, userId: session.user.id } }),
    comingFromPurchase
      ? db.user.findUnique({ where: { id: session.user.id }, select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true } })
      : Promise.resolve(null),
  ])

  const plan = (freshUser?.plan ?? session.user.plan) ?? "UNSUBSCRIBED"
  const subscriptionStatus = (freshUser?.subscriptionStatus ?? session.user.subscriptionStatus) ?? "NONE"
  const subscriptionEndsAt = (freshUser?.subscriptionEndsAt?.toISOString() ?? session.user.subscriptionEndsAt) ?? null
  const role = session.user.role ?? "USER"
  const isManaged = session.user.isManaged ?? false
  const managedBlocked = session.user.managedBlocked ?? false
  const managedExpiresAt = session.user.managedExpiresAt ?? null

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
      isNew={isNew}
      sections={sections}
      sectionData={sectionData}
      config={config}
      plan={plan}
      subscriptionStatus={subscriptionStatus}
      subscriptionEndsAt={subscriptionEndsAt}
      role={role}
      isManaged={isManaged}
      managedBlocked={managedBlocked}
      managedExpiresAt={managedExpiresAt}
    />
  )
}
