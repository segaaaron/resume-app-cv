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
    <section className={cn("py-16 px-4", alt ? "bg-[#f8fafc]" : "bg-white")}>
      <div className="animate-on-scroll max-w-[960px] mx-auto flex flex-col gap-12 items-center">
        <div className={cn(
          "flex flex-wrap items-center gap-14 w-full",
          reverse ? "flex-row-reverse" : "flex-row"
        )}>
          {/* Mockup side */}
          <div className="flex-[1_1_340px] flex justify-center">
            {mockup}
          </div>

          {/* Text side */}
          <div className="flex-[1_1_300px] flex flex-col gap-4">
            {/* Badge */}
            <div className="flex items-center gap-1.5">
              <div className="w-[18px] h-px bg-dash-cyan rounded-sm" />
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-[0.12em] uppercase text-dash-cyan px-3 py-[3px] rounded-full"
                style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.22)" }}
              >
                ✦ {badge}
              </span>
            </div>

            <h2 className="text-[clamp(22px,3.5vw,30px)] font-extrabold text-dash-navy tracking-[-0.025em] leading-[1.2] m-0">
              {title}
            </h2>

            <p className="text-[15px] text-dash-muted leading-[1.7] m-0 max-w-[440px]">
              {description}
            </p>

            {/* Decorative separator */}
            <div className="mt-1 h-px w-12 rounded-sm"
              style={{ background: "linear-gradient(90deg, #00D4FF, transparent)" }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
