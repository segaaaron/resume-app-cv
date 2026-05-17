import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { verifyPrintToken } from "@/lib/pdf/print-token"
import CoverLetterPrintLayout from "@/components/cover-letter/CoverLetterPrintLayout"

export const dynamic = "force-dynamic"

export default async function CoverLetterPrintPage({
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

  const [letter, latestResume] = await Promise.all([
    db.coverLetter.findFirst({ where: { id, userId } }),
    db.resume.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { personalDetails: true, photoUrl: true },
    }),
  ])

  if (!letter) notFound()

  const content = (letter.content as Record<string, string>) ?? {}
  const sectionData = (latestResume?.personalDetails as Record<string, unknown> | null) ?? {}
  const pd = (sectionData.personalDetails as Record<string, string> | null) ?? {}

  const candidate = {
    name: content.candidateName ?? pd.name ?? pd.fullName ?? "",
    jobTitle: content.candidateJobTitle ?? pd.jobTitle ?? pd.title ?? "",
    email: content.candidateEmail ?? pd.email ?? "",
    phone: content.candidatePhone ?? pd.phone ?? "",
    address: content.candidateAddress ?? pd.address ?? pd.location ?? "",
    photo: content.candidatePhoto ?? latestResume?.photoUrl ?? pd.photoUrl ?? pd.photo ?? "",
    photoPosition: typeof content.candidatePhotoPosition === "number" ? Number(content.candidatePhotoPosition) : 50,
    linkedin: content.candidateLinkedin ?? pd.linkedin ?? "",
    website: content.candidateWebsite ?? pd.website ?? pd.portfolioUrl ?? "",
  }

  return (
    <CoverLetterPrintLayout
      letterId={id}
      title={letter.title}
      colorScheme={letter.colorScheme}
      fontFamily={letter.fontFamily}
      templateId={letter.templateId ?? "elegant"}
      content={{
        recipientName: content.recipientName ?? "",
        recipientTitle: content.recipientTitle ?? "",
        company: content.company ?? "",
        subject: content.subject ?? "",
        body: content.body ?? "",
        closing: content.closing ?? "",
      }}
      candidate={candidate}
      locale={locale}
    />
  )
}
