"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { RefreshCw, ChevronDown, Webhook } from "lucide-react"
import { relativeTime as relative } from "@/lib/format/relativeTime"

type WebhookStatus = "SUCCESS" | "FAILED" | "SKIPPED"

interface FeedItem {
  id: string
  stripeEventId: string
  type: string
  status: WebhookStatus
  errorMessage: string | null
  latencyMs: number | null
  attempts: number
  objectId: string | null
  userId: string | null
  createdAt: string
}

const STATUS_STYLE: Record<WebhookStatus, { bg: string; text: string; dot: string }> = {
  SUCCESS: { bg: "rgba(16,185,129,0.12)", text: "#0F9A6E", dot: "#10B981" },
  FAILED: { bg: "rgba(239,68,68,0.10)", text: "#D33636", dot: "#EF4444" },
  SKIPPED: { bg: "rgba(107,122,140,0.10)", text: "#6B7A8C", dot: "#6B7A8C" },
}

export default function StripeWebhookFeed() {
  const t = useTranslations("dashboard_admin.stripe")
  const [status, setStatus] = useState<WebhookStatus | "">("")
  const [items, setItems] = useState<FeedItem[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async (reset: boolean, statusFilter: WebhookStatus | "", cur: string | null) => {
    setLoading(true)
    setError(false)
    try {
      const p = new URLSearchParams()
      if (statusFilter) p.set("status", statusFilter)
      if (!reset && cur) p.set("cursor", cur)
      const res = await fetch(`/api/admin/stripe/webhooks?${p.toString()}`)
      if (!res.ok) throw new Error("fetch failed")
      const data: { items: FeedItem[]; nextCursor: string | null } = await res.json()
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]))
      setCursor(data.nextCursor)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(true, status, null)
  }, [status, load])

  const filters: (WebhookStatus | "")[] = ["", "SUCCESS", "FAILED", "SKIPPED"]

  return (
    <div>
      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {filters.map((f) => {
          const active = status === f
          return (
            <button
              key={f || "all"}
              onClick={() => setStatus(f)}
              className={`px-3 py-1.5 text-[11.5px] font-bold rounded-[8px] border transition-colors duration-150 ${
                active
                  ? "bg-[#1a2e4a] text-white border-[#1a2e4a]"
                  : "bg-white text-[#6B7A8C] border-[#D9E1ED] hover:text-[#1a2e4a]"
              }`}
            >
              {f === "" ? t("filter_all") : t(`status_${f.toLowerCase()}`)}
            </button>
          )
        })}
        <button
          onClick={() => load(true, status, null)}
          disabled={loading}
          className="ml-auto inline-flex items-center gap-2 rounded-[8px] px-3 py-1.5 text-[11.5px] font-bold text-[#6B7A8C] border border-[#D9E1ED] bg-white hover:text-[#1a2e4a] transition-colors duration-150 disabled:opacity-60"
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
            <Webhook className="w-5 h-5 text-[#00A8CC]" />
          </div>
          <div className="text-[14px] font-bold text-[#1a2e4a]">{t("feed_empty_title")}</div>
          <div className="text-[12px] text-[#6B7A8C] mt-1">{t("feed_empty_subtitle")}</div>
        </div>
      ) : (
        <>
          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-[90px_1fr_90px_70px_70px_28px] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B7A8C]">
            <div>{t("col_status")}</div>
            <div>{t("col_event")}</div>
            <div className="text-right">{t("col_latency")}</div>
            <div className="text-right">{t("col_attempts")}</div>
            <div className="text-right">{t("col_time")}</div>
            <div />
          </div>

          <div className="flex flex-col gap-2.5 md:gap-0">
            {items.map((it) => {
              const open = expanded === it.id
              const st = STATUS_STYLE[it.status]
              const canExpand = it.status === "FAILED" || it.objectId || it.userId
              return (
                <div key={it.id} className="rounded-[10px] md:rounded-none border border-[#D9E1ED] md:border-0 md:border-b md:border-[#EDF1F7] bg-white overflow-hidden">
                  <button
                    onClick={() => canExpand && setExpanded(open ? null : it.id)}
                    className={`w-full text-left grid grid-cols-1 md:grid-cols-[90px_1fr_90px_70px_70px_28px] gap-2 md:gap-3 md:items-center px-4 py-3.5 transition-colors duration-150 ${canExpand ? "hover:bg-[#F7FAFD] cursor-pointer" : "cursor-default"}`}
                  >
                    {/* status */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: st.bg, color: st.text }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                        {t(`status_${it.status.toLowerCase()}`)}
                      </span>
                    </div>
                    {/* event type + objectId */}
                    <div className="min-w-0">
                      <code className="text-[12.5px] text-[#1a2e4a] font-semibold break-words md:truncate block" style={{ fontFamily: "var(--mono,monospace)" }}>{it.type}</code>
                      {it.objectId && <code className="text-[10.5px] text-[#6B7A8C] truncate block" style={{ fontFamily: "var(--mono,monospace)" }}>{it.objectId}</code>}
                    </div>
                    {/* latency */}
                    <div className="flex md:block items-center gap-1.5 md:text-right">
                      <span className="md:hidden text-[10px] uppercase font-bold text-[#6B7A8C]">{t("col_latency")}:</span>
                      <span className="text-[11.5px] text-[#6B7A8C] tabular-nums" style={{ fontFamily: "var(--mono,monospace)" }}>{it.latencyMs != null ? `${it.latencyMs}ms` : "—"}</span>
                    </div>
                    {/* attempts */}
                    <div className="flex md:block items-center gap-1.5 md:text-right">
                      <span className="md:hidden text-[10px] uppercase font-bold text-[#6B7A8C]">{t("col_attempts")}:</span>
                      <span className={`text-[11.5px] tabular-nums ${it.attempts > 1 ? "text-[#B4740B] font-bold" : "text-[#6B7A8C]"}`} style={{ fontFamily: "var(--mono,monospace)" }}>{it.attempts}</span>
                    </div>
                    {/* time */}
                    <div className="flex md:block items-center gap-1.5 md:text-right">
                      <span className="md:hidden text-[10px] uppercase font-bold text-[#6B7A8C]">{t("col_time")}:</span>
                      <span className="text-[11.5px] text-[#6B7A8C] tabular-nums" style={{ fontFamily: "var(--mono,monospace)" }}>{relative(it.createdAt)}</span>
                    </div>
                    {/* chevron */}
                    <div className="hidden md:flex justify-end">
                      {canExpand && <ChevronDown className={`w-4 h-4 text-[#6B7A8C] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />}
                    </div>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#EDF1F7] bg-[#FAFCFE] text-[12px]">
                      <Detail label={t("detail_event_id")} value={it.stripeEventId} mono />
                      {it.objectId && <Detail label={t("detail_object_id")} value={it.objectId} mono />}
                      {it.userId && <Detail label={t("detail_user_id")} value={it.userId} mono />}
                      {it.errorMessage && (
                        <div className="mt-2">
                          <div className="text-[10px] font-bold uppercase tracking-wide text-[#6B7A8C] mb-1">{t("detail_error")}</div>
                          <pre className="text-[11px] leading-relaxed text-[#D33636] bg-white border border-[#D9E1ED] rounded-[8px] p-3 overflow-x-auto whitespace-pre-wrap break-words" style={{ fontFamily: "var(--mono,monospace)" }}>{it.errorMessage}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {cursor && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => load(false, status, cursor)}
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

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 py-0.5">
      <span className="text-[10px] font-bold uppercase tracking-wide text-[#6B7A8C] w-[70px] flex-shrink-0">{label}</span>
      <span className={`text-[11.5px] text-[#1a2e4a] break-all ${mono ? "" : ""}`} style={mono ? { fontFamily: "var(--mono,monospace)" } : undefined}>{value}</span>
    </div>
  )
}
