interface Props { locale?: string }

export default function ATSScoreMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const present = ["React", "TypeScript", "Figma", "Agile", "Git"]
  const missing = ["GraphQL", "CI/CD", "Node.js"]

  const jobSnippet = isEs
    ? '"Buscamos Frontend Developer con experiencia en React y TypeScript. Se valorará GraphQL y CI/CD para proyectos en equipo ágil..."'
    : '"Looking for a Frontend Developer with React and TypeScript experience. GraphQL and CI/CD knowledge a plus for agile team projects..."'

  const offerLabel   = isEs ? "Oferta de empleo" : "Job posting"
  const pasteHint    = isEs ? "Pega la descripción del puesto" : "Paste the job description"
  const analyzeBtn   = isEs ? "✦ Analizar compatibilidad" : "✦ Analyze compatibility"
  const highCompat   = isEs ? "Compatibilidad alta" : "High compatibility"
  const presentLabel = isEs ? "Presentes en tu CV" : "Present in your CV"
  const missingLabel = isEs ? "Faltantes — añádelos" : "Missing — add these"
  const tip          = isEs ? "Añade las keywords faltantes para mejorar tu score" : "Add missing keywords to improve your score"

  return (
    <div className="w-full max-w-[360px] mx-auto flex flex-col gap-2">
      {/* Input card */}
      <div className="bg-white rounded-[18px] border-[1.5px] border-dash-border-s shadow-[0_4px_20px_rgba(26,46,74,0.07)] p-[14px]">
        <div className="flex items-center gap-[5px] mb-[10px]">
          <span className="text-[9px] font-extrabold text-dash-navy uppercase tracking-[0.08em]">
            {offerLabel}
          </span>
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[8px] text-slate-400">{pasteHint}</span>
        </div>
        <div className="rounded-[10px] bg-slate-50 border border-slate-200 px-[11px] py-[9px] mb-[10px]">
          <p className="text-[11px] text-slate-600 leading-[1.6]">{jobSnippet}</p>
        </div>
        <button className="w-full text-[11px] font-extrabold text-white bg-[linear-gradient(135deg,#1a2e4a_0%,#0a1e35_100%)] border-none rounded-[10px] py-[9px] cursor-pointer shadow-[0_4px_16px_rgba(26,46,74,0.2)] flex items-center justify-center gap-[5px]">
          <span className="text-dash-cyan">✦</span> {analyzeBtn}
        </button>
      </div>

      {/* Arrow connector */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center gap-[2px]">
          <div className="w-px h-[10px] bg-[linear-gradient(180deg,rgba(0,212,255,0.4),rgba(0,212,255,0.1))]" />
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1l5 5 5-5" stroke="rgba(0,212,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Results card */}
      <div className="bg-white rounded-[18px] border-[1.5px] border-[rgba(0,212,255,0.2)] shadow-[0_6px_28px_rgba(0,212,255,0.08)] p-[16px]">
        {/* Chrome */}
        <div className="flex items-center gap-[5px] mb-[14px]">
          <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
          <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
          <div className="w-2 h-2 rounded-full bg-[#28c840]" />
          <span className="text-[10px] text-slate-400 ml-2 font-mono">Valhalla Resume · ATS Score</span>
        </div>

        {/* Score circle */}
        <div className="flex flex-col items-center mb-[14px]">
          <div className="relative w-[76px] h-[76px]">
            <svg viewBox="0 0 36 36" className="w-[76px] h-[76px] -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F1F5F9" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="2.5"
                strokeDasharray="87 13" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[18px] font-black text-dash-navy leading-none">87%</span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-green-500 mt-1">{highCompat}</span>
        </div>

        {/* Keywords */}
        <div className="flex flex-col gap-[10px]">
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.08em] mb-[5px]">
              {presentLabel}
            </p>
            <div className="flex flex-wrap gap-1">
              {present.map(k => (
                <span key={k} className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-[2px]">
                  ✓ {k}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.08em] mb-[5px]">
              {missingLabel}
            </p>
            <div className="flex flex-wrap gap-1">
              {missing.map(k => (
                <span key={k} className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-[2px]">
                  ✗ {k}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-[10px] rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)] px-[10px] py-[6px] flex items-center gap-[5px]">
          <span className="text-[9px] text-dash-cyan">💡</span>
          <p className="text-[9px] text-slate-500">{tip}</p>
        </div>
      </div>
    </div>
  )
}
