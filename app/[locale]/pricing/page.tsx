import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import { Check } from "lucide-react"
import type { Metadata } from "next"
import PricingButtons from "@/components/marketing/PricingButtons"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"

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
      canonical: "https://readycv.app/pricing",
    },
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      url: "https://readycv.app/pricing",
      type: "website",
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

  const features = [
    t("feature1"),
    t("feature2"),
    t("feature3"),
    t("feature4"),
    t("feature5"),
    t("feature6"),
    t("feature7"),
    t("feature8"),
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">{t("title")}</h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12">
            {t("subtitle")}
          </p>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {/* Trial */}
            <div className="bg-primary text-white rounded-2xl p-8 text-left">
              <div className="mb-6">
                <p className="text-sm font-medium text-white/70 mb-1">{t("trial_label")}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$0.99</span>
                  <span className="text-white/70">{t("trial_period")}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                    <Check className="h-4 w-4 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <PricingButtons plan="trial" />
              <p className="text-xs text-white/60 text-center mt-2">{t("cancel_anytime")}</p>
            </div>

            {/* Monthly */}
            <div className="bg-white border-2 border-border rounded-2xl p-8 text-left">
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">{t("monthly_label")}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$9.99</span>
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
              <PricingButtons plan="pro" />
              <p className="text-xs text-muted-foreground text-center mt-2">{t("cancel_anytime")}</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
