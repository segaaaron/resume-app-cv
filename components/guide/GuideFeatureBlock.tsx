import { cn } from "@/lib/utils"

interface Props {
  badge: string
  title: string
  description: string
  mockup: React.ReactNode
  reverse?: boolean
  alt?: boolean
}

export default function GuideFeatureBlock({ badge, title, description, mockup, reverse = false, alt = false }: Props) {
  return (
    <section className={cn("py-16 px-4", alt ? "bg-neutral-50" : "bg-white")}>
      <div className={cn(
        "max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12",
        reverse && "lg:flex-row-reverse"
      )}>
        <div className="flex-1 flex justify-center">
          {mockup}
        </div>

        <div className="flex-1 space-y-4 text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-1">
            ✦ {badge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold leading-tight">{title}</h2>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </section>
  )
}
