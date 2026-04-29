import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isActive, isSuperAdmin } from "@/lib/plans"
import CoverLetterEditor from "@/components/cover-letter/CoverLetterEditor"

export default async function CoverLetterPage({ params, searchParams }: { params: Promise<{ id: string; locale: string }>; searchParams: Promise<{ new?: string }> }) {
  const session = await auth()
  const { id, locale } = await params
  const { new: isNewParam } = await searchParams
  const isNew = isNewParam === "1"
  if (!session?.user) redirect(`/${locale}/login`)

  const [letter, user, latestResume] = await Promise.all([
    db.coverLetter.findFirst({ where: { id, userId: session.user.id } }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, trialEndsAt: true, role: true },
    }),
    db.resume.findFirst({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { personalDetails: true, photoUrl: true },
    }),
  ])

  if (!letter) notFound()

  const isPro = isSuperAdmin(user?.role) || isActive(
    user?.plan ?? "FREE",
    user?.trialEndsAt ?? null,
    user?.subscriptionEndsAt ?? null,
    user?.subscriptionStatus ?? null,
  )

  const content = (letter.content as Record<string, string>) ?? {}

  // personalDetails DB field stores the full sectionData object — dig into the nested personalDetails key
  const sectionData = (latestResume?.personalDetails as Record<string, unknown> | null) ?? {}
  const pd = (sectionData.personalDetails as Record<string, string> | null) ?? {}
  const candidateFromResume = {
    name: pd.name ?? pd.fullName ?? "",
    jobTitle: pd.jobTitle ?? pd.title ?? "",
    email: pd.email ?? "",
    phone: pd.phone ?? "",
    address: pd.address ?? pd.location ?? "",
    // resume.photoUrl (top-level column) takes priority, fall back to personalDetails field
    photo: latestResume?.photoUrl ?? pd.photoUrl ?? pd.photo ?? "",
    linkedin: pd.linkedin ?? "",
    website: pd.website ?? pd.portfolioUrl ?? "",
  }

  // Respect existing candidate data if the user already edited it
  const initialCandidate = {
    name: content.candidateName ?? candidateFromResume.name,
    jobTitle: content.candidateJobTitle ?? candidateFromResume.jobTitle,
    email: content.candidateEmail ?? candidateFromResume.email,
    phone: content.candidatePhone ?? candidateFromResume.phone,
    address: content.candidateAddress ?? candidateFromResume.address,
    photo: content.candidatePhoto ?? candidateFromResume.photo,
    photoPosition: typeof content.candidatePhotoPosition === "number" ? content.candidatePhotoPosition : 50,
    linkedin: content.candidateLinkedin ?? candidateFromResume.linkedin,
    website: content.candidateWebsite ?? candidateFromResume.website,
  }

  return (
    <CoverLetterEditor
      id={letter.id}
      title={letter.title}
      isNew={isNew}
      colorScheme={letter.colorScheme}
      fontFamily={letter.fontFamily}
      templateId={letter.templateId ?? "classic"}
      isPro={isPro}
      language={locale}
      content={{
        recipientName: content.recipientName ?? "",
        recipientTitle: content.recipientTitle ?? "",
        company: content.company ?? "",
        subject: content.subject ?? "",
        body: content.body ?? "",
        closing: content.closing ?? "",
      }}
      initialCandidate={initialCandidate}
    />
  )
}
