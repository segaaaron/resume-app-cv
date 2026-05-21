"use client"

import { useState } from "react"
import { format } from "date-fns"
import { RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"

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
  const [hovered, setHovered] = useState(false)

  const isPro = user.plan === "PRO"
  const isActive = user.subscriptionStatus === "ACTIVE"
  const isAdmin = user.role === "SUPER_ADMIN"

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ transition: "background 0.14s ease" }}
    >
      {/* Usuario */}
      <td style={{
        padding: "14px 16px", fontSize: 13, color: "#1a2e4a",
        borderBottom: isLast ? "none" : "1px solid #E8EDF6",
        background: hovered ? "#EEF2F9" : "transparent",
        verticalAlign: "middle",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontWeight: 600, color: "#1a2e4a", fontSize: 13 }}>
            {user.name ?? "—"}
          </span>
          <span style={{ fontSize: 11, color: "#A0AABE", fontFamily: "var(--dash-mono)" }}>
            {user.email}
          </span>
        </div>
      </td>

      {/* Plan */}
      <td style={{
        padding: "14px 16px", fontSize: 13,
        borderBottom: isLast ? "none" : "1px solid #E8EDF6",
        background: hovered ? "#EEF2F9" : "transparent",
        verticalAlign: "middle",
      }}>
        {isPro ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 5,
            fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
            background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
            color: "#00D4FF", whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: 7 }}>◆</span> PRO
          </span>
        ) : (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 5,
            fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
            background: "rgba(255,255,255,0.04)", border: "1px solid #E8EDF6",
            color: "#A0AABE", whiteSpace: "nowrap",
          }}>
            FREE
          </span>
        )}
      </td>

      {/* Estado */}
      <td style={{
        padding: "14px 16px", fontSize: 13,
        borderBottom: isLast ? "none" : "1px solid #E8EDF6",
        background: hovered ? "#EEF2F9" : "transparent",
        verticalAlign: "middle",
      }}>
        {isActive ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 5,
            fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
            background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)",
            color: "#10B981", whiteSpace: "nowrap",
          }}>
            {t("status_active")}
          </span>
        ) : (
          <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "2px 8px", borderRadius: 5,
            fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
            background: "#F5F7FB", border: "1px solid #E8EDF6",
            color: "#A0AABE", whiteSpace: "nowrap",
          }}>
            {user.subscriptionStatus === "CANCELED" ? t("status_canceled")
              : user.subscriptionStatus === "EXPIRED" ? t("status_expired")
              : "—"}
          </span>
        )}
      </td>

      {/* Intervalo */}
      <td style={{
        padding: "14px 16px", fontSize: 13, color: "#6B7A8C",
        borderBottom: isLast ? "none" : "1px solid #E8EDF6",
        background: hovered ? "#EEF2F9" : "transparent",
        verticalAlign: "middle",
      }}>
        {user.planInterval === "monthly" ? t("interval_monthly")
          : user.planInterval === "annual" ? t("interval_annual")
          : "—"}
      </td>

      {/* Renovación */}
      <td style={{
        padding: "14px 16px", fontSize: 13, color: "#6B7A8C",
        borderBottom: isLast ? "none" : "1px solid #E8EDF6",
        background: hovered ? "#EEF2F9" : "transparent",
        verticalAlign: "middle",
      }}>
        <span style={{ fontFamily: "var(--dash-mono)", fontSize: 11.5, color: "#6B7A8C" }}>
          {user.subscriptionEndsAt
            ? format(new Date(user.subscriptionEndsAt), "dd MMM yyyy")
            : "—"}
        </span>
      </td>

      {/* Última actividad */}
      <td style={{
        padding: "14px 16px",
        borderBottom: isLast ? "none" : "1px solid #E8EDF6",
        background: hovered ? "#EEF2F9" : "transparent",
        verticalAlign: "middle",
      }}>
        <span style={{ fontFamily: "var(--dash-mono)", fontSize: 11.5, color: "#6B7A8C" }}>
          {format(new Date(user.lastActiveAt), "dd MMM yyyy HH:mm")}
        </span>
      </td>

      {/* Rol */}
      <td style={{
        padding: "14px 16px",
        borderBottom: isLast ? "none" : "1px solid #E8EDF6",
        background: hovered ? "#EEF2F9" : "transparent",
        verticalAlign: "middle",
      }}>
        {isAdmin ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 5,
            fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
            background: "rgba(107,138,196,0.12)", border: "1px solid rgba(107,138,196,0.2)",
            color: "#6B8AC4", whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: 8 }}>○</span> {t("role_admin")}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#A0AABE" }}>{t("role_user")}</span>
        )}
      </td>

      {/* Acciones */}
      <td style={{
        padding: "14px 16px", textAlign: "right",
        borderBottom: isLast ? "none" : "1px solid #E8EDF6",
        background: hovered ? "#EEF2F9" : "transparent",
        verticalAlign: "middle",
      }}>
        {!isAdmin && (
          <ActionBtn loading={loading === user.id} onClick={onAction} />
        )}
      </td>
    </tr>
  )
}

export function ActionBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  const t = useTranslations("dashboard_admin")
  const [hovered, setHovered] = useState(false)
  return (
    <button
      disabled={loading}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "4px 10px", border: `1px solid ${hovered ? "#00D4FF" : "#D9E1ED"}`,
        borderRadius: 5, background: hovered ? "#EEF2F9" : "transparent",
        color: hovered ? "#1a2e4a" : "#6B7A8C",
        fontSize: 11, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", gap: 5,
        whiteSpace: "nowrap", transition: "all 0.14s ease",
        opacity: loading ? 0.6 : 1,
      }}
    >
      <RefreshCw style={{ width: 10, height: 10 }} className={loading ? "animate-spin" : ""} />
      {t("reset_session")}
    </button>
  )
}
