"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import LocaleSwitcher from "@/components/marketing/LocaleSwitcher"
import { Z_FIXED_BAR, Z_PAGE_OVERLAY } from "@/lib/ui/z-layers"

export default function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const t = useTranslations("nav")
  const locale = useLocale()
  const pathname = usePathname()

  const isActive = (path: string) => {
    const full = `/${locale}${path}`
    return pathname === full || pathname.startsWith(`${full}/`)
  }

  const activeClass = "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
  const mobileActiveClass = "text-primary font-semibold"

  const links = [
    { path: "/templates",   label: t("templates"),  gradient: false },
    { path: "/blog",        label: t("blog"),        gradient: false },
    { path: "/guide",       label: t("guide"),       gradient: false },
    { path: "/pricing",     label: t("pricing"),     gradient: false },
    { path: "/faq",         label: t("faq"),         gradient: false },
  ]

  return (
    <header style={{ zIndex: Z_FIXED_BAR }} className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-[#C9A96E]/25 shadow-brand-xs">
      <a
        href="#main-content"
        style={{ zIndex: Z_PAGE_OVERLAY }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#1a2e4a] focus:shadow-lg focus:outline focus:outline-2 focus:outline-[#00D4FF]"
      >
        {t("skip_to_content")}
      </a>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
          <Image src="/logo.svg" alt="Valhalla Resume" width={28} height={28} priority className="rounded-lg shrink-0" />
          Valhalla Resume
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {links.map(({ path, label, gradient }) =>
            gradient ? (
              <Link
                key={path}
                href={`/${locale}${path}`}
                className={`relative pb-0.5 flex items-center gap-1 font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity ${isActive(path) ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-500 after:rounded-full" : ""}`}
              >
                ✦ {label}
              </Link>
            ) : (
              <Link
                key={path}
                href={`/${locale}${path}`}
                className={`relative pb-0.5 hover:text-foreground transition-colors ${isActive(path) ? activeClass : ""}`}
              >
                {label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LocaleSwitcher variant="marketing" />
          {session ? (
            <Button asChild>
              <Link href={`/${locale}/dashboard/resumes`}>{t("dashboard")}</Link>
            </Button>
          ) : (
            <Button asChild className="shadow-brand-sm">
              <Link href={`/${locale}/login`}>{t("register")}</Link>
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 flex flex-col gap-3 text-sm">
          {links.map(({ path, label, gradient }) =>
            gradient ? (
              <Link
                key={path}
                href={`/${locale}${path}`}
                className={`py-2 font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent ${isActive(path) ? "underline" : ""}`}
                onClick={() => setOpen(false)}
              >
                ✦ {label}
              </Link>
            ) : (
              <Link
                key={path}
                href={`/${locale}${path}`}
                className={`py-2 hover:text-primary transition-colors ${isActive(path) ? mobileActiveClass : ""}`}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            )
          )}
          <div className="py-2">
            <LocaleSwitcher variant="marketing" />
          </div>
          <hr />
          {session ? (
            <Button asChild><Link href={`/${locale}/dashboard/resumes`}>{t("dashboard")}</Link></Button>
          ) : (
            <Button asChild><Link href={`/${locale}/login`}>{t("register")}</Link></Button>
          )}
        </div>
      )}
    </header>
  )
}
