interface Props {
  stat: string
  line1: string
  line2: string
  body: string
  punch: string
}

export default function ActProblem({ stat, line1, line2, body, punch }: Props) {
  return (
    <section
      data-scene="act-problem"
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="max-w-3xl mx-auto">
        <p
          className="font-serif text-[120px] sm:text-[160px] font-black leading-none text-white mb-2 animate-blur-in"
          style={{ textShadow: "0 0 80px rgba(99,102,241,0.4)" }}
        >
          {stat}
        </p>
        <h2
          className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white/90 leading-tight mb-6"
          data-animate="title"
        >
          {line1} {line2}
        </h2>
        <p className="text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed animate-blur-in"
          style={{ transitionDelay: "0.3s" }}
        >
          {body}
        </p>
        {/* Sales punch — one tier above the muted body: bold, white, with a cyan
            accent on the payoff clause. Sits below the explanation so it reads as
            the takeaway, not a competing headline. */}
        <p className="mt-8 text-xl sm:text-2xl font-bold text-white animate-blur-in"
          style={{ transitionDelay: "0.45s", textShadow: "0 0 40px rgba(0,212,255,0.25)" }}
        >
          {punch}
        </p>
      </div>
    </section>
  )
}
