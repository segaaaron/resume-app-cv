import { toast } from "sonner"

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
  /** Timeout in ms. Defaults to 30_000 (30s). Aborts with TimeoutError DOMException. */
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 30_000

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
  const effectiveTimeout = timeoutMs ?? DEFAULT_TIMEOUT_MS
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
      throw err
    }
    if (!silent) toast.error(msgs.network_error)
    throw new Error("network_error")
  } finally {
    clearTimeout(timeoutId)
    composed.cleanup()
  }
  if (!silent && res.status >= 500) {
    toast.error(res.status === 503 ? msgs.service_unavailable : msgs.server_error)
  }
  return res
}
