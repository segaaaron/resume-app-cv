"use client"

import { useState, useEffect } from "react"
import { toZonedTime, format as formatTz } from "date-fns-tz"
import type { Locale } from "date-fns"

export function useUserTimezone(): string {
  const [timezone, setTimezone] = useState("UTC")

  useEffect(() => {
    // The browser's zone does not exist on the server; "UTC" is rendered first on both
    // sides and corrected after mount. Reading Intl during render is the mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
