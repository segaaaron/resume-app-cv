import KanbanBoard from "@/components/kanban/Board"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${locale}/login`)
  }
  const t = await getTranslations("kanban")
  const applications = await db.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 mt-2">{t("page_title")}</h1>
      <KanbanBoard initialApplications={applications.map(a => ({
        id: a.id,
        jobTitle: a.jobTitle,
        company: a.company,
        status: a.status as import("@/stores/applicationStore").AppStatus,
        notes: a.notes ?? undefined,
        url: a.url ?? undefined,
        salary: a.salary ?? undefined,
        appliedAt: a.appliedAt?.toISOString(),
        createdAt: a.createdAt.toISOString(),
      }))} />
    </div>
  )
}
