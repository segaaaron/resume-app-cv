"use client"

import { useEffect } from "react"
import Link from "next/link"
import { reportClientError } from "@/lib/client-error-reporter"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface the render crash in the admin Service Errors dashboard.
    reportClientError(error.message, error.stack, "react")
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-4xl font-bold">500</h1>
      <p className="text-muted-foreground">Algo salió mal. Por favor intenta de nuevo.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="underline text-sm">
          Reintentar
        </button>
        <Link href="/" className="underline text-sm">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
