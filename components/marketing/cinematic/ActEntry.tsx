interface Props {
  line1: string
  line2: string
  scrollHint: string
}

export default function ActEntry({ line1, line2, scrollHint }: Props) {
  const words1 = line1.split(" ")
  const words2 = line2.split(" ")

  return (
    <section
      data-scene="act-entry"
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20"
    >
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="font-serif text-6xl sm:text-7xl lg:text-8xl font-black leading-tight text-foreground mb-4">
          <span className="block">
            {words1.map((w, i) => (
              <span
                key={i}
                className="cinematic-word mr-[0.25em]"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                {w}
              </span>
            ))}
          </span>
          <span className="block italic text-primary">
            {words2.map((w, i) => (
              <span
                key={i}
                className="cinematic-word mr-[0.25em]"
                style={{ animationDelay: `${(words1.length + i) * 0.12}s` }}
              >
                {w}
              </span>
            ))}
          </span>
        </h1>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ animation: "fade-in 1s ease 1.5s both" }}
      >
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          {scrollHint}
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-muted-foreground/60 to-transparent animate-pulse" />
      </div>
    </section>
  )
}
