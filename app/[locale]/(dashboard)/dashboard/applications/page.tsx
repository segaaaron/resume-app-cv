import KanbanBoard from "@/components/kanban/Board"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export default async function ApplicationsPage() {
  const session = await auth()
  const applications = await db.application.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mis Candidaturas</h1>
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
