"use client"

import Link from "next/link"
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

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <FileText className="h-6 w-6" />
          READY CV
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/templates" className="hover:text-foreground transition-colors">{t("templates")}</Link>
          <Link href="/pro-disenos" className="flex items-center gap-1 font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            ✦ {t("pro_designs")}
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">{t("pricing")}</Link>
          <Link href="/#faq" className="hover:text-foreground transition-colors">{t("faq")}</Link>
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
              <Button asChild>
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
          <Link href="/templates" className="py-2 hover:text-primary" onClick={() => setOpen(false)}>{t("templates")}</Link>
          <Link href="/pro-disenos" className="py-2 font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent" onClick={() => setOpen(false)}>✦ {t("pro_designs")}</Link>
          <Link href="/pricing" className="py-2 hover:text-primary" onClick={() => setOpen(false)}>{t("pricing")}</Link>
          <Link href="/#faq" className="py-2 hover:text-primary" onClick={() => setOpen(false)}>{t("faq")}</Link>
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
