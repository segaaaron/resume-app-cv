import type { CountryData } from "./types"

export type Period = "year" | "month" | "hour"

export function formatSalary(
  amount: number,
  country: CountryData,
  period: Period = "year",
  locale: string = "en"
): string {
  let value = amount
  if (period === "month") value = amount / country.monthsPerYear
  if (period === "hour") value = amount / country.workHoursPerYear

  const intlLocale = locale === "es" ? "es-ES" : "en-US"
  const maxDigits = period === "hour" ? 0 : 0

  try {
    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: country.currency,
      maximumFractionDigits: maxDigits,
      minimumFractionDigits: 0,
    }).format(Math.round(value))
  } catch {
    // Fallback: symbol + spaced thousands
    return `${country.currencySymbol}${Math.round(value).toLocaleString(intlLocale)}`
  }
}

export function formatNumberCompact(amount: number, locale: string = "en"): string {
  const intlLocale = locale === "es" ? "es-ES" : "en-US"
  try {
    return new Intl.NumberFormat(intlLocale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  } catch {
    return amount.toLocaleString(intlLocale)
  }
}
