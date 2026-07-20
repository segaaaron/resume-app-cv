"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { RefreshCw, Receipt, ShieldAlert, Ban, RefreshCcw, UserCog, History } from "lucide-react"

interface TimelineItem {
  id: string
  action: string
  userId: string
  userEmail: string | null
  metadata: unknown
  createdAt: string
}

// action → icon + accent color (never color-only: label always shown)
const ACTION_STYLE: Record<string, { color: string; icon: typeof Receipt }> = {
  REFUND_ISSUED: { color: "#B4740B", icon: Receipt },
  PARTIAL_REFUND: { color: "#B4740B", icon: Receipt },
  DISPUTE_CHARGEBACK: { color: "#D33636", icon: ShieldAlert },
  DISPUTE_CLOSED: { color: "#6B7A8C", icon: ShieldAlert },
  DISPUTE_WON_MANUAL_REVIEW: { color: "#0F9A6E", icon: ShieldAlert },
  FRAUD_WARNING: { color: "#D33636", icon: ShieldAlert },
  CANCEL_SUBSCRIPTION: { color: "#6B7A8C", icon: Ban },
  SUBSCRIPTION_UPDATED: { color: "#00A8CC", icon: RefreshCcw },
  SUBSCRIPTION_CREATED_EXTERNAL: { color: "#0F9A6E", icon: RefreshCcw },
  PROFILE_SYNCED_FROM_STRIPE: { color: "#6B7A8C", icon: UserCog },
  ADMIN_RECONCILE_USER: { color: "#6B8AC4", icon: UserCog },
}

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.round(hr / 24)}d`
}

export default function StripeBillingTimeline() {
  const t = useTranslations("dashboard_admin.stripe")
  const [items, setItems] = useState<TimelineItem[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async (reset: boolean, cur: string | null) => {
    setLoading(true)
    setError(false)
    try {
      const p = new URLSearchParams()
      if (!reset && cur) p.set("cursor", cur)
      const res = await fetch(`/api/admin/stripe/billing-timeline?${p.toString()}`)
      if (!res.ok) throw new Error("fetch failed")
      const data: { items: TimelineItem[]; nextCursor: string | null } = await res.json()
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]))
      setCursor(data.nextCursor)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(true, null)
  }, [load])

  // Action label falls back to a humanized action key if no translation exists.
  const actionLabel = (action: string) => {
    const key = `action_${action}`
    return t.has(key) ? t(key) : action.replace(/_/g, " ")
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C]">
          <History className="w-3.5 h-3.5 text-[#00D4FF]" />
          {t("timeline_title")}
        </div>
        <button
          onClick={() => load(true, null)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-[11.5px] font-bold text-[#6B7A8C] border border-[#D9E1ED] bg-white hover:text-[#1a2e4a] transition-colors duration-150 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {t("refresh")}
        </button>
      </div>

      {error ? (
        <div className="text-[12.5px] text-[#D33636] py-6 text-center border border-[#D9E1ED] rounded-[10px] bg-white">{t("feed_error")}</div>
      ) : items.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-[10px] border border-[#D9E1ED] bg-white">
          <div className="w-11 h-11 rounded-full bg-[rgba(0,212,255,0.10)] flex items-center justify-center mb-3">
            <History className="w-5 h-5 text-[#00A8CC]" />
          </div>
          <div className="text-[14px] font-bold text-[#1a2e4a]">{t("timeline_empty_title")}</div>
          <div className="text-[12px] text-[#6B7A8C] mt-1">{t("timeline_empty_subtitle")}</div>
        </div>
      ) : (
        <>
          <div className="flex flex-col">
            {items.map((it) => {
              const style = ACTION_STYLE[it.action] ?? { color: "#6B7A8C", icon: History }
              const Icon = style.icon
              const open = expanded === it.id
              const hasMeta = it.metadata != null && Object.keys(it.metadata as object).length > 0
              return (
                <div key={it.id} className="border-b border-[#EDF1F7] last:border-0">
                  <button
                    onClick={() => hasMeta && setExpanded(open ? null : it.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors duration-150 ${hasMeta ? "hover:bg-[#F7FAFD] cursor-pointer" : "cursor-default"}`}
                  >
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${style.color}18` }}>
                      <Icon className="w-4 h-4" style={{ color: style.color }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-bold text-[#1a2e4a]">{actionLabel(it.action)}</div>
                      <div className="text-[11px] text-[#6B7A8C] truncate">{it.userEmail ?? it.userId}</div>
                    </div>
                    <span className="text-[11px] text-[#6B7A8C] whitespace-nowrap tabular-nums" style={{ fontFamily: "var(--mono,monospace)" }}>{relative(it.createdAt)}</span>
                  </button>
                  {open && hasMeta && (
                    <div className="px-4 pb-3 pl-[60px]">
                      <pre className="text-[11px] leading-relaxed text-[#4A5A6E] bg-white border border-[#D9E1ED] rounded-[8px] p-3 overflow-x-auto max-h-52" style={{ fontFamily: "var(--mono,monospace)" }}>
                        {JSON.stringify(it.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {cursor && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => load(false, cursor)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2 text-[12.5px] font-bold text-[#1a2e4a] border border-[#D9E1ED] bg-white hover:border-[#00D4FF] transition-colors duration-150 disabled:opacity-60"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                {t("load_more")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
