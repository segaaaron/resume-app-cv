import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import PricingClientSection from "@/components/marketing/PricingClientSection"
import type { Metadata } from "next"
import Script from "next/script"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isActive } from "@/lib/plans"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"

export const dynamic = "force-dynamic"


const jsonLdSoftwareApp = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReadyCVV",
  url: "https://readycvv.com",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      price: "15.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "15.00",
        priceCurrency: "USD",
        billingIncrement: 1,
        unitCode: "MON",
      },
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      price: "144.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "144.00",
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
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/pricing`,
      languages: {
        es: "https://readycvv.com/es/pricing",
        en: "https://readycvv.com/en/pricing",
        "x-default": "https://readycvv.com/en/pricing",
      },
    },
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      url: `https://readycvv.com/${locale}/pricing`,
      type: "website",
      images: [{ url: "https://readycvv.com/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("og_title"),
      description: t("og_description"),
      images: ["https://readycvv.com/og-image.png"],
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
      { "@type": "ListItem", position: 1, name: tCommon("home_label"), item: "https://readycvv.com" },
      { "@type": "ListItem", position: 2, name: t("breadcrumb_pricing"), item: `https://readycvv.com/${locale}/pricing` },
    ],
  }
  const dateLocale = locale === "es" ? es : enUS

  const session = await auth()
  let userIsPro = false
  let subscriptionEndsAt: Date | null = null
  let planInterval: string | null = null

  if (session?.user?.id) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, planInterval: true, role: true },
    })
    if (dbUser) {
      userIsPro = isActive(dbUser.plan, dbUser.subscriptionEndsAt, dbUser.subscriptionStatus, dbUser.role)
      subscriptionEndsAt = dbUser.subscriptionEndsAt
      planInterval = dbUser.planInterval
    }
  }

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
      <main className="flex-1 py-12 sm:py-16">
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
          subscriptionEndsAt={
            subscriptionEndsAt
              ? format(new Date(subscriptionEndsAt), "d 'de' MMMM yyyy", { locale: dateLocale })
              : null
          }
          planInterval={planInterval}
        />
      </main>
      <Footer />
    </div>
  )
}
