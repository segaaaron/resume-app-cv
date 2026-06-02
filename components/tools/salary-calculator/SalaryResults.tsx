"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp } from "lucide-react"
import type {
  CountryData,
  ProfessionInfo,
  SalaryEntry,
  SalaryLevel,
} from "@/lib/salary/types"
import { LEVELS } from "@/lib/salary/types"
import { formatSalary, type Period } from "@/lib/salary/format"

type Props = {
  country: CountryData
  profession: ProfessionInfo
  entry: SalaryEntry
  initialLevel?: SalaryLevel
}

export default function SalaryResults({ country, profession, entry, initialLevel = "mid" }: Props) {
  const locale = useLocale() as "en" | "es"
  const t = useTranslations("tools.salaryCalculator.results")
  const tShared = useTranslations("salary.shared.level")
  const tYears = useTranslations("salary.shared.levelYears")
  const tCountries = useTranslations("salary.country_names")

  const [level, setLevel] = useState<SalaryLevel>(initialLevel)
  const [period, setPeriod] = useState<Period>("year")

  const current = entry[level]
  const maxP90 = useMemo(
    () => Math.max(...LEVELS.map((lv) => entry[lv].p90)),
    [entry]
  )

  const periods: Period[] = ["year", "month", "hour"]

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] p-6 text-white shadow-[0_30px_80px_-20px_rgba(15,26,46,0.55)] md:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.28),_transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(79,139,255,0.22),_transparent_65%)]"
      />

      {/* Header */}
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#00D4FF]">
            {t("yourEstimate")}
          </p>
          <h3 className="mt-1 text-xl font-extrabold md:text-2xl">
            {profession.name[locale]} · {country.flag} {tCountries(country.code)}
          </h3>
          <p className="mt-1 text-xs text-white/65">
            {tShared(level)} · {tYears(level)} · {country.currency}
          </p>
        </div>

        <div className="inline-flex rounded-2xl border border-white/15 bg-white/5 p-1 backdrop-blur">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-xl px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                period === p
                  ? "bg-[#00D4FF] text-[#0f1a2e]"
                  : "text-white/65 hover:text-white"
              }`}
            >
              {t(`period.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Median + Range */}
      <div className="relative mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
            {t("median")}
          </p>
          <p className="mt-2 bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF] bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-6xl">
            {formatSalary(current.p50, country, period, locale)}
          </p>
          <p className="mt-3 text-sm text-white/65">
            {t("range")}:{" "}
            <span className="font-bold text-white">
              {formatSalary(current.p25, country, period, locale)} –{" "}
              {formatSalary(current.p90, country, period, locale)}
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
            {t("percentilesHelp", {
              profession: profession.name[locale].toLowerCase(),
              country: tCountries(country.code),
            })}
          </p>
          <div className="mt-3 space-y-2">
            {(["p25", "p50", "p75", "p90"] as const).map((k) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/55">
                  {t(`percentiles.${k}`)}
                </span>
                <span className="text-sm font-bold text-white">
                  {formatSalary(current[k], country, period, locale)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Level bar chart */}
      <div className="relative mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
          {tShared("entry")} → {tShared("lead")}
        </p>
        <div className="mt-4 space-y-3">
          {LEVELS.map((lv) => {
            const data = entry[lv]
            const leftPct = (data.p25 / maxP90) * 100
            const rightPct = (data.p90 / maxP90) * 100
            const medianPct = (data.p50 / maxP90) * 100
            const isActive = lv === level
            return (
              <button
                key={lv}
                type="button"
                onClick={() => setLevel(lv)}
                className={`group block w-full text-left ${
                  isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`font-bold ${
                      isActive ? "text-[#00D4FF]" : "text-white/65"
                    }`}
                  >
                    {tShared(lv)}{" "}
                    <span className="font-medium text-white/45">· {tYears(lv)}</span>
                  </span>
                  <span className="font-bold text-white">
                    {formatSalary(data.p50, country, period, locale)}
                  </span>
                </div>
                <div className="relative mt-1.5 h-2.5 rounded-full bg-white/8">
                  <div
                    className={`absolute top-0 h-full rounded-full ${
                      isActive
                        ? "bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF]"
                        : "bg-white/30 group-hover:bg-white/45"
                    }`}
                    style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-white"
                    style={{ left: `${medianPct}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="relative mt-7 rounded-2xl border border-[#00D4FF]/25 bg-[#00D4FF]/8 p-5">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#00D4FF]">
          <Sparkles className="h-3.5 w-3.5" />
          {t("boostTitle")}
        </p>
        <ul className="mt-3 space-y-2 text-sm text-white/85">
          <li className="flex gap-2"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4FF]" />{t("boostTip1")}</li>
          <li className="flex gap-2"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4FF]" />{t("boostTip2")}</li>
          <li className="flex gap-2"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4FF]" />{t("boostTip3")}</li>
        </ul>
      </div>

      {/* CTAs */}
      <div className="relative mt-7 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Link
          href={`/${locale}/pricing`}
          className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF] px-6 py-3.5 text-sm font-bold text-[#0f1a2e] shadow-[0_15px_40px_-10px_rgba(0,212,255,0.55)] transition-transform hover:scale-[1.02]"
        >
          {t("ctaPrimary")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href={`/${locale}/tools/ats-checker`}
          className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
        >
          <ShieldCheck className="h-4 w-4 text-[#00D4FF]" />
          {t("ctaSecondary")}
        </Link>
      </div>
    </div>
  )
}
