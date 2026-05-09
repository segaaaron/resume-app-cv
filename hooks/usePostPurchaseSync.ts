"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

const MAX_POLL_MS = 30_000
const INITIAL_INTERVAL_MS = 2_000
const MAX_INTERVAL_MS = 8_000
const BACKOFF_FACTOR = 1.5
const CHANNEL_NAME = "billing"

export type PostPurchaseSyncState = "idle" | "polling" | "synced" | "timeout"

export function usePostPurchaseSync(): {
  syncState: PostPurchaseSyncState
  startSync: () => void
} {
  const { update } = useSession()
  const router = useRouter()
  const [syncState, setSyncState] = useState<PostPurchaseSyncState>("idle")
  const activeRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const channelRef = useRef<BroadcastChannel | null>(null)

  // Cleanup on unmount — stops any in-flight poll and pending setTimeout
  useEffect(() => {
    return () => {
      activeRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = async (event) => {
      if (event.data?.type === "BILLING_SYNCED") {
        activeRef.current = false
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setSyncState("synced")
        await update()
        router.refresh()
      }
    }

    return () => channel.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startSync = useCallback(() => {
    if (activeRef.current) return
    activeRef.current = true
    setSyncState("polling")

    const started = Date.now()
    let interval = INITIAL_INTERVAL_MS

    const poll = async () => {
      if (!activeRef.current) return

      if (Date.now() - started > MAX_POLL_MS) {
        activeRef.current = false
        setSyncState("timeout")
        return
      }

      try {
        const res = await fetch("/api/billing/post-purchase-status")

        if (res.status === 429) {
          // Rate limited — stop polling and show timeout state
          activeRef.current = false
          setSyncState("timeout")
          return
        }

        if (res.ok) {
          const data = await res.json() as {
            plan: string
            subscriptionStatus: string
          }
          const active =
            data.plan === "PRO" &&
            (data.subscriptionStatus === "ACTIVE" || data.subscriptionStatus === "PAST_DUE")
          if (active) {
            activeRef.current = false
            setSyncState("synced")
            await update()
            router.refresh()
            channelRef.current?.postMessage({ type: "BILLING_SYNCED" })
            return
          }
        }
      } catch {
        // transient network error — continue polling
      }

      interval = Math.min(interval * BACKOFF_FACTOR, MAX_INTERVAL_MS)
      timeoutRef.current = setTimeout(poll, interval)
    }

    poll()
  }, [update, router])

  return { syncState, startSync }
}
