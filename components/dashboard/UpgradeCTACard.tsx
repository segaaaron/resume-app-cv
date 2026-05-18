"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useTranslations, useLocale } from "next-intl"
import { Crown, Sparkles, ArrowRight, Check } from "lucide-react"
import { isActive } from "@/lib/plans"

/**
 * UpgradeCTACard
 * Prominent upsell shown at the top of dashboard list views when the
 * current user does NOT have an active Pro subscription.
 *
 * Visibility rule:
 *   show = plan !== "PRO" OR subscriptionStatus is not in {ACTIVE, CANCELED}
 *   (CANCELED users still keep access until subscriptionEndsAt — we do not
 *   pester them with the upsell during the grace window.)
 */
export default function UpgradeCTACard() {
  const t = useTranslations("dashboard.upgrade_cta")
  const locale = useLocale()
  const { data: session, status } = useSession()

  // While loading the session we render nothing to avoid a flash of CTA
  // for users who actually are Pro.
  if (status === "loading") return null

  const pro = isActive(
    session?.user?.plan ?? "UNSUBSCRIBED",
    session?.user?.subscriptionEndsAt ? new Date(session.user.subscriptionEndsAt) : null,
    session?.user?.subscriptionStatus,
    session?.user?.role,
  )

  if (pro) return null

  const pills = [
    t("pill_unlimited_cvs"),
    t("pill_cover_letters"),
    t("pill_pdf_export"),
    t("pill_premium_templates"),
  ]

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-5 py-6 shadow-lg sm:px-7 sm:py-7">
      {/* Decorative sparkles */}
      <Sparkles
        aria-hidden
        className="pointer-events-none absolute -right-2 -top-2 h-24 w-24 text-white/10"
      />
      <Sparkles
        aria-hidden
        className="pointer-events-none absolute bottom-2 right-20 h-10 w-10 text-white/15"
      />
      <Sparkles
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-3 h-6 w-6 text-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
              <Crown className="h-5 w-5 text-white" />
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white ring-1 ring-white/25">
              Pro
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            {t("headline")}
          </h2>
          <p className="mt-1.5 text-sm sm:text-[15px] text-white/85 max-w-xl">
            {t("subtext")}
          </p>

          <ul className="mt-4 flex flex-wrap gap-2">
            {pills.map((label) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur-sm"
              >
                <Check className="h-3 w-3" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end lg:text-right shrink-0">
          <p className="text-xs font-medium uppercase tracking-wide text-white/75">
            {t("price_hint")}
          </p>
          <Link
            href={`/${locale}/pricing`}
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-md ring-1 ring-white/40 transition-all hover:bg-white/95 hover:shadow-lg hover:scale-[1.02] active:scale-100"
          >
            {t("cta_button")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
