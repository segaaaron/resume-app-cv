"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface Props {
  plan: "monthly" | "annual"
  isPro?: boolean
}

export default function PricingButtons({ plan, isPro }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const t = useTranslations("pricing")

  async function handleClick() {
    if (isPro) {
      window.location.href = "/api/stripe/portal"
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (res.status === 401) {
        router.push(`/register?plan=${plan}`)
        return
      }

      if (res.status === 503) {
        router.push(`/register?plan=${plan}`)
        return
      }

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? t("toast_payment_error"))
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error(t("toast_connection_error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="lg" className="w-full" onClick={handleClick} disabled={loading}>
      {loading ? t("btn_loading") : isPro ? t("pro_member_manage") : t("btn_start")}
    </Button>
  )
}
