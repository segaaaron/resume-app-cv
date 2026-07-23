import { ReactNode } from "react"

type Props = { children: ReactNode }

/**
 * Editorial prose wrapper for blog body content — tuned for a premium reading
 * experience, not a wall of text:
 *  · lead paragraph is larger/darker and opens with a drop cap
 *  · H2s carry a cyan accent bar (section anchors you can scan)
 *  · blockquotes render as gradient pull-quotes
 *  · list items use branded cyan dot markers
 *  · comfortable measure: 16–17px body, 1.8 line-height
 * One component → every post inherits the upgrade. H2/H3 keep scroll-mt for the
 * sticky-nav TOC anchor offset.
 */
export default function BlogProse({ children }: Props) {
  return (
    <div
      className="
        prose prose-neutral max-w-none
        prose-p:text-[16px] sm:prose-p:text-[17px] prose-p:leading-[1.8] prose-p:text-[#334155] prose-p:my-5

        [&>p:first-of-type]:text-[19px] [&>p:first-of-type]:leading-[1.7] [&>p:first-of-type]:text-[#1a2e4a] [&>p:first-of-type]:font-medium [&>p:first-of-type]:mb-6
        [&>p:first-of-type]:first-letter:float-left [&>p:first-of-type]:first-letter:mr-3 [&>p:first-of-type]:first-letter:mt-2 [&>p:first-of-type]:first-letter:text-[64px] [&>p:first-of-type]:first-letter:font-extrabold [&>p:first-of-type]:first-letter:leading-[0.8] [&>p:first-of-type]:first-letter:text-[#1a2e4a]

        prose-headings:tracking-tight prose-headings:text-[#1a2e4a]
        prose-h2:text-[26px] sm:prose-h2:text-[32px] prose-h2:font-extrabold prose-h2:leading-tight prose-h2:mt-14 prose-h2:mb-5 prose-h2:pl-5 prose-h2:border-l-[3px] prose-h2:border-[#00D4FF] prose-h2:scroll-mt-24
        prose-h3:text-[19px] sm:prose-h3:text-[22px] prose-h3:font-bold prose-h3:mt-9 prose-h3:mb-3 prose-h3:scroll-mt-24

        prose-strong:text-[#1a2e4a] prose-strong:font-bold

        prose-a:text-[#0a8db5] prose-a:font-semibold prose-a:no-underline prose-a:underline prose-a:decoration-[#00D4FF]/40 prose-a:decoration-2 prose-a:underline-offset-[3px] hover:prose-a:text-[#00D4FF] hover:prose-a:decoration-[#00D4FF] prose-a:transition-colors

        prose-ul:list-none prose-ul:pl-0 prose-ul:my-5
        [&_ul>li]:relative [&_ul>li]:pl-6 [&_ul>li]:before:content-[''] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.72em] [&_ul>li]:before:h-[7px] [&_ul>li]:before:w-[7px] [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-[#00D4FF]
        prose-ol:my-5
        prose-li:text-[16px] sm:prose-li:text-[17px] prose-li:text-[#334155] prose-li:leading-[1.75] prose-li:my-1.5

        prose-blockquote:my-8 prose-blockquote:border-l-4 prose-blockquote:border-[#00D4FF] prose-blockquote:bg-gradient-to-r prose-blockquote:from-[#00D4FF]/10 prose-blockquote:to-transparent prose-blockquote:py-5 prose-blockquote:px-7 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic prose-blockquote:text-[18px] prose-blockquote:font-medium prose-blockquote:text-[#1a2e4a]

        prose-table:my-7 prose-table:text-sm prose-table:rounded-xl prose-table:overflow-hidden prose-table:shadow-[0_2px_22px_-8px_rgba(26,46,74,0.28)]
        prose-th:bg-[#1a2e4a] prose-th:text-white prose-th:font-semibold prose-th:text-left prose-th:px-4 prose-th:py-3
        prose-td:px-4 prose-td:py-3 prose-td:border-b prose-td:border-[#1a2e4a]/10

        prose-code:bg-[#1a2e4a]/8 prose-code:text-[#1a2e4a] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-medium prose-code:before:hidden prose-code:after:hidden
      "
    >
      {children}
    </div>
  )
}
