import Link from "next/link"
import { Sparkles, Wand2, Target, Brain, Lightbulb, FileText, MessageSquare } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function AIFeatures() {
  const t = await getTranslations("ai_features")

  const clusters = [
    {
      label: t("cluster1_title"),
      tools: [
        { icon: Wand2, title: t("bullet_title"), desc: t("bullet_desc") },
        { icon: FileText, title: t("summary_title"), desc: t("summary_desc") },
        { icon: Sparkles, title: t("fill_title"), desc: t("fill_desc") },
      ],
    },
    {
      label: t("cluster2_title"),
      tools: [
        { icon: Target, title: t("ats_title"), desc: t("ats_desc") },
        { icon: Brain, title: t("skills_title"), desc: t("skills_desc") },
      ],
    },
    {
      label: t("cluster3_title"),
      tools: [
        { icon: Lightbulb, title: t("coverletter_title"), desc: t("coverletter_desc") },
        { icon: MessageSquare, title: t("review_title"), desc: t("review_desc") },
      ],
    },
  ]

  return (
    <section className="py-20 px-4 bg-[#f8faff]" id="ia">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="h-4 w-4" />
            7 {t("pro_badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">{t("section_title")}</h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            {t("section_subtitle")}
          </p>
        </div>

        <div className="space-y-10">
          {clusters.map((cluster) => (
            <div key={cluster.label}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {cluster.label}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cluster.tools.map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="bg-white rounded-2xl border border-border p-6 hover:shadow-md hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-[#eaf3fc] flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full self-start mt-1">
                        {t("pro_badge")}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-primary rounded-2xl p-8 text-center text-white">
          <p className="text-lg font-semibold mb-1">{t("cta_title")}</p>
          <p className="text-white/70 mb-6">{t("cta_desc")}</p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors text-sm"
          >
            {t("cta_btn")}
          </Link>
        </div>
      </div>
    </section>
  )
}
