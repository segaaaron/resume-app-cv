"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { ChevronDown, HelpCircle } from "lucide-react"

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const

export default function ReferralFAQ() {
  const t = useTranslations("dashboard.referrals.faq")
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="relative rounded-2xl border border-[#E6EBF2] bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(0,212,255,0.10)] border border-[rgba(0,212,255,0.25)] text-[#00A8CC]">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h3
            className="text-[18px] sm:text-[20px] font-bold text-[#1a2e4a] tracking-tight leading-tight"
            style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
          >
            {t("title")}
          </h3>
          <p className="text-[12.5px] text-[#6B7A8C] mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {FAQ_KEYS.map((key, i) => {
          const isOpen = openIndex === i
          return (
            <li
              key={key}
              className={[
                "rounded-xl border transition-all duration-200",
                isOpen
                  ? "border-[rgba(0,212,255,0.30)] bg-gradient-to-br from-[rgba(0,212,255,0.04)] to-white shadow-[0_6px_18px_-12px_rgba(0,212,255,0.30)]"
                  : "border-[#E6EBF2] bg-[#FAFBFD] hover:border-[#D5DCE7]",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="text-[13.5px] font-semibold text-[#1a2e4a] tracking-tight">
                  {t(`${key}_question` as `${typeof key}_question`)}
                </span>
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-transform duration-200",
                    isOpen
                      ? "border-[rgba(0,212,255,0.35)] bg-[#00D4FF] text-[#0a1a2e] rotate-180"
                      : "border-[#E6EBF2] bg-white text-[#6B7A8C]",
                  ].join(" ")}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-200"
                style={{ maxHeight: isOpen ? 200 : 0, opacity: isOpen ? 1 : 0 }}
              >
                <p className="px-4 pb-4 pt-1 text-[12.5px] text-[#4a5a72] leading-relaxed">
                  {t(`${key}_answer` as `${typeof key}_answer`)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
