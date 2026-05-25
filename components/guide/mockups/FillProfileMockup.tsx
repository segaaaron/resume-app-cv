interface Props { locale?: string }

export default function FillProfileMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const prompt = isEs
    ? '"Soy desarrolladora React con 4 años en startups, especializada en performance y accesibilidad."'
    : '"I\'m a React developer with 4 years in startups, specialized in performance and accessibility."'

  const aiGenerated  = isEs ? "✦ IA generó 3 sugerencias" : "✦ AI generated 3 suggestions"
  const applyLabel   = isEs ? "Aplicar" : "Apply"
  const inputHint    = isEs ? "Describe tu trayectoria (máx. 500 caracteres)" : "Describe your background (max 500 chars)"

  const results = isEs
    ? [
        {
          icon: "📝",
          label: "Resumen profesional",
          badge: "Generado por IA",
          suggested: "Desarrolladora frontend con 4 años en startups SaaS. Especializada en React, rendimiento web y accesibilidad, reduciendo tiempos de carga un 35%.",
        },
        {
          icon: "🏷️",
          label: "Título del puesto",
          badge: "Sugerido",
          suggested: "Frontend Developer · React & Accesibilidad",
        },
        {
          icon: "🛠️",
          label: "Habilidades sugeridas",
          badge: "Extraídas",
          suggested: "React, TypeScript, Tailwind CSS, Figma, Jest, Accesibilidad WCAG",
        },
      ]
    : [
        {
          icon: "📝",
          label: "Professional summary",
          badge: "AI generated",
          suggested: "Frontend developer with 4 years at SaaS startups. Specialized in React, web performance and accessibility, reducing load times by 35%.",
        },
        {
          icon: "🏷️",
          label: "Job title",
          badge: "Suggested",
          suggested: "Frontend Developer · React & Accessibility",
        },
        {
          icon: "🛠️",
          label: "Suggested skills",
          badge: "Extracted",
          suggested: "React, TypeScript, Tailwind CSS, Figma, Jest, WCAG Accessibility",
        },
      ]

  return (
    <div className="bg-white rounded-[20px] border-[1.5px] border-dash-border-s shadow-[0_8px_40px_rgba(26,46,74,0.10)] px-[18px] pt-[18px] pb-4 w-full max-w-[340px] mx-auto">
      {/* Chrome bar */}
      <div className="flex items-center gap-[5px] mb-[14px]">
        <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
        <div className="w-2 h-2 rounded-full bg-[#28c840]" />
        <span className="text-[10px] text-slate-400 ml-2 font-mono">
          ReadyCVV · {isEs ? "Completar con IA" : "AI Assistant"}
        </span>
      </div>

      {/* Input box */}
      <div className="rounded-[10px] border-[1.5px] border-slate-200 bg-slate-50 px-3 py-[10px] mb-[10px]">
        <p className="text-[10px] text-slate-500 leading-[1.5] mb-1">{inputHint}</p>
        <p className="text-[11px] text-dash-navy italic leading-[1.5]">{prompt}</p>
      </div>

      {/* AI badge */}
      <div className="flex justify-center mb-[10px]">
        <span className="text-[9px] font-extrabold tracking-[0.08em] text-dash-cyan bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.25)] rounded-full px-[10px] py-[3px]">
          {aiGenerated}
        </span>
      </div>

      {/* Result cards */}
      <div className="flex flex-col gap-2">
        {results.map((r) => (
          <div key={r.label} className="rounded-[10px] border-[1.5px] border-[rgba(26,46,74,0.08)] bg-[rgba(26,46,74,0.02)] px-3 py-[10px]">
            <div className="flex items-center justify-between mb-[5px]">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">{r.icon}</span>
                <span className="text-[10px] font-bold text-dash-navy">{r.label}</span>
              </div>
              <span className="text-[8px] font-bold text-dash-cyan bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] rounded-full px-[6px] py-[1px]">
                {r.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-[1.55] mb-2">{r.suggested}</p>
            <div className="flex justify-end">
              <button className="text-[10px] font-bold text-white bg-[linear-gradient(135deg,#1a2e4a_0%,#0f1e33_100%)] border-none rounded-[7px] px-3 py-1 cursor-pointer shadow-[0_2px_8px_rgba(26,46,74,0.2)]">
                {applyLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
