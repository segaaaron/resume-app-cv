"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowRight,
  Award,
  ChevronDown,
  Clock,
  Globe,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import {
  COUNTRIES,
  PROFESSIONS,
  buildEntry,
  getProfessionsByCategory,
  searchProfessions,
} from "@/lib/salary"
import type {
  CountryData,
  ProfessionCategory,
  ProfessionInfo,
  SalaryLevel,
} from "@/lib/salary/types"
import { getProfessionIcon } from "@/lib/salary/iconMap"
import SalaryResults from "./SalaryResults"

type Locale = "en" | "es"

const LEVEL_ORDER: SalaryLevel[] = ["entry", "mid", "senior", "lead"]

const LEVEL_ICONS: Record<SalaryLevel, typeof Award> = {
  entry: Sparkles,
  mid: TrendingUp,
  senior: Award,
  lead: Clock,
}

export default function SalaryCalculatorForm() {
  const t = useTranslations("tools.salaryCalculator.form")
  const tShared = useTranslations("salary.shared.level")
  const tYears = useTranslations("salary.shared.levelYears")
  const tCountries = useTranslations("salary.country_names")
  const tCats = useTranslations("salary.category_names")
  const locale = useLocale() as Locale

  const [country, setCountry] = useState<CountryData | null>(null)
  const [countryOpen, setCountryOpen] = useState(false)
  const [profession, setProfession] = useState<ProfessionInfo | null>(null)
  const [profQuery, setProfQuery] = useState("")
  const [profCategory, setProfCategory] = useState<ProfessionCategory | "all">("all")
  const [profOpen, setProfOpen] = useState(false)
  const [level, setLevel] = useState<SalaryLevel>("mid")
  const [showResults, setShowResults] = useState(false)

  const byCategory = useMemo(() => getProfessionsByCategory(), [])
  const categories = useMemo(
    () => Object.keys(byCategory) as ProfessionCategory[],
    [byCategory]
  )

  const filteredProfessions = useMemo(() => {
    const base = profCategory === "all" ? PROFESSIONS : byCategory[profCategory] ?? []
    if (!profQuery.trim()) return base
    const searched = searchProfessions(profQuery)
    return base.filter((p) => searched.includes(p))
  }, [profQuery, profCategory, byCategory])

  const canSubmit = !!country && !!profession
  const entry = useMemo(
    () => (country && profession ? buildEntry(country, profession) : null),
    [country, profession]
  )

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/85 p-6 shadow-[0_25px_70px_-25px_rgba(15,26,46,0.35)] backdrop-blur md:p-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.18),_transparent_65%)]"
        />

        <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Country */}
          <div className="relative">
            <label className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1a2e4a]/70">
              <Globe className="h-3.5 w-3.5 text-[#00D4FF]" /> {t("countryLabel")}
            </label>
            <button
              type="button"
              onClick={() => setCountryOpen((v) => !v)}
              className={`group flex w-full items-center justify-between rounded-2xl border bg-white px-5 py-4 text-left text-base font-semibold text-[#1a2e4a] shadow-sm transition-all hover:border-[#00D4FF]/60 hover:shadow-[0_8px_30px_-12px_rgba(0,212,255,0.35)] ${
                countryOpen ? "border-[#00D4FF]" : "border-[#1a2e4a]/15"
              }`}
            >
              <span className="flex items-center gap-3">
                {country ? (
                  <>
                    <span className="text-2xl leading-none">{country.flag}</span>
                    <span>{tCountries(country.code)}</span>
                  </>
                ) : (
                  <span className="text-[#1a2e4a]/45 font-medium">
                    {t("countryPlaceholder")}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-[#1a2e4a]/50 transition-transform ${
                  countryOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {countryOpen && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#1a2e4a]/10 bg-white shadow-[0_25px_60px_-15px_rgba(15,26,46,0.35)]">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCountry(c)
                      setCountryOpen(false)
                      setShowResults(false)
                    }}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-semibold text-[#1a2e4a] transition-colors hover:bg-[#00D4FF]/8"
                  >
                    <span className="text-2xl leading-none">{c.flag}</span>
                    <span>{tCountries(c.code)}</span>
                    <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-[#1a2e4a]/50">
                      {c.currency}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profession */}
          <div className="relative">
            <label className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1a2e4a]/70">
              <Search className="h-3.5 w-3.5 text-[#00D4FF]" /> {t("professionLabel")}
            </label>
            <div
              className={`flex items-center rounded-2xl border bg-white px-5 py-4 shadow-sm transition-all focus-within:border-[#00D4FF] hover:border-[#00D4FF]/60 ${
                profOpen ? "border-[#00D4FF]" : "border-[#1a2e4a]/15"
              }`}
            >
              {profession ? (
                <span className="flex items-center gap-2.5 text-[#1a2e4a] font-semibold">
                  {(() => {
                    const Icon = getProfessionIcon(profession.icon)
                    return <Icon className="h-4 w-4 text-[#00D4FF]" />
                  })()}
                  {profession.name[locale]}
                </span>
              ) : null}
              <input
                value={profQuery}
                onChange={(e) => {
                  setProfQuery(e.target.value)
                  setProfOpen(true)
                  if (profession) setProfession(null)
                }}
                onFocus={() => setProfOpen(true)}
                placeholder={!profession ? t("professionPlaceholder") : ""}
                className="ml-2 flex-1 bg-transparent text-base text-[#1a2e4a] placeholder:text-[#1a2e4a]/45 outline-none"
              />
              <ChevronDown
                className={`h-4 w-4 text-[#1a2e4a]/50 transition-transform ${
                  profOpen ? "rotate-180" : ""
                }`}
              />
            </div>
            {profOpen && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#1a2e4a]/10 bg-white shadow-[0_25px_60px_-15px_rgba(15,26,46,0.35)]">
                <div className="flex flex-wrap gap-1.5 border-b border-[#1a2e4a]/8 bg-[#f7fafc] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setProfCategory("all")}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                      profCategory === "all"
                        ? "bg-[#1a2e4a] text-white"
                        : "bg-white text-[#1a2e4a]/70 hover:text-[#1a2e4a]"
                    }`}
                  >
                    {t("categoryAll")}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProfCategory(cat)}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        profCategory === cat
                          ? "bg-[#1a2e4a] text-white"
                          : "bg-white text-[#1a2e4a]/70 hover:text-[#1a2e4a]"
                      }`}
                    >
                      {tCats(cat)}
                    </button>
                  ))}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {filteredProfessions.length === 0 && (
                    <p className="px-5 py-6 text-center text-sm text-[#1a2e4a]/55">
                      {t("noResults")}
                    </p>
                  )}
                  {filteredProfessions.map((p) => {
                    const Icon = getProfessionIcon(p.icon)
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => {
                          setProfession(p)
                          setProfQuery("")
                          setProfOpen(false)
                          setShowResults(false)
                        }}
                        className="flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm font-semibold text-[#1a2e4a] transition-colors hover:bg-[#00D4FF]/8"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] text-[#00D4FF]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1">{p.name[locale]}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a2e4a]/45">
                          {tCats(p.category)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Level */}
        <div className="relative mt-6">
          <label className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1a2e4a]/70">
            <TrendingUp className="h-3.5 w-3.5 text-[#00D4FF]" /> {t("levelLabel")}
          </label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {LEVEL_ORDER.map((lv) => {
              const Icon = LEVEL_ICONS[lv]
              const active = level === lv
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => {
                    setLevel(lv)
                    setShowResults(false)
                  }}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                    active
                      ? "border-[#00D4FF] bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] text-white shadow-[0_15px_40px_-10px_rgba(0,212,255,0.45)]"
                      : "border-[#1a2e4a]/12 bg-white text-[#1a2e4a] hover:border-[#00D4FF]/50 hover:shadow-sm"
                  }`}
                >
                  <div
                    className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                      active
                        ? "bg-white/10 text-[#00D4FF]"
                        : "bg-[#1a2e4a]/8 text-[#1a2e4a]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-bold">{tShared(lv)}</div>
                  <div
                    className={`text-[11px] ${
                      active ? "text-white/70" : "text-[#1a2e4a]/55"
                    }`}
                  >
                    {tYears(lv)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="relative mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-[#1a2e4a]/55">
            {country && profession ? `${profession.name[locale]} · ${tCountries(country.code)}` : ""}
          </p>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => setShowResults(true)}
            className={`group inline-flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold transition-all sm:w-auto ${
              canSubmit
                ? "bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF] text-[#0f1a2e] shadow-[0_15px_40px_-10px_rgba(0,212,255,0.55)] hover:scale-[1.02]"
                : "cursor-not-allowed bg-[#1a2e4a]/15 text-[#1a2e4a]/40"
            }`}
          >
            {t("cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {showResults && country && profession && entry && (
        <SalaryResults
          country={country}
          profession={profession}
          entry={entry}
          initialLevel={level}
        />
      )}

      {/* Deep links to current selection */}
      {country && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <Link
            href={`/${locale}/salary/${country.slug}`}
            className="rounded-full border border-[#1a2e4a]/15 bg-white/80 px-3.5 py-1.5 font-semibold text-[#1a2e4a]/80 backdrop-blur transition-colors hover:border-[#00D4FF]/50 hover:text-[#1a2e4a]"
          >
            {country.flag} {tCountries(country.code)}
          </Link>
          {profession && (
            <Link
              href={`/${locale}/salary/${country.slug}/${profession.slug}`}
              className="rounded-full border border-[#00D4FF]/40 bg-[#00D4FF]/8 px-3.5 py-1.5 font-semibold text-[#1a2e4a] backdrop-blur transition-colors hover:bg-[#00D4FF]/15"
            >
              {profession.name[locale]} · {country.flag}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
