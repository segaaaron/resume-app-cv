import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import ResumesDashboard from "@/components/dashboard/ResumesDashboard"

export default async function ResumesPage() {
  const session = await auth()
  const resumes = await db.resume.findMany({
    where: { userId: session!.user!.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      templateId: true,
      colorScheme: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  return <ResumesDashboard initialResumes={resumes} />
}
