"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { FileText, Menu, X } from "lucide-react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import LocaleSwitcher from "@/components/marketing/LocaleSwitcher"

export default function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const t = useTranslations("nav")
  const pathname = usePathname()

  const isActive = (href: string) => pathname.includes(href)

  const handleFaqClick = (e: React.MouseEvent) => {
    const faqEl = document.getElementById("faq")
    if (faqEl) {
      e.preventDefault()
      faqEl.scrollIntoView({ behavior: "smooth" })
      setOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100 shadow-brand-xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-white" />
          </div>
          ReadyCV
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link
            href="/templates"
            className={`relative pb-0.5 hover:text-foreground transition-colors ${isActive("/templates") ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full" : ""}`}
          >
            {t("templates")}
          </Link>
          <Link href="/pro-disenos" className={`relative pb-0.5 flex items-center gap-1 font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity ${isActive("/pro-disenos") ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-500 after:rounded-full" : ""}`}>
            ✦ {t("pro_designs")}
          </Link>
          <Link
            href="/guide"
            className={`relative pb-0.5 hover:text-foreground transition-colors ${isActive("/guide") ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full" : ""}`}
          >
            {t("guide")}
          </Link>
          <Link
            href="/pricing"
            className={`relative pb-0.5 hover:text-foreground transition-colors ${isActive("/pricing") ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full" : ""}`}
          >
            {t("pricing")}
          </Link>
          <Link href="/#faq" onClick={handleFaqClick} className="hover:text-foreground transition-colors">{t("faq")}</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <LocaleSwitcher />
          {session ? (
            <Button asChild>
              <Link href="/dashboard/resumes">{t("dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild className="shadow-brand-sm">
                <Link href="/register">{t("register")}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-white px-4 py-4 flex flex-col gap-3 text-sm">
          <Link href="/templates" className={`py-2 hover:text-primary transition-colors ${isActive("/templates") ? "text-primary font-semibold" : ""}`} onClick={() => setOpen(false)}>{t("templates")}</Link>
          <Link href="/pro-disenos" className={`py-2 font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent ${isActive("/pro-disenos") ? "underline" : ""}`} onClick={() => setOpen(false)}>✦ {t("pro_designs")}</Link>
          <Link href="/guide" className={`py-2 hover:text-primary transition-colors ${isActive("/guide") ? "text-primary font-semibold" : ""}`} onClick={() => setOpen(false)}>{t("guide")}</Link>
          <Link href="/pricing" className={`py-2 hover:text-primary transition-colors ${isActive("/pricing") ? "text-primary font-semibold" : ""}`} onClick={() => setOpen(false)}>{t("pricing")}</Link>
          <Link href="/#faq" onClick={handleFaqClick} className="py-2 hover:text-primary">{t("faq")}</Link>
          <div className="py-2">
            <LocaleSwitcher />
          </div>
          <hr />
          {session ? (
            <Button asChild><Link href="/dashboard/resumes">{t("dashboard")}</Link></Button>
          ) : (
            <>
              <Button variant="outline" asChild><Link href="/login">{t("login")}</Link></Button>
              <Button asChild><Link href="/register">{t("register")}</Link></Button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
