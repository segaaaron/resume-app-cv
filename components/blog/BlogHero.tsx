import Link from "next/link"
import { ChevronRight, Clock, Calendar, User } from "lucide-react"

type Props = {
  locale: string
  tag: string
  title: string
  subtitle: string
  datePublished: string
  readingTime: number
  author?: string
  breadcrumbBlogLabel: string
  breadcrumbHomeLabel: string
  readingLabel: string
}

/**
 * Premium blog hero — navy gradient bg + cyan accent line + breadcrumbs.
 * Mobile-first, tracking-tight H1, metadata row with lucide icons.
 */
export default function BlogHero({
  locale,
  tag,
  title,
  subtitle,
  datePublished,
  readingTime,
  author = "Valhalla Resume Team",
  breadcrumbBlogLabel,
  breadcrumbHomeLabel,
  readingLabel,
}: Props) {
  const dateObj = new Date(datePublished)
  const formattedDate = dateObj.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1a2e4a] via-[#1a2e4a] to-[#0f1d30] text-white">
      {/* Cyan accent line top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-70" />
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#00D4FF]/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-[#00D4FF]/10 blur-3xl"
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-xs sm:text-sm text-white/70">
          <Link href={`/${locale}`} className="hover:text-[#00D4FF] transition-colors">
            {breadcrumbHomeLabel}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <Link href={`/${locale}/blog`} className="hover:text-[#00D4FF] transition-colors">
            {breadcrumbBlogLabel}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          <span className="text-white/90 truncate max-w-[180px] sm:max-w-none">{tag}</span>
        </nav>

        {/* Tag badge premium */}
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30 px-3 py-1.5 rounded-full mb-6 shadow-[0_0_25px_-5px_rgba(0,212,255,0.4)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
          {tag}
        </span>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
          {title}
        </h1>

        <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-3xl mb-8">
          {subtitle}
        </p>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs sm:text-sm text-white/70">
          <span className="inline-flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#00D4FF]" />
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#00D4FF]" />
            {readingTime} {readingLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-[#00D4FF]" />
            {author}
          </span>
        </div>
      </div>
    </section>
  )
}
