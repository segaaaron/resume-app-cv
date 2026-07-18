import { redirect } from "next/navigation"
import Link from "next/link"
import { Users as UsersIcon, ArrowRight, Activity, AlertOctagon } from "lucide-react"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import AdminUsersTable from "@/components/admin/AdminUsersTable"
import AIUsagePanel from "@/components/admin/AIUsagePanel"
import { getTranslations } from "next-intl/server"

export const dynamic = "force-dynamic"

export const metadata = { title: "Admin — Users", robots: { index: false, follow: false } }

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "dashboard_admin" })
  const session = await auth()

  if (!session?.user?.id || session.user.role !== "SUPER_ADMIN") {
    redirect(`/${locale}/dashboard/resumes`)
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:                 true,
      name:               true,
      email:              true,
      plan:               true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      planInterval:       true,
      role:               true,
      stripeCustomerId:   true,
      createdAt:          true,
      lastActiveAt:       true,
    },
  })

  const totalUsers   = users.length
  const proUsers     = users.filter(u => u.plan === "PRO" && u.subscriptionStatus === "ACTIVE")
  const proCount     = proUsers.length
  const convRate     = totalUsers > 0 ? Math.round((proCount / totalUsers) * 100) : 0
  const mrr          = proCount * 15

  // Active today: lastActiveAt within last 24h
  const yesterday    = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const activeToday  = users.filter(u => new Date(u.lastActiveAt) > yesterday).length

  return (
    <div className="flex flex-col gap-0">

      {/* Page head */}
      <div className="dash-card-in" style={{ animationDelay: "0ms" }}>
        <div className="mb-7 flex flex-col">
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
          <p className="text-[13.5px] text-[#6B7A8C] mt-[6px]">
            {t("subtitle", { count: totalUsers })}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div
        className="dash-card-in grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-7"
        style={{ animationDelay: "60ms" }}
      >
        {/* Total usuarios */}
        <div className="bg-white border border-[#D9E1ED] rounded-[10px] p-5 relative overflow-hidden transition-all duration-200">
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C] mb-2">
            {t("stat_total_users")}
          </div>
          <div
            className="text-[24px] font-bold text-[#1a2e4a] tracking-[-0.02em] leading-none"
            style={{ fontFamily: "var(--mono,monospace)" }}
          >
            {totalUsers}
            <span
              className="text-[12px] font-normal text-[#6B7A8C] ml-1 tracking-normal"
              style={{ fontFamily: "var(--sans,inherit)" }}
            >
              {t("stat_total_accounts")}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#6B7A8C]">
            {t("stat_total_note")}
          </div>
          <span
            className="absolute bottom-[10px] right-3 text-[28px] text-[#00D4FF] opacity-[0.05] leading-none pointer-events-none select-none"
            style={{ fontFamily: "var(--dash-serif,Georgia,serif)" }}
          >
            §
          </span>
        </div>

        {/* Suscriptores PRO */}
        <div className="bg-gradient-to-br from-[rgba(0,212,255,0.05)] to-[rgba(0,212,255,0.02)] border border-[rgba(0,212,255,0.15)] rounded-[10px] p-5 relative overflow-hidden transition-all duration-200">
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#00D4FF] mb-2">
            {t("stat_pro_subscribers")}
          </div>
          <div
            className="text-[20px] font-bold text-[#00D4FF] tracking-[-0.02em] leading-none"
            style={{ fontFamily: "var(--mono,monospace)" }}
          >
            {proCount} {t("stat_pro_unit")}
          </div>
          <div className="mt-2 text-[11px] text-[#6B7A8C]">
            {t("stat_conv_rate", { rate: convRate })}
          </div>
          <span
            className="absolute bottom-[10px] right-3 text-[28px] text-[#00D4FF] opacity-[0.05] leading-none pointer-events-none select-none"
            style={{ fontFamily: "var(--dash-serif,Georgia,serif)" }}
          >
            ◆
          </span>
        </div>

        {/* Activos hoy */}
        <div className="bg-white border border-[#D9E1ED] rounded-[10px] p-5 relative overflow-hidden transition-all duration-200">
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C] mb-2">
            {t("stat_active_today")}
          </div>
          <div
            className="text-[24px] font-bold text-[#1a2e4a] tracking-[-0.02em] leading-none"
            style={{ fontFamily: "var(--mono,monospace)" }}
          >
            {activeToday}
            <span
              className="text-[12px] font-normal text-[#6B7A8C] ml-1 tracking-normal"
              style={{ fontFamily: "var(--sans,inherit)" }}
            >
              {t("stat_sessions")}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#6B7A8C]">
            {t("stat_active_24h")}
          </div>
          <span
            className="absolute bottom-[10px] right-3 text-[28px] text-[#00D4FF] opacity-[0.05] leading-none pointer-events-none select-none"
            style={{ fontFamily: "var(--dash-serif,Georgia,serif)" }}
          >
            ◈
          </span>
        </div>

        {/* MRR */}
        <div className="bg-white border border-[#D9E1ED] rounded-[10px] p-5 relative overflow-hidden transition-all duration-200">
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C] mb-2">
            {t("stat_mrr")}
          </div>
          <div
            className="text-[24px] font-bold text-[#1a2e4a] tracking-[-0.02em] leading-none"
            style={{ fontFamily: "var(--mono,monospace)" }}
          >
            ${mrr}
            <span
              className="text-[12px] font-normal text-[#6B7A8C] ml-1 tracking-normal"
              style={{ fontFamily: "var(--sans,inherit)" }}
            >
              {t("stat_mrr_unit")}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-[#6B7A8C]">
            {t("stat_mrr_note", { count: proCount })}
          </div>
          <span
            className="absolute bottom-[10px] right-3 text-[28px] text-[#00D4FF] opacity-[0.05] leading-none pointer-events-none select-none"
            style={{ fontFamily: "var(--dash-serif,Georgia,serif)" }}
          >
            $
          </span>
        </div>
      </div>

      {/* Managed users entry point */}
      <div className="dash-card-in mb-7" style={{ animationDelay: "90ms" }}>
        <Link
          href={`/${locale}/dashboard/admin/managed`}
          className="group flex items-center justify-between gap-4 px-5 py-4 rounded-[12px] border border-[rgba(0,212,255,0.18)] bg-gradient-to-br from-[#eef4fb] via-white to-[#dbe6f3] shadow-[0_4px_16px_rgba(15,25,45,0.04)] hover:shadow-[0_8px_28px_rgba(0,212,255,0.18)] hover:-translate-y-px transition-all duration-200 no-underline"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(0,212,255,0.3)]">
              <UsersIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#1a2e4a] tracking-[-0.01em]">
                {t("managed_entry_title")}
              </div>
              <div className="text-[11.5px] text-[#6B7A8C] mt-px">
                {t("managed_entry_subtitle")}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#00D4FF] transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Cron health entry point */}
      <div className="dash-card-in mb-7" style={{ animationDelay: "105ms" }}>
        <Link
          href={`/${locale}/dashboard/admin/crons`}
          className="group flex items-center justify-between gap-4 px-5 py-4 rounded-[12px] border border-[rgba(0,212,255,0.18)] bg-gradient-to-br from-[#eef4fb] via-white to-[#dbe6f3] shadow-[0_4px_16px_rgba(15,25,45,0.04)] hover:shadow-[0_8px_28px_rgba(0,212,255,0.18)] hover:-translate-y-px transition-all duration-200 no-underline"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4FF] to-[#00A8CC] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(0,212,255,0.3)]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#1a2e4a] tracking-[-0.01em]">
                {t("crons_entry_title")}
              </div>
              <div className="text-[11.5px] text-[#6B7A8C] mt-px">
                {t("crons_entry_subtitle")}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#00D4FF] transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Service errors entry point */}
      <div className="dash-card-in mb-7" style={{ animationDelay: "115ms" }}>
        <Link
          href={`/${locale}/dashboard/admin/errors`}
          className="group flex items-center justify-between gap-4 px-5 py-4 rounded-[12px] border border-[rgba(239,68,68,0.18)] bg-gradient-to-br from-[#fbeeee] via-white to-[#f3dbdb] shadow-[0_4px_16px_rgba(15,25,45,0.04)] hover:shadow-[0_8px_28px_rgba(239,68,68,0.15)] hover:-translate-y-px transition-all duration-200 no-underline"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EF4444] to-[#B32A2A] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(239,68,68,0.3)]">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[14px] font-bold text-[#1a2e4a] tracking-[-0.01em]">
                {t("errors_entry_title")}
              </div>
              <div className="text-[11.5px] text-[#6B7A8C] mt-px">
                {t("errors_entry_subtitle")}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#EF4444] transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* AI Usage Panel */}
      <AIUsagePanel />

      {/* Table — horizontal scroll on mobile */}
      <div className="dash-card-in overflow-x-auto" style={{ animationDelay: "120ms" }}>
        <div className="min-w-[600px]">
          <AdminUsersTable users={users} />
        </div>
      </div>

    </div>
  )
}
