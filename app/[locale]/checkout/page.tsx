"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { apiFetch } from "@/lib/apiFetch"
import { reportUxFailure } from "@/lib/client-error-reporter"

function CheckoutRedirectInner() {
  const t = useTranslations("checkout")
  const params = useSearchParams()
  const routeParams = useParams()
  const locale = (routeParams?.locale as string | undefined) ?? "es"
  const plan = params.get("plan")
  // Derived: an absent or unknown ?plan= is visible on the first render. Setting it from
  // the effect meant painting the page once as "working" before admitting it was not.
  const planValid = plan === "monthly" || plan === "annual"
  const [error, setError] = useState(!planValid)

  useEffect(() => {
    if (!planValid) return

    // A checkout that does not start is a sale lost in silence: the buyer sees
    // "something went wrong" and leaves. Through apiFetch so a timeout or a
    // dead network is recorded, `silent` because this page renders its own
    // error state and a toast on top would say the same thing twice.
    apiFetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, locale }),
      silent: true,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          window.location.href = data.url
        } else {
          reportUxFailure("checkout_no_url", { plan: String(plan).slice(0, 40) })
          setError(true)
        }
      })
      .catch(() => {
        reportUxFailure("checkout_request_failed", { plan: String(plan).slice(0, 40) })
        setError(true)
      })
  }, [plan])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-lg font-semibold">{t("error_message")}</p>
        <Link href="/pricing" className="text-primary underline text-sm">{t("back_to_pricing")}</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-lg font-semibold">{t("loading")}</p>
      <p className="text-sm text-muted-foreground">{t("redirect_hint")}</p>
    </div>
  )
}

export default function CheckoutRedirectPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutRedirectInner />
    </Suspense>
  )
}
