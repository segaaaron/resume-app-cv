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
    <section style={{ background: "#f8fafc", padding: "80px 16px" }}>
      <style>{`
        .guide-step-card {
          background: white;
          border: 1.5px solid #E8EEF8;
          border-radius: 20px;
          padding: 28px 24px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 2px 16px rgba(26,46,74,0.05);
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.22s, border-color 0.22s, transform 0.22s;
        }
        .guide-step-card:hover {
          box-shadow: 0 10px 36px rgba(26,46,74,0.12), 0 0 0 1px rgba(0,212,255,0.3);
          border-color: rgba(0,212,255,0.35);
          transform: translateY(-5px);
        }
        @media (min-width: 1024px) {
          .lg-connector { display: block !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 28, height: 1.5, background: "#00D4FF", borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#00D4FF" }}>
              How it works
            </span>
            <div style={{ width: 28, height: 1.5, background: "#00D4FF", borderRadius: 2 }} />
          </div>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "#1a2e4a", letterSpacing: "-0.02em", margin: 0 }}>
            {title}
          </h2>
        </div>

        {/* Steps */}
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 18 }}>
          {/* Desktop connector */}
          <div
            aria-hidden
            className="lg-connector"
            style={{
              display: "none", position: "absolute",
              top: 50, left: "12.5%", right: "12.5%", height: 1,
              background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.3) 20%, rgba(0,102,255,0.3) 50%, rgba(0,212,255,0.3) 80%, transparent)",
              pointerEvents: "none", zIndex: 0,
            }}
          />

          {steps.map(({ num, title: stepTitle, desc }, i) => {
            const Icon = STEP_ICONS[i]
            const accent = STEP_ACCENTS[i]
            const glow = STEP_GLOWS[i]
            return (
              <div key={num} className="guide-step-card" style={{ zIndex: 1 }}>
                {/* Step number */}
                <div style={{
                  position: "absolute", top: 14, right: 16,
                  fontSize: 11, fontWeight: 800, color: "rgba(26,46,74,0.12)",
                  letterSpacing: "0.04em",
                }}>
                  {num}
                </div>

                {/* Icon container */}
                <div style={{
                  width: 56, height: 56, borderRadius: 16, marginBottom: 18,
                  background: "linear-gradient(135deg, #1a2e4a 0%, #0f1e33 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 4px 20px ${glow}, 0 0 0 1px rgba(0,212,255,0.12)`,
                  position: "relative",
                }}>
                  <Icon style={{ width: 22, height: 22, color: accent }} />
                  <div style={{
                    position: "absolute", top: -3, right: -3,
                    width: 10, height: 10, borderRadius: "50%",
                    background: accent, boxShadow: `0 0 8px ${accent}`,
                    border: "2px solid #f8fafc",
                  }} />
                </div>

                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1a2e4a", marginBottom: 8, letterSpacing: "-0.01em" }}>
                  {stepTitle}
                </h3>
                <p style={{ fontSize: 12, color: "#6B7A8C", lineHeight: 1.65, margin: 0 }}>
                  {desc}
                </p>

                {/* Bottom accent */}
                <div style={{
                  position: "absolute", bottom: 0, left: "25%", right: "25%",
                  height: 2, borderRadius: "2px 2px 0 0",
                  background: `linear-gradient(90deg, transparent, ${accent}50, transparent)`,
                }} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
