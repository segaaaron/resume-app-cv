"use client"

/**
 * Marketing upsell shown at the top of the editor to non-PRO plans
 * (UNSUBSCRIBED / BASIC / SPRINT). Appears on every editor entry (dismiss is
 * session-only, not persisted) and adapts its message to the current plan,
 * pointing to the next tier. Premium, slim, responsive, accessible.
 */

import { useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { Sparkles, ArrowRight, X } from "lucide-react"

type UpsellPlan = "UNSUBSCRIBED" | "BASIC" | "SPRINT"

const COPY: Record<UpsellPlan, { es: string; en: string }> = {
  UNSUBSCRIBED: {
    es: "Desbloquea descargas e IA para crear un CV que destaque.",
    en: "Unlock downloads and AI to build a CV that stands out.",
  },
  BASIC: {
    es: "Suma asistente de IA y plantillas PRO con un plan superior.",
    en: "Add the AI assistant and PRO templates with a higher plan.",
  },
  SPRINT: {
    es: "Hazlo permanente con PRO — incluye ATS y revisión con IA.",
    en: "Make it permanent with PRO — includes ATS and AI review.",
  },
}

export default function UpgradeBanner({ plan }: { plan: string }) {
  const locale = useLocale()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null
  if (plan !== "UNSUBSCRIBED" && plan !== "BASIC" && plan !== "SPRINT") return null

  const isEs = locale === "es"
  const message = COPY[plan as UpsellPlan][isEs ? "es" : "en"]

  return (
    <div
      role="region"
      aria-label={isEs ? "Mejora tu plan" : "Upgrade your plan"}
      className="relative flex items-center gap-3 px-4 sm:px-5 py-2.5 text-white overflow-hidden"
      style={{ background: "linear-gradient(90deg, #1a2e4a 0%, #14233b 60%, #0f1a2e 100%)" }}
    >
      <span
        className="absolute inset-y-0 left-0 w-40 opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle at left, #00D4FF 0%, transparent 70%)" }}
      />
      <Sparkles className="relative h-4 w-4 shrink-0 text-[#00D4FF]" />
      <p className="relative flex-1 text-[12.5px] sm:text-[13px] leading-snug text-cyan-50/90 truncate">
        {message}
      </p>
      <Link
        href={`/${locale}/pricing`}
        className="relative shrink-0 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0a1322] bg-[#00D4FF] hover:bg-cyan-300 transition-colors px-3 py-1.5 rounded-full"
      >
        {isEs ? "Mejorar" : "Upgrade"} <ArrowRight className="h-3 w-3" />
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={isEs ? "Cerrar" : "Dismiss"}
        className="relative shrink-0 p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
