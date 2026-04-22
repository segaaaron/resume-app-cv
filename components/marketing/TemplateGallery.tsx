import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TEMPLATES } from "@/types/resume"
import { getTranslations } from "next-intl/server"

const showcaseTemplates = TEMPLATES.slice(0, 6)

export default async function TemplateGallery() {
  const t = await getTranslations("template_gallery")

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">{t("title")}</h2>
        <p className="text-center text-muted-foreground mb-12">
          {t("subtitle")}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {showcaseTemplates.map((template) => (
            <Link
              key={template.id}
              href={`/templates#${template.id}`}
              className="group cursor-pointer"
            >
              <div className="aspect-[3/4] bg-gradient-to-br from-[#eaf3fc] to-white rounded-xl border-2 border-border group-hover:border-primary/60 transition-all overflow-hidden flex flex-col">
                {/* Mock template preview */}
                <div
                  className="h-8 w-full"
                  style={{ background: template.id === "elegant" || template.id === "metro" || template.id === "modern" ? "#1d1d20" : "#2a72d7" }}
                />
                <div className="flex-1 p-2 space-y-1">
                  <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-1 bg-gray-100 rounded w-1/2" />
                  <div className="mt-2 space-y-0.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-1 bg-gray-100 rounded w-full" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs font-medium text-center mt-2 group-hover:text-primary transition-colors">
                {template.name}
              </p>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/templates">{t("see_all")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
