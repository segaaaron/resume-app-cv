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

  const fetcher = useCallback(async (): Promise<void> => {
    // de-dupe within REFRESH_DEDUPE_MS
    if (Date.now() - lastFetch.current < REFRESH_DEDUPE_MS && data) return
    if (inFlight.current) return inFlight.current

    const p = (async () => {
      try {
        const res = await apiFetch("/api/user/quota-status", { silent: true })
        if (!res.ok) {
          throw new Error(`quota-status ${res.status}`)
        }
        const json = (await res.json()) as QuotaStatusPayload
        setData(json)
        setError(null)
        lastFetch.current = Date.now()
      } catch (err) {
        setError(err instanceof Error ? err : new Error("quota-status failed"))
      } finally {
        setIsLoading(false)
        inFlight.current = null
      }
    })()

    inFlight.current = p
    return p
  }, [data])

  // initial fetch
  useEffect(() => {
    fetcher()
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

  const refresh = useCallback(async () => {
    lastFetch.current = 0
    await fetcher()
  }, [fetcher])

  return { data, isLoading, error, refresh }
}
