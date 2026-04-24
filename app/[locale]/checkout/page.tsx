"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function CheckoutRedirectPage() {
  const params = useSearchParams()
  const plan = params.get("plan")
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!plan || (plan !== "monthly" && plan !== "annual")) {
      setError(true)
      return
    }

    fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          window.location.href = data.url
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
  }, [plan])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-lg font-semibold">Ocurrió un error al iniciar el pago.</p>
        <a href="/pricing" className="text-primary underline text-sm">Volver a precios</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-lg font-semibold">Preparando tu pago...</p>
      <p className="text-sm text-muted-foreground">Serás redirigido a Stripe en un momento.</p>
    </div>
  )
}
