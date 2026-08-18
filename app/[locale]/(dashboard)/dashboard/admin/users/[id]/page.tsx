import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTranslations } from "next-intl/server"
import UserDetailPanel from "@/components/admin/UserDetailPanel"

/**
 * Ficha de un usuario, para soporte.
 *
 * POR QUÉ EXISTE: cuando alguien reclama, su historia estaba repartida en cinco tablas y
 * ninguna pantalla la juntaba. "No puedo descargar" obligaba a abrir la base por SSH para
 * saber qué plan tiene, cuándo pagó, cuántos CVs hizo y si su IA está agotada. Esta
 * pantalla convierte eso en un clic desde la lista.
 *
 * Es de LECTURA. Las acciones (cortar sesión, conceder acceso) viven en sus endpoints, con
 * su propia confirmación y su registro en auditoría.
 */
export const dynamic = "force-dynamic"
export const metadata = { title: "Admin — User", robots: { index: false, follow: false } }

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: "dashboard_admin" })
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect(`/${locale}/dashboard/resumes`)
  }

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, plan: true, subscriptionStatus: true,
      subscriptionEndsAt: true, planInterval: true, paymentProvider: true, role: true,
      createdAt: true, lastActiveAt: true, emailVerified: true, deletedAt: true,
      stripeCustomerId: true, subscriptionId: true, paypalSubscriptionId: true,
      isManaged: true, managedBlocked: true, managedExpiresAt: true,
      managedDownloadLimit: true, managedDownloadsUsed: true,
      managedResumeLimit: true, managedCoverLetterLimit: true, managedNote: true,
      referredBy: true,
    },
  })
  if (!user) notFound()

  // Todo en paralelo: la ficha se abre desde un ticket, y una pantalla de soporte lenta
  // es una pantalla que nadie usa.
  const [resumeCount, letterCount, applicationCount, audit, aiByEndpoint] = await Promise.all([
    db.resume.count({ where: { userId: id } }),
    db.coverLetter.count({ where: { userId: id } }),
    db.application.count({ where: { userId: id } }),
    db.auditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: { id: true, action: true, metadata: true, createdAt: true },
    }),
    db.aIUsageLog.groupBy({
      by: ["endpoint"],
      where: { userId: id },
      _count: { _all: true },
      _sum: { costUsd: true },
    }),
  ])

  return (
    <div className="flex flex-col gap-0">
      <div className="mb-5">
        <Link
          href={`/${locale}/dashboard/admin`}
          className="inline-flex items-center gap-1.5 text-[12px] text-dash-muted hover:text-dash-navy transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("detail_back")}
        </Link>
      </div>

      <UserDetailPanel
        user={{
          ...user,
          createdAt: user.createdAt.toISOString(),
          lastActiveAt: user.lastActiveAt.toISOString(),
          subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() ?? null,
          managedExpiresAt: user.managedExpiresAt?.toISOString() ?? null,
          emailVerified: user.emailVerified?.toISOString() ?? null,
          deletedAt: user.deletedAt?.toISOString() ?? null,
        }}
        counts={{ resumes: resumeCount, letters: letterCount, applications: applicationCount }}
        audit={audit.map((a) => ({
          id: a.id,
          action: a.action,
          metadata: a.metadata as Record<string, unknown> | null,
          createdAt: a.createdAt.toISOString(),
        }))}
        ai={aiByEndpoint.map((r) => ({
          endpoint: r.endpoint,
          calls: r._count._all,
          costUsd: r._sum.costUsd ?? 0,
        }))}
      />
    </div>
  )
}
