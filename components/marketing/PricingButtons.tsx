"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface Props {
  plan: "trial" | "pro"
}

export default function PricingButtons({ plan }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const t = useTranslations("pricing")

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (res.status === 401) {
        router.push("/login")
        return
      }

      if (res.status === 503) {
        router.push("/register")
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
        {loading ? t("btn_trial_loading") : t("btn_trial")}
      </Button>
    )
  }

  return (
    <Button size="lg" className="w-full" onClick={handleClick} disabled={loading}>
      {loading ? t("btn_pro_loading") : t("btn_pro")}
    </Button>
  )
}
