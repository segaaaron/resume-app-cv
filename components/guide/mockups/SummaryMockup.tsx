interface Props { locale?: string }

export default function SummaryMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const title = isEs ? "Resumen Profesional" : "Professional Summary"
  const regenerate = isEs ? "✦ Regenerar versión" : "✦ Regenerate version"
  const summary = isEs
    ? "Diseñadora UX con 5 años de experiencia en productos digitales B2B. Especialista en design systems y research de usuarios, con historial de aumentar retención un 30% y reducir tiempos de onboarding un 45%."
    : "UX Designer with 5 years of experience in B2B digital products. Specialist in design systems and user research, with a track record of increasing retention by 30% and reducing onboarding time by 45%."

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-5 w-full max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full bg-red-400" />
        <div className="h-2 w-2 rounded-full bg-yellow-400" />
        <div className="h-2 w-2 rounded-full bg-green-400" />
        <span className="text-xs text-muted-foreground ml-2 font-mono">ReadyCV · {isEs ? "Resumen IA" : "AI Summary"}</span>
      </div>
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">{title}</span>
          <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">IA</span>
        </div>
        <p className="text-xs text-neutral-700 leading-relaxed">{summary}</p>
      </div>
      <button className="mt-3 w-full text-xs text-indigo-600 border border-indigo-200 rounded-lg py-1.5 hover:bg-indigo-50 transition-colors font-medium">
        {regenerate}
      </button>
    </div>
  )
}
