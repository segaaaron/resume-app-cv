import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default async function GuideHero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "guide.hero" })

  const stats = [
    t("stat_templates"),
    t("stat_ai"),
    t("stat_ats"),
    t("stat_pdf"),
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-4 py-20 sm:py-28 text-white">
      <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm mb-6">
          <Sparkles className="h-3 w-3" />
          {t("badge")}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
          {t("h1")}
        </h1>

        <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto mb-8 leading-relaxed">
          {t("subtitle")}
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {stats.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/25 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              ✓ {s}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="bg-white text-indigo-700 hover:bg-white/95 shadow-lg font-semibold">
            <Link href={`/${locale}/register`}>{t("cta_primary")} →</Link>
          </Button>
          <Button asChild size="lg" className="bg-white text-indigo-700 hover:bg-white/95 shadow-lg font-semibold">
            <Link href={`/${locale}/pricing`}>{t("cta_secondary")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
