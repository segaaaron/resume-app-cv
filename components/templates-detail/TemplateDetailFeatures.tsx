import { Sparkles, Award, Layout, FileText, Zap, Palette, CheckCircle2, ImageIcon } from "lucide-react"
import { templateName, type TemplateSEO } from "@/lib/templates-seo"

const FEATURE_ICONS = [Sparkles, Layout, Palette, Award, FileText, Zap, CheckCircle2, ImageIcon] as const

interface Props {
  template: TemplateSEO
  locale: "en" | "es"
  features: string[]
  t: (k: string) => string
}

export default function TemplateDetailFeatures({ template, locale, features, t }: Props) {
  return (
    <section className="py-20 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#1a2e4a] bg-[#1a2e4a]/5 px-3 py-1 rounded-full mb-4">
            {t("features_title")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1a2e4a]">{templateName(template, locale)}</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]
            return (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-6 border border-slate-200/60 shadow-[0_10px_40px_-15px_rgba(26,46,74,0.15)] hover:shadow-[0_20px_60px_-15px_rgba(26,46,74,0.3)] hover:-translate-y-1 hover:border-[#00D4FF]/40 transition-all duration-300"
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-transform group-hover:scale-110"
                  style={{
                    background: "linear-gradient(135deg, #1a2e4a 0%, #00D4FF 120%)",
                    boxShadow: "0 8px 20px -8px rgba(26,46,74,0.4)",
                  }}
                >
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.2} />
                </div>
                <p className="text-sm font-semibold text-[#1a2e4a] leading-snug">{feature}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
