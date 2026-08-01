interface Props { locale?: string }

export default function SummaryMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const title      = isEs ? "Resumen Profesional" : "Professional Summary"
  const aiBadge    = isEs ? "Generado con IA" : "AI Generated"
  const regenerate = isEs ? "✦ Regenerar versión" : "✦ Regenerate version"
  const hint       = isEs ? "Analiza tu perfil completo · Genera en segundos" : "Analyzes your full profile · Generates in seconds"
  const counter    = isEs ? "Versión 1 de 3" : "Version 1 of 3"

  const summary = isEs
    ? "Diseñadora UX con 5 años en productos digitales B2B. Especialista en design systems y research de usuarios, con historial de aumentar retención un 30% y reducir tiempos de onboarding un 45%."
    : "UX Designer with 5 years of experience in B2B digital products. Specialist in design systems and user research, with a track record of increasing retention by 30% and reducing onboarding time by 45%."

  return (
    <div className="bg-white rounded-[20px] border-[1.5px] border-dash-border-s shadow-[0_8px_40px_rgba(26,46,74,0.10)] p-[18px] w-full max-w-[340px] mx-auto">
      {/* Chrome bar */}
      <div className="flex items-center gap-[5px] mb-[14px]">
        <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
        <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
        <div className="w-2 h-2 rounded-full bg-[#28c840]" />
        <span className="text-[10px] text-slate-400 ml-2 font-mono">
          Valhalla Resume · {isEs ? "Resumen IA" : "AI Summary"}
        </span>
      </div>

      {/* Hint strip */}
      <div className="rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)] px-[10px] py-[6px] mb-[10px] flex items-center gap-[6px]">
        <span className="text-[9px] text-dash-cyan">✦</span>
        <span className="text-[9px] text-slate-500">{hint}</span>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border-[1.5px] border-[rgba(26,46,74,0.10)] bg-[linear-gradient(135deg,rgba(26,46,74,0.03)_0%,rgba(0,212,255,0.03)_100%)] p-[14px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-[6px]">
            <span className="text-[9px] font-extrabold text-dash-navy uppercase tracking-[0.08em]">
              {title}
            </span>
            <span className="text-[8px] font-bold text-dash-cyan bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.22)] rounded-full px-[6px] py-[1px]">
              {aiBadge}
            </span>
          </div>
          <span className="text-[9px] text-slate-400">{counter}</span>
        </div>
        <p className="text-[12px] text-dash-navy leading-[1.65]">{summary}</p>

        {/* Decorative accent line */}
        <div className="mt-3 h-px bg-[linear-gradient(90deg,rgba(0,212,255,0.4),transparent)]" />
      </div>

      {/* Regenerate button */}
      <button className="mt-[10px] w-full text-[11px] font-bold text-dash-navy bg-transparent border-[1.5px] border-[rgba(26,46,74,0.15)] rounded-[10px] py-2 cursor-pointer flex items-center justify-center gap-1">
        <span className="text-dash-cyan">✦</span>
        {regenerate}
      </button>
    </div>
  )
}
