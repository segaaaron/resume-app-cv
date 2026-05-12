import Image from "next/image"
import Link from "next/link"

interface Props {
  headline: string
  sub: string
  footer: string
  locale: string
  labels: {
    tech: string
    design: string
    legal: string
    health: string
    hospitality: string
  }
}

type TemplateKey = keyof Props["labels"]

const TEMPLATES: TemplateKey[] = ["tech", "design", "legal", "health", "hospitality"]
const TEMPLATE_NAMES: Record<TemplateKey, string> = {
  tech: "Nova",
  design: "EditorialSerif",
  legal: "Consul",
  health: "ClassicMono",
  hospitality: "ChefMenu",
}
const TEMPLATE_IMAGES: Record<TemplateKey, string> = {
  tech: "/examples/tech.webp",
  design: "/examples/design.webp",
  legal: "/examples/legal.webp",
  health: "/examples/health.webp",
  hospitality: "/examples/hospitality.webp",
}

export default function ActTemplates({ headline, sub, footer, locale, labels }: Props) {
  return (
    <section
      data-scene="act-templates"
      className="min-h-screen flex flex-col items-center justify-center px-6 py-24"
    >
      <div className="max-w-6xl mx-auto w-full text-center">
        <h2
          className="font-serif text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-2"
          data-animate="title"
        >
          {headline}
        </h2>
        <p className="font-serif text-2xl italic text-neutral-400 mb-16 animate-on-scroll">
          {sub}
        </p>

        {/* Template cards */}
        <div className="flex flex-wrap justify-center gap-5 mb-10" data-animate="cards">
          {TEMPLATES.map((key) => (
            <Link
              key={key}
              href={`/${locale}/templates`}
              className="group relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(139,92,246,0.4)]"
              style={{
                width: "180px",
                height: "254px",
                flexShrink: 0,
              }}
            >
              <Image
                src={TEMPLATE_IMAGES[key]}
                alt={`${labels[key]} - ${TEMPLATE_NAMES[key]}`}
                fill
                className="object-cover object-top"
                sizes="180px"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                <p className="text-white text-xs font-bold">{labels[key]}</p>
                <p className="text-white/70 text-[10px]">{TEMPLATE_NAMES[key]}</p>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-neutral-500 text-sm animate-on-scroll">
          ◆ {footer}
        </p>
      </div>
    </section>
  )
}
