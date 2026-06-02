"use client"

import { useTranslations } from "next-intl"
import { Share2, UserPlus, Gift } from "lucide-react"

export default function ReferralHowItWorks() {
  const t = useTranslations("dashboard.referrals.how_it_works")

  const steps = [
    { n: 1, key: "step1", icon: Share2 },
    { n: 2, key: "step2", icon: UserPlus },
    { n: 3, key: "step3", icon: Gift },
  ] as const

  return (
    <section className="relative rounded-2xl border border-[#E6EBF2] bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] uppercase text-[#00D4FF] mb-2">
        <span className="inline-block bg-[#00D4FF] opacity-50" style={{ width: 14, height: 1.5 }} />
        {t("eyebrow")}
      </div>
      <h3
        className="text-[18px] sm:text-[20px] font-bold text-[#1a2e4a] tracking-tight leading-tight"
        style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
      >
        {t("title")}
      </h3>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
        {steps.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.n}
              className="relative rounded-xl border border-[#E6EBF2] bg-[#FAFBFD] p-4 transition-all duration-200 hover:border-[rgba(0,212,255,0.30)] hover:bg-white hover:shadow-[0_8px_24px_-12px_rgba(0,212,255,0.25)]"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="relative">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-[14px] shadow-[0_6px_16px_-6px_rgba(0,212,255,0.55)]"
                    style={{ backgroundImage: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)" }}
                  >
                    {s.n}
                  </div>
                  <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-[rgba(0,212,255,0.35)]" />
                </div>
                <Icon className="h-4 w-4 text-[#1a2e4a] opacity-60" />
              </div>
              <p className="text-[13.5px] font-bold text-[#1a2e4a] tracking-tight">
                {t(`${s.key}_title` as "step1_title" | "step2_title" | "step3_title")}
              </p>
              <p className="text-[12px] text-[#6B7A8C] mt-1 leading-snug">
                {t(`${s.key}_desc` as "step1_desc" | "step2_desc" | "step3_desc")}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
