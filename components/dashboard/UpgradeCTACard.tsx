"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { useTranslations, useLocale } from "next-intl"
import { Crown, ArrowRight, Check } from "lucide-react"
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
    <div
      className="relative mb-6 overflow-hidden rounded-2xl px-5 py-6 sm:px-7 sm:py-7"
      style={{ backgroundColor: "var(--dash-navy)" }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--dash-cyan-glow)" }}
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-3">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: "var(--dash-cyan)" }}
            >
              <Crown className="h-5 w-5" style={{ color: "var(--dash-navy)" }} />
            </span>
            <div
              className="h-px flex-1 max-w-[3rem] rounded-full"
              style={{ backgroundColor: "var(--dash-cyan)" }}
            />
          </div>

          <h2 className="font-playfair text-xl sm:text-2xl font-bold text-white leading-tight">
            {t("headline")}
          </h2>
          <p className="mt-1.5 text-sm sm:text-[15px] max-w-xl" style={{ color: "rgba(255,255,255,0.75)" }}>
            {t("subtext")}
          </p>

          <ul className="mt-4 flex flex-wrap gap-2">
            {pills.map((label) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-white/15"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                <Check className="h-3 w-3" style={{ color: "var(--dash-cyan)" }} aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end lg:text-right shrink-0">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.6)" }}>
            {t("price_hint")}
          </p>
          <Link
            href={`/${locale}/pricing`}
            className="group inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-lg transition-all hover:opacity-90 hover:scale-[1.02] active:scale-100"
            style={{ backgroundColor: "var(--dash-cyan)", color: "var(--dash-navy)" }}
          >
            {t("cta_button")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
