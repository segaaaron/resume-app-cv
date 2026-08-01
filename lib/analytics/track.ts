"use client"

// ─────────────────────────────────────────────────────────────────────────────
// Safe, typed client wrapper around the Umami tracker.
//
//   • Fails closed: if window.umami is not present (SSR, ad blocker, env unset,
//     or the afterInteractive script hasn't loaded yet) the call is a no-op and
//     NEVER throws.
//   • Early-call queue: events fired before the tracker finishes loading are
//     buffered (bounded) and flushed once umami appears. identify() is stored
//     separately so the latest identity always replays first.
//   • Type-safe: names and payloads are constrained by AnalyticsEventMap.
// ─────────────────────────────────────────────────────────────────────────────

import type { AnalyticsEvent, AnalyticsEventMap, IdentityTraits } from "./events"

type UmamiApi = {
  track: (name: string, data?: Record<string, unknown>) => void
  identify: (traits: Record<string, unknown>) => void
}

function getUmami(): UmamiApi | null {
  if (typeof window === "undefined") return null
  const u = (window as unknown as { umami?: Partial<UmamiApi> }).umami
  return u && typeof u.track === "function" ? (u as UmamiApi) : null
}

const MAX_QUEUE = 30
const queue: Array<{ name: string; data?: Record<string, unknown> }> = []
let pendingIdentity: Record<string, unknown> | null = null
let flushTimer: ReturnType<typeof setInterval> | null = null

function flush(): boolean {
  const u = getUmami()
  if (!u) return false
  try {
    if (pendingIdentity) {
      u.identify(pendingIdentity)
      pendingIdentity = null
    }
    while (queue.length) {
      const ev = queue.shift()!
      u.track(ev.name, ev.data)
    }
  } catch {
    /* never let analytics break the app */
  }
  return true
}

function ensureFlushLoop(): void {
  if (flushTimer || typeof window === "undefined") return
  let attempts = 0
  flushTimer = setInterval(() => {
    attempts += 1
    // Stop after ~20s (tracker either loaded or is blocked); drop the buffer.
    if (flush() || attempts > 40) {
      if (flushTimer) clearInterval(flushTimer)
      flushTimer = null
      if (attempts > 40) {
        queue.length = 0
        pendingIdentity = null
      }
    }
  }, 500)
}

/** Track a typed analytics event. Props are constrained to the event's shape. */
export function track<N extends AnalyticsEvent>(
  name: N,
  ...args: AnalyticsEventMap[N] extends Record<string, never> ? [] : [props: AnalyticsEventMap[N]]
): void {
  const data = args[0] as Record<string, unknown> | undefined
  const u = getUmami()
  if (u) {
    try {
      u.track(name, data)
    } catch {
      /* swallow */
    }
    return
  }
  if (queue.length < MAX_QUEUE) queue.push({ name, data })
  ensureFlushLoop()
}

/**
 * Fires `resume_first_download` at most once per browser — the activation
 * milestone of a user reaching a real PDF output. Uses a localStorage flag as a
 * per-device heuristic (no server round-trip); a returning device won't refire.
 */
export function trackFirstDownloadOnce(props: AnalyticsEventMap["resume_first_download"]): void {
  if (typeof window === "undefined") return
  try {
    if (window.localStorage.getItem("rcv_first_dl")) return
    window.localStorage.setItem("rcv_first_dl", "1")
  } catch {
    return
  }
  track("resume_first_download", props)
}

/** Attach identity traits to the current Umami session (the "who"). No PII. */
export function identify(traits: IdentityTraits): void {
  const payload = traits as unknown as Record<string, unknown>
  const u = getUmami()
  if (u) {
    try {
      u.identify(payload)
    } catch {
      /* swallow */
    }
    return
  }
  pendingIdentity = payload
  ensureFlushLoop()
}
