import Link from "next/link"
import { Lock } from "lucide-react"
import MockTemplatePreview from "@/components/templates-detail/MockTemplatePreview"
import type { TemplateSEO } from "@/lib/templates-seo"

interface Props {
  related: TemplateSEO[]
  locale: "en" | "es"
  categoryLabelFor: (cat: TemplateSEO["category"]) => string
  t: (k: string) => string
}

export default function TemplateDetailRelated({ related, locale, categoryLabelFor, t }: Props) {
  if (related.length === 0) return null
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-[#1a2e4a] mb-2">{t("related_title")}</h2>
          <p className="text-slate-600">{t("related_subtitle")}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {related.map((rel) => (
            <Link key={rel.id} href={`/${locale}/templates/design/${rel.slug}`} className="group block">
              <div className="relative aspect-[3/4] mb-2.5 rounded-lg overflow-hidden border border-slate-200/60 group-hover:border-[#00D4FF]/40 transition-colors">
                <MockTemplatePreview templateId={rel.id} />
              </div>
              <div className="px-1">
                <h3 className="font-bold text-sm text-[#1a2e4a] leading-tight group-hover:text-[#00D4FF] transition-colors flex items-center gap-1.5">
                  {rel.name}
                  {rel.isPro && <Lock className="h-3 w-3 text-amber-500" aria-label={t("pro_required")} />}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{categoryLabelFor(rel.category)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
