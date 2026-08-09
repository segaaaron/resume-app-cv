import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import PricingClientSection from "@/components/marketing/PricingClientSection"
import type { Metadata } from "next"
import Script from "next/script"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isActive, hasManageableBilling, hasGatewayBilling, hasStripeBillingPortal, blocksNewPurchase, isStaffAccess as isStaffAccessFn } from "@/lib/plans"
import { PRICING, priceForSchema } from "@/lib/pricing"
import { redirect } from "next/navigation"
import { isEUUser } from "@/lib/geoip"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"


const jsonLdSoftwareApp = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Valhalla Resume",
  url: "https://www.valhallaresume.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      price: priceForSchema(PRICING.proMonthly),
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: priceForSchema(PRICING.proMonthly),
        priceCurrency: "USD",
        billingIncrement: 1,
        unitCode: "MON",
      },
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      price: priceForSchema(PRICING.proAnnual),
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: priceForSchema(PRICING.proAnnual),
        priceCurrency: "USD",
        billingIncrement: 1,
        unitCode: "ANN",
      },
      availability: "https://schema.org/InStock",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "320",
    bestRating: "5",
    worstRating: "1",
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.pricing" })

  return {
    // `absolute` on purpose: this title already opens with the brand, so letting the
    // root layout's `title.template` append "| Valhalla Resume" printed it twice.
    title: { absolute: t("title") },
    description: t("description"),
    alternates: {
      canonical: `https://www.valhallaresume.com/${locale}/pricing`,
      languages: {
        es: "https://www.valhallaresume.com/es/pricing",
        en: "https://www.valhallaresume.com/en/pricing",
        "x-default": "https://www.valhallaresume.com/en/pricing",
      },
    },
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      url: `https://www.valhallaresume.com/${locale}/pricing`,
      type: "website",
      images: [{ url: "https://www.valhallaresume.com/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("og_title"),
      description: t("og_description"),
      images: ["https://www.valhallaresume.com/og-image.png"],
    },
  }
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("pricing")
  const tCommon = await getTranslations("common")

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tCommon("home_label"), item: "https://www.valhallaresume.com" },
      { "@type": "ListItem", position: 2, name: t("breadcrumb_pricing"), item: `https://www.valhallaresume.com/${locale}/pricing` },
    ],
  }
  const dateLocale = locale === "es" ? es : enUS

  const [session, isEU] = await Promise.all([auth(), isEUUser()])
  let userIsPro = false
  let canManageBilling = false
  let subscriptionCancelled = false
  /** Access with no gateway behind it — nothing to cancel, nothing to buy, only support can unblock. */
  let billingNeedsSupport = false
  let blocksRecurringPurchase = false
  let blocksOneTimePurchase = false
  let isStaffAccess = false
  let subscriptionEndsAt: Date | null = null
  let planInterval: string | null = null
  let paymentProvider: string | null = null
  // Which KIND of access the banner is describing. The banner used to assume every
  // `userIsPro` was a subscriber, so it told one-time BASIC/SPRINT buyers "you're a Pro
  // member, your plan renews on X" — both false: they aren't PRO and a one-time payment
  // never renews. Admins got "your subscription is active" with no subscription at all.
  let accessKind: "subscription" | "one_time" | "staff" = "subscription"
  let oneTimePlanLabel: string | null = null

  if (session?.user?.id) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, planInterval: true, paymentProvider: true, role: true, isManaged: true, managedBlocked: true, managedExpiresAt: true, stripeCustomerId: true },
    })
    if (dbUser?.isManaged || dbUser?.plan === "LIMITED") {
      redirect(`/${locale}/dashboard`)
    }
    if (dbUser) {
      userIsPro = isActive(
        dbUser.plan,
        dbUser.subscriptionEndsAt,
        dbUser.subscriptionStatus,
        dbUser.role,
        dbUser.isManaged,
        dbUser.managedBlocked,
        dbUser.managedExpiresAt,
      )
      // FOUR separate questions, deliberately not one flag (they answer differently
      // for admins, one-time buyers, users who already cancelled, and rows whose
      // status has no gateway behind it):
      //   · userIsPro        → does the user have PRO ACCESS right now?
      //   · hasRealBilling   → is a gateway actually billing them? (status can lie)
      //   · canManageBilling → is there a manage action that will not fail?
      //   · blocks*Purchase  → would a new checkout be rejected? (mirrors the backend)
      // A CANCELED user is the case that proves they must stay apart: billing to
      // manage (portal) YES, upgrade blocked NO, one-time downgrade blocked YES.
      //
      // `subscriptionStatus` is NOT proof that money is moving. A row granted outside
      // checkout (admin grant, manual DB fix, migrated data) carries ACTIVE with no
      // Stripe customer and no PayPal agreement: the portal 400s
      // (`no_active_subscription`), and telling them to "cancel first" points at
      // something that does not exist.
      const hasRealBilling = hasGatewayBilling(
        dbUser.subscriptionStatus,
        dbUser.stripeCustomerId,
        dbUser.paymentProvider,
      )
      // PayPal has no hosted portal but does have the in-app cancel in Settings, so
      // for them real billing IS a manage action. Stripe additionally needs the
      // customer the portal opens against.
      canManageBilling = dbUser.paymentProvider === "PAYPAL"
        ? hasRealBilling
        : hasStripeBillingPortal(dbUser.subscriptionStatus, dbUser.stripeCustomerId)
      // Cancelled-but-still-running is about the STATUS only — it drives the banner
      // copy ("you keep access until X" instead of "renews on X"), which stays true
      // whether or not a Stripe customer exists.
      subscriptionCancelled = hasManageableBilling(dbUser.subscriptionStatus)
        && !blocksNewPurchase(dbUser.subscriptionStatus, false)
      blocksRecurringPurchase = blocksNewPurchase(dbUser.subscriptionStatus, false)
      blocksOneTimePurchase = blocksNewPurchase(dbUser.subscriptionStatus, true)
      // An admin whose ACTIVE status has no gateway behind it is staff access, not a
      // subscriber. Judging this by status alone was the gap: it produced a banner
      // claiming their subscription renews, a portal button that 400s, and one-time
      // cards locked behind a date that never comes.
      isStaffAccess = isStaffAccessFn(dbUser.role, dbUser.subscriptionStatus, hasRealBilling)
      // Access with no gateway behind it and a status that blocks buying: the user can
      // neither manage nor purchase, and every "cancel first" instruction is
      // unfollowable. Only support can fix the row, so say that instead.
      billingNeedsSupport = !isStaffAccess && !hasRealBilling && hasManageableBilling(dbUser.subscriptionStatus)
      subscriptionEndsAt = dbUser.subscriptionEndsAt
      planInterval = dbUser.planInterval
      paymentProvider = dbUser.paymentProvider

      const isOneTimePlan = dbUser.plan === "BASIC" || dbUser.plan === "SPRINT"
      accessKind = isStaffAccess ? "staff" : isOneTimePlan ? "one_time" : "subscription"
      oneTimePlanLabel = isOneTimePlan ? (dbUser.plan === "BASIC" ? "Basic" : "Sprint") : null
    }
  }

  // The Spanish pattern hardcodes "de", so English read "26 de August 2026".
  // Same split SettingsForm already uses.
  const formattedEndsAt = subscriptionEndsAt
    ? format(new Date(subscriptionEndsAt), locale === "es" ? "d 'de' MMMM yyyy" : "MMMM d, yyyy", { locale: dateLocale })
    : null

  const features = [
    t("feature1"),
    t("feature2"),
    t("feature3"),
    t("feature4"),
    t("feature5"),
    t("feature6"),
    t("feature7"),
    t("feature8"),
    t("feature10"),
    t("feature11"),
    t("feature12"),
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Script
        id="json-ld-breadcrumb-pricing"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <Script
        id="json-ld-software-app-pricing"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftwareApp) }}
      />
      <Navbar />
      <main id="main-content" className="flex-1 py-12 sm:py-16">
        <PricingClientSection
          features={features}
          userIsPro={userIsPro}
          proMemberTitle={t("pro_member_title")}
          proMemberRenews={t("pro_member_renews")}
          proMemberActive={t("pro_member_active")}
          planAnnual={t("plan_annual")}
          planMonthly={t("plan_monthly")}
          cancelAnytime={t("cancel_anytime")}
          monthlyLabel={t("monthly_label")}
          annualLabel={t("annual_label")}
          annualBadge={t("annual_badge")}
          annualEquiv={t("annual_equiv")}
          titleText={t("title")}
          subtitleText={t("subtitle")}
          accentLabel={t("accent_label")}
          subscriptionEndsAt={formattedEndsAt}
          planInterval={planInterval}
          isEU={isEU}
          isEs={locale === "es"}
          paypalAvailable={false /* PayPal hidden by CEO decision until launch — Stripe only. Existing PayPal payers still manage billing via isPayPalPayer below. Restore paypalEnabled() to re-enable the checkout option. */}
          proMemberManage={t("pro_member_manage")}
          isPayPalPayer={paymentProvider === "PAYPAL"}
          canManageBilling={canManageBilling}
          subscriptionCancelled={subscriptionCancelled}
          billingNeedsSupport={billingNeedsSupport}
          blocksRecurringPurchase={blocksRecurringPurchase}
          blocksOneTimePurchase={blocksOneTimePurchase}
          isStaffAccess={isStaffAccess}
          accessKind={accessKind}
          oneTimePlanLabel={oneTimePlanLabel}
          memberTitleOneTime={t("member_title_onetime")}
          memberTitleStaff={t("member_title_staff")}
          memberOneTimeUntil={
            formattedEndsAt
              ? t("member_onetime_until", { date: formattedEndsAt })
              : t("member_onetime_no_date")
          }
          memberStaffNote={t("member_staff_note")}
          memberCancelledUntil={
            formattedEndsAt
              ? t("member_cancelled_until", { date: formattedEndsAt })
              : t("member_cancelled")
          }
        />
      </main>
      <Footer />
    </div>
  )
}
