interface Props {
  stat: string
  line1: string
  line2: string
  body: string
}

export default function ActProblem({ stat, line1, line2, body }: Props) {
  return (
    <section
      data-scene="act-problem"
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
    >
      <div className="max-w-3xl mx-auto animate-on-scroll">
        <p
          className="font-serif text-[120px] sm:text-[160px] font-black leading-none text-white mb-2"
          style={{ textShadow: "0 0 80px rgba(99,102,241,0.4)" }}
        >
          {stat}
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white/90 leading-tight mb-6">
          {line1}<br />{line2}
        </h2>
        <p className="text-lg text-neutral-400 max-w-xl mx-auto leading-relaxed">
          {body}
        </p>
      </div>
    </section>
  )
}
