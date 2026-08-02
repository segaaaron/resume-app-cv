import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTranslations } from "next-intl/server"
import { getErrorReport, type ErrorWindow } from "@/lib/services/error/errorLog"
import ServiceErrorsPanel, { type ServiceErrorsReport } from "@/components/admin/ServiceErrorsPanel"

export const dynamic = "force-dynamic"

export const metadata = { title: "Admin — Service Errors", robots: { index: false, follow: false } }

function parseWindow(v: string | string[] | undefined): ErrorWindow {
  return v === "7d" || v === "30d" ? v : "24h"
}
function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function AdminErrorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: "dashboard_admin.errors" })
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect(`/${locale}/dashboard/resumes`)
  }

  const report = await getErrorReport({
    window: parseWindow(sp.window),
    source: first(sp.source),
    q: first(sp.q),
  })

  // Resolve display emails for issues whose snapshot is missing but a userId exists.
  const missing = [...new Set(report.issues.filter((i) => !i.lastUserEmail && i.lastUserId).map((i) => i.lastUserId!))]
  const emailById = new Map<string, string>()
  if (missing.length > 0) {
    const users = await db.user.findMany({ where: { id: { in: missing } }, select: { id: true, email: true } })
    for (const u of users) emailById.set(u.id, u.email)
  }

  const view: ServiceErrorsReport = {
    window: report.window,
    total: report.total,
    affectedUsers: report.affectedUsers,
    topSource: report.topSource,
    sources: report.sources,
    issues: report.issues.map((i) => ({
      fingerprint: i.fingerprint,
      source: i.source,
      endpoint: i.endpoint,
      message: i.message,
      stack: i.stack,
      statusCode: i.statusCode,
      count: i.count,
      lastSeen: i.lastSeen,
      lastUserId: i.lastUserId,
      lastUserEmail: i.lastUserEmail ?? (i.lastUserId ? emailById.get(i.lastUserId) ?? null : null),
      context: i.context,
    })),
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Page head */}
      <div className="dash-card-in" style={{ animationDelay: "0ms" }}>
        <div className="mb-7 flex flex-col">
          <Link
            href={`/${locale}/dashboard/admin`}
            className="inline-flex items-center gap-1.5 text-[12px] text-[#6B7A8C] hover:text-[#00D4FF] transition-colors duration-150 mb-3 w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("back_to_admin")}
          </Link>
          <div className="flex items-center gap-[7px] text-[10px] font-bold tracking-[0.1em] uppercase text-[#00D4FF] mb-[6px]">
            <span className="inline-block w-[14px] h-[1.5px] bg-[#00D4FF] opacity-50" />
            {t("eyebrow")}
          </div>
          <h1
            className="text-[32px] font-bold text-[#1a2e4a] tracking-[-0.035em] leading-[1.1] m-0"
            style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
          >
            {t("page_title")}
          </h1>
          <p className="text-[13.5px] text-[#6B7A8C] mt-[6px]">{t("page_subtitle")}</p>
        </div>
      </div>

      <div className="dash-card-in" style={{ animationDelay: "60ms" }}>
        <ServiceErrorsPanel report={view} />
      </div>
    </div>
  )
}
