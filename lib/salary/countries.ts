import type { CountryData } from "./types"

// Country data — averageNet and baseAnnual are calibrated to public sources:
// BLS (US), ONS (UK), INE (ES), INEGI (MX), INDEC (AR), DANE (CO).
// Figures are 2026 estimates expressed in local currency.
export const COUNTRIES: CountryData[] = [
  {
    code: "usa",
    name: { en: "United States", es: "Estados Unidos" },
    slug: "usa",
    currency: "USD",
    currencySymbol: "$",
    flag: "🇺🇸",
    averageNet: 59000,
    averageNetUsd: 59000,
    baseAnnual: 70000,
    workHoursPerYear: 2080,
    monthsPerYear: 12,
  },
  {
    code: "uk",
    name: { en: "United Kingdom", es: "Reino Unido" },
    slug: "uk",
    currency: "GBP",
    currencySymbol: "£",
    flag: "🇬🇧",
    averageNet: 35000,
    averageNetUsd: 44000,
    baseAnnual: 40000,
    workHoursPerYear: 1820,
    monthsPerYear: 12,
  },
  {
    code: "spain",
    name: { en: "Spain", es: "España" },
    slug: "spain",
    currency: "EUR",
    currencySymbol: "€",
    flag: "🇪🇸",
    averageNet: 27000,
    averageNetUsd: 29000,
    baseAnnual: 28000,
    workHoursPerYear: 1750,
    monthsPerYear: 14, // Spain commonly reports 14 payments
  },
  {
    code: "mexico",
    name: { en: "Mexico", es: "México" },
    slug: "mexico",
    currency: "MXN",
    currencySymbol: "$",
    flag: "🇲🇽",
    averageNet: 180000,
    averageNetUsd: 9500,
    baseAnnual: 260000,
    workHoursPerYear: 2250,
    monthsPerYear: 12,
  },
  {
    code: "argentina",
    name: { en: "Argentina", es: "Argentina" },
    slug: "argentina",
    currency: "ARS",
    currencySymbol: "$",
    flag: "🇦🇷",
    averageNet: 9000000,
    averageNetUsd: 8400,
    baseAnnual: 12000000,
    workHoursPerYear: 1920,
    monthsPerYear: 13, // SAC / aguinaldo
  },
  {
    code: "colombia",
    name: { en: "Colombia", es: "Colombia" },
    slug: "colombia",
    currency: "COP",
    currencySymbol: "$",
    flag: "🇨🇴",
    averageNet: 30000000,
    averageNetUsd: 7100,
    baseAnnual: 42000000,
    workHoursPerYear: 2100,
    monthsPerYear: 12,
  },
]

export const COUNTRY_BY_SLUG: Record<string, CountryData> = Object.fromEntries(
  COUNTRIES.map((c) => [c.slug, c])
)

export function getCountry(slug: string): CountryData | undefined {
  return COUNTRY_BY_SLUG[slug]
}
