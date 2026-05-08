import { FileText, Mail, Kanban, Sparkles, Layout } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Card } from "@/components/ui/card"

const FEATURE_KEYS = [
  { icon: FileText, titleKey: "cv_title", descKey: "cv_desc" },
  { icon: Mail, titleKey: "cover_letter_title", descKey: "cover_letter_desc" },
  { icon: Layout, titleKey: "jobs_title", descKey: "jobs_desc" },
  { icon: Sparkles, titleKey: "ai_title", descKey: "ai_desc" },
  { icon: Kanban, titleKey: "kanban_title", descKey: "kanban_desc" },
] as const

export default async function FeatureCards() {
  const t = await getTranslations("features")

  return (
    <section className="py-24 px-4 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURE_KEYS.map(({ icon: Icon, titleKey, descKey }) => (
            <Card key={titleKey} variant="interactive" className="p-6">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{t(titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
