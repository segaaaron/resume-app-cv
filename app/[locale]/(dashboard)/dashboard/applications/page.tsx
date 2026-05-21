import KanbanBoard from "@/components/kanban/Board"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
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
  const applications = await db.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  const mappedApplications = applications.map(a => ({
    id: a.id,
    jobTitle: a.jobTitle,
    company: a.company,
    status: a.status as import("@/stores/applicationStore").AppStatus,
    modalidad: (a as { modalidad?: string | null }).modalidad ?? undefined,
    notes: a.notes ?? undefined,
    url: a.url ?? undefined,
    salary: a.salary ?? undefined,
    appliedAt: a.appliedAt?.toISOString(),
    createdAt: a.createdAt.toISOString(),
  }))

  return (
    <div className="dash-card-in" style={{ animationDelay: "0ms" }}>
      <KanbanBoard initialApplications={mappedApplications} />
    </div>
  )
}
