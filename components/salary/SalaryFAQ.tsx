"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

type Item = { q: string; a: string }

export default function SalaryFAQ({
  title,
  items,
}: {
  title: string
  items: Item[]
}) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="relative mx-auto max-w-3xl px-6 pb-16">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#1a2e4a] md:text-4xl">
        {title}
      </h2>
      <div className="mt-10 space-y-3">
        {items.map((it, i) => {
          const isOpen = open === i
          return (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-[#1a2e4a]/10 bg-white/85 shadow-[0_10px_30px_-15px_rgba(15,26,46,0.18)] backdrop-blur transition-shadow hover:shadow-[0_15px_40px_-15px_rgba(0,212,255,0.2)]"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-6 py-5 text-left"
              >
                <span className="text-base font-bold text-[#1a2e4a] md:text-lg">{it.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[#1a2e4a]/45 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-[#1a2e4a]/8 bg-[#f7fafc]/60 px-6 py-5 text-sm leading-relaxed text-[#1a2e4a]/80">
                  {it.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
