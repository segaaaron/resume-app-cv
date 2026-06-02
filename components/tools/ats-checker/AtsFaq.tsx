import { getTranslations } from "next-intl/server"

export default async function AtsFaq({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "tools.atsChecker.faq" })
  const items = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
  ]
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#1a2e4a] md:text-4xl">{t("title")}</h2>
      <div className="mt-10 space-y-3">
        {items.map((item, i) => (
          <details key={i} className="group rounded-2xl border border-[#1a2e4a]/10 bg-white p-5 shadow-[0_8px_30px_-15px_rgba(15,26,46,0.18)] transition-all open:border-[#00D4FF]/40 open:shadow-[0_15px_40px_-15px_rgba(0,212,255,0.25)]">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-bold text-[#1a2e4a] md:text-base">
              <span>{item.q}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a2e4a]/5 text-[#1a2e4a] transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-[#1a2e4a]/70">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
