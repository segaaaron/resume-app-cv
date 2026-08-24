import Link from "next/link"

/**
 * The brand lockup — logo tile + "Valhalla Resume" — in ONE place.
 *
 * It used to be re-typed per surface, and the auth screens still carried the
 * pre-rebrand wordmark ("ReadyCV") months after the product was renamed: a
 * second copy of a name nobody remembers to update. Every surface that shows
 * the brand renders this component, so the name lives in exactly one file.
 *
 * No hooks and no "use client": it renders inside Server Components (auth
 * layouts) and Client Components (DashboardNav) alike.
 */

export const BRAND_NAME = "Valhalla Resume"

type Tone = "light" | "dark"
type Size = "sm" | "md" | "lg"

const MARK_PX: Record<Size, number> = { sm: 30, md: 34, lg: 38 }
const TEXT_CLASS: Record<Size, string> = {
  sm: "text-[14px]",
  md: "text-[15px]",
  lg: "text-[17px]",
}
/** `light` = brand sits on a light surface; `dark` = on the navy panel. */
const TONE_CLASS: Record<Tone, string> = {
  light: "text-[#1a2e4a]",
  dark: "text-white",
}

export default function BrandMark({
  href,
  tone = "light",
  size = "md",
  className = "",
  mark = true,
  onClick,
}: {
  href?: string
  tone?: Tone
  size?: Size
  className?: string
  /** `false` = wordmark only, for surfaces that already show the logo tile. */
  mark?: boolean
  onClick?: () => void
}) {
  const px = MARK_PX[size]

  const inner = (
    <>
      {mark && (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src="/logo.svg"
        alt=""
        aria-hidden="true"
        width={px}
        height={px}
        className="rounded-[10px] shrink-0 block shadow-[0_4px_14px_rgba(42,114,215,0.30)] transition-transform duration-200 group-hover:scale-105"
      />
      )}
      <span
        className={`[font-family:var(--dash-serif)] font-bold tracking-[-0.02em] leading-none ${TEXT_CLASS[size]} ${TONE_CLASS[tone]}`}
      >
        {BRAND_NAME}
      </span>
    </>
  )

  const classes = `flex items-center gap-[10px] w-fit no-underline group ${className}`

  if (!href) {
    return <span className={classes}>{inner}</span>
  }

  return (
    <Link href={href} onClick={onClick} className={classes}>
      {inner}
    </Link>
  )
}
