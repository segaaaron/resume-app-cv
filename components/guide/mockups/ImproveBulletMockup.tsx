interface Props { locale?: string }

export default function ImproveBulletMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const company      = "Brightwell Media"
  const role         = isEs ? "Analista de Marketing" : "Marketing Analyst"
  const descLabel    = isEs ? "Descripción" : "Description"
  const improvedLabel = isEs ? "Descripción mejorada" : "Improved description"
  const applyLabel   = isEs ? "Aplicar" : "Apply"
  const improvedByAI = isEs ? "✦ Mejorado por IA · 3 versiones" : "✦ Improved by AI · 3 versions"
  const improveBtn   = isEs ? "✦ Mejorar con IA" : "✦ Improve with AI"
  const beforeNote   = isEs ? "Antes — genérico" : "Before — generic"
  const afterNote    = isEs ? "Después — con métricas" : "After — with metrics"

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
        "Coordiné 8 campañas digitales generando 320k+ impresiones y +22% en conversiones.",
        "Diseñé 15+ dashboards ejecutivos adoptados en toda la empresa, ahorrando 3 hrs/semana.",
        "Resolví 200+ consultas/mes con índice de satisfacción del 97% en 2 trimestres.",
      ]
    : [
        "Coordinated 8 digital campaigns generating 320k+ impressions and a 22% increase in conversions.",
        "Designed 15+ executive dashboards adopted company-wide, reducing reporting time by 3 hrs/week.",
        "Resolved 200+ customer inquiries/month with a 97% satisfaction score for 2 consecutive quarters.",
      ]

  return (
    <div className="w-full max-w-[360px] mx-auto flex flex-col gap-[10px]">
      {/* Before card */}
      <div className="bg-white rounded-[18px] border-[1.5px] border-dash-border-s shadow-[0_4px_20px_rgba(26,46,74,0.07)] p-[16px]">
        <div className="flex items-center gap-[5px] mb-3">
          <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
          <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
          <div className="w-2 h-2 rounded-full bg-[#28c840]" />
          <span className="text-[10px] text-slate-400 ml-2 font-mono">
            {role} · {company}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-[6px] mb-[10px]">
          {[role, company].map((val) => (
            <div key={val} className="rounded-[7px] border border-slate-200 bg-slate-50 px-2 py-[5px] text-[10px] text-slate-500">
              {val}
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-[6px]">
            <div className="flex items-center gap-[5px]">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.06em]">
                {descLabel}
              </span>
              <span className="text-[8px] text-slate-400 bg-slate-100 border border-slate-200 rounded px-[5px] py-[1px]">
                {beforeNote}
              </span>
            </div>
            <span className="text-[9px] font-extrabold text-dash-cyan cursor-pointer">{improveBtn}</span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-[10px] py-2">
            {bullets.map((b, i) => (
              <p key={i} className="text-[10px] text-slate-400 leading-[1.55]" style={{ marginBottom: i < bullets.length - 1 ? 3 : 0 }}>
                • {b}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* AI badge connector */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-px h-2 bg-[rgba(0,212,255,0.3)]" />
        <span className="text-[9px] font-extrabold tracking-[0.06em] text-white bg-[linear-gradient(135deg,#1a2e4a_0%,#0a1e35_100%)] rounded-full px-3 py-1 shadow-[0_2px_12px_rgba(0,212,255,0.25)] border border-[rgba(0,212,255,0.3)]">
          {improvedByAI}
        </span>
        <div className="w-px h-2 bg-[rgba(0,212,255,0.3)]" />
      </div>

      {/* After card */}
      <div className="bg-white rounded-[18px] border-[1.5px] border-[rgba(0,212,255,0.25)] shadow-[0_4px_24px_rgba(0,212,255,0.1)] p-[14px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-[5px]">
            <span className="text-[10px] font-bold text-dash-navy">{improvedLabel}</span>
            <span className="text-[8px] text-dash-cyan bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] rounded px-[5px] py-[1px]">
              {afterNote}
            </span>
          </div>
          <button className="text-[9px] font-bold text-white bg-[linear-gradient(135deg,#1a2e4a_0%,#0f1e33_100%)] border-none rounded-[6px] px-[10px] py-[3px] cursor-pointer">
            {applyLabel}
          </button>
        </div>
        <div className="flex flex-col gap-[5px]">
          {improved.map((b, i) => (
            <div key={i} className="flex items-start gap-[6px]">
              <div className="w-[14px] h-[14px] rounded-full shrink-0 mt-[2px] bg-[rgba(0,212,255,0.12)] flex items-center justify-center">
                <span className="text-[7px] text-dash-cyan font-extrabold">✓</span>
              </div>
              <p className="text-[10px] text-dash-navy leading-[1.55] font-medium">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
