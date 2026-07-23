import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import ResumesDashboard from "@/components/dashboard/ResumesDashboard"

export const dynamic = "force-dynamic"

export default async function ResumesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }

  type ResumeRow = { id: string; title: string; templateId: string; colorScheme: string; thumbnailUrl: string | null; updatedAt: Date; createdAt: Date; translatedFromId: string | null }
  let resumes: ResumeRow[] = []
  try {
    resumes = await db.resume.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        templateId: true,
        colorScheme: true,
        thumbnailUrl: true,
        updatedAt: true,
        createdAt: true,
        translatedFromId: true,
      },
    })
  } catch {
    redirect(`/${locale}/login`)
  }

  return <ResumesDashboard initialResumes={resumes} />
}
