"use client"

import { useTranslations } from "next-intl"
import { format } from "date-fns"
import GrantAccessCard from "./GrantAccessCard"

/**
 * Ficha de soporte. Sólo presenta: la página ya trajo los datos.
 *
 * Cada bloque responde una pregunta que hoy obliga a abrir la base a mano:
 * quién es · qué plan tiene y hasta cuándo · cuánto usó · qué le pasó últimamente.
 */

type UserData = {
  id: string
  name: string | null
  email: string
  plan: string
  subscriptionStatus: string
  subscriptionEndsAt: string | null
  planInterval: string | null
  paymentProvider: string | null
  role: string
  createdAt: string
  lastActiveAt: string
  emailVerified: string | null
  deletedAt: string | null
  stripeCustomerId: string | null
  subscriptionId: string | null
  paypalSubscriptionId: string | null
  isManaged: boolean
  managedBlocked: boolean
  managedExpiresAt: string | null
  managedDownloadLimit: number | null
  managedDownloadsUsed: number
  managedResumeLimit: number | null
  managedCoverLetterLimit: number | null
  managedNote: string | null
  referredBy: string | null
}

const d = (v: string | null) => (v ? format(new Date(v), "d MMM yyyy HH:mm") : "—")

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-dash-border rounded-[10px] overflow-hidden">
      <div className="px-4 py-[11px] border-b border-dash-border-s bg-dash-surface">
        <span className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-dash-muted">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 py-[5px] border-b border-dash-border-s last:border-0">
      <span className="text-[11px] text-dash-muted w-[170px] shrink-0">{k}</span>
      <span className="text-[12.5px] text-dash-navy font-medium break-all">{v}</span>
    </div>
  )
}

export default function UserDetailPanel({
  user,
  counts,
  audit,
  ai,
}: {
  user: UserData
  counts: { resumes: number; letters: number; applications: number }
  audit: Array<{ id: string; action: string; metadata: Record<string, unknown> | null; createdAt: string }>
  ai: Array<{ endpoint: string; calls: number; costUsd: number }>
}) {
  const t = useTranslations("dashboard_admin")
  const totalCalls = ai.reduce((s, r) => s + r.calls, 0)
  const totalCost = ai.reduce((s, r) => s + r.costUsd, 0)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-[24px] font-semibold text-dash-navy tracking-[-0.03em] m-0">
          {user.name || t("detail_no_name")}
        </h1>
        <p className="font-mono text-[12px] text-dash-muted mt-1 mb-0">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t("detail_account")}>
          <Row k={t("detail_plan")} v={user.plan} />
          <Row k={t("detail_status")} v={user.subscriptionStatus} />
          <Row k={t("detail_interval")} v={user.planInterval ?? "—"} />
          <Row k={t("detail_renewal")} v={d(user.subscriptionEndsAt)} />
          <Row k={t("detail_provider")} v={user.paymentProvider ?? "—"} />
          <Row k={t("detail_role")} v={user.role} />
          <Row k={t("detail_verified")} v={d(user.emailVerified)} />
          <Row k={t("detail_created")} v={d(user.createdAt)} />
          <Row k={t("detail_last_active")} v={d(user.lastActiveAt)} />
          {user.deletedAt && <Row k={t("detail_deleted")} v={d(user.deletedAt)} />}
          {user.referredBy && <Row k={t("detail_referred")} v={user.referredBy} />}
        </Card>

        <Card title={t("detail_usage")}>
          <Row k={t("detail_resumes")} v={counts.resumes} />
          <Row k={t("detail_letters")} v={counts.letters} />
          <Row k={t("detail_applications")} v={counts.applications} />
          <Row k={t("detail_ai_calls")} v={totalCalls} />
          <Row k={t("detail_ai_cost")} v={`$${totalCost.toFixed(4)}`} />
          {user.isManaged && (
            <>
              <Row k={t("detail_managed_expires")} v={d(user.managedExpiresAt)} />
              <Row k={t("detail_managed_blocked")} v={user.managedBlocked ? t("detail_yes") : t("detail_no")} />
              <Row
                k={t("detail_managed_downloads")}
                v={`${user.managedDownloadsUsed} / ${user.managedDownloadLimit ?? "∞"}`}
              />
              {user.managedNote && <Row k={t("detail_managed_note")} v={user.managedNote} />}
            </>
          )}
        </Card>
      </div>

      <GrantAccessCard userId={user.id} isManaged={user.isManaged} />

      {/* Los ids de pasarela son lo primero que se busca al cruzar un cobro con Stripe. */}
      <Card title={t("detail_gateway")}>
        <Row k="stripeCustomerId" v={user.stripeCustomerId ?? "—"} />
        <Row k="subscriptionId" v={user.subscriptionId ?? "—"} />
        <Row k="paypalSubscriptionId" v={user.paypalSubscriptionId ?? "—"} />
        <Row k="userId" v={user.id} />
      </Card>

      {ai.length > 0 && (
        <Card title={t("detail_ai_by_endpoint")}>
          <div className="flex flex-col">
            {ai.sort((a, b) => b.calls - a.calls).map((r) => (
              <Row key={r.endpoint} k={r.endpoint} v={`${r.calls} · $${r.costUsd.toFixed(4)}`} />
            ))}
          </div>
        </Card>
      )}

      <Card title={t("detail_audit")}>
        {audit.length === 0 ? (
          <p className="text-[12px] text-dash-muted m-0">{t("detail_audit_empty")}</p>
        ) : (
          <div className="flex flex-col">
            {audit.map((a) => (
              <div key={a.id} className="flex items-baseline gap-3 py-[5px] border-b border-dash-border-s last:border-0">
                <span className="font-mono text-[10.5px] text-dash-muted w-[135px] shrink-0">{d(a.createdAt)}</span>
                <span className="text-[12px] font-semibold text-dash-navy w-[210px] shrink-0">{a.action}</span>
                <span className="font-mono text-[10.5px] text-dash-muted break-all">
                  {a.metadata ? JSON.stringify(a.metadata) : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
