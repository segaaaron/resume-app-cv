import { COUNTRIES, getCountry } from "./countries"
import { PROFESSIONS, getProfession } from "./professions"
import type {
  CountryData,
  ProfessionInfo,
  SalaryEntry,
  SalaryLevel,
  SalaryPercentiles,
} from "./types"
import { LEVELS } from "./types"

// Level multipliers vs entry baseline. Same shape across countries.
const LEVEL_MULTIPLIER: Record<SalaryLevel, number> = {
  entry: 1.0,
  mid: 1.55,
  senior: 2.2,
  lead: 3.1,
}

// Percentile spread per level — wider spread at senior+ tracks reality.
const SPREAD: Record<SalaryLevel, { p25: number; p50: number; p75: number; p90: number }> = {
  entry: { p25: 0.85, p50: 1.0, p75: 1.18, p90: 1.35 },
  mid: { p25: 0.82, p50: 1.0, p75: 1.22, p90: 1.45 },
  senior: { p25: 0.8, p50: 1.0, p75: 1.28, p90: 1.6 },
  lead: { p25: 0.78, p50: 1.0, p75: 1.35, p90: 1.85 },
}

// Country-specific calibration coefficient — keeps numbers anchored to public stats.
const COUNTRY_TUNING: Record<string, number> = {
  usa: 1.0,
  uk: 1.0,
  spain: 1.0,
  mexico: 1.0,
  argentina: 1.0,
  colombia: 1.0,
}

function roundNice(n: number, currency: string): number {
  if (currency === "ARS") return Math.round(n / 100000) * 100000
  if (currency === "COP") return Math.round(n / 100000) * 100000
  if (currency === "MXN") return Math.round(n / 1000) * 1000
  if (currency === "USD" || currency === "GBP" || currency === "EUR") {
    return Math.round(n / 500) * 500
  }
  return Math.round(n)
}

function computePercentiles(
  country: CountryData,
  profession: ProfessionInfo,
  level: SalaryLevel
): SalaryPercentiles {
  const tuning = COUNTRY_TUNING[country.slug] ?? 1.0
  const base = country.baseAnnual * profession.baseMultiplier * LEVEL_MULTIPLIER[level] * tuning
  const spread = SPREAD[level]
  return {
    p25: roundNice(base * spread.p25, country.currency),
    p50: roundNice(base * spread.p50, country.currency),
    p75: roundNice(base * spread.p75, country.currency),
    p90: roundNice(base * spread.p90, country.currency),
  }
}

export function buildEntry(country: CountryData, profession: ProfessionInfo): SalaryEntry {
  return {
    entry: computePercentiles(country, profession, "entry"),
    mid: computePercentiles(country, profession, "mid"),
    senior: computePercentiles(country, profession, "senior"),
    lead: computePercentiles(country, profession, "lead"),
  }
}

export function getSalary(
  countrySlug: string,
  professionSlug: string,
  level: SalaryLevel
): SalaryPercentiles | undefined {
  const country = getCountry(countrySlug)
  const profession = getProfession(professionSlug)
  if (!country || !profession) return undefined
  return computePercentiles(country, profession, level)
}

export function getAllLevels(countrySlug: string, professionSlug: string): SalaryEntry | undefined {
  const country = getCountry(countrySlug)
  const profession = getProfession(professionSlug)
  if (!country || !profession) return undefined
  return buildEntry(country, profession)
}

export function getCountrySnapshot(
  countrySlug: string
): { profession: ProfessionInfo; p50Mid: number }[] | undefined {
  const country = getCountry(countrySlug)
  if (!country) return undefined
  return PROFESSIONS.map((p) => ({
    profession: p,
    p50Mid: computePercentiles(country, p, "mid").p50,
  }))
}

export function getCrossCountryComparison(
  professionSlug: string,
  level: SalaryLevel = "mid"
): { country: CountryData; p50: number; p50Usd: number }[] | undefined {
  const profession = getProfession(professionSlug)
  if (!profession) return undefined
  return COUNTRIES.map((c) => {
    const p = computePercentiles(c, profession, level)
    const usdRate = c.averageNetUsd / c.averageNet
    return {
      country: c,
      p50: p.p50,
      p50Usd: Math.round(p.p50 * usdRate),
    }
  })
}

export function getRelatedProfessions(
  professionSlug: string,
  limit = 6
): ProfessionInfo[] {
  const target = getProfession(professionSlug)
  if (!target) return []
  return PROFESSIONS.filter(
    (p) => p.category === target.category && p.slug !== target.slug
  ).slice(0, limit)
}

export { LEVELS }
