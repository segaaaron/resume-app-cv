// Browser-only. Ships an uncaught client error to /api/client-errors so it lands in
// the admin "Service Errors" dashboard alongside server errors. Deduped and capped per
// page load so a render loop or a repeated rejection cannot flood the endpoint.
//
// Never throws: reporting an error must not create one.

const sent = new Set<string>()
const MAX_PER_LOAD = 50

export type ClientErrorKind = "error" | "unhandledrejection" | "react" | "ux"

/**
 * True when the failure came from something injected into the page rather than
 * from this app.
 *
 * Browser extensions run inside our document and throw inside it, so window.onerror
 * and unhandledrejection see them exactly as they see our own bugs. Reported from
 * production: `TypeError: Cannot read properties of undefined (reading 'M_ID')` at
 * `chrome-extension://…/executors/200.js`, over and over — a defect in somebody
 * else's code, filed in our panel, on every page load of every user who has that
 * extension installed.
 *
 * The panel exists to find OUR bugs quickly. A stream of failures we cannot read,
 * cannot reproduce and cannot fix is worse than no panel: it buries the one entry
 * that mattered. And each one costs a request and a row.
 *
 * Matched by URL SCHEME, not by extension id — an id list would only ever know the
 * extensions somebody already saw. The check is on the throw site (the first frame
 * carrying a URL): an extension appearing deeper in a stack that starts in our code
 * is still our bug to fix.
 */
const EXTENSION_SCHEME = /^(chrome|moz|safari-web|safari|ms-browser|edge)-extension:\/\//

export function isThirdPartyClientError(message: string, stack: string | undefined): boolean {
  // "Script error." is what a cross-origin script gives us: no file, no line, no
  // stack. Nothing can be done with it, by anyone.
  if (!stack && /^script error\.?$/i.test(message.trim())) return true
  if (!stack) return false
  for (const line of stack.split("\n")) {
    const url = line.match(/(?:at\s+)?(?:\S+\s+\()?([a-z-]+:\/\/\S+)/i)?.[1]
    if (!url) continue
    return EXTENSION_SCHEME.test(url)
  }
  return false
}

/**
 * Facts a blocked action may carry. NEVER résumé content.
 *
 * Numbers, booleans and short codes only — enough to reproduce the refusal
 * (which guard, how many lines, did the index still point at the text) and
 * nothing a recruiter could read. Free text is not accepted by the endpoint
 * either, so this rule cannot be broken by a future caller in a hurry.
 */
export type UxFailureDetail = Record<string, string | number | boolean>

/**
 * An action the user asked for did not happen, and the server cannot know it.
 *
 * THE HOLE THIS EXISTS TO CLOSE. Three failures were reported from production by
 * screenshot ("Could not apply change", "Could not improve the achievement") and
 * the server had NOT ONE row about any of them — no request was ever made, the
 * refusal was decided in the browser. A guard that rejects an action shows a
 * toast and returns; it never throws, so window.onerror never sees it either.
 * From our side the product looked perfectly healthy while the user could not
 * delete a bullet.
 *
 * THE RULE: if the user sees an error, it is recorded. What we cannot count, we
 * only learn about when somebody complains.
 *
 * Three kinds of failure land here, and ONLY these three — everything else is
 * already recorded server-side by `handleError` / `apiError`:
 *   1. a local guard refusing the action (nothing was ever sent),
 *   2. a request that never reached us (network down, timeout, gateway),
 *   3. a 200 whose body the UI cannot read (our own two halves disagreeing).
 *
 * `code` is a stable identifier for the site, never a message: the panel groups
 * by it, so "this guard fired 40 times today" is one glance instead of a ticket.
 */
export function reportUxFailure(code: string, detail?: UxFailureDetail): void {
  if (typeof window === "undefined") return
  const key = `ux:${code}:${JSON.stringify(detail ?? {})}`
  if (sent.has(key) || sent.size >= MAX_PER_LOAD) return
  sent.add(key)
  try {
    void fetch("/api/client-errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `ux: ${code}`.slice(0, 2000),
        source: window.location.pathname,
        kind: "ux" as ClientErrorKind,
        detail,
      }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* swallow — telemetry must never break the page */
  }
}

export function reportClientError(
  message: string | undefined,
  stack: string | undefined,
  kind: ClientErrorKind,
): void {
  if (typeof window === "undefined") return
  const msg = (message ?? "").trim()
  if (!msg) return

  // Next.js control-flow signals (redirect() / notFound()) are THROWN internally and
  // caught by Next to do their job — they are NOT errors. The server sink already
  // filters them (instrumentation.ts); the client boundary can see them too (e.g. a
  // redirect during render), so drop them here to keep the Service Errors panel showing
  // only real client failures.
  if (/NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK|NEXT_RSC/.test(msg) || (stack ? /NEXT_REDIRECT|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK|NEXT_RSC/.test(stack) : false)) return

  // Somebody else's extension crashing inside our page is not our failure.
  if (isThirdPartyClientError(msg, stack)) return

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
