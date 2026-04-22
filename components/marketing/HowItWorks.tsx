import { PencilLine, Palette, Download } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function HowItWorks() {
  const t = await getTranslations("how_it_works")

  const steps = [
    {
      icon: PencilLine,
      step: "1",
      title: t("step1_title"),
      description: t("step1_desc"),
    },
    {
      icon: Palette,
      step: "2",
      title: t("step2_title"),
      description: t("step2_desc"),
    },
    {
      icon: Download,
      step: "3",
      title: t("step3_title"),
      description: t("step3_desc"),
    },
  ]

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">{t("title")}</h2>
        <p className="text-center text-muted-foreground mb-12">
          {t("subtitle")}
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ icon: Icon, step, title, description }) => (
            <div key={step} className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-2xl bg-[#eaf3fc] flex items-center justify-center">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {step}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
