import { getTranslations } from "next-intl/server"
import { Palette, Sparkles, Target, Download } from "lucide-react"

export default async function GuideSteps({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "guide.steps" })

  const steps = [
    { icon: Palette, num: "1", title: t("step1_title"), desc: t("step1_desc") },
    { icon: Sparkles, num: "2", title: t("step2_title"), desc: t("step2_desc") },
    { icon: Target, num: "3", title: t("step3_title"), desc: t("step3_desc") },
    { icon: Download, num: "4", title: t("step4_title"), desc: t("step4_desc") },
  ]

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-14">{t("title")}</h2>
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div aria-hidden className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200" />

          {steps.map(({ icon: Icon, num, title, desc }) => (
            <div key={num} className="flex flex-col items-center text-center gap-3">
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <Icon className="h-7 w-7 text-white" />
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white border-2 border-indigo-300 text-[10px] font-bold text-indigo-600 flex items-center justify-center">
                  {num}
                </span>
              </div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
