import { List } from "lucide-react"

type TocItem = { id: string; label: string }

type Props = {
  items: TocItem[]
  title: string
}

/**
 * Premium TOC — works both inline (mobile) and sticky-sidebar via parent.
 * Anchor scroll with smooth scroll handled by Tailwind globally (html { scroll-behavior: smooth }).
 */
export default function BlogTableOfContents({ items, title }: Props) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Table of contents"
      className="rounded-2xl border border-[#1a2e4a]/10 bg-gradient-to-br from-white via-white to-[#00D4FF]/5 p-5 sm:p-6 shadow-[0_2px_20px_-8px_rgba(26,46,74,0.15)]"
    >
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#1a2e4a] mb-4">
        <List className="h-3.5 w-3.5 text-[#00D4FF]" />
        {title}
      </p>
      <ol className="space-y-2.5">
        {items.map((item, idx) => (
          <li key={item.id} className="flex gap-3 group">
            <span className="shrink-0 text-[11px] font-bold text-[#00D4FF] tabular-nums mt-0.5">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <a
              href={`#${item.id}`}
              className="text-sm text-[#1a2e4a]/80 hover:text-[#1a2e4a] hover:underline decoration-[#00D4FF] decoration-2 underline-offset-4 transition-colors leading-snug"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
