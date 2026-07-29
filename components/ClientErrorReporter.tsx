"use client"

import { useEffect } from "react"
import { reportClientError } from "@/lib/client-error-reporter"

/**
 * Global browser-error capture. Mounted once in the root layout, it forwards every
 * uncaught JS error and unhandled promise rejection to the admin Service Errors
 * dashboard. React render crashes are captured separately by the error.tsx boundaries.
 * Renders nothing.
 */
export default function ClientErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) =>
      reportClientError(e.message || String(e.error), (e.error as Error | undefined)?.stack, "error")

    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { message?: string; stack?: string } | undefined
      reportClientError(r?.message ?? String(e.reason), r?.stack, "unhandledrejection")
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
