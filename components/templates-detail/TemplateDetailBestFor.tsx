interface Props {
  bestFor: string[]
  t: (k: string) => string
}

export default function TemplateDetailBestFor({ bestFor, t }: Props) {
  return (
    <section className="py-12 px-4 sm:px-6 bg-gradient-to-br from-[#1a2e4a]/[0.03] via-transparent to-[#00D4FF]/[0.03]">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#1a2e4a] mb-6">{t("best_for_title")}</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {bestFor.map((profession) => (
            <span
              key={profession}
              className="px-4 py-2 bg-white text-[#1a2e4a] text-sm font-semibold rounded-full ring-1 ring-[#1a2e4a]/10 shadow-[0_4px_12px_-4px_rgba(26,46,74,0.15)] hover:ring-[#00D4FF]/40 hover:shadow-[0_8px_20px_-4px_rgba(0,212,255,0.25)] transition-all"
            >
              {profession}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
