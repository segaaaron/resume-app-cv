interface Props {
  brand: string
  tagline: string
  value: string
  trust: string
  statAi: string
  statTemplates: string
  statAts: string
}

export default function ActReveal({ brand, tagline, value, trust, statAi, statTemplates, statAts }: Props) {
  return (
    <section
      data-scene="act-reveal"
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="max-w-4xl mx-auto">
        <p
          className="font-serif text-7xl sm:text-8xl lg:text-9xl font-black text-white leading-none mb-4 tracking-[-0.02em]"
          data-animate="title"
          style={{ textShadow: "0 0 120px rgba(139,92,246,0.5)" }}
        >
          {brand}
        </p>
        <p
          className="font-serif text-2xl sm:text-3xl italic text-white mb-5 animate-on-scroll"
          style={{
            animationDelay: "0.15s",
            // Dark halo lifts the text off the bright nebula/god-rays; the purple
            // glow keeps it cohesive with the brand's own glow above.
            textShadow: "0 2px 24px rgba(0,0,0,0.6), 0 0 40px rgba(139,92,246,0.45)",
          }}
        >
          {tagline}
        </p>
        {/* Value line — one tier below the tagline: sans, semibold, tighter, so it
            reads as the promise, not a second headline. */}
        <p
          className="text-base sm:text-lg font-semibold tracking-wide text-white/90 mb-11 animate-on-scroll"
          style={{ animationDelay: "0.22s", textShadow: "0 2px 18px rgba(0,0,0,0.55)" }}
        >
          {value}
        </p>
        <div
          className="flex flex-wrap justify-center gap-3 animate-on-scroll"
          style={{ animationDelay: "0.3s" }}
        >
          {[statAi, statTemplates, statAts].map((s) => (
            <span
              key={s}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white/90 backdrop-blur-sm"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {s}
            </span>
          ))}
        </div>
        {/* Trust microcopy — lowest tier: small, muted, our honesty differentiator.
            Kept ≥3:1 on the dark bg (white/55) so it stays legible without competing. */}
        <p
          className="mt-8 mx-auto max-w-md text-xs sm:text-[13px] leading-relaxed text-white/55 animate-on-scroll"
          style={{ animationDelay: "0.4s" }}
        >
          {trust}
        </p>
      </div>
    </section>
  )
}
