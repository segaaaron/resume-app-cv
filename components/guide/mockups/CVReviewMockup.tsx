interface Props { locale?: string }

export default function CVReviewMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const titleLabel = isEs ? "Valhalla Resume · Revisión IA" : "Valhalla Resume · AI Review"
  const applyLabel = isEs ? "Aplicar →" : "Apply →"
  const okLabel    = isEs ? "Fortalezas" : "Strengths"
  const warnLabel  = isEs ? "Mejoras sugeridas" : "Suggested improvements"
  const hint       = isEs ? "Cada sugerencia tiene botón Aplicar — 1 clic y se actualiza" : "Each suggestion has Apply — 1 click and it updates"

  const items = isEs
    ? [
        { type: "ok",   text: "Experiencia laboral cuantificada con métricas" },
        { type: "ok",   text: "Palabras clave del sector incluidas" },
        { type: "warn", text: "Resumen demasiado genérico — específica tu especialidad" },
        { type: "warn", text: "Falta sección de proyectos personales" },
        { type: "warn", text: "Agrega logros medibles en educación" },
      ]
    : [
        { type: "ok",   text: "Work experience quantified with metrics" },
        { type: "ok",   text: "Industry keywords included" },
        { type: "warn", text: "Summary too generic — specify your specialty" },
        { type: "warn", text: "Missing personal projects section" },
        { type: "warn", text: "Add measurable achievements to education" },
      ]

  const okItems   = items.filter(i => i.type === "ok")
  const warnItems = items.filter(i => i.type === "warn")

  return (
    <div className="bg-white rounded-[20px] border-[1.5px] border-dash-border-s shadow-[0_8px_40px_rgba(26,46,74,0.10)] p-[18px] w-full max-w-[360px] mx-auto">
      {/* Chrome bar */}
      <div className="flex items-center gap-[5px] mb-[14px]">
        <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
        <div className="w-2 h-2 rounded-full bg-[#28c840]" />
        <span className="text-[10px] text-slate-400 ml-2 font-mono">{titleLabel}</span>
      </div>

      {/* OK items */}
      <div className="mb-[6px]">
        <p className="text-[8px] font-extrabold text-green-700 uppercase tracking-[0.08em] mb-[5px]">
          {okLabel}
        </p>
        <div className="flex flex-col gap-[5px]">
          {okItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-[9px] bg-green-50 border border-green-200 px-[10px] py-2">
              <div className="w-4 h-4 rounded-full shrink-0 bg-green-700 flex items-center justify-center">
                <span className="text-[8px] text-white font-extrabold">✓</span>
              </div>
              <p className="text-[11px] text-green-800 leading-[1.4]">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 my-[10px]" />

      {/* Warn items */}
      <div className="mb-2">
        <p className="text-[8px] font-extrabold text-amber-600 uppercase tracking-[0.08em] mb-[5px]">
          {warnLabel}
        </p>
        <div className="flex flex-col gap-[5px]">
          {warnItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-[9px] bg-amber-50 border border-amber-200 px-[10px] py-2">
              <div className="w-4 h-4 rounded-full shrink-0 bg-amber-400 flex items-center justify-center">
                <span className="text-[9px] text-white">!</span>
              </div>
              <p className="text-[10px] text-amber-900 leading-[1.4] flex-1">{item.text}</p>
              <button className="text-[9px] font-extrabold text-white bg-[linear-gradient(135deg,#1a2e4a_0%,#0f1e33_100%)] border-none rounded-[6px] px-2 py-[3px] cursor-pointer shrink-0 shadow-[0_1px_6px_rgba(26,46,74,0.2)]">
                {applyLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      <div className="rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)] px-[10px] py-[6px] flex items-center gap-[5px]">
        <span className="text-[9px] text-dash-cyan">✦</span>
        <p className="text-[9px] text-slate-500">{hint}</p>
      </div>
    </div>
  )
}
