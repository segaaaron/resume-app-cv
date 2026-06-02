import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import { TEMPLATES } from "@/types/resume"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { PRO_IDS } from "@/components/editor/template-switcher"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.pro_designs" })

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/pro-disenos`,
      languages: {
        es: "https://readycvv.com/es/pro-disenos",
        en: "https://readycvv.com/en/pro-disenos",
        "x-default": "https://readycvv.com/en/pro-disenos",
      },
    },
  }
}

const PRO_VISUALS: Record<string, {
  bg: string; accent: string; headerBg: string; headerText: string;
  gradient?: string
}> = {
  aurora:  { bg: "#f5f3ff", accent: "#8b5cf6", headerBg: "#4c1d95", headerText: "#fff",     gradient: "from-violet-600 to-purple-400" },
  helix:   { bg: "#0d1117", accent: "#22d3ee", headerBg: "#0d1117", headerText: "#22d3ee",  gradient: "from-cyan-500 to-blue-600" },
  lumiere: { bg: "#faf9f7", accent: "#b45309", headerBg: "#fff",    headerText: "#1a1a1a",  gradient: "from-amber-600 to-yellow-400" },
  prism:   { bg: "#fff",    accent: "#29b6d8", headerBg: "#1b2a3b", headerText: "#29b6d8",  gradient: "from-sky-500 to-teal-400" },
  consul:  { bg: "#eff6ff", accent: "#2563eb", headerBg: "#2563eb", headerText: "#fff",     gradient: "from-blue-600 to-indigo-400" },
}


export default async function ProDisenosPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("pro_designs_page")

  const proTemplates = TEMPLATES.filter((tmpl) => PRO_IDS.includes(tmpl.id))
  const descriptions: Record<string, { tagline: string; features: string[] }> = {
    aurora:  { tagline: t("aurora_tagline"),  features: [t("aurora_f1"),  t("aurora_f2"),  t("aurora_f3"),  t("aurora_f4")]  },
    helix:   { tagline: t("helix_tagline"),   features: [t("helix_f1"),   t("helix_f2"),   t("helix_f3"),   t("helix_f4")]   },
    lumiere: { tagline: t("lumiere_tagline"), features: [t("lumiere_f1"), t("lumiere_f2"), t("lumiere_f3"), t("lumiere_f4")] },
    prism:   { tagline: t("prism_tagline"),   features: [t("prism_f1"),   t("prism_f2"),   t("prism_f3"),   t("prism_f4")]   },
    consul:  { tagline: t("consul_tagline"),  features: [t("consul_f1"),  t("consul_f2"),  t("consul_f3"),  t("consul_f4")]  },
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 py-20 px-4">
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="hex" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                <polygon points="30,2 58,17 58,47 30,62 2,47 2,17" fill="none" stroke="#a78bfa" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="800" height="400" fill="url(#hex)" />
          </svg>

          <div className="relative max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-violet-400 to-cyan-400 text-transparent bg-clip-text mb-4">
              {t("exclusive")}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-violet-200 text-lg max-w-2xl mx-auto mb-8">
              {t("subtitle")}
            </p>
            <Button size="lg" className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white border-0" asChild>
              <Link href="/register">{t("cta_start")}</Link>
            </Button>
          </div>
        </section>

        {/* Template cards */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {proTemplates.map((template) => {
                const visual = PRO_VISUALS[template.id]
                const desc = descriptions[template.id]
                const gradient = visual?.gradient ?? "from-violet-500 to-cyan-500"

                return (
                  <Link key={template.id} href="/register" className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border">
                    <div className={`relative h-48 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 192" preserveAspectRatio="xMidYMid slice">
                        <circle cx="320" cy="40"  r="80"  fill="white" />
                        <circle cx="60"  cy="160" r="60"  fill="white" />
                        <circle cx="200" cy="96"  r="120" fill="white" />
                      </svg>
                      <span className="relative text-white font-black text-5xl opacity-30 tracking-widest select-none">
                        {template.name.replace(/[✦⭐]/g, "").trim().toUpperCase().slice(0, 2)}
                      </span>
                      <div className="absolute top-3 right-3 bg-white/20 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                        {t("pro_badge")}
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <h2 className="text-lg font-extrabold mb-1">{template.name}</h2>
                      <p className="text-sm text-muted-foreground mb-4">{desc?.tagline}</p>
                      <ul className="flex flex-col gap-1.5 mt-auto">
                        {desc?.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="mt-0.5 text-violet-500 font-bold">✦</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-5">
                        <span className="inline-block w-full text-center text-sm font-semibold text-primary group-hover:underline">
                          {t("use_template")}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">{t("cta_title")}</h2>
          <p className="text-muted-foreground mb-6">{t("cta_subtitle")}</p>
          <Button size="lg" asChild>
            <Link href="/register">{t("cta_button")}</Link>
          </Button>
        </section>

      </main>
      <Footer />
    </div>
  )
}
