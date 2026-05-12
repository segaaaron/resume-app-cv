"use client"

import { useState, useEffect } from "react"
import { toZonedTime, format as formatTz } from "date-fns-tz"
import type { Locale } from "date-fns"

export function useUserTimezone(): string {
  const [timezone, setTimezone] = useState("UTC")

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  return timezone
}

export function formatInTimezone(
  date: Date | string,
  timezone: string,
  dateLocale: Locale,
  formatStr = "d MMM yyyy"
): string {
  const d = typeof date === "string" ? new Date(date) : date
  const zoned = toZonedTime(d, timezone)
  return formatTz(zoned, formatStr, { locale: dateLocale, timeZone: timezone })
}
