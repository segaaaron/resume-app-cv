import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import CoverLetterEditor from "@/components/cover-letter/CoverLetterEditor"

export default async function CoverLetterPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const session = await auth()
  const { id, locale } = await params
  if (!session?.user) redirect(`/${locale}/login`)
  const letter = await db.coverLetter.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!letter) notFound()

  const content = (letter.content as Record<string, string>) ?? {}

  return (
    <CoverLetterEditor
      id={letter.id}
      title={letter.title}
      colorScheme={letter.colorScheme}
      fontFamily={letter.fontFamily}
      content={{
        recipientName: content.recipientName ?? "",
        recipientTitle: content.recipientTitle ?? "",
        company: content.company ?? "",
        body: content.body ?? "",
        closing: content.closing ?? "",
      }}
    />
  )
}
