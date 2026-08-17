"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CircleDashed,
  RefreshCw,
  Clock,
  Timer,
  CalendarClock,
} from "lucide-react"

type CronHealthState = "HEALTHY" | "STALE" | "FAILING" | "NEVER_RUN"

export interface CronHealthView {
  job: string
  label: string
  scheduleHuman: string
  state: CronHealthState
  lastRunAt: string | null
  lastStatus: "SUCCESS" | "FAILURE" | null
  lastSuccessAt: string | null
  lastDurationMs: number | null
  lastError: string | null
  recentFailures: number
}

const STATE_STYLE: Record<
  CronHealthState,
  { accent: string; badgeBg: string; badgeText: string; icon: typeof CheckCircle2 }
> = {
  HEALTHY:   { accent: "#10B981", badgeBg: "rgba(16,185,129,0.10)",  badgeText: "#0F9A6E", icon: CheckCircle2 },
  STALE:     { accent: "#F59E0B", badgeBg: "rgba(245,158,11,0.12)",  badgeText: "#B4740B", icon: AlertTriangle },
  FAILING:   { accent: "#EF4444", badgeBg: "rgba(239,68,68,0.10)",   badgeText: "#D33636", icon: XCircle },
  NEVER_RUN: { accent: "#6B7A8C", badgeBg: "rgba(107,122,140,0.10)", badgeText: "#6B7A8C", icon: CircleDashed },
}

function useRelativeTime() {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    // `null` until mounted on purpose: the server's clock and the browser's differ, and
    // rendering a relative time from either during SSR is a guaranteed mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}

function formatRelative(iso: string | null, now: number | null): string {
  if (!iso) return "—"
  if (now === null) return new Date(iso).toISOString().slice(0, 16).replace("T", " ")
  const diff = now - new Date(iso).getTime()
  const abs = Math.abs(diff)
  const min = Math.round(abs / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.round(hr / 24)
  return `${d}d ago`
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—"
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function CronHealthPanel({ jobs }: { jobs: CronHealthView[] }) {
  const t = useTranslations("dashboard_admin.crons")
  const router = useRouter()
  const now = useRelativeTime()
  const [isPending, startTransition] = useTransition()

  const failing = jobs.filter((j) => j.state === "FAILING").length
  const stale = jobs.filter((j) => j.state === "STALE").length
  const never = jobs.filter((j) => j.state === "NEVER_RUN").length
  const healthy = jobs.filter((j) => j.state === "HEALTHY").length

  const banner =
    failing > 0
      ? { tone: "#EF4444", bg: "rgba(239,68,68,0.08)", text: t("banner_failing", { count: failing }) }
      : stale > 0
        ? { tone: "#F59E0B", bg: "rgba(245,158,11,0.10)", text: t("banner_stale", { count: stale }) }
        : never > 0
          ? { tone: "#6B7A8C", bg: "rgba(107,122,140,0.08)", text: t("banner_never", { count: never }) }
          : { tone: "#10B981", bg: "rgba(16,185,129,0.08)", text: t("banner_healthy", { count: healthy }) }

  return (
    <div>
      {/* Summary banner + refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div
          className="flex items-center gap-2.5 rounded-[10px] px-4 py-3 border w-full sm:w-auto"
          style={{ borderColor: banner.tone + "40", background: banner.bg }}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: banner.tone }} />
          <span className="text-[13px] font-semibold" style={{ color: banner.tone }}>
            {banner.text}
          </span>
        </div>
        <button
          onClick={() => startTransition(() => router.refresh())}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[12.5px] font-bold text-[#1a2e4a] border border-[#D9E1ED] bg-white hover:border-[#00D4FF] hover:text-[#00A8CC] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
          {t("refresh")}
        </button>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((j) => {
          const s = STATE_STYLE[j.state]
          const Icon = s.icon
          return (
            <div
              key={j.job}
              className="relative overflow-hidden bg-white border border-[#D9E1ED] rounded-[10px] p-5 pl-6 transition-all duration-200 hover:shadow-[0_6px_20px_rgba(15,25,45,0.06)]"
            >
              {/* status accent bar */}
              <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: s.accent }} aria-hidden />

              {/* header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold tracking-[0.09em] uppercase text-[#6B7A8C] mb-1 flex items-center gap-1.5">
                    <CalendarClock className="w-3 h-3 text-[#00D4FF]" />
                    {j.scheduleHuman}
                  </div>
                  <h3 className="text-[15.5px] font-bold text-[#1a2e4a] tracking-[-0.01em] truncate">
                    {j.label}
                  </h3>
                  <code className="text-[10.5px] text-[#6B7A8C]" style={{ fontFamily: "var(--mono,monospace)" }}>
                    {j.job}
                  </code>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold flex-shrink-0"
                  style={{ background: s.badgeBg, color: s.badgeText }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t(`state_${j.state}`)}
                </span>
              </div>

              {/* metrics */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-[#EDF1F7]">
                <Metric icon={Clock} label={t("last_run")} value={formatRelative(j.lastRunAt, now)} />
                <Metric icon={CheckCircle2} label={t("last_success")} value={formatRelative(j.lastSuccessAt, now)} />
                <Metric icon={Timer} label={t("latency")} value={formatDuration(j.lastDurationMs)} />
                <Metric
                  icon={AlertTriangle}
                  label={t("failures_7d")}
                  value={String(j.recentFailures)}
                  emphasize={j.recentFailures > 0}
                />
              </div>

              {/* last error */}
              {j.state === "FAILING" && j.lastError && (
                <div className="mt-4 rounded-[8px] px-3 py-2.5 text-[11.5px] leading-snug border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)] text-[#B32A2A] break-words">
                  <span className="font-bold uppercase tracking-wide text-[10px] block mb-0.5">{t("last_error")}</span>
                  {j.lastError}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  emphasize,
}: {
  icon: typeof Clock
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div>
      <div className="text-[9.5px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C] mb-1 flex items-center gap-1">
        <Icon className="w-3 h-3 opacity-70" />
        {label}
      </div>
      <div
        className={`text-[14px] font-bold tracking-[-0.01em] leading-none ${emphasize ? "text-[#D33636]" : "text-[#1a2e4a]"}`}
        style={{ fontFamily: "var(--mono,monospace)" }}
      >
        {value}
      </div>
    </div>
  )
}
