"use client"

import { Palette, Sparkles, Target, Download } from "lucide-react"

const STEP_ICONS = [Palette, Sparkles, Target, Download]
const STEP_ACCENTS = ["#00D4FF", "#00BFFF", "#0099FF", "#00D4FF"]
const STEP_GLOWS = [
  "rgba(0,212,255,0.18)",
  "rgba(0,191,255,0.16)",
  "rgba(0,153,255,0.15)",
  "rgba(0,212,255,0.14)",
]

interface Step {
  num: string
  title: string
  desc: string
}

export default function GuideStepsGrid({ steps, title }: { steps: Step[]; title: string }) {
  return (
    <section className="bg-[#f8fafc] py-[80px] px-4">
      <div className="max-w-[1020px] mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2.5 mb-3.5">
            <div className="w-7 h-[1.5px] bg-dash-cyan rounded-[2px]" />
            <span className="text-[10px] font-extrabold tracking-[0.14em] uppercase text-dash-cyan">
              How it works
            </span>
            <div className="w-7 h-[1.5px] bg-dash-cyan rounded-[2px]" />
          </div>
          <h2 className="text-[clamp(24px,4vw,36px)] font-extrabold text-dash-navy tracking-[-0.02em] m-0">
            {title}
          </h2>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[18px]">
          {/* Desktop connector */}
          <div
            aria-hidden
            className="lg-connector hidden absolute top-[50px] left-[12.5%] right-[12.5%] h-px pointer-events-none z-0"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.3) 20%, rgba(0,102,255,0.3) 50%, rgba(0,212,255,0.3) 80%, transparent)" }}
          />

          {steps.map(({ num, title: stepTitle, desc }, i) => {
            const Icon = STEP_ICONS[i]
            const accent = STEP_ACCENTS[i]
            const glow = STEP_GLOWS[i]
            return (
              <div key={num} className="guide-step-card z-[1]">
                {/* Step number */}
                <div className="absolute top-3.5 right-4 text-[11px] font-extrabold text-dash-navy/[0.12] tracking-[0.04em]">
                  {num}
                </div>

                {/* Icon container */}
                <div
                  className="w-14 h-14 rounded-2xl mb-[18px] flex items-center justify-center relative"
                  style={{
                    background: "linear-gradient(135deg, #1a2e4a 0%, #0f1e33 100%)",
                    boxShadow: `0 4px 20px ${glow}, 0 0 0 1px rgba(0,212,255,0.12)`,
                  }}
                >
                  <Icon style={{ width: 22, height: 22, color: accent }} />
                  <div
                    className="absolute -top-[3px] -right-[3px] w-2.5 h-2.5 rounded-full border-2 border-[#f8fafc]"
                    style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                  />
                </div>

                <h3 className="text-[13px] font-bold text-dash-navy mb-2 tracking-[-0.01em]">
                  {stepTitle}
                </h3>
                <p className="text-[12px] text-dash-muted leading-[1.65] m-0">
                  {desc}
                </p>

                {/* Bottom accent */}
                <div
                  className="absolute bottom-0 left-[25%] right-[25%] h-0.5 rounded-t-[2px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
