"use client"

import { useTranslations } from "next-intl"
import { Inbox, CheckCircle2, Clock3 } from "lucide-react"

interface Item {
  id: string
  referredAt: string
  status: "verified" | "pending"
  tierApplied: number | null
  creditCents: number | null
}

interface Props {
  items: Item[]
  locale: string
}

export default function ReferralHistory({ items, locale }: Props) {
  const t = useTranslations("dashboard.referrals.history")
  const formatter = new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    day: "numeric", month: "short", year: "numeric",
  })

  return (
    <section className="relative rounded-2xl border border-[#E6EBF2] bg-white p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3 mb-4">
        <div>
          <h3
            className="text-[18px] sm:text-[20px] font-bold text-[#1a2e4a] tracking-tight leading-tight"
            style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
          >
            {t("title")}
          </h3>
          <p className="text-[12.5px] text-[#6B7A8C] mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D5DCE7] bg-[#FAFBFD] px-5 py-10 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#E6EBF2] text-[#6B7A8C] shadow-[0_4px_12px_-6px_rgba(15,25,45,0.20)]">
            <Inbox className="h-5 w-5" />
          </div>
          <p className="mt-3 text-[14px] font-semibold text-[#1a2e4a]">{t("empty_state_title")}</p>
          <p className="mt-1 text-[12.5px] text-[#6B7A8C] max-w-[360px]">{t("empty_state_desc")}</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-[#EEF2F8] rounded-xl border border-[#E6EBF2] overflow-hidden">
          {items.map((it) => {
            const isVerified = it.status === "verified"
            return (
              <li key={it.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#FAFBFD] transition-colors">
                <div className={[
                  "flex h-9 w-9 items-center justify-center rounded-lg border shrink-0",
                  isVerified
                    ? "bg-[rgba(0,212,255,0.10)] border-[rgba(0,212,255,0.25)] text-[#00A8CC]"
                    : "bg-amber-50 border-amber-200 text-amber-600",
                ].join(" ")}>
                  {isVerified ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#1a2e4a] truncate">
                    {isVerified ? t("row_verified_title") : t("row_pending_title")}
                  </p>
                  <p className="text-[11.5px] text-[#6B7A8C]">
                    {formatter.format(new Date(it.referredAt))}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={[
                    "inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-bold tracking-[0.06em] uppercase",
                    isVerified
                      ? "bg-[#1a2e4a] text-[#00D4FF]"
                      : "bg-amber-100 text-amber-700 border border-amber-200",
                  ].join(" ")}>
                    {isVerified ? t("status_verified") : t("status_pending")}
                  </span>
                  {it.tierApplied !== null && it.creditCents !== null && (
                    <span className="text-[10.5px] text-[#6B7A8C]">
                      {t("tier_applied", { tier: it.tierApplied, amount: (it.creditCents / 100).toFixed(2) })}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
