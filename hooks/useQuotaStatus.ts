"use client"

/**
 * Lightweight quota status hook. The project does NOT use React Query / SWR,
 * so we hand-roll a small fetch+state implementation that:
 *  - fetches GET /api/user/quota-status on mount
 *  - refetches on `window` focus
 *  - exposes `refresh()` for explicit invalidation after AI use / create / delete
 *  - de-dupes concurrent in-flight requests
 *  - matches backend cache (5s) by no-op'ing refresh attempts within 1s
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"

export interface AiQuotaEntry {
  used: number
  limit: number
  remaining: number
  blocked: boolean
}

export interface PlanQuotaCounter {
  used: number
  limit: number
}

export interface QuotaStatusPayload {
  ai: Record<string, AiQuotaEntry>
  plan: {
    plan: "UNSUBSCRIBED" | "PRO" | string
    resumes: PlanQuotaCounter
    coverLetters: PlanQuotaCounter
    canExportPdf: boolean
    canImport: boolean
  }
}

interface UseQuotaStatusResult {
  data: QuotaStatusPayload | null
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

const REFRESH_DEDUPE_MS = 1_000

export function useQuotaStatus(): UseQuotaStatusResult {
  const [data, setData] = useState<QuotaStatusPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const inFlight = useRef<Promise<void> | null>(null)
  const lastFetch = useRef<number>(0)
  // Mirror of `data` so `fetcher` doesn't need it in deps — keeps the callback
  // stable across renders and prevents listener re-subscription on every state change.
  const dataRef = useRef<QuotaStatusPayload | null>(null)
  // Abort in-flight fetch on unmount.
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { dataRef.current = data }, [data])

  const fetcher = useCallback(async (): Promise<void> => {
    // de-dupe within REFRESH_DEDUPE_MS (read latest data via ref to keep deps empty)
    if (Date.now() - lastFetch.current < REFRESH_DEDUPE_MS && dataRef.current) return
    if (inFlight.current) return inFlight.current

    const ctrl = new AbortController()
    abortRef.current = ctrl

    const p = (async () => {
      try {
        const res = await apiFetch("/api/user/quota-status", { silent: true, signal: ctrl.signal })
        if (!res.ok) {
          throw new Error(`quota-status ${res.status}`)
        }
        const json = (await res.json()) as QuotaStatusPayload
        if (ctrl.signal.aborted) return
        setData(json)
        setError(null)
        lastFetch.current = Date.now()
      } catch (err) {
        if (ctrl.signal.aborted) return
        if (err instanceof Error && err.name === "AbortError") return
        setError(err instanceof Error ? err : new Error("quota-status failed"))
      } finally {
        if (!ctrl.signal.aborted) setIsLoading(false)
        if (abortRef.current === ctrl) abortRef.current = null
        inFlight.current = null
      }
    })()

    inFlight.current = p
    return p
  }, [])

  // initial fetch + cancel in-flight on unmount
  useEffect(() => {
    fetcher()
    return () => {
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // refetch on focus
  useEffect(() => {
    const onFocus = () => {
      lastFetch.current = 0 // bypass de-dupe on user-initiated focus
      fetcher()
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [fetcher])

  // refetch when billing is synced from another tab
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return
    const channel = new BroadcastChannel("billing")
    channel.onmessage = (e) => {
      if (e.data?.type === "BILLING_SYNCED") {
        lastFetch.current = 0
        fetcher()
      }
    }
    return () => channel.close()
  }, [fetcher])

  const refresh = useCallback(async () => {
    lastFetch.current = 0
    await fetcher()
  }, [fetcher])

  return { data, isLoading, error, refresh }
}
