"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  plan: "trial" | "pro"
}

export default function PricingButtons({ plan }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    try {
      const priceId =
        plan === "trial"
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_TRIAL
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO

      if (!priceId) {
        // Stripe not configured — redirect to register
        router.push("/register")
        return
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })

      if (res.status === 401) {
        router.push("/login")
        return
      }

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Error al iniciar el pago")
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (plan === "trial") {
    return (
      <Button variant="secondary" size="lg" className="w-full" onClick={handleClick} disabled={loading}>
        {loading ? "Redirigiendo..." : "Comenzar prueba"}
      </Button>
    )
  }

  return (
    <Button size="lg" className="w-full" onClick={handleClick} disabled={loading}>
      {loading ? "Redirigiendo..." : "Empezar ahora"}
    </Button>
  )
}
