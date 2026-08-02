"use client"

import { useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  RefreshCw,
  Trash2,
  ShieldCheck,
  AlertOctagon,
  Users as UsersIcon,
  Server,
  ChevronDown,
  Search,
} from "lucide-react"
import { relativeTime as relative } from "@/lib/format/relativeTime"

type ErrorWindow = "24h" | "7d" | "30d"

export interface ErrorIssueView {
  fingerprint: string
  source: string
  endpoint: string | null
  message: string
  stack: string | null
  statusCode: number | null
  count: number
  lastSeen: string
  lastUserEmail: string | null
  lastUserId: string | null
  context: unknown
}

export interface ServiceErrorsReport {
  window: ErrorWindow
  total: number
  affectedUsers: number
  topSource: { source: string; count: number } | null
  sources: string[]
  issues: ErrorIssueView[]
}

// Stable color per source family — dot + text, never color-only (label always present).
const SOURCE_COLORS: { match: RegExp; color: string }[] = [
  { match: /pdf/i, color: "#7C3AED" },
  { match: /ai|anthropic|claude/i, color: "#00A8CC" },
  { match: /stripe|billing/i, color: "#635BFF" },
  { match: /auth|session/i, color: "#0F9A6E" },
  { match: /cron/i, color: "#B4740B" },
  { match: /client|browser/i, color: "#E4572E" },
]
function sourceColor(source: string): string {
  return SOURCE_COLORS.find((s) => s.match.test(source))?.color ?? "#6B7A8C"
}

function statusStyle(code: number | null): { bg: string; text: string } {
  if (code === null) return { bg: "rgba(107,122,140,0.10)", text: "#6B7A8C" }
  if (code >= 500) return { bg: "rgba(239,68,68,0.10)", text: "#D33636" }
  if (code >= 400) return { bg: "rgba(245,158,11,0.12)", text: "#B4740B" }
  return { bg: "rgba(107,122,140,0.10)", text: "#6B7A8C" }
}

export default function ServiceErrorsPanel({ report }: { report: ServiceErrorsReport }) {
  const t = useTranslations("dashboard_admin.errors")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [qDraft, setQDraft] = useState(searchParams.get("q") ?? "")
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  // Two-click confirm (no native dialog): first click arms, second wipes.
  async function clearAll() {
    if (!confirmClear) { setConfirmClear(true); return }
    setClearing(true)
    try {
      await fetch("/api/admin/errors/clear", { method: "POST", credentials: "same-origin" })
    } finally {
      setClearing(false)
      setConfirmClear(false)
      startTransition(() => router.refresh())
    }
  }

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    startTransition(() => router.push(`${pathname}?${p.toString()}`))
  }

  const windows: ErrorWindow[] = ["24h", "7d", "30d"]

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Stat icon={AlertOctagon} label={t("stat_errors", { window: report.window })} value={String(report.total)} tone={report.total > 0 ? "#D33636" : "#1a2e4a"} />
        <Stat icon={UsersIcon} label={t("stat_affected_users")} value={String(report.affectedUsers)} tone="#1a2e4a" />
        <Stat icon={Server} label={t("stat_top_service")} value={report.topSource ? report.topSource.source : "—"} sub={report.topSource ? `${report.topSource.count}` : undefined} tone="#1a2e4a" />
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        {/* window segmented */}
        <div className="inline-flex rounded-[10px] border border-[#D9E1ED] bg-white p-1 self-start">
          {windows.map((w) => {
            const active = report.window === w
            return (
              <button
                key={w}
                onClick={() => setParam("window", w)}
                className={`px-3 py-1.5 text-[12px] font-bold rounded-[7px] transition-colors duration-150 ${active ? "bg-[#1a2e4a] text-white" : "text-[#6B7A8C] hover:text-[#1a2e4a]"}`}
              >
                {w}
              </button>
            )
          })}
        </div>

        {/* source filter — always lists every known service family so you can
            confirm any of them is clean (filter → "0, all clear"), not only the
            ones that happen to have errors in the current window. */}
        <select
          value={searchParams.get("source") ?? ""}
          onChange={(e) => setParam("source", e.target.value || null)}
          className="rounded-[10px] border border-[#D9E1ED] bg-white px-3 py-2 text-[12.5px] text-[#1a2e4a] focus:border-[#00D4FF] focus:outline-none min-h-[40px]"
        >
          <option value="">{t("all_services")}</option>
          {report.sources.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* search */}
        <form
          onSubmit={(e) => { e.preventDefault(); setParam("q", qDraft || null) }}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7A8C]" />
            <input
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              placeholder={t("search_placeholder")}
              className="w-full rounded-[10px] border border-[#D9E1ED] bg-white pl-9 pr-3 py-2 text-[12.5px] text-[#1a2e4a] focus:border-[#00D4FF] focus:outline-none min-h-[40px]"
            />
          </div>
        </form>

        {/* clear — wipe the reviewed board (two-click confirm) */}
        {report.total > 0 && (
          <button
            onClick={clearAll}
            onBlur={() => setConfirmClear(false)}
            disabled={clearing}
            className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-4 min-h-[40px] text-[12.5px] font-bold transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed self-start md:self-auto ${confirmClear ? "text-white bg-[#D33636] hover:bg-[#b82d2d]" : "text-[#6B7A8C] border border-[#D9E1ED] bg-white hover:text-[#D33636] hover:border-[#D33636]/50"}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmClear ? t("clear_confirm") : t("clear")}
          </button>
        )}

        {/* refresh */}
        <button
          onClick={() => startTransition(() => router.refresh())}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] px-4 min-h-[40px] text-[12.5px] font-bold text-white bg-[#1a2e4a] hover:bg-[#24406a] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
          {t("refresh")}
        </button>
      </div>

      {/* Empty state */}
      {report.issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-[10px] border border-[#D9E1ED] bg-gradient-to-br from-[rgba(16,185,129,0.05)] to-white">
          <div className="w-12 h-12 rounded-full bg-[rgba(16,185,129,0.12)] flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-[#0F9A6E]" />
          </div>
          <div className="text-[15px] font-bold text-[#1a2e4a]">{t("empty_title")}</div>
          <div className="text-[12.5px] text-[#6B7A8C] mt-1">{t("empty_subtitle", { window: report.window })}</div>
        </div>
      ) : (
        <>
          {/* Desktop header — hidden on mobile */}
          <div className="hidden md:grid grid-cols-[110px_1fr_80px_90px_90px_28px] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B7A8C]">
            <div>{t("col_service")}</div>
            <div>{t("col_issue")}</div>
            <div className="text-right">{t("col_count")}</div>
            <div className="text-right">{t("col_last_seen")}</div>
            <div>{t("col_last_user")}</div>
            <div />
          </div>

          <div className="flex flex-col gap-2.5 md:gap-0">
            {report.issues.map((issue) => {
              const open = expanded === issue.fingerprint
              const sc = sourceColor(issue.source)
              const st = statusStyle(issue.statusCode)
              return (
                <div
                  key={issue.fingerprint}
                  className="rounded-[10px] md:rounded-none border border-[#D9E1ED] md:border-0 md:border-b md:border-[#EDF1F7] bg-white overflow-hidden"
                >
                  {/* row */}
                  <button
                    onClick={() => setExpanded(open ? null : issue.fingerprint)}
                    className="w-full text-left grid grid-cols-1 md:grid-cols-[110px_1fr_80px_90px_90px_28px] gap-2 md:gap-3 md:items-center px-4 py-3.5 hover:bg-[#F7FAFD] transition-colors duration-150"
                  >
                    {/* service */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc }} />
                      <span className="text-[12px] font-bold text-[#1a2e4a] truncate">{issue.source}</span>
                    </div>

                    {/* message + endpoint */}
                    <div className="min-w-0">
                      <div className="text-[13px] text-[#1a2e4a] font-medium break-words md:truncate">{issue.message}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {issue.endpoint && (
                          <code className="text-[10.5px] text-[#6B7A8C]" style={{ fontFamily: "var(--mono,monospace)" }}>{issue.endpoint}</code>
                        )}
                        {issue.statusCode !== null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: st.bg, color: st.text }}>
                            {issue.statusCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* count */}
                    <div className="flex md:block items-center gap-1.5 md:text-right">
                      <span className="md:hidden text-[10px] uppercase font-bold text-[#6B7A8C]">{t("col_count")}:</span>
                      <span className="text-[14px] font-bold text-[#1a2e4a]" style={{ fontFamily: "var(--mono,monospace)" }}>{issue.count}</span>
                    </div>

                    {/* last seen */}
                    <div className="flex md:block items-center gap-1.5 md:text-right">
                      <span className="md:hidden text-[10px] uppercase font-bold text-[#6B7A8C]">{t("col_last_seen")}:</span>
                      <span className="text-[12px] text-[#6B7A8C]" style={{ fontFamily: "var(--mono,monospace)" }}>{relative(issue.lastSeen)}</span>
                    </div>

                    {/* last user */}
                    <div className="flex md:block items-center gap-1.5 min-w-0">
                      <span className="md:hidden text-[10px] uppercase font-bold text-[#6B7A8C]">{t("col_last_user")}:</span>
                      <span className="text-[11.5px] text-[#6B7A8C] truncate">{issue.lastUserEmail ?? issue.lastUserId ?? "—"}</span>
                    </div>

                    {/* chevron */}
                    <div className="hidden md:flex justify-end">
                      <ChevronDown className={`w-4 h-4 text-[#6B7A8C] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* expanded detail */}
                  {open && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#EDF1F7] bg-[#FAFCFE]">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-[#6B7A8C] mt-3 mb-1">{t("detail_message")}</div>
                      <div className="text-[12.5px] text-[#1a2e4a] break-words mb-3">{issue.message}</div>

                      {(() => {
                        const ctx = issue.context && typeof issue.context === "object" ? (issue.context as Record<string, unknown>) : null
                        const payload = ctx?.payload
                        const meta: [string, string][] = []
                        if (ctx?.method) meta.push([t("detail_method"), String(ctx.method)])
                        if (issue.statusCode != null) meta.push([t("detail_status"), String(issue.statusCode)])
                        if (ctx?.query) meta.push([t("detail_query"), String(ctx.query)])
                        if (issue.endpoint) meta.push([t("detail_endpoint"), issue.endpoint])
                        if (issue.lastUserEmail || issue.lastUserId) meta.push([t("detail_user"), issue.lastUserEmail ?? issue.lastUserId!])
                        meta.push([t("detail_time"), new Date(issue.lastSeen).toLocaleString()])
                        return (
                          <>
                            {meta.length > 0 && (
                              <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                                {meta.map(([k, v]) => (
                                  <div key={k} className="text-[11.5px] min-w-0">
                                    <span className="text-[#6B7A8C]">{k}: </span>
                                    <span className="text-[#1a2e4a] font-medium break-words">{v}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {payload != null && (
                              <>
                                <div className="text-[10px] font-bold uppercase tracking-wide text-[#6B7A8C] mb-1">{t("detail_payload")}</div>
                                <pre className="text-[11px] leading-relaxed text-[#4A5A6E] bg-white border border-[#D9E1ED] rounded-[8px] p-3 overflow-x-auto max-h-64 mb-3" style={{ fontFamily: "var(--mono,monospace)" }}>
                                  {typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)}
                                </pre>
                              </>
                            )}
                          </>
                        )
                      })()}

                      {issue.stack && (
                        <>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-[#6B7A8C] mb-1">{t("detail_stack")}</div>
                          <pre className="text-[11px] leading-relaxed text-[#4A5A6E] bg-white border border-[#D9E1ED] rounded-[8px] p-3 overflow-x-auto max-h-64" style={{ fontFamily: "var(--mono,monospace)" }}>
                            {issue.stack}
                          </pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof AlertOctagon
  label: string
  value: string
  sub?: string
  tone: string
}) {
  return (
    <div className="bg-white border border-[#D9E1ED] rounded-[10px] p-4 relative overflow-hidden">
      <div className="text-[10.5px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C] mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-[#00D4FF]" />
        {label}
      </div>
      <div className="text-[22px] font-bold tracking-[-0.02em] leading-none truncate" style={{ fontFamily: "var(--mono,monospace)", color: tone }}>
        {value}
        {sub && <span className="text-[12px] font-normal text-[#6B7A8C] ml-1">× {sub}</span>}
      </div>
    </div>
  )
}
