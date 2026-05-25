"use client"

import React, { useTransition } from "react"
import { useLocale } from "next-intl"
import { usePathname, useRouter } from "next/navigation"

interface LocaleSwitcherProps {
  variant?: "dashboard" | "marketing"
  inactiveColor?: string
}

export default function LocaleSwitcher({ variant = "dashboard", inactiveColor }: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  function switchLocale(nextLocale: string) {
    if (nextLocale === locale) return
    const segments = pathname.split("/")
    const pathWithoutLocale = segments.slice(2).join("/")
    const newPath = `/${nextLocale}${pathWithoutLocale ? `/${pathWithoutLocale}` : ""}`
    startTransition(() => { router.push(newPath) })
  }

  // ── Marketing variant: inline text buttons, no container box ─────────────────
  if (variant === "marketing") {
    const mutedColor = inactiveColor ?? "var(--muted-foreground)"
    const hoverCol   = inactiveColor ? "#FFFFFF" : "var(--foreground)"

    return (
      <div className="flex items-center gap-0 text-xs font-semibold">
        {(["es", "en"] as const).map((lang, i) => (
          <React.Fragment key={lang}>
            {i > 0 && (
              <span className="text-[10px] opacity-40 select-none" style={{ color: mutedColor }}>|</span>
            )}
            <button
              onClick={() => switchLocale(lang)}
              disabled={isPending}
              className="relative px-2 py-1 transition-all duration-200"
              style={{
                color: locale === lang ? "var(--primary)" : mutedColor,
                fontWeight: locale === lang ? 700 : 500,
              }}
              onMouseEnter={(e) => {
                if (locale !== lang) e.currentTarget.style.color = hoverCol
              }}
              onMouseLeave={(e) => {
                if (locale !== lang) e.currentTarget.style.color = mutedColor
              }}
            >
              {lang.toUpperCase()}
              {locale === lang && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-sm bg-[var(--primary)]" />
              )}
            </button>
          </React.Fragment>
        ))}
      </div>
    )
  }

  // ── Dashboard variant: pill container, cyan active, white text ────────────────
  return (
    <div
      className="flex items-center gap-1 rounded-[8px] p-0.5"
      style={{ background: "var(--dash-surface)", border: "1px solid var(--dash-border)" }}
    >
      {(["es", "en"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => switchLocale(lang)}
          disabled={isPending}
          className="px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-all"
          style={
            locale === lang
              ? { background: "var(--dash-cyan)", color: "white" }
              : { background: "transparent", color: "var(--dash-muted)" }
          }
          onMouseEnter={(e) => {
            if (locale !== lang) e.currentTarget.style.color = "var(--dash-navy)"
          }}
          onMouseLeave={(e) => {
            if (locale !== lang) e.currentTarget.style.color = "var(--dash-muted)"
          }}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
