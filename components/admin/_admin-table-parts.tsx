"use client"

import { format } from "date-fns"
import { RefreshCw } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"

export interface UserRow {
  id:                 string
  name:               string | null
  email:              string | null
  plan:               string
  subscriptionStatus: string
  subscriptionEndsAt: Date | null
  planInterval:       string | null
  role:               string
  stripeCustomerId:   string | null
  createdAt:          Date
  lastActiveAt:       Date
}

export function TableRow({
  user,
  loading,
  onAction,
  isLast,
}: {
  user: UserRow
  loading: string | null
  onAction: () => void
  isLast: boolean
}) {
  const t = useTranslations("dashboard_admin")
  const locale = useLocale()

  const isPro = user.plan === "PRO"
  const isActive = user.subscriptionStatus === "ACTIVE"
  const isAdmin = user.role === "SUPER_ADMIN"

  const borderClass = isLast ? "" : "border-b border-dash-border-s"
  const tdBase = `px-4 py-[14px] text-[13px] align-middle transition-colors duration-[140ms] ${borderClass} group-hover:bg-dash-surface2`

  return (
    <tr className="group">
      {/* Usuario */}
      <td className={`${tdBase} text-dash-navy`}>
        {/* El nombre es el acceso a la ficha: cuando llega un ticket, el camino natural es
            buscar a la persona y abrirla, no copiar su id a otra pantalla. */}
        <Link href={`/${locale}/dashboard/admin/users/${user.id}`} className="flex flex-col gap-[2px] group/link">
          <span className="font-semibold text-dash-navy text-[13px] group-hover/link:text-dash-cyan transition-colors">
            {user.name ?? "—"}
          </span>
          <span className="text-[11px] text-dash-subtle font-mono">
            {user.email}
          </span>
        </Link>
      </td>

      {/* Plan */}
      <td className={tdBase}>
        {isPro ? (
          <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-[5px] text-[11px] font-semibold tracking-[0.04em] bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] text-dash-cyan whitespace-nowrap">
            <span className="text-[7px]">◆</span> PRO
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-[5px] text-[11px] font-semibold tracking-[0.04em] bg-[rgba(255,255,255,0.04)] border border-dash-border-s text-dash-subtle whitespace-nowrap">
            FREE
          </span>
        )}
      </td>

      {/* Estado */}
      <td className={tdBase}>
        {isActive ? (
          <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-[5px] text-[11px] font-semibold tracking-[0.04em] bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.2)] text-emerald-500 whitespace-nowrap">
            {t("status_active")}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-[2px] rounded-[5px] text-[11px] font-semibold tracking-[0.04em] bg-dash-surface border border-dash-border-s text-dash-subtle whitespace-nowrap">
            {user.subscriptionStatus === "CANCELED" ? t("status_canceled")
              : user.subscriptionStatus === "EXPIRED" ? t("status_expired")
              : "—"}
          </span>
        )}
      </td>

      {/* Intervalo */}
      <td className={`${tdBase} text-dash-muted`}>
        {user.planInterval === "monthly" ? t("interval_monthly")
          : user.planInterval === "annual" ? t("interval_annual")
          : "—"}
      </td>

      {/* Renovación */}
      <td className={tdBase}>
        <span className="font-mono text-[11.5px] text-dash-muted">
          {user.subscriptionEndsAt
            ? format(new Date(user.subscriptionEndsAt), "dd MMM yyyy")
            : "—"}
        </span>
      </td>

      {/* Última actividad */}
      <td className={tdBase}>
        <span className="font-mono text-[11.5px] text-dash-muted">
          {format(new Date(user.lastActiveAt), "dd MMM yyyy HH:mm")}
        </span>
      </td>

      {/* Rol */}
      <td className={tdBase}>
        {isAdmin ? (
          <span className="inline-flex items-center gap-1 px-2 py-[2px] rounded-[5px] text-[11px] font-semibold tracking-[0.04em] bg-[rgba(107,138,196,0.12)] border border-[rgba(107,138,196,0.2)] text-[#6B8AC4] whitespace-nowrap">
            <span className="text-[8px]">○</span> {t("role_admin")}
          </span>
        ) : (
          <span className="text-[12px] text-dash-subtle">{t("role_user")}</span>
        )}
      </td>

      {/* Acciones */}
      <td className={`${tdBase} text-right`}>
        {!isAdmin && (
          <ActionBtn loading={loading === user.id} onClick={onAction} />
        )}
      </td>
    </tr>
  )
}

export function ActionBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  const t = useTranslations("dashboard_admin")
  return (
    <button
      disabled={loading}
      onClick={onClick}
      className="px-[10px] py-1 border border-dash-border rounded-[5px] bg-transparent text-dash-muted text-[11px] font-[inherit] inline-flex items-center gap-[5px] whitespace-nowrap transition-all duration-[140ms] hover:border-dash-cyan hover:bg-dash-surface2 hover:text-dash-navy disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      <RefreshCw style={{ width: 10, height: 10 }} className={loading ? "animate-spin" : ""} />
      {t("reset_session")}
    </button>
  )
}
