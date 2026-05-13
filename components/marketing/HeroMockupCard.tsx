"use client"

import { useTranslations } from "next-intl"

export default function HeroMockupCard() {
  const t = useTranslations("hero")
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-badge {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(-2deg); }
        }
        @keyframes dash-fill {
          from { stroke-dasharray: 0 100; }
          to { stroke-dasharray: 94 6; }
        }
        .hero-card { animation: float 4s ease-in-out infinite; }
        .hero-badge { animation: float-badge 3.5s ease-in-out infinite 0.5s; }
        .ats-arc { animation: dash-fill 1.5s ease-out 0.3s both; }
      `}</style>

      <div className="relative hidden md:block">
        {/* Main CV card */}
        <div className="hero-card bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden">
          {/* Header bar */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 h-20 flex items-end px-6 pb-3 relative">
            <div>
              <div className="h-4 bg-white/90 rounded-lg w-40 mb-1.5" />
              <div className="h-2.5 bg-white/50 rounded w-24" />
            </div>
            {/* Floating AI badge */}
            <div className="absolute top-3 right-4 flex items-center gap-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-white">{t("mockup_ai_badge")}</span>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="p-6 grid grid-cols-3 gap-5">
            <div className="col-span-2 space-y-4">
              {[80, 100, 65].map((w, i) => (
                <div key={i}>
                  <div className="h-2.5 bg-indigo-100 rounded mb-2" style={{ width: "35%" }} />
                  <div className="h-2 bg-neutral-100 rounded mb-1 w-full" />
                  <div className="h-2 bg-neutral-100 rounded" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
            <div className="space-y-2.5">
              {[100, 80, 90, 70, 55].map((w, i) => (
                <div key={i} className="h-2 bg-neutral-100 rounded" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* ATS Score floating badge */}
        <div className="hero-badge absolute -left-8 bottom-6 bg-white shadow-2xl border border-neutral-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          {/* SVG gauge */}
          <div className="relative h-12 w-12 shrink-0">
            <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="#22c55e" strokeWidth="3"
                strokeLinecap="round"
                className="ats-arc"
                strokeDasharray="94 6"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-extrabold text-green-600">94%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">ATS Score</p>
            <p className="text-sm font-bold text-green-600">{t("mockup_ats_compat")}</p>
            <div className="flex gap-1 mt-1">
              {["React", "TS", "Git"].map(k => (
                <span key={k} className="text-[8px] bg-green-50 text-green-700 border border-green-200 rounded-full px-1.5 py-0.5 font-semibold">✓ {k}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
