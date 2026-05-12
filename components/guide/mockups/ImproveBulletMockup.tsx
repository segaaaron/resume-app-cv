interface Props { locale?: string }

export default function ImproveBulletMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const company = "Brightwell Media"
  const role = isEs ? "Analista de Marketing" : "Marketing Analyst"
  const descLabel = isEs ? "Descripción" : "Description"
  const improvedLabel = isEs ? "Descripción mejorada" : "Improved description"
  const applyLabel = isEs ? "Aplicar" : "Apply"
  const improvedByAI = isEs ? "✦ Mejorado por IA" : "✦ Improved by AI"
  const improveBtn = isEs ? "✦ Mejorar con IA" : "✦ Improve with AI"

  const bullets = isEs
    ? [
        "Ayudé al equipo de marketing con las campañas.",
        "Creé reportes y presentaciones para dirección.",
        "Apoyé en tareas de comunicación con clientes.",
      ]
    : [
        "Helped the marketing team with campaigns.",
        "Created reports and presentations for management.",
        "Assisted with customer communication tasks.",
      ]

  const improved = isEs
    ? [
        "Coordiné 8 campañas digitales generando 320k+ impresiones y un aumento del 22% en conversiones.",
        "Diseñé 15+ dashboards ejecutivos adoptados en toda la empresa, reduciendo el tiempo de reportes 3 hrs/semana.",
        "Resolví 200+ consultas de clientes/mes manteniendo un índice de satisfacción del 97% durante 2 trimestres.",
      ]
    : [
        "Coordinated 8 digital campaigns generating 320k+ impressions and a 22% increase in conversions.",
        "Designed 15+ executive dashboards adopted company-wide, reducing reporting time by 3 hrs/week.",
        "Resolved 200+ customer inquiries/month maintaining a 97% satisfaction score for 2 consecutive quarters.",
      ]

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-md p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <div className="h-2 w-2 rounded-full bg-yellow-400" />
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-xs text-muted-foreground ml-2 font-mono">{role} · {company}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-600 bg-neutral-50">{role}</div>
          <div className="rounded-md border border-neutral-200 px-2 py-1.5 text-[11px] text-neutral-600 bg-neutral-50">{company}</div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-neutral-500">{descLabel}</span>
            <span className="text-[9px] font-bold text-indigo-600">{improveBtn}</span>
          </div>
          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-2 space-y-1">
            {bullets.map((b, i) => (
              <p key={i} className="text-[10px] text-neutral-500 leading-relaxed">• {b}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[9px] font-bold px-3 py-1 rounded-full shadow">
          {improvedByAI}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-200 shadow-md p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-emerald-700">{improvedLabel}</span>
          <button className="text-[9px] font-bold text-white bg-emerald-500 rounded-md px-2 py-0.5">{applyLabel}</button>
        </div>
        <div className="space-y-1">
          {improved.map((b, i) => (
            <p key={i} className="text-[10px] text-neutral-700 leading-relaxed font-medium">• {b}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
