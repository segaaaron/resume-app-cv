import { getTranslations } from "next-intl/server"

export default async function GuideStats({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "guide.stats" })

  const stats = [
    { number: t("templates_number"), label: t("templates_label") },
    { number: t("ai_number"), label: t("ai_label") },
    { number: t("time_number"), label: t("time_label") },
  ]

  return (
    <section className="py-16 px-4 bg-neutral-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-sm font-bold text-center text-muted-foreground mb-10 uppercase tracking-wide">
          {t("title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center animate-on-scroll">
          {stats.map(({ number, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <span className="text-5xl font-extrabold text-primary">{number}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
