"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Gift, Loader2 } from "lucide-react"
import { apiFetch } from "@/lib/apiFetch"

/**
 * Conceder acceso desde la ficha del usuario.
 *
 * El motivo es obligatorio en el formulario y en el endpoint: si sólo lo pidiera la UI,
 * la primera llamada desde otro lado dejaría un acceso regalado sin explicación.
 */
export default function GrantAccessCard({ userId, isManaged }: { userId: string; isManaged: boolean }) {
  const t = useTranslations("dashboard_admin")
  const router = useRouter()
  const [plan, setPlan] = useState<"PRO" | "BASIC" | "SPRINT">("PRO")
  const [days, setDays] = useState("30")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  // Un gestionado recibe su plan de su administrador; ofrecerlo acá crearía dos fuentes
  // para el mismo dato, y el endpoint lo rechaza igual.
  if (isManaged) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch("/api/admin/users/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan, days: Number(days), reason: reason.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }))
        toast.error(body?.error ?? t("grant_error"))
        return
      }
      toast.success(t("grant_done"))
      setReason("")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-dash-border rounded-[10px] overflow-hidden">
      <div className="px-4 py-[11px] border-b border-dash-border-s bg-dash-surface flex items-center gap-2">
        <Gift className="w-3.5 h-3.5 text-dash-muted" />
        <span className="text-[9.5px] font-bold tracking-[0.1em] uppercase text-dash-muted">{t("grant_title")}</span>
      </div>
      <form onSubmit={submit} className="p-4 flex flex-col gap-3">
        <p className="text-[11.5px] text-dash-muted m-0">{t("grant_help")}</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-dash-muted">{t("grant_plan")}</span>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as "PRO" | "BASIC" | "SPRINT")}
              className="h-[32px] rounded-[6px] border border-dash-border bg-white px-2 text-[12.5px] text-dash-navy"
            >
              <option value="PRO">PRO</option>
              <option value="BASIC">BASIC</option>
              <option value="SPRINT">SPRINT</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wide text-dash-muted">{t("grant_days")}</span>
            <input
              type="number"
              min={1}
              max={3650}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="h-[32px] w-[90px] rounded-[6px] border border-dash-border bg-white px-2 text-[12.5px] text-dash-navy"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1 min-w-[220px]">
            <span className="text-[10px] uppercase tracking-wide text-dash-muted">{t("grant_reason")}</span>
            <input
              required
              minLength={3}
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("grant_reason_placeholder")}
              className="h-[32px] w-full rounded-[6px] border border-dash-border bg-white px-2 text-[12.5px] text-dash-navy"
            />
          </label>
          <button
            type="submit"
            disabled={loading || reason.trim().length < 3}
            className="h-[32px] px-4 rounded-[6px] bg-[#1a2e4a] text-white text-[12px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            {t("grant_submit")}
          </button>
        </div>
      </form>
    </div>
  )
}
