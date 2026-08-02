"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

/**
 * Success-page half of Stripe's belt-and-suspenders fulfillment. When Checkout redirects
 * the buyer back with `?session_id=cs_...`, post it to /api/stripe/reconcile-session so
 * the plan activates immediately even if the webhook is delayed or misconfigured. The
 * endpoint is idempotent per session — it never double-provisions or charges — so this is
 * pure safety net on top of the webhook. Runs once, then strips session_id from the URL
 * so a refresh cannot re-post. Silent by design: a no-op (webhook already did it) is fine.
 */
export default function CheckoutReconciler() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const done = useRef(false)

  useEffect(() => {
    const sessionId = params.get("session_id")
    if (!sessionId || done.current) return
    done.current = true

    ;(async () => {
      try {
        await fetch("/api/stripe/reconcile-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
      } catch {
        // The webhook remains the primary path; swallow and let it fulfill.
      }
      // Strip only session_id — keep `upgraded=true` so any success UI still shows.
      const next = new URLSearchParams(params.toString())
      next.delete("session_id")
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    })()
  }, [params, router, pathname])

  return null
}
