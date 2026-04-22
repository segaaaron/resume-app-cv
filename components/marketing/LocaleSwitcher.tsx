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

  return (
    <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
      <button
        onClick={() => switchLocale("es")}
        disabled={isPending}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "es"
            ? "text-foreground font-semibold"
            : "hover:text-foreground"
        }`}
      >
        ES
      </button>
      <span className="opacity-30">|</span>
      <button
        onClick={() => switchLocale("en")}
        disabled={isPending}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "en"
            ? "text-foreground font-semibold"
            : "hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  )
}
