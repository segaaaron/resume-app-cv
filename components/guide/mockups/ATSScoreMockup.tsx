interface Props { locale?: string }

export default function ATSScoreMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const present = ["React", "TypeScript", "Figma", "Agile", "Git"]
  const missing = ["GraphQL", "CI/CD", "Node.js"]

  const jobSnippet = isEs
    ? '"Buscamos Frontend Developer con experiencia en React y TypeScript. Se valorará conocimiento de GraphQL y CI/CD para proyectos en equipo ágil..."'
    : '"Looking for a Frontend Developer with React and TypeScript experience. GraphQL and CI/CD knowledge a plus for agile team projects..."'

  const offerLabel = isEs ? "Oferta de empleo" : "Job posting"
  const analyzeBtn = isEs ? "✦ Analizar compatibilidad" : "✦ Analyze compatibility"
  const highCompat = isEs ? "Compatibilidad alta" : "High compatibility"
  const presentLabel = isEs ? "Presentes" : "Present"
  const missingLabel = isEs ? "Faltantes" : "Missing"

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-md p-4 space-y-2">
        <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">{offerLabel}</p>
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">
          <p className="text-[11px] text-neutral-700 font-medium leading-relaxed">{jobSnippet}</p>
        </div>
        <button className="w-full text-[10px] font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg py-1.5">
          {analyzeBtn}
        </button>
      </div>

      <div className="flex justify-center">
        <svg className="h-5 w-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <div className="h-2 w-2 rounded-full bg-yellow-400" />
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-xs text-muted-foreground ml-2 font-mono">ReadyCV · ATS Score</span>
        </div>
        <div className="flex flex-col items-center mb-4">
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="87 13" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-green-600">87%</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-green-600 mt-1">{highCompat}</span>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-1">{presentLabel}</p>
            <div className="flex flex-wrap gap-1">
              {present.map(k => (
                <span key={k} className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">✓ {k}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-1">{missingLabel}</p>
            <div className="flex flex-wrap gap-1">
              {missing.map(k => (
                <span key={k} className="text-[10px] bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5 font-medium">✗ {k}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
