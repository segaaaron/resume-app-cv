interface Props { locale?: string }

export default function CoverLetterMockup({ locale = "es" }: Props) {
  const isEs = locale === "es"

  const greeting = isEs ? "Estimado/a Equipo de Brightwell Inc.," : "Dear Brightwell Inc. Team,"
  const closing = isEs ? "Atentamente, Sarah Johnson" : "Sincerely, Sarah Johnson"
  const regenerate = isEs ? "✦ Regenerar" : "✦ Regenerate"
  const download = isEs ? "Descargar PDF" : "Download PDF"
  const titleLabel = isEs ? "ReadyCV · Carta IA" : "ReadyCV · AI Letter"

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-5 w-full max-w-sm mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 rounded-full bg-red-400" />
        <div className="h-2 w-2 rounded-full bg-yellow-400" />
        <div className="h-2 w-2 rounded-full bg-green-400" />
        <span className="text-xs text-muted-foreground ml-2 font-mono">{titleLabel}</span>
      </div>
      <div className="border border-neutral-100 rounded-xl p-4 space-y-3 bg-neutral-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">RC</span>
            </div>
            <span className="text-[10px] font-bold text-neutral-700">Sarah Johnson</span>
          </div>
          <span className="text-[9px] text-neutral-400">9 May 2026</span>
        </div>
        <div className="h-px bg-neutral-200" />
        <p className="text-[10px] text-neutral-600 font-medium">{greeting}</p>
        <div className="space-y-1.5">
          {[85, 100, 70, 90, 60].map((w, i) => (
            <div key={i} className="h-1.5 bg-neutral-200 rounded-full" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="space-y-1.5">
          {[95, 80, 65, 88].map((w, i) => (
            <div key={i} className="h-1.5 bg-neutral-200 rounded-full" style={{ width: `${w}%` }} />
          ))}
        </div>
        <p className="text-[10px] text-neutral-500 italic">{closing}</p>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="flex-1 text-center text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg py-1.5 font-medium">{regenerate}</div>
        <div className="flex-1 text-center text-[10px] bg-primary text-white rounded-lg py-1.5 font-medium">{download}</div>
      </div>
    </div>
  )
}
