import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import AdminUsersTable from "@/components/admin/AdminUsersTable"
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
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Page head */}
      <div className="dash-card-in" style={{ animationDelay: "0ms", marginBottom: 28 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          color: "#00D4FF", marginBottom: 6,
          display: "flex", alignItems: "center", gap: 7,
        }}>
          <span style={{ width: 14, height: 1.5, background: "#00D4FF", opacity: 0.5, display: "inline-block" }} />
          {t("eyebrow")}
        </div>
        <h1 style={{
          fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)",
          fontSize: 32, fontWeight: 700, color: "#1a2e4a",
          letterSpacing: "-0.035em", lineHeight: 1.1, margin: 0,
        }}>
          {t("page_title")}
        </h1>
        <p style={{ fontSize: 13.5, color: "#6B7A8C", marginTop: 6 }}>
          {t("subtitle", { count: totalUsers })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="dash-card-in" style={{
        animationDelay: "60ms",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        marginBottom: 28,
      }}>
        {/* Total usuarios */}
        <div style={{
          background: "white", border: "1px solid #D9E1ED",
          borderRadius: 10, padding: 20,
          position: "relative", overflow: "hidden",
          transition: "all 0.2s ease",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "#6B7A8C", marginBottom: 8,
          }}>
            {t("stat_total_users")}
          </div>
          <div style={{
            fontFamily: "var(--mono,monospace)", fontSize: 24, fontWeight: 700,
            color: "#1a2e4a", letterSpacing: "-0.02em", lineHeight: 1,
          }}>
            {totalUsers}
            <span style={{
              fontFamily: "var(--sans,inherit)", fontSize: 12, fontWeight: 400,
              color: "#6B7A8C", marginLeft: 4, letterSpacing: 0,
            }}>{t("stat_total_accounts")}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#6B7A8C" }}>
            {t("stat_total_note")}
          </div>
          <span style={{
            position: "absolute", bottom: 10, right: 12,
            fontSize: 28, color: "#00D4FF", opacity: 0.05,
            fontFamily: "var(--dash-serif,Georgia,serif)", lineHeight: 1,
            pointerEvents: "none", userSelect: "none",
          }}>§</span>
        </div>

        {/* Suscriptores PRO */}
        <div style={{
          background: "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(0,212,255,0.02) 100%)",
          border: "1px solid rgba(0,212,255,0.15)",
          borderRadius: 10, padding: 20,
          position: "relative", overflow: "hidden",
          transition: "all 0.2s ease",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "#00D4FF", marginBottom: 8, opacity: 1,
          }}>
            {t("stat_pro_subscribers")}
          </div>
          <div style={{
            fontFamily: "var(--mono,monospace)", fontSize: 20, fontWeight: 700,
            color: "#00D4FF", letterSpacing: "-0.02em", lineHeight: 1,
          }}>
            {proCount} {t("stat_pro_unit")}
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#6B7A8C" }}>
            {t("stat_conv_rate", { rate: convRate })}
          </div>
          <span style={{
            position: "absolute", bottom: 10, right: 12,
            fontSize: 28, color: "#00D4FF", opacity: 0.05,
            fontFamily: "var(--dash-serif,Georgia,serif)", lineHeight: 1,
            pointerEvents: "none", userSelect: "none",
          }}>◆</span>
        </div>

        {/* Activos hoy */}
        <div style={{
          background: "white", border: "1px solid #D9E1ED",
          borderRadius: 10, padding: 20,
          position: "relative", overflow: "hidden",
          transition: "all 0.2s ease",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "#6B7A8C", marginBottom: 8,
          }}>
            {t("stat_active_today")}
          </div>
          <div style={{
            fontFamily: "var(--mono,monospace)", fontSize: 24, fontWeight: 700,
            color: "#1a2e4a", letterSpacing: "-0.02em", lineHeight: 1,
          }}>
            {activeToday}
            <span style={{
              fontFamily: "var(--sans,inherit)", fontSize: 12, fontWeight: 400,
              color: "#6B7A8C", marginLeft: 4, letterSpacing: 0,
            }}>{t("stat_sessions")}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#6B7A8C" }}>
            {t("stat_active_24h")}
          </div>
          <span style={{
            position: "absolute", bottom: 10, right: 12,
            fontSize: 28, color: "#00D4FF", opacity: 0.05,
            fontFamily: "var(--dash-serif,Georgia,serif)", lineHeight: 1,
            pointerEvents: "none", userSelect: "none",
          }}>◈</span>
        </div>

        {/* MRR */}
        <div style={{
          background: "white", border: "1px solid #D9E1ED",
          borderRadius: 10, padding: 20,
          position: "relative", overflow: "hidden",
          transition: "all 0.2s ease",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "#6B7A8C", marginBottom: 8,
          }}>
            {t("stat_mrr")}
          </div>
          <div style={{
            fontFamily: "var(--mono,monospace)", fontSize: 24, fontWeight: 700,
            color: "#1a2e4a", letterSpacing: "-0.02em", lineHeight: 1,
          }}>
            ${mrr}
            <span style={{
              fontFamily: "var(--sans,inherit)", fontSize: 12, fontWeight: 400,
              color: "#6B7A8C", marginLeft: 4, letterSpacing: 0,
            }}>{t("stat_mrr_unit")}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#6B7A8C" }}>
            {t("stat_mrr_note", { count: proCount })}
          </div>
          <span style={{
            position: "absolute", bottom: 10, right: 12,
            fontSize: 28, color: "#00D4FF", opacity: 0.05,
            fontFamily: "var(--dash-serif,Georgia,serif)", lineHeight: 1,
            pointerEvents: "none", userSelect: "none",
          }}>$</span>
        </div>
      </div>

      {/* Table */}
      <div className="dash-card-in" style={{ animationDelay: "120ms" }}>
        <AdminUsersTable users={users} />
      </div>

    </div>
  )
}
