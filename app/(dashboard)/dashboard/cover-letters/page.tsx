import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import CoverLettersDashboard from "@/components/dashboard/CoverLettersDashboard"

export default async function CoverLettersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const letters = await db.coverLetter.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, colorScheme: true, updatedAt: true, createdAt: true },
  })

  return <CoverLettersDashboard initialLetters={letters} />
}
