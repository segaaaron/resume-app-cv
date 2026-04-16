import Link from "next/link"
import { FileText } from "lucide-react"

const links = {
  Herramientas: [
    { label: "Constructor de CV", href: "/dashboard/resumes" },
    { label: "Carta de Presentación", href: "/dashboard/cover-letters" },
    { label: "Ofertas de Trabajo", href: "/dashboard/jobs" },
    { label: "Mis Candidaturas", href: "/dashboard/applications" },
  ],
  Recursos: [
    { label: "Plantillas de CV", href: "/templates" },
    { label: "Ejemplos de CV", href: "/examples" },
    { label: "Artículos", href: "/articles" },
  ],
  Soporte: [
    { label: "FAQ", href: "/#faq" },
    { label: "Precios", href: "/pricing" },
    { label: "Contacto", href: "/contact" },
    { label: "Privacidad", href: "/privacy" },
    { label: "Términos", href: "/terms" },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-[#1d1d20] text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <FileText className="h-5 w-5 text-primary" />
              CVV Pro
            </Link>
            <p className="text-sm text-white/60 leading-relaxed">
              La plataforma más completa para crear tu currículum profesional y gestionar tu búsqueda de empleo.
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4 text-sm">{category}</h4>
              <ul className="space-y-2">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <p>© {new Date().getFullYear()} CVV Pro. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
