interface Props { locale?: string }

export default function CVReviewMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const titleLabel = isEs ? "ReadyCV · Revisión IA" : "ReadyCV · AI Review"
  const applyLabel = isEs ? "Aplicar →" : "Apply →"

  const items = isEs
    ? [
        { type: "ok", text: "Experiencia laboral cuantificada con métricas" },
        { type: "ok", text: "Palabras clave del sector incluidas" },
        { type: "warn", text: "Resumen demasiado genérico — específica tu especialidad" },
        { type: "warn", text: "Falta sección de proyectos personales" },
        { type: "warn", text: "Agrega más logros medibles en educación" },
      ]
    : [
        { type: "ok", text: "Work experience quantified with metrics" },
        { type: "ok", text: "Industry keywords included" },
        { type: "warn", text: "Summary too generic — specify your specialty" },
        { type: "warn", text: "Missing personal projects section" },
        { type: "warn", text: "Add measurable achievements to education" },
      ]

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-5 w-full max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full bg-red-400" />
        <div className="h-2 w-2 rounded-full bg-yellow-400" />
        <div className="h-2 w-2 rounded-full bg-green-400" />
        <span className="text-xs text-muted-foreground ml-2 font-mono">{titleLabel}</span>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className={`flex items-start gap-2 rounded-lg p-2.5 ${item.type === "ok" ? "bg-green-50 border border-green-100" : "bg-amber-50 border border-amber-100"}`}>
            <span className="text-sm shrink-0">{item.type === "ok" ? "✓" : "⚠"}</span>
            <p className="text-[11px] text-neutral-700 leading-relaxed flex-1">{item.text}</p>
            {item.type === "warn" && (
              <button className="shrink-0 text-[9px] font-bold text-amber-700 border border-amber-300 rounded-md px-1.5 py-0.5 hover:bg-amber-100 transition-colors">
                {applyLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
