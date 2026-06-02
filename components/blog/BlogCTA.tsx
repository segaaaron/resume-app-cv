import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

type Props = {
  locale: string
  title: string
  description: string
  buttonLabel: string
  hint?: string
  /** Default routes to /pricing (PRO upgrade). Override only if needed. */
  href?: string
}

/**
 * Premium bottom-CTA card — navy gradient + cyan glow + animated arrow.
 * Drives user toward /pricing (PRO plan — there is NO free tier).
 */
export default function BlogCTA({
  locale,
  title,
  description,
  buttonLabel,
  hint,
  href,
}: Props) {
  const target = href ?? `/${locale}/pricing`

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[#1a2e4a]/15 bg-gradient-to-br from-[#1a2e4a] via-[#1a2e4a] to-[#0f1d30] p-8 sm:p-12 shadow-[0_20px_60px_-20px_rgba(26,46,74,0.5)]">
      {/* Cyan glow accents */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#00D4FF]/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#00D4FF]/15 blur-3xl" />
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-60" />

      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30 px-3 py-1.5 rounded-full mb-5">
          <Sparkles className="h-3 w-3" />
          ReadyCV PRO
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3 leading-tight">
          {title}
        </h2>
        <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-7 max-w-xl">
          {description}
        </p>

        <Link
          href={target}
          className="group inline-flex items-center gap-2.5 bg-gradient-to-r from-[#00D4FF] to-[#00B8E0] text-[#0f1d30] font-bold text-sm sm:text-base px-7 py-3.5 rounded-xl shadow-[0_8px_30px_-6px_rgba(0,212,255,0.6)] hover:shadow-[0_10px_40px_-6px_rgba(0,212,255,0.8)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          {buttonLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>

        {hint && (
          <p className="mt-5 text-xs text-white/60">
            {hint}
          </p>
        )}
      </div>
    </section>
  )
}
