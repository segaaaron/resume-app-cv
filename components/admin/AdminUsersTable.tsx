"use client"

import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { RefreshCw, Shield, User, Crown, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

function PlanBadge({ plan, status }: { plan: string; status: string }) {
  if (plan === "PRO") {
    const color = status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : status === "CANCELED" ? "bg-amber-100 text-amber-800 border-amber-200"
                : "bg-red-100 text-red-800 border-red-200"
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}><Crown className="h-3 w-3" /> PRO</span>
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-600 border-gray-200"><User className="h-3 w-3" /> Sin plan</span>
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:   "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELED: "bg-amber-100 text-amber-700 border-amber-200",
    EXPIRED:  "bg-red-100 text-red-700 border-red-200",
    NONE:     "bg-gray-100 text-gray-500 border-gray-200",
  }
  const labels: Record<string, string> = {
    ACTIVE: "Activo", CANCELED: "Cancelado", EXPIRED: "Expirado", NONE: "—",
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? map.NONE}`}>
      {labels[status] ?? status}
    </span>
  )
}

export default function AdminUsersTable({ users: initial }: { users: UserRow[] }) {
  const t = useTranslations("dashboard_admin")
  const [users, setUsers] = useState(initial)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const confirmUser = users.find(u => u.id === confirmId)

  async function invalidateSession(userId: string) {
    setLoading(userId)
    try {
      const res = await fetch("/api/admin/invalidate-session", {
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

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Intervalo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Renovación</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Última actividad</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium truncate max-w-[180px]">{user.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={user.plan} status={user.subscriptionStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.subscriptionStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.planInterval === "monthly" ? "Mensual"
                     : user.planInterval === "annual" ? "Anual"
                     : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.subscriptionEndsAt
                      ? format(new Date(user.subscriptionEndsAt), "dd MMM yyyy")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(user.lastActiveAt), "dd MMM yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "SUPER_ADMIN"
                      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"><Shield className="h-3 w-3" /> Admin</span>
                      : <span className="text-muted-foreground text-xs">Usuario</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role !== "SUPER_ADMIN" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={loading === user.id}
                        onClick={() => setConfirmId(user.id)}
                      >
                        <RefreshCw className={`h-3 w-3 ${loading === user.id ? "animate-spin" : ""}`} />
                        Reset sesión
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
