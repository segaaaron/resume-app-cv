// Salary calculator domain types
export type SalaryLevel = "entry" | "mid" | "senior" | "lead"
export type CountryCode = "usa" | "uk" | "spain" | "mexico" | "argentina" | "colombia"
export type ProfessionCategory =
  | "tech"
  | "business"
  | "healthcare"
  | "education"
  | "legal"
  | "trades"
  | "service"

export type CurrencyCode = "USD" | "GBP" | "EUR" | "MXN" | "ARS" | "COP"

export type SalaryPercentiles = {
  p25: number
  p50: number
  p75: number
  p90: number
}

export type SalaryEntry = Record<SalaryLevel, SalaryPercentiles>

export type LocaleString = { en: string; es: string }

export type CountryData = {
  code: CountryCode
  name: LocaleString
  slug: string
  currency: CurrencyCode
  currencySymbol: string
  flag: string
  averageNet: number // annual net average in local currency
  averageNetUsd: number // USD equivalent for cross-country comparisons
  baseAnnual: number // base annual reference for a tech entry role in local currency
  workHoursPerYear: number
  monthsPerYear: number
}

export type ProfessionInfo = {
  slug: string
  category: ProfessionCategory
  name: LocaleString
  description: LocaleString
  icon: string // lucide-react icon name
  searchTerms: string[]
  // Multiplier vs base tech-entry of each country
  baseMultiplier: number
}

export const LEVELS: readonly SalaryLevel[] = ["entry", "mid", "senior", "lead"] as const

export const LEVEL_YEARS: Record<SalaryLevel, LocaleString> = {
  entry: { en: "0–2 years", es: "0–2 años" },
  mid: { en: "3–5 years", es: "3–5 años" },
  senior: { en: "6–10 years", es: "6–10 años" },
  lead: { en: "10+ years", es: "10+ años" },
}
