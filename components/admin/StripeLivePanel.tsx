"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { RefreshCw, Wallet, Zap, ShieldAlert, CreditCard, CloudOff } from "lucide-react"
import { apiFetch } from "@/lib/apiFetch"

interface Money { amount: number; currency: string }
interface Charge { id: string; amount: number; currency: string; status: string; paid: boolean; refunded: boolean; description: string | null; email: string | null; created: number }
interface Dispute { id: string; amount: number; currency: string; reason: string; status: string; chargeId: string | null; created: number }
interface LiveData {
  generatedAt: string
  balance: { available: Money[]; pending: Money[] } | null
  recentCharges: Charge[] | null
  openDisputes: Dispute[] | null
  subscriptions: { activeCount: number; hasMore: boolean } | null
  errors: string[]
}

function money(amount: number, currency: string): string {
  return `${(amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency.toUpperCase()}`
}

export default function StripeLivePanel() {
  const t = useTranslations("dashboard_admin.stripe")
  const [data, setData] = useState<LiveData | null>(null)
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<"ok" | "disabled" | "error">("ok")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch("/api/admin/stripe/live")
      if (res.status === 503) { setState("disabled"); setData(null); return }
      if (!res.ok) throw new Error("fetch failed")
      setData(await res.json())
      setState("ok")
    } catch {
      setState("error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C]">
          <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
          {t("live_title")}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-[11.5px] font-bold text-[#6B7A8C] border border-[#D9E1ED] bg-white hover:text-[#1a2e4a] transition-colors duration-150 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {t("refresh")}
        </button>
      </div>

      {state === "disabled" ? (
        <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-[10px] border border-[#D9E1ED] bg-white">
          <div className="w-11 h-11 rounded-full bg-[rgba(107,122,140,0.10)] flex items-center justify-center mb-3">
            <CloudOff className="w-5 h-5 text-[#6B7A8C]" />
          </div>
          <div className="text-[14px] font-bold text-[#1a2e4a]">{t("live_disabled_title")}</div>
          <div className="text-[12px] text-[#6B7A8C] mt-1">{t("live_disabled_subtitle")}</div>
        </div>
      ) : state === "error" ? (
        <div className="text-[12.5px] text-[#D33636] py-6 text-center border border-[#D9E1ED] rounded-[10px] bg-white">{t("live_error")}</div>
      ) : loading && !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-[10px] border border-[#D9E1ED] bg-[#F7FAFD] animate-pulse" />)}
        </div>
      ) : data ? (
        <>
          {data.errors.length > 0 && (
            <div className="mb-4 text-[11.5px] text-[#B4740B] bg-[rgba(245,158,11,0.10)] border border-[rgba(245,158,11,0.25)] rounded-[8px] px-3 py-2">
              {t("live_partial", { sections: data.errors.join(", ") })}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Balance */}
            <Card icon={Wallet} title={t("live_balance")}>
              {data.balance ? (
                <div className="flex flex-col gap-2">
                  <Row label={t("live_available")}>
                    {data.balance.available.length ? data.balance.available.map((b) => <Amount key={b.currency} v={money(b.amount, b.currency)} tone="#0F9A6E" />) : <Muted />}
                  </Row>
                  <Row label={t("live_pending")}>
                    {data.balance.pending.length ? data.balance.pending.map((b) => <Amount key={b.currency} v={money(b.amount, b.currency)} tone="#6B7A8C" />) : <Muted />}
                  </Row>
                </div>
              ) : <Muted />}
            </Card>

            {/* Subscriptions */}
            <Card icon={CreditCard} title={t("live_subscriptions")}>
              {data.subscriptions ? (
                <div className="text-[24px] font-bold text-[#00A8CC] tabular-nums" style={{ fontFamily: "var(--mono,monospace)" }}>
                  {data.subscriptions.activeCount}{data.subscriptions.hasMore ? "+" : ""}
                  <span className="text-[12px] font-normal text-[#6B7A8C] ml-2" style={{ fontFamily: "inherit" }}>{t("live_active_subs")}</span>
                </div>
              ) : <Muted />}
            </Card>

            {/* Open disputes */}
            <Card icon={ShieldAlert} title={t("live_disputes")}>
              {data.openDisputes ? (
                data.openDisputes.length === 0 ? (
                  <div className="flex items-center gap-2 text-[12.5px] text-[#0F9A6E]"><span className="w-2 h-2 rounded-full bg-[#0F9A6E]" />{t("live_no_disputes")}</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {data.openDisputes.map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-2 border-b border-[#EDF1F7] last:border-0 pb-1.5 last:pb-0">
                        <div className="min-w-0">
                          <div className="text-[12px] font-bold text-[#D33636]">{money(d.amount, d.currency)}</div>
                          <code className="text-[10px] text-[#6B7A8C]" style={{ fontFamily: "var(--mono,monospace)" }}>{d.reason} · {d.status}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : <Muted />}
            </Card>

            {/* Recent charges */}
            <Card icon={Zap} title={t("live_recent_charges")}>
              {data.recentCharges ? (
                data.recentCharges.length === 0 ? <Muted /> : (
                  <div className="flex flex-col gap-1.5">
                    {data.recentCharges.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 border-b border-[#EDF1F7] last:border-0 pb-1.5 last:pb-0">
                        <div className="min-w-0">
                          <div className="text-[12px] font-bold text-[#1a2e4a] tabular-nums" style={{ fontFamily: "var(--mono,monospace)" }}>{money(c.amount, c.currency)}</div>
                          <span className="text-[10.5px] text-[#6B7A8C] truncate block">{c.email ?? c.description ?? c.id}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: c.refunded ? "rgba(107,122,140,0.10)" : c.paid ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.10)", color: c.refunded ? "#6B7A8C" : c.paid ? "#0F9A6E" : "#D33636" }}>
                          {c.refunded ? t("charge_refunded") : c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ) : <Muted />}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}

function Card({ icon: Icon, title, children }: { icon: typeof Wallet; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#D9E1ED] rounded-[10px] p-4">
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C] mb-3">
        <Icon className="w-3.5 h-3.5 text-[#00D4FF]" />
        {title}
      </div>
      {children}
    </div>
  )
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11.5px] text-[#6B7A8C]">{label}</span>
      <div className="flex flex-col items-end gap-0.5">{children}</div>
    </div>
  )
}
function Amount({ v, tone }: { v: string; tone: string }) {
  return <span className="text-[13px] font-bold tabular-nums" style={{ fontFamily: "var(--mono,monospace)", color: tone }}>{v}</span>
}
function Muted() {
  return <span className="text-[12.5px] text-[#6B7A8C]">—</span>
}
