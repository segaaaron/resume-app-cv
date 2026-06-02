interface Props {
  longDesc: string
  t: (k: string) => string
}

export default function TemplateDetailDescription({ longDesc, t }: Props) {
  return (
    <section className="py-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a2e4a] mb-6">
          {t("description_title")}
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed">{longDesc}</p>
      </div>
    </section>
  )
}
