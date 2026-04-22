import { FileText, Mail, Briefcase, Kanban } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function FeatureCards() {
  const t = await getTranslations("features")

  const features = [
    {
      icon: FileText,
      title: t("cv_title"),
      description: t("cv_desc"),
    },
    {
      icon: Mail,
      title: t("cover_letter_title"),
      description: t("cover_letter_desc"),
    },
    {
      icon: Briefcase,
      title: t("jobs_title"),
      description: t("jobs_desc"),
    },
    {
      icon: Kanban,
      title: t("kanban_title"),
      description: t("kanban_desc"),
    },
  ]

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">{t("title")}</h2>
        <p className="text-center text-muted-foreground mb-12">
          {t("subtitle")}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-border p-6 hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-[#eaf3fc] flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
