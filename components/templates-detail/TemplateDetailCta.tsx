import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TemplateSEO } from "@/lib/templates-seo"

interface Props {
  template: TemplateSEO
  locale: "en" | "es"
  t: (k: string) => string
}

export default function TemplateDetailCta({ template, locale, t }: Props) {
  return (
    <section
      className="relative overflow-hidden py-20 px-4 sm:px-6"
      style={{
        background: "linear-gradient(135deg, #1a2e4a 0%, #0f1a2e 50%, #00D4FF 220%)",
      }}
    >
      <div
        className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #00D4FF 0%, transparent 70%)" }}
      />
      <div className="relative max-w-3xl mx-auto text-center text-white">
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
          {t("final_cta_title")}
        </h2>
        <p className="text-lg text-cyan-100/80 mb-10">{t("final_cta_subtitle")}</p>
        <Link href={`/${locale}/register?template=${template.id}`}>
          <Button
            size="lg"
            className="gap-2 text-base font-semibold bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#0a1322] shadow-[0_10px_40px_-10px_rgba(0,212,255,0.7)] hover:shadow-[0_20px_60px_-10px_rgba(0,212,255,0.9)] transition-all px-8"
          >
            {t("final_cta_button")} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
