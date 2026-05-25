interface Props { locale?: string }

export default function CoverLetterMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const greeting    = isEs ? "Estimado/a Equipo de Brightwell Inc.," : "Dear Brightwell Inc. Team,"
  const closing     = isEs ? "Atentamente, Sarah Johnson" : "Sincerely, Sarah Johnson"
  const regenerate  = isEs ? "✦ Regenerar" : "✦ Regenerate"
  const download    = isEs ? "Descargar PDF" : "Download PDF"
  const titleLabel  = isEs ? "ReadyCVV · Carta IA" : "ReadyCVV · AI Letter"
  const toLabel     = isEs ? "Para:" : "To:"
  const roleLabel   = isEs ? "Posición:" : "Role:"
  const hint        = isEs ? "Genera variantes hasta encontrar la perfecta · Editable con formato rico" : "Generate variants until perfect · Editable with rich text"

  return (
    <div className="bg-white rounded-[20px] border-[1.5px] border-dash-border-s shadow-[0_8px_40px_rgba(26,46,74,0.10)] p-[18px] w-full max-w-[340px] mx-auto">
      {/* Chrome bar */}
      <div className="flex items-center gap-[5px] mb-[14px]">
        <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
        <div className="w-2 h-2 rounded-full bg-[#28c840]" />
        <span className="text-[10px] text-slate-400 ml-2 font-mono">{titleLabel}</span>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-[6px] mb-[10px]">
        {[
          { lbl: toLabel, val: "Brightwell Inc." },
          { lbl: roleLabel, val: isEs ? "Analista de Marketing" : "Marketing Analyst" },
        ].map(({ lbl, val }) => (
          <div key={lbl} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-[5px]">
            <p className="text-[8px] text-slate-400 mb-[1px]">{lbl}</p>
            <p className="text-[10px] text-dash-navy font-semibold">{val}</p>
          </div>
        ))}
      </div>

      {/* Letter preview */}
      <div className="rounded-xl border-[1.5px] border-[rgba(26,46,74,0.08)] bg-[#FAFBFC] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-[7px]">
            <div className="w-6 h-6 rounded-[7px] bg-[linear-gradient(135deg,#1a2e4a_0%,#0f1e33_100%)] flex items-center justify-center">
              <span className="text-white text-[8px] font-extrabold">RC</span>
            </div>
            <span className="text-[10px] font-bold text-dash-navy">Sarah Johnson</span>
          </div>
          <span className="text-[9px] text-slate-400">9 May 2026</span>
        </div>

        <div className="h-px bg-slate-100 mb-2" />

        <p className="text-[10px] text-slate-600 font-semibold mb-2">{greeting}</p>

        {/* Simulated letter lines */}
        <div className="flex flex-col gap-1 mb-2">
          {[88, 100, 72, 92, 64].map((w, i) => (
            <div key={i} className="h-[5px] bg-[#E9EEF6] rounded-[3px]" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="flex flex-col gap-1 mb-2">
          {[96, 82, 68, 90].map((w, i) => (
            <div key={i} className="h-[5px] bg-[#E9EEF6] rounded-[3px]" style={{ width: `${w}%` }} />
          ))}
        </div>

        <p className="text-[9px] text-slate-400 italic">{closing}</p>
      </div>

      {/* Hint */}
      <div className="mt-2 rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)] px-[9px] py-[5px] flex items-center gap-[5px]">
        <span className="text-[9px] text-dash-cyan">✦</span>
        <p className="text-[9px] text-slate-500">{hint}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-[10px]">
        <button className="flex-1 text-[10px] font-bold text-dash-navy bg-transparent border-[1.5px] border-[rgba(26,46,74,0.15)] rounded-[9px] py-[7px] cursor-pointer flex items-center justify-center gap-[3px]">
          <span className="text-dash-cyan">✦</span> {regenerate}
        </button>
        <button className="flex-1 text-[10px] font-bold text-white bg-[linear-gradient(135deg,#1a2e4a_0%,#0f1e33_100%)] border-none rounded-[9px] py-[7px] cursor-pointer shadow-[0_2px_10px_rgba(26,46,74,0.2)]">
          {download}
        </button>
      </div>
    </div>
  )
}
