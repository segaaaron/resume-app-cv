"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { apiFetch } from "@/lib/apiFetch"
import { reportUxFailure } from "@/lib/client-error-reporter"

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
        // Through apiFetch so a timeout or a dead network is recorded like every
        // other request. `silent` keeps the UX identical: the webhook is the
        // primary path, so the buyer must not be shown an error for a backup
        // that failed.
        await apiFetch("/api/stripe/reconcile-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
          silent: true,
        })
      } catch {
        // The webhook remains the primary path; swallow and let it fulfill.
        // Swallowed for the USER, not for us: if this backup is failing for
        // everyone, the only sign would be fulfilment arriving late, and by then
        // it is a support ticket about money.
        reportUxFailure("checkout_reconcile_failed")
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
