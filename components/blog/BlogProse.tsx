import { ReactNode } from "react"

type Props = { children: ReactNode }

/**
 * Premium prose wrapper for blog body content.
 * Custom Tailwind typography styles tuned for navy/cyan brand.
 * H2/H3 get scroll-mt for TOC anchor offset under sticky Navbar.
 */
export default function BlogProse({ children }: Props) {
  return (
    <div
      className="
        prose prose-neutral max-w-none
        prose-headings:tracking-tight prose-headings:text-[#1a2e4a]
        prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-5 prose-h2:scroll-mt-24
        prose-h2:relative prose-h2:pb-3 prose-h2:border-b prose-h2:border-[#1a2e4a]/10
        prose-h3:text-lg sm:prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3 prose-h3:scroll-mt-24
        prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-[#1a2e4a]/80
        prose-strong:text-[#1a2e4a] prose-strong:font-semibold
        prose-a:text-[#0a8db5] prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:decoration-[#00D4FF] prose-a:decoration-2 prose-a:underline-offset-4
        prose-ul:my-4 prose-li:text-[15px] prose-li:text-[#1a2e4a]/80 prose-li:leading-relaxed prose-li:my-1
        prose-ol:my-4
        prose-blockquote:border-l-4 prose-blockquote:border-[#00D4FF] prose-blockquote:bg-[#00D4FF]/5 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-[#1a2e4a]/85 prose-blockquote:font-normal
        prose-table:my-6 prose-table:text-sm
        prose-th:bg-[#1a2e4a] prose-th:text-white prose-th:font-semibold prose-th:text-left prose-th:px-4 prose-th:py-3
        prose-td:px-4 prose-td:py-3 prose-td:border-b prose-td:border-[#1a2e4a]/10
        prose-code:bg-[#1a2e4a]/8 prose-code:text-[#1a2e4a] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-medium prose-code:before:hidden prose-code:after:hidden
      "
    >
      {children}
    </div>
  )
}
