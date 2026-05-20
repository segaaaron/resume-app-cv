"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"

export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function switchLocale(nextLocale: string) {
    if (nextLocale === locale) return

    // Pathname includes the locale prefix like /es/templates or /en/templates
    // Strip the current locale prefix and prepend the new one
    const segments = pathname.split("/")
    // segments[0] = "", segments[1] = locale, rest = path
    const pathWithoutLocale = segments.slice(2).join("/")
    const newPath = `/${nextLocale}${pathWithoutLocale ? `/${pathWithoutLocale}` : ""}`

    startTransition(() => {
      router.push(newPath)
    })
  }

  const baseBtn = "px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-all"

  return (
    <div
      className="flex items-center gap-1 rounded-[8px] p-0.5"
      style={{
        background: "var(--dash-surface)",
        border: "1px solid var(--dash-border)",
      }}
    >
      <button
        onClick={() => switchLocale("es")}
        disabled={isPending}
        className={baseBtn}
        style={
          locale === "es"
            ? { background: "var(--dash-cyan)", color: "var(--dash-navy)" }
            : { background: "transparent", color: "var(--dash-muted)" }
        }
        onMouseEnter={(e) => {
          if (locale !== "es") e.currentTarget.style.color = "var(--dash-navy)"
        }}
        onMouseLeave={(e) => {
          if (locale !== "es") e.currentTarget.style.color = "var(--dash-muted)"
        }}
      >
        ES
      </button>
      <button
        onClick={() => switchLocale("en")}
        disabled={isPending}
        className={baseBtn}
        style={
          locale === "en"
            ? { background: "var(--dash-cyan)", color: "var(--dash-navy)" }
            : { background: "transparent", color: "var(--dash-muted)" }
        }
        onMouseEnter={(e) => {
          if (locale !== "en") e.currentTarget.style.color = "var(--dash-navy)"
        }}
        onMouseLeave={(e) => {
          if (locale !== "en") e.currentTarget.style.color = "var(--dash-muted)"
        }}
      >
        EN
      </button>
    </div>
  )
}
