interface Props {
  faqItems: Array<{ q: string; a: string }>
  t: (k: string) => string
}

export default function TemplateDetailFaq({ faqItems, t }: Props) {
  return (
    <section className="py-20 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#1a2e4a] mb-10 text-center">
          {t("faq_title")}
        </h2>
        <div className="space-y-4">
          {faqItems.map((item, i) => (
            <details
              key={i}
              className="group bg-white rounded-2xl border border-slate-200/60 shadow-[0_6px_24px_-12px_rgba(26,46,74,0.15)] hover:shadow-[0_12px_36px_-12px_rgba(26,46,74,0.25)] hover:border-[#00D4FF]/30 transition-all overflow-hidden"
            >
              <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between gap-4">
                <h3 className="font-bold text-[#1a2e4a] text-base">{item.q}</h3>
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1a2e4a]/5 flex items-center justify-center text-[#1a2e4a] group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <div className="px-6 pb-5 -mt-1 text-sm text-slate-600 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
