import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function ATSSection() {
  const t = await getTranslations("ats_section")

  const steps = [
    { number: "1", label: t("step1") },
    { number: "2", label: t("step2") },
    { number: "3", label: t("step3") },
  ]

  return (
    <section className="py-20 px-4 bg-background" id="ats-score">
      <div className="max-w-4xl mx-auto">
        {/* Problem block */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 max-w-2xl mx-auto leading-tight">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* 3-step flow */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0 mb-14">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center gap-4 sm:gap-0">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mb-2">
                  {step.number}
                </div>
                <span className="text-sm font-medium max-w-[120px]">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="h-5 w-5 text-muted-foreground mx-6 hidden sm:block shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Solution card */}
        <div className="bg-[#f8faff] border border-primary/20 rounded-2xl p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* ATS score ring mockup */}
            <div className="shrink-0 mx-auto sm:mx-0">
              <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-sm">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray="220 314"
                  strokeDashoffset="78"
                  strokeLinecap="round"
                  className="text-primary"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
                />
                <text x="60" y="58" textAnchor="middle" className="fill-foreground" fontSize="22" fontWeight="700">72</text>
                <text x="60" y="74" textAnchor="middle" className="fill-muted-foreground" fontSize="10">/100</text>
              </svg>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold mb-3">{t("solution_title")}</h3>
              <p className="text-muted-foreground mb-6">{t("solution_desc")}</p>
              <p className="text-lg font-semibold text-foreground mb-6">{t("payoff")}</p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors text-sm"
              >
                {t("cta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
