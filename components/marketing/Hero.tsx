import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function Hero() {
  const t = await getTranslations("hero")

  let userCount = 1200
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/stats/users-count`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const data = await res.json()
      userCount = data.count ?? 1200
    }
  } catch {
    /* use fallback */
  }

  return (
    <section className="relative overflow-hidden bg-white">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 70% -10%, #EFF6FF 0%, transparent 60%)" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-[55%_45%] items-center gap-12">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-sm text-blue-700 font-medium mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            {userCount.toLocaleString()}+ {t("users_trust")}
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            {t("title")}{" "}
            <span className="text-primary">{t("title_highlight")}</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
            {t("subtitle")}
          </p>

          <ul className="space-y-2 mb-10">
            {[t("proof_ats"), t("proof_pdf"), t("proof_ai")].map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                {point}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="gap-2 shadow-brand-md" asChild>
              <Link href="/register">
                {t("cta_primary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/templates">{t("cta_secondary")}</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">{t("cancel_anytime")}</p>
        </div>

        <div className="relative hidden md:block">
          <div className="bg-white rounded-2xl shadow-brand-lg border border-neutral-100 overflow-hidden">
            <div className="bg-primary h-20 flex items-end px-6 pb-3">
              <div>
                <div className="h-4 bg-white/90 rounded w-40 mb-1.5" />
                <div className="h-2.5 bg-white/60 rounded w-24" />
              </div>
            </div>
            <div className="p-6 grid grid-cols-3 gap-5">
              <div className="col-span-2 space-y-4">
                {[80, 100, 65].map((w, i) => (
                  <div key={i}>
                    <div className="h-2.5 bg-neutral-200 rounded mb-2" style={{ width: "35%" }} />
                    <div className="h-2 bg-neutral-100 rounded mb-1 w-full" />
                    <div className="h-2 bg-neutral-100 rounded" style={{ width: `${w}%` }} />
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {[100, 80, 90, 70].map((w, i) => (
                  <div key={i} className="h-2 bg-neutral-100 rounded" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -left-6 bottom-8 bg-white shadow-brand-md border border-neutral-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-green-700 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ATS Score: 94%
          </div>
        </div>
      </div>
    </section>
  )
}
