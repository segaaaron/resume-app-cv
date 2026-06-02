"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"

type FaqItem = { q: string; a: string }

type Props = {
  items: FaqItem[]
  title: string
}

/**
 * Premium FAQ accordion — navy/cyan, smooth height transitions.
 * Client component (interactive). FAQ schema rendered separately by BlogSchemas.
 */
export default function BlogFAQ({ items, title }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  if (items.length === 0) return null

  return (
    <section id="faq" className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1d30] flex items-center justify-center shadow-[0_4px_20px_-6px_rgba(0,212,255,0.4)]">
          <HelpCircle className="h-5 w-5 text-[#00D4FF]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a2e4a]">
          {title}
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const open = openIdx === idx
          return (
            <div
              key={idx}
              className={`group rounded-2xl border transition-all overflow-hidden ${
                open
                  ? "border-[#00D4FF]/40 bg-gradient-to-br from-white to-[#00D4FF]/5 shadow-[0_4px_25px_-8px_rgba(0,212,255,0.25)]"
                  : "border-[#1a2e4a]/10 bg-white hover:border-[#1a2e4a]/20"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : idx)}
                className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-start justify-between gap-4 text-left"
                aria-expanded={open}
              >
                <span className={`font-semibold text-sm sm:text-base leading-snug transition-colors ${open ? "text-[#1a2e4a]" : "text-[#1a2e4a]/90 group-hover:text-[#1a2e4a]"}`}>
                  {item.q}
                </span>
                <ChevronDown
                  className={`shrink-0 h-5 w-5 transition-transform ${open ? "rotate-180 text-[#00D4FF]" : "text-[#1a2e4a]/50"}`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm sm:text-[15px] text-[#1a2e4a]/75 leading-relaxed border-t border-[#00D4FF]/15 pt-4">
                    {item.a}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
