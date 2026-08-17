import { toast } from "sonner"
import { track } from "@/lib/analytics/track"
import { serviceFromUrl } from "@/lib/analytics/events"
import { reportUxFailure } from "@/lib/client-error-reporter"

const MESSAGES = {
  es: {
    server_error: "Algo salió mal. Inténtalo de nuevo.",
    service_unavailable: "Servicio no disponible. Intenta en unos minutos.",
    network_error: "Sin conexión. Verifica tu internet.",
  },
  en: {
    server_error: "Something went wrong. Please try again.",
    service_unavailable: "Service unavailable. Try again in a few minutes.",
    network_error: "No connection. Check your internet.",
  },
}

function getLocale(): "es" | "en" {
  if (typeof document === "undefined") return "es"
  return document.documentElement.lang === "en" ? "en" : "es"
}

type ApiFetchOptions = RequestInit & {
  silent?: boolean
  /** Caller-provided AbortSignal. Composed with the internal timeout signal. */
  signal?: AbortSignal
  /** Timeout in ms. Overrides the per-endpoint default. Aborts with TimeoutError. */
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 30_000

/**
 * Ceiling for the endpoints that are genuinely slow: anything that calls a model, and
 * anything that renders a PDF in the screenshot microservice.
 *
 * WHY: the flat 30s ceiling sat BELOW what the server needs. `lib/ai-client.ts` gives
 * OpenAI 60s per call with 3 retries, and an ATS analysis chains several calls plus an
 * embedding pass. The browser gave up first — and giving up costs nothing on the server:
 * the work runs to completion and we pay for every token of it, then the result is
 * dropped because nobody is listening. From the user's side "the button did nothing".
 * Waiting longer is not a fix for slowness; it is a fix for THROWING AWAY work we paid
 * for. Anything past this ceiling is a real failure and still surfaces as one.
 */
const SLOW_ENDPOINT_TIMEOUT_MS = 120_000

/** Endpoints whose normal path is a model call or a PDF render. */
function isSlowEndpoint(url: string): boolean {
  const path = url.startsWith("http") ? safePath(url) : url
  return path.startsWith("/api/ai/")
    || path === "/api/resumes/import"
    || /^\/api\/(resumes|cover-letters)\/[^/]+\/(pdf|thumbnail)/.test(path)
}

function safePath(url: string): string {
  try { return new URL(url).pathname } catch { return url }
}

/** The ceiling that applies when the caller did not name one. Exported for the tests. */
export function defaultTimeoutFor(url: string): number {
  return isSlowEndpoint(url) ? SLOW_ENDPOINT_TIMEOUT_MS : DEFAULT_TIMEOUT_MS
}

// Polyfill fallback in case AbortSignal.any is not available in the runtime.
// Node 22 / modern browsers support it natively; this is a defensive path.
// Returns { signal, cleanup }. The native branch returns a no-op cleanup
// (the native AbortSignal.any handles listener teardown internally). The
// polyfill branch returns a cleanup that removes the registered listeners
// so they don't leak on the caller-provided signal after the request resolves.
function composeSignals(signals: AbortSignal[]): { signal: AbortSignal; cleanup: () => void } {
  const anyFn = (AbortSignal as unknown as { any?: (s: AbortSignal[]) => AbortSignal }).any
  if (typeof anyFn === "function") return { signal: anyFn(signals), cleanup: () => {} }
  const controller = new AbortController()
  const cleanups: Array<() => void> = []
  for (const s of signals) {
    if (s.aborted) {
      controller.abort((s as AbortSignal & { reason?: unknown }).reason)
      break
    }
    const onAbort = () => controller.abort((s as AbortSignal & { reason?: unknown }).reason)
    s.addEventListener("abort", onAbort, { once: true })
    cleanups.push(() => s.removeEventListener("abort", onAbort))
  }
  return {
    signal: controller.signal,
    cleanup: () => { for (const c of cleanups) c() },
  }
}

export async function apiFetch(url: string, options?: ApiFetchOptions): Promise<Response> {
  const { silent, signal: callerSignal, timeoutMs, ...fetchOptions } = options ?? {}
  const msgs = MESSAGES[getLocale()]

  const timeoutController = new AbortController()
  const effectiveTimeout = timeoutMs ?? defaultTimeoutFor(url)
  const timeoutId = setTimeout(
    () => timeoutController.abort(new DOMException("Timeout", "TimeoutError")),
    effectiveTimeout,
  )
  const composed = callerSignal
    ? composeSignals([callerSignal, timeoutController.signal])
    : { signal: timeoutController.signal, cleanup: () => {} }

  let res: Response
  try {
    res = await fetch(url, { ...fetchOptions, signal: composed.signal })
  } catch (err) {
    // Propagate AbortError / TimeoutError so callers can distinguish cancellation.
    if (err instanceof DOMException && (err.name === "AbortError" || err.name === "TimeoutError")) {
      // A TIMEOUT is a failure of ours and it is invisible everywhere else: the
      // request never completed, so no server row exists, and it is swallowed by
      // the caller's catch as if it were a user cancellation. The AI endpoints
      // are the slow ones — precisely the ones that hit this ceiling — and until
      // now "the button did nothing after 30 seconds" produced no record at all.
      // A user-initiated abort is NOT reported: nothing failed.
      if (err.name === "TimeoutError") {
        const svc = serviceFromUrl(url)
        reportUxFailure("request_timeout", { endpoint: svc.endpoint ?? "unknown", source: svc.source, timeoutMs: effectiveTimeout })
      }
      throw err
    }
    // Network-level failure the user actually saw (connection dropped, DNS, CORS).
    // Recorded, not merely counted in analytics: nothing reached the server, so
    // the Service Errors panel is the ONLY place this can ever appear.
    const svc = serviceFromUrl(url)
    track("service_error_shown", { source: svc.source, endpoint: svc.endpoint, status: 0, error_type: "network" })
    reportUxFailure("request_network_failed", { endpoint: svc.endpoint ?? "unknown", source: svc.source })
    if (!silent) toast.error(msgs.network_error)
    throw new Error("network_error")
  } finally {
    clearTimeout(timeoutId)
    composed.cleanup()
  }
  // Server failures (5xx) surfaced to the user. Client-side 4xx (quota, validation,
  // off-topic) are expected and tracked closer to their surface, not here.
  if (res.status >= 500) {
    const svc = serviceFromUrl(url)
    track("service_error_shown", { source: svc.source, endpoint: svc.endpoint, status: res.status, error_type: "server" })
    // A 502/503/504 comes from the proxy, NOT from the app: the container was
    // restarting, the deploy was mid-flight, the request timed out upstream.
    // Next never ran, so `handleError` never wrote a row and the outage is
    // invisible in the panel — exactly the window in which a user is most
    // likely to be looking at a broken screen. A 500 IS ours and is already
    // recorded server-side with its real message; reporting it again would file
    // the same failure twice under a worse description.
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      reportUxFailure("request_gateway_error", { endpoint: svc.endpoint ?? "unknown", source: svc.source, status: res.status })
    }
    if (!silent) {
      toast.error(res.status === 503 ? msgs.service_unavailable : msgs.server_error)
    }
  }
  return res
}
