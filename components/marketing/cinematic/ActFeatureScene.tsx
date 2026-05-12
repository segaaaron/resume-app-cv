import { cn } from "@/lib/utils"

interface Props {
  scene: string
  badge: string
  headline: string
  body: string
  mockup: React.ReactNode
  reverse?: boolean
}

export default function ActFeatureScene({ scene, badge, headline, body, mockup, reverse = false }: Props) {
  return (
    <section
      data-scene={scene}
      className="min-h-screen flex items-center px-6 py-20"
    >
      <div className={cn(
        "max-w-6xl mx-auto w-full flex flex-col lg:flex-row items-center gap-16",
        reverse && "lg:flex-row-reverse"
      )}>
        {/* Mockup */}
        <div className={cn(
          "flex-1 flex justify-center",
          reverse ? "animate-on-scroll-left" : "animate-on-scroll-right"
        )}>
          {mockup}
        </div>

        {/* Text */}
        <div className="flex-1 text-center lg:text-left">
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase mb-4 animate-blur-in"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.8)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "999px",
              padding: "4px 14px",
            }}
          >
            ✦ {badge}
          </span>
          <h2
            className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6"
            data-animate="title"
          >
            {headline}
          </h2>
          <p
            className="text-lg text-white/70 leading-relaxed max-w-md animate-blur-in"
            style={{ transitionDelay: "0.3s" }}
          >
            {body}
          </p>
        </div>
      </div>
    </section>
  )
}
