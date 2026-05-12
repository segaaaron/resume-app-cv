import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function GuideCTA({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "guide.cta" })

  return (
    <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-20 px-4 text-white text-center">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold">{t("h2")}</h2>
        <p className="text-lg text-white/85">{t("subtitle")}</p>
        <Button asChild size="lg" className="bg-white text-indigo-700 hover:bg-white/95 shadow-lg font-semibold text-base px-8">
          <Link href={`/${locale}/register`}>{t("button")}</Link>
        </Button>
        <p className="text-sm text-white/70">{t("note")}</p>
      </div>
    </section>
  )
}
