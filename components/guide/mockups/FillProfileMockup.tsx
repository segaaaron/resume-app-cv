interface Props { locale?: string }

export default function FillProfileMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const prompt = isEs
    ? '"Soy desarrolladora React con 4 años en startups, especializada en performance y accesibilidad."'
    : '"I\'m a React developer with 4 years in startups, specialized in performance and accessibility."'

  const aiGenerated = isEs ? "✦ IA generó 3 sugerencias" : "✦ AI generated 3 suggestions"
  const applyLabel = isEs ? "Aplicar" : "Apply"

  const results = isEs
    ? [
        { label: "📝 Resumen profesional", suggested: "Desarrolladora frontend con 4 años de experiencia en startups SaaS. Especializada en React, rendimiento web y accesibilidad, con historial de reducir tiempos de carga un 35%." },
        { label: "🏷️ Título del puesto", suggested: "Frontend Developer · React & Accesibilidad" },
        { label: "🛠️ Habilidades sugeridas", suggested: "React, TypeScript, Tailwind CSS, Figma, Jest, Accesibilidad WCAG" },
      ]
    : [
        { label: "📝 Professional summary", suggested: "Frontend developer with 4 years of experience at SaaS startups. Specialized in React, web performance and accessibility, with a track record of reducing load times by 35%." },
        { label: "🏷️ Job title", suggested: "Frontend Developer · React & Accessibility" },
        { label: "🛠️ Suggested skills", suggested: "React, TypeScript, Tailwind CSS, Figma, Jest, WCAG Accessibility" },
      ]

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-5 space-y-3 w-full max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-2 w-2 rounded-full bg-red-400" />
        <div className="h-2 w-2 rounded-full bg-yellow-400" />
        <div className="h-2 w-2 rounded-full bg-green-400" />
        <span className="text-xs text-muted-foreground ml-2 font-mono">ReadyCVV · {isEs ? "Ayúdate con la IA" : "AI Assistant"}</span>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] text-neutral-500 leading-relaxed">
        {prompt}
      </div>

      <div className="flex justify-center py-0.5">
        <span className="text-[9px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">{aiGenerated}</span>
      </div>

      {results.map((r) => (
        <div key={r.label} className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 space-y-1.5">
          <p className="text-[10px] font-semibold text-indigo-700">{r.label}</p>
          <p className="text-[11px] text-neutral-700 leading-relaxed">{r.suggested}</p>
          <div className="flex justify-end">
            <button className="text-[10px] font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-md px-2.5 py-1">
              {applyLabel}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
