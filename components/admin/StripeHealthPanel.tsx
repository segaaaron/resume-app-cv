"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  RefreshCw,
  Webhook,
  AlertTriangle,
  ShieldAlert,
  Receipt,
  CreditCard,
  Ban,
  DollarSign,
} from "lucide-react"
import type { StripeOverview } from "@/lib/services/stripe/stripeAdminReport"
import { relativeTime as relative } from "@/lib/format/relativeTime"

type Win = "24h" | "7d" | "30d"

export default function StripeHealthPanel({ overview }: { overview: StripeOverview }) {
  const t = useTranslations("dashboard_admin.stripe")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [win, setWin] = useState<Win>("24h")

  const w = overview.webhooks[win]
  const windows: Win[] = ["24h", "7d", "30d"]
  const failing = w.failed > 0

  return (
    <div>
      {/* Window segmented + refresh */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="inline-flex rounded-[10px] border border-[#D9E1ED] bg-white p-1">
          {windows.map((x) => {
            const active = win === x
            return (
              <button
                key={x}
                onClick={() => setWin(x)}
                className={`px-3 py-1.5 text-[12px] font-bold rounded-[7px] transition-colors duration-150 ${active ? "bg-[#1a2e4a] text-white" : "text-[#6B7A8C] hover:text-[#1a2e4a]"}`}
              >
                {x}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => startTransition(() => router.refresh())}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] px-4 min-h-[40px] text-[12.5px] font-bold text-white bg-[#1a2e4a] hover:bg-[#24406a] transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
          {t("refresh")}
        </button>
      </div>

      {/* Webhook KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Stat icon={Webhook} label={t("kpi_total", { window: win })} value={String(w.total)} tone="#1a2e4a" />
        <Stat icon={Webhook} label={t("kpi_success")} value={String(w.success)} tone="#0F9A6E" />
        <Stat icon={AlertTriangle} label={t("kpi_failed")} value={String(w.failed)} tone={failing ? "#D33636" : "#1a2e4a"} />
        <Stat
          icon={AlertTriangle}
          label={t("kpi_failure_rate")}
          value={`${w.failureRate}%`}
          tone={w.failureRate > 0 ? "#D33636" : "#0F9A6E"}
          sub={w.skipped > 0 ? t("kpi_skipped", { count: w.skipped }) : undefined}
        />
      </div>

      {/* Billing + subscriptions KPI grid (30d / live) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Stat icon={ShieldAlert} label={t("kpi_disputes")} value={String(overview.billing30d.disputes)} tone={overview.billing30d.disputes > 0 ? "#B4740B" : "#1a2e4a"} />
        <Stat icon={ShieldAlert} label={t("kpi_fraud")} value={String(overview.billing30d.fraud)} tone={overview.billing30d.fraud > 0 ? "#D33636" : "#1a2e4a"} />
        <Stat icon={Receipt} label={t("kpi_refunds")} value={String(overview.billing30d.refunds)} tone="#1a2e4a" />
        <Stat icon={Ban} label={t("kpi_cancellations")} value={String(overview.billing30d.cancellations)} tone="#1a2e4a" />
        <Stat icon={DollarSign} label={t("kpi_mrr")} value={`$${overview.subscriptions.mrr}`} sub={t("kpi_active_pro", { count: overview.subscriptions.activePro })} tone="#00A8CC" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top event types (7d) */}
        <div className="bg-white border border-[#D9E1ED] rounded-[10px] p-4">
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C] mb-3">
            <CreditCard className="w-3.5 h-3.5 text-[#00D4FF]" />
            {t("top_types_title")}
          </div>
          {overview.topTypes.length === 0 ? (
            <div className="text-[12.5px] text-[#6B7A8C] py-3">{t("no_events")}</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {overview.topTypes.map((tt) => (
                <div key={tt.type} className="flex items-center justify-between gap-3">
                  <code className="text-[11.5px] text-[#1a2e4a] truncate" style={{ fontFamily: "var(--mono,monospace)" }}>{tt.type}</code>
                  <span className="text-[12px] font-bold text-[#1a2e4a] tabular-nums" style={{ fontFamily: "var(--mono,monospace)" }}>{tt.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent failures (30d) */}
        <div className="bg-white border border-[#D9E1ED] rounded-[10px] p-4">
          <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C] mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-[#D33636]" />
            {t("recent_failures_title")}
          </div>
          {overview.recentFailures.length === 0 ? (
            <div className="flex items-center gap-2 text-[12.5px] text-[#0F9A6E] py-3">
              <span className="w-2 h-2 rounded-full bg-[#0F9A6E]" />
              {t("no_failures")}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {overview.recentFailures.map((f) => (
                <div key={f.id} className="border-b border-[#EDF1F7] last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-[11px] font-bold text-[#1a2e4a] truncate" style={{ fontFamily: "var(--mono,monospace)" }}>{f.type}</code>
                    <span className="text-[10.5px] text-[#6B7A8C] whitespace-nowrap" style={{ fontFamily: "var(--mono,monospace)" }}>{relative(f.createdAt)}</span>
                  </div>
                  {f.errorMessage && (
                    <div className="text-[11px] text-[#D33636] break-words mt-0.5">{f.errorMessage}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
  icon: typeof Webhook
  label: string
  value: string
  sub?: string
  tone: string
}) {
  return (
    <div className="bg-white border border-[#D9E1ED] rounded-[10px] p-4 relative overflow-hidden">
      <div className="text-[10.5px] font-bold tracking-[0.08em] uppercase text-[#6B7A8C] mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-[#00D4FF]" />
        <span className="truncate">{label}</span>
      </div>
      <div className="text-[22px] font-bold tracking-[-0.02em] leading-none truncate tabular-nums" style={{ fontFamily: "var(--mono,monospace)", color: tone }}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[11px] text-[#6B7A8C]">{sub}</div>}
    </div>
  )
}
