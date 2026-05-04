import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import { Check, BadgeCheck } from "lucide-react"
import type { Metadata } from "next"
import Script from "next/script"
import PricingButtons from "@/components/marketing/PricingButtons"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isActive } from "@/lib/plans"
import Link from "next/link"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"

const jsonLdBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: "https://readycvv.com" },
    { "@type": "ListItem", position: 2, name: "Precios", item: "https://readycvv.com/pricing" },
  ],
}

const jsonLdSoftwareApp = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ReadyCV",
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
  const dateLocale = locale === "es" ? es : enUS

  const session = await auth()
  let userIsPro = false
  let subscriptionEndsAt: Date | null = null

  if (session?.user?.id) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true },
    })
    if (dbUser) {
      userIsPro = isActive(dbUser.plan, dbUser.subscriptionEndsAt, dbUser.subscriptionStatus)
      subscriptionEndsAt = dbUser.subscriptionEndsAt
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
      <main className="flex-1 py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">{t("title")}</h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12">
            {t("subtitle")}
          </p>

          {userIsPro && (
            <div className="max-w-2xl mx-auto w-full mb-8 bg-primary/10 border border-primary/20 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <BadgeCheck className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-foreground">{t("pro_member_title")}</p>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionEndsAt
                      ? `${t("pro_member_renews")} ${format(new Date(subscriptionEndsAt), "d 'de' MMMM yyyy", { locale: dateLocale })}`
                      : t("pro_member_active")}
                  </p>
                </div>
              </div>
              <Link
                href="/api/stripe/portal"
                className="shrink-0 inline-flex items-center justify-center rounded-xl bg-primary text-white text-sm font-medium px-5 py-2.5 hover:bg-primary/90 transition-colors"
              >
                {t("pro_member_manage")}
              </Link>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {/* Monthly */}
            <div className="bg-white border-2 border-border rounded-2xl p-8 text-left">
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">{t("monthly_label")}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$15</span>
                  <span className="text-muted-foreground">{t("monthly_period")}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <PricingButtons plan="monthly" isPro={userIsPro} />
              <p className="text-xs text-muted-foreground text-center mt-2">{t("cancel_anytime")}</p>
            </div>

            {/* Annual */}
            <div className="bg-primary text-white rounded-2xl p-8 text-left">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-white/70">{t("annual_label")}</p>
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">{t("annual_badge")}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$144</span>
                  <span className="text-white/70">{t("annual_period")}</span>
                </div>
                <p className="text-xs text-white/60 mt-1">{t("annual_equiv")}</p>
              </div>
              <ul className="space-y-2 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                    <Check className="h-4 w-4 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <PricingButtons plan="annual" isPro={userIsPro} />
              <p className="text-xs text-white/60 text-center mt-2">{t("cancel_anytime")}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
