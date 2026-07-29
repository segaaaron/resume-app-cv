// Browser-only. Ships an uncaught client error to /api/client-errors so it lands in
// the admin "Service Errors" dashboard alongside server errors. Deduped and capped per
// page load so a render loop or a repeated rejection cannot flood the endpoint.
//
// Never throws: reporting an error must not create one.

const sent = new Set<string>()
const MAX_PER_LOAD = 50

export type ClientErrorKind = "error" | "unhandledrejection" | "react"

export function reportClientError(
  message: string | undefined,
  stack: string | undefined,
  kind: ClientErrorKind,
): void {
  if (typeof window === "undefined") return
  const msg = (message ?? "").trim()
  if (!msg) return

  const key = `${kind}:${msg}:${(stack ?? "").slice(0, 200)}`
  if (sent.has(key) || sent.size >= MAX_PER_LOAD) return
  sent.add(key)

  try {
    const body = JSON.stringify({
      message: msg.slice(0, 2000),
      stack: stack ? stack.slice(0, 6000) : undefined,
      source: window.location.pathname,
      kind,
    })
    void fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true, // survive a navigation / crash unload
    }).catch(() => {})
  } catch {
    /* swallow — telemetry must never break the page */
  }
}
