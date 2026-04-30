import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowRight } from "lucide-react"

const EXAMPLES = [
  { file: "/examples/cv-example-tech.png", badgeKey: "badge_tech" as const, template: "Nova" },
  { file: "/examples/cv-example-design.png", badgeKey: "badge_design" as const, template: "EditorialSerif" },
  { file: "/examples/cv-example-legal.png", badgeKey: "badge_legal" as const, template: "Consul" },
  { file: "/examples/cv-example-health.png", badgeKey: "badge_health" as const, template: "ClassicMono" },
  { file: "/examples/cv-example-hospitality.png", badgeKey: "badge_hospitality" as const, template: "ChefMenu" },
]

export default async function CVExamples() {
  const t = await getTranslations("cv_examples")

  return (
    <section className="py-16 sm:py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {EXAMPLES.map((ex) => (
            <div key={ex.file} className="group flex flex-col gap-2">
              <div className="relative rounded-xl overflow-hidden border border-border shadow-sm bg-white aspect-[3/4] transition-shadow group-hover:shadow-md">
                <Image
                  src={ex.file}
                  alt={t(ex.badgeKey)}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              </div>
              <div className="flex flex-col gap-0.5 px-0.5">
                <span className="text-xs font-semibold text-primary">{t(ex.badgeKey)}</span>
                <span className="text-xs text-muted-foreground">{ex.template}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            {t("cta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
