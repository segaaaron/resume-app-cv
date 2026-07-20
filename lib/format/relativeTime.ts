/**
 * Compact relative-time label from an ISO timestamp: "just now", "5m", "3h", "2d".
 * Single source for the admin panels that previously each copied this function.
 */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.round(hr / 24)}d`
}
