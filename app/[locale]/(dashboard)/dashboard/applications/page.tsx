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
    <div>
      {/* Page head */}
      <div className="dash-card-in mb-7" style={{ animationDelay: "0ms" }}>
        <div
          className="flex items-center gap-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em]"
          style={{ color: "var(--dash-cyan)" }}
        >
          <span
            className="w-3.5 h-px opacity-50 inline-block"
            style={{ background: "var(--dash-cyan)" }}
          />
          Seguimiento
        </div>
        <h1
          className="font-serif text-[28px] sm:text-[32px] font-black leading-tight tracking-tight"
          style={{ color: "var(--dash-navy)" }}
        >
          {t("page_title")}
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--dash-muted)" }}>
          {applications.length} candidaturas · Kanban de postulaciones
        </p>
      </div>
      <div className="dash-card-in" style={{ animationDelay: "80ms" }}>
        <KanbanBoard initialApplications={mappedApplications} />
      </div>
    </div>
  )
}
