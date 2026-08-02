import Link from "next/link"

interface Props {
  line1: string
  line2: string
  cta: string
  note: string
  locale: string
}

export default function ActClimax({ line1, line2, cta, note, locale }: Props) {
  return (
    <section
      data-scene="act-climax"
      className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-black text-foreground leading-tight mb-10 animate-blur-in">
          {line1}<br />
          <span className="italic text-primary">{line2}</span>
        </h2>

        <div className="animate-on-scroll" style={{ animationDelay: "0.2s" }}>
          <Link
            href={`/${locale}/register`}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-lg px-10 py-5 rounded-2xl shadow-2xl hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(79,70,229,0.4)]"
          >
            {cta} →
          </Link>
        </div>

        <p
          className="mt-6 text-sm text-muted-foreground animate-on-scroll"
          style={{ animationDelay: "0.35s" }}
        >
          {note}
        </p>
      </div>

      {/* Legal footer */}
      <div className="absolute bottom-6 flex flex-wrap justify-center gap-4 text-xs text-slate-700">
        <Link href={`/${locale}/privacy`} className="hover:text-slate-900 transition-colors">Privacy</Link>
        <Link href={`/${locale}/terms`} className="hover:text-slate-900 transition-colors">Terms</Link>
        <Link href={`/${locale}/cookie-policy`} className="hover:text-slate-900 transition-colors">Cookies</Link>
        <Link href={`/${locale}/pricing`} className="hover:text-slate-900 transition-colors">Pricing</Link>
      </div>
    </section>
  )
}
