"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { FileText, Menu, X } from "lucide-react"
import { useState } from "react"

export default function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <FileText className="h-6 w-6" />
          READY CV
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/templates" className="hover:text-foreground transition-colors">Plantillas</Link>
          <Link href="/pro-disenos" className="flex items-center gap-1 font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            ✦ Pro Diseños
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">Precios</Link>
          <Link href="/#faq" className="hover:text-foreground transition-colors">FAQ</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <Button asChild>
              <Link href="/dashboard/resumes">Mi Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Crear CV gratis</Link>
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
          <Link href="/templates" className="py-2 hover:text-primary" onClick={() => setOpen(false)}>Plantillas</Link>
          <Link href="/pro-disenos" className="py-2 font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent" onClick={() => setOpen(false)}>✦ Pro Diseños</Link>
          <Link href="/pricing" className="py-2 hover:text-primary" onClick={() => setOpen(false)}>Precios</Link>
          <Link href="/#faq" className="py-2 hover:text-primary" onClick={() => setOpen(false)}>FAQ</Link>
          <hr />
          {session ? (
            <Button asChild><Link href="/dashboard/resumes">Mi Dashboard</Link></Button>
          ) : (
            <>
              <Button variant="outline" asChild><Link href="/login">Iniciar sesión</Link></Button>
              <Button asChild><Link href="/register">Crear CV gratis</Link></Button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
