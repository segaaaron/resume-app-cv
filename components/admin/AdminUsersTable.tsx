"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useTranslations } from "next-intl"
import { RefreshCw, AlertCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface UserRow {
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

const PAGE_SIZE = 10

export default function AdminUsersTable({ users: initial }: { users: UserRow[] }) {
  const t = useTranslations("dashboard_admin")
  const [users] = useState(initial)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(users.length / PAGE_SIZE)
  const pageFrom = (page - 1) * PAGE_SIZE + 1
  const pageTo = Math.min(page * PAGE_SIZE, users.length)
  const pageUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const confirmUser = users.find(u => u.id === confirmId)

  const exportUsersCSV = useCallback(() => {
    const headers = ["id", "name", "email", "plan", "subscriptionStatus", "planInterval", "subscriptionEndsAt", "role", "createdAt", "lastActiveAt"]
    const rows = users.map(u => [
      u.id,
      u.name ?? "",
      u.email ?? "",
      u.plan,
      u.subscriptionStatus,
      u.planInterval ?? "",
      u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt).toISOString() : "",
      u.role,
      new Date(u.createdAt).toISOString(),
      new Date(u.lastActiveAt).toISOString(),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `readycv-users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [users])

  useEffect(() => {
    document.addEventListener("admin-export-users", exportUsersCSV)
    return () => document.removeEventListener("admin-export-users", exportUsersCSV)
  }, [exportUsersCSV])

  async function invalidateSession(userId: string) {
    setLoading(userId)
    try {
      const res = await apiFetch("/api/admin/invalidate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? t("invalidate_error"))
        return
      }
      toast.success(t("invalidate_success"))
    } catch {
      toast.error(t("invalidate_network_error"))
    } finally {
      setLoading(null)
      setConfirmId(null)
    }
  }

  function renderPageButtons() {
    const btns: React.ReactNode[] = []
    const delta = 2
    const left = page - delta
    const right = page + delta

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        btns.push(
          <button
            key={i}
            onClick={() => setPage(i)}
            style={{
              minWidth: 32, height: 32, padding: "0 10px",
              border: i === page ? "none" : "1px solid #D9E1ED",
              background: i === page ? "linear-gradient(135deg,#00D4FF 0%,#00A8CC 100%)" : "white",
              color: i === page ? "white" : "#6B7A8C",
              borderRadius: 6,
              fontFamily: "var(--mono,monospace)", fontSize: 12, fontWeight: i === page ? 700 : 500,
              cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              boxShadow: i === page ? "0 2px 8px rgba(0,212,255,0.28)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {i}
          </button>
        )
      } else if (i === left - 1 || i === right + 1) {
        btns.push(
          <span key={`e${i}`} style={{ color: "#A0AABE", fontSize: 14, padding: "0 4px", userSelect: "none" }}>…</span>
        )
      }
    }
    return btns
  }

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span style={{
          fontFamily: "var(--serif,'Playfair Display',Georgia,serif)",
          fontSize: 16, fontWeight: 600, color: "#1a2e4a",
          letterSpacing: "-0.025em", flex: 1,
        }}>
          Usuarios registrados
        </span>
        <span style={{
          fontFamily: "var(--mono,monospace)", fontSize: 11, color: "#6B7A8C",
          background: "#EEF2F9", border: "1px solid #E8EDF6",
          borderRadius: 8, padding: "2px 8px",
        }}>
          {users.length} total
        </span>
        <button
          onClick={exportUsersCSV}
          style={{
            padding: "6px 14px", border: "1px solid #D9E1ED",
            borderRadius: 5, background: "transparent", color: "#6B7A8C",
            fontSize: 11, fontFamily: "inherit", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 5,
            transition: "all 0.14s ease", whiteSpace: "nowrap",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "#EEF2F9"
            ;(e.currentTarget as HTMLButtonElement).style.color = "#1a2e4a"
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = "#00D4FF"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent"
            ;(e.currentTarget as HTMLButtonElement).style.color = "#6B7A8C"
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = "#D9E1ED"
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v6M3.5 5l2 2 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 8.5V9.5a1 1 0 001 1h7a1 1 0 001-1V8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: "white", border: "1px solid #D9E1ED",
        borderRadius: 10, overflowX: "auto", overflowY: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #E8EDF6", background: "#F5F7FB" }}>
              {["Usuario", "Plan", "Estado", "Intervalo", "Renovación", "Última actividad", "Rol", "Acciones"].map((h, i) => (
                <th key={h} style={{
                  padding: "11px 16px", textAlign: i === 7 ? "right" : "left",
                  fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#6B7A8C", whiteSpace: "nowrap",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageUsers.map((user, idx) => (
              <TableRow
                key={user.id}
                user={user}
                loading={loading}
                onAction={() => setConfirmId(user.id)}
                isLast={idx === pageUsers.length - 1}
              />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "48px 16px", textAlign: "center", color: "#6B7A8C", fontSize: 13 }}>
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {users.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, padding: "0 4px" }}>
          <div style={{ fontSize: 12, color: "#6B7A8C", fontFamily: "var(--mono,monospace)" }}>
            Mostrando{" "}
            <b style={{ color: "#1a2e4a", fontWeight: 600 }}>{pageFrom}</b>
            –
            <b style={{ color: "#1a2e4a", fontWeight: 600 }}>{pageTo}</b>
            {" "}de{" "}
            <b style={{ color: "#1a2e4a", fontWeight: 600 }}>{users.length}</b>
            {" "}usuarios
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                minWidth: 32, height: 32, padding: "0 10px",
                border: "1px solid #D9E1ED", background: "white",
                color: "#6B7A8C", borderRadius: 6,
                fontFamily: "var(--mono,monospace)", fontSize: 12, fontWeight: 500,
                cursor: page === 1 ? "not-allowed" : "pointer",
                opacity: page === 1 ? 0.4 : 1,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              ‹
            </button>
            {renderPageButtons()}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{
                minWidth: 32, height: 32, padding: "0 10px",
                border: "1px solid #D9E1ED", background: "white",
                color: "#6B7A8C", borderRadius: 6,
                fontFamily: "var(--mono,monospace)", fontSize: 12, fontWeight: 500,
                cursor: page === totalPages ? "not-allowed" : "pointer",
                opacity: page === totalPages ? 0.4 : 1,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmId} onOpenChange={open => { if (!open) setConfirmId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Invalidar sesión
            </AlertDialogTitle>
            <AlertDialogDescription>
              El usuario <span className="font-medium text-foreground">{confirmUser?.email}</span> será deslogueado automáticamente en los próximos 5 minutos. No perderá ningún dato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => confirmId && invalidateSession(confirmId)}
            >
              Invalidar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function TableRow({
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
          <span style={{
            fontSize: 11, color: "#A0AABE",
            fontFamily: "var(--mono,monospace)",
          }}>
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
            Activo
          </span>
        ) : (
          <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "2px 8px", borderRadius: 5,
            fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
            background: "#F5F7FB", border: "1px solid #E8EDF6",
            color: "#A0AABE", whiteSpace: "nowrap",
          }}>
            {user.subscriptionStatus === "CANCELED" ? "Cancelado"
              : user.subscriptionStatus === "EXPIRED" ? "Expirado"
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
        {user.planInterval === "monthly" ? "Mensual"
          : user.planInterval === "annual" ? "Anual"
          : "—"}
      </td>

      {/* Renovación */}
      <td style={{
        padding: "14px 16px", fontSize: 13, color: "#6B7A8C",
        borderBottom: isLast ? "none" : "1px solid #E8EDF6",
        background: hovered ? "#EEF2F9" : "transparent",
        verticalAlign: "middle",
      }}>
        <span style={{ fontFamily: "var(--mono,monospace)", fontSize: 11.5, color: "#6B7A8C" }}>
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
        <span style={{ fontFamily: "var(--mono,monospace)", fontSize: 11.5, color: "#6B7A8C" }}>
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
            <span style={{ fontSize: 8 }}>○</span> Admin
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#A0AABE" }}>Usuario</span>
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

function ActionBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
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
      Reset sesión
    </button>
  )
}
