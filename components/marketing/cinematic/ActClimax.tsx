import Link from "next/link"

interface Props {
  line1: string
  line2: string
  sub: string
  speed: string
  cta: string
  note: string
  locale: string
}

export default function ActClimax({ line1, line2, sub, speed, cta, note, locale }: Props) {
  return (
    <section
      data-scene="act-climax"
      className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-black text-foreground leading-tight mb-6 animate-blur-in">
          {line1}<br />
          <span className="italic text-primary">{line2}</span>
        </h2>

        {/* Poetic sub — serif italic, one tier under the headline, sets up the CTA. */}
        <p
          className="font-serif text-lg sm:text-xl italic text-foreground/70 mb-10 animate-on-scroll"
          style={{ animationDelay: "0.1s" }}
        >
          {sub}
        </p>

        <div className="animate-on-scroll" style={{ animationDelay: "0.2s" }}>
          <Link
            href={`/${locale}/login`}
            className="inline-flex items-center gap-2 bg-primary text-white font-bold text-lg px-10 py-5 rounded-2xl shadow-2xl hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(79,70,229,0.4)]"
          >
            {cta} →
          </Link>
        </div>

        {/* Speed reassurance — small, semibold, just under the CTA: removes the
            "this will take forever" objection at the decision point. */}
        <p
          className="mt-5 text-sm font-semibold text-foreground/75 animate-on-scroll"
          style={{ animationDelay: "0.3s" }}
        >
          {speed}
        </p>

        <p
          className="mt-3 text-sm text-muted-foreground animate-on-scroll"
          style={{ animationDelay: "0.4s" }}
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
