"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { useTranslations } from "next-intl"
import { AlertCircle } from "lucide-react"
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
import { TableRow, type UserRow } from "./_admin-table-parts"

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
              fontFamily: "var(--dash-mono)", fontSize: 12, fontWeight: i === page ? 700 : 500,
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
          {t("table_registered_users")}
        </span>
        <span style={{
          fontFamily: "var(--dash-mono)", fontSize: 11, color: "#6B7A8C",
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
          {t("table_export_csv")}
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
              {[t("col_user"), t("col_plan"), t("col_status"), t("col_interval"), t("col_renewal"), t("col_last_active"), t("col_role"), t("col_actions")].map((h, i) => (
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
                  {t("table_no_users")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {users.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, padding: "0 4px" }}>
          <div style={{ fontSize: 12, color: "#6B7A8C", fontFamily: "var(--dash-mono)" }}>
            {t("table_showing")}{" "}
            <b style={{ color: "#1a2e4a", fontWeight: 600 }}>{pageFrom}</b>
            –
            <b style={{ color: "#1a2e4a", fontWeight: 600 }}>{pageTo}</b>
            {" "}{t("table_of")}{" "}
            <b style={{ color: "#1a2e4a", fontWeight: 600 }}>{users.length}</b>
            {" "}{t("table_users")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{
                minWidth: 32, height: 32, padding: "0 10px",
                border: "1px solid #D9E1ED", background: "white",
                color: "#6B7A8C", borderRadius: 6,
                fontFamily: "var(--dash-mono)", fontSize: 12, fontWeight: 500,
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
                fontFamily: "var(--dash-mono)", fontSize: 12, fontWeight: 500,
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
              {t("invalidate_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("invalidate_desc", { email: confirmUser?.email ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("invalidate_cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => confirmId && invalidateSession(confirmId)}
            >
              {t("invalidate_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
