"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
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

/**
 * La paginación se mudó al SERVIDOR. Antes la página traía la tabla `User` entera y esto
 * la cortaba de a diez en el navegador: con cuatro usuarios no se nota, con veinte mil la
 * pantalla principal del admin no abre.
 */
export default function AdminUsersTable({
  users,
  total,
  page,
  totalPages,
  query,
}: {
  users: UserRow[]
  total: number
  page: number
  totalPages: number
  query: string
}) {
  const t = useTranslations("dashboard_admin")
  const router = useRouter()
  const pathname = usePathname()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [term, setTerm] = useState(query)

  const pageFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const pageTo = Math.min(page * PAGE_SIZE, total)
  const pageUsers = users
  const confirmUser = users.find(u => u.id === confirmId)

  /** Navegar reescribe la URL: el servidor vuelve a consultar y la búsqueda queda
   *  compartible y en el historial, que es lo que uno espera de un panel. */
  function go(next: { page?: number; q?: string }) {
    const sp = new URLSearchParams()
    const qq = next.q !== undefined ? next.q : query
    if (qq) sp.set("q", qq)
    const p = next.page ?? 1
    if (p > 1) sp.set("page", String(p))
    router.push(`${pathname}${sp.toString() ? `?${sp}` : ""}`)
  }

  // Baja TODOS los usuarios desde el servidor. Armarlo con el array local exportaría
  // sólo la página visible, que es peor que no tener el botón: parece completo y no lo es.
  const exportUsersCSV = useCallback(() => {
    window.location.href = "/api/admin/users/export"
  }, [])

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
        const isActive = i === page
        btns.push(
          <button
            key={i}
            onClick={() => go({ page: i })}
            style={{
              minWidth: 32, height: 32, padding: "0 10px",
              border: isActive ? "none" : "1px solid #D9E1ED",
              background: isActive ? "linear-gradient(135deg,#00D4FF 0%,#00A8CC 100%)" : "white",
              color: isActive ? "white" : "#6B7A8C",
              borderRadius: 6,
              fontFamily: "var(--dash-mono)", fontSize: 12, fontWeight: isActive ? 700 : 500,
              cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              boxShadow: isActive ? "0 2px 8px rgba(0,212,255,0.28)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            {i}
          </button>
        )
      } else if (i === left - 1 || i === right + 1) {
        btns.push(
          <span key={`e${i}`} className="text-dash-subtle text-[14px] px-1 select-none">…</span>
        )
      }
    }
    return btns
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-[10px] mb-[18px]">
        <span className="font-serif text-[16px] font-semibold text-dash-navy tracking-[-0.025em] flex-1">
          {t("table_registered_users")}
        </span>
        {/* Buscador: con cuatro usuarios sobra la vista, con dos mil el soporte llega con
            un email y no con una posición en la lista. Envía por URL para que el servidor
            filtre en la base, no el navegador sobre una página. */}
        <form
          onSubmit={(e) => { e.preventDefault(); go({ q: term.trim(), page: 1 }) }}
          className="flex items-center gap-1.5"
        >
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t("table_search_placeholder")}
            aria-label={t("table_search_placeholder")}
            className="h-[30px] w-[210px] rounded-[6px] border border-dash-border bg-white px-2.5 text-[12px] text-dash-navy outline-none focus:border-dash-cyan"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setTerm(""); go({ q: "", page: 1 }) }}
              className="h-[30px] px-2 rounded-[6px] border border-dash-border bg-transparent text-[11px] text-dash-muted hover:text-dash-navy"
            >
              {t("table_search_clear")}
            </button>
          )}
        </form>
        <span className="font-mono text-[11px] text-dash-muted bg-dash-surface2 border border-dash-border-s rounded-lg px-2 py-[2px]">
          {query ? t("table_search_results", { count: total }) : `${total} total`}
        </span>
        <button
          onClick={exportUsersCSV}
          className="px-[14px] py-[6px] border border-dash-border rounded-[5px] bg-transparent text-dash-muted text-[11px] font-[inherit] cursor-pointer inline-flex items-center gap-[5px] transition-all duration-[140ms] whitespace-nowrap hover:bg-dash-surface2 hover:text-dash-navy hover:border-dash-cyan"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v6M3.5 5l2 2 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 8.5V9.5a1 1 0 001 1h7a1 1 0 001-1V8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {t("table_export_csv")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-dash-border rounded-[10px] overflow-x-auto overflow-y-hidden">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-dash-border-s bg-dash-surface">
              {[t("col_user"), t("col_plan"), t("col_status"), t("col_interval"), t("col_renewal"), t("col_last_active"), t("col_role"), t("col_actions")].map((h, i) => (
                <th key={h} className="px-4 py-[11px] text-[9.5px] font-bold tracking-[0.1em] uppercase text-dash-muted whitespace-nowrap" style={{ textAlign: i === 7 ? "right" : "left" }}>
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
                <td colSpan={8} className="px-4 py-12 text-center text-dash-muted text-[13px]">
                  {t("table_no_users")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {users.length > 0 && (
        <div className="flex items-center justify-between mt-[18px] px-1">
          <div className="text-[12px] text-dash-muted font-mono">
            {t("table_showing")}{" "}
            <b className="text-dash-navy font-semibold">{pageFrom}</b>
            –
            <b className="text-dash-navy font-semibold">{pageTo}</b>
            {" "}{t("table_of")}{" "}
            <b className="text-dash-navy font-semibold">{users.length}</b>
            {" "}{t("table_users")}
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => go({ page: Math.max(1, page - 1) })}
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
              onClick={() => go({ page: Math.min(totalPages, page + 1) })}
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
