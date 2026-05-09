interface Props {
  brand: string
  tagline: string
  statAi: string
  statTemplates: string
  statAts: string
}

export default function ActReveal({ brand, tagline, statAi, statTemplates, statAts }: Props) {
  return (
    <section
      data-scene="act-reveal"
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="max-w-4xl mx-auto">
        <p
          className="font-serif text-7xl sm:text-8xl lg:text-9xl font-black text-white leading-none mb-4"
          data-animate="title"
          style={{
            letterSpacing: "-0.02em",
            textShadow: "0 0 120px rgba(139,92,246,0.5)",
          }}
        >
          {brand}
        </p>
        <p
          className="font-serif text-2xl sm:text-3xl italic text-indigo-300 mb-12 animate-on-scroll"
          style={{ animationDelay: "0.15s" }}
        >
          {tagline}
        </p>
        <div
          className="flex flex-wrap justify-center gap-3 animate-on-scroll"
          style={{ animationDelay: "0.3s" }}
        >
          {[statAi, statTemplates, statAts].map((s) => (
            <span
              key={s}
              className="px-4 py-2 rounded-full text-sm font-semibold text-white/90"
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
