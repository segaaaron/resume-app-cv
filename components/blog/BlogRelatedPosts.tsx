import Link from "next/link"
import { ArrowUpRight, BookOpen } from "lucide-react"

type RelatedItem = {
  slug: string
  title: string
  desc: string
  tag: string
  readingTime: number
}

type Props = {
  locale: string
  items: RelatedItem[]
  title: string
  readingLabel: string
}

/**
 * Premium related-posts grid — 3 cards, navy/cyan hover, lucide accents.
 * Each card links to /[locale]/blog/[slug].
 */
export default function BlogRelatedPosts({ locale, items, title, readingLabel }: Props) {
  if (items.length === 0) return null

  return (
    <section className="border-t border-[#1a2e4a]/10 pt-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1d30] flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-[#00D4FF]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a2e4a]">
          {title}
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/${locale}/blog/${item.slug}`}
            className="group relative flex flex-col rounded-2xl border border-[#1a2e4a]/10 bg-white p-5 hover:border-[#00D4FF]/40 hover:shadow-[0_8px_30px_-10px_rgba(0,212,255,0.3)] hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest bg-[#1a2e4a]/8 text-[#1a2e4a] px-2 py-1 rounded-full">
                {item.tag}
              </span>
              <ArrowUpRight className="h-4 w-4 text-[#1a2e4a]/40 group-hover:text-[#00D4FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <h3 className="font-semibold text-[#1a2e4a] text-sm sm:text-base leading-snug mb-2 group-hover:text-[#1a2e4a] line-clamp-2">
              {item.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#1a2e4a]/65 leading-relaxed mb-4 line-clamp-3 flex-1">
              {item.desc}
            </p>
            <span className="text-[11px] font-medium text-[#1a2e4a]/50">
              {item.readingTime} {readingLabel}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
