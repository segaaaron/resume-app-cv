import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-[#eaf3fc] to-background py-20 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">4.5/5 · 48,000+ reseñas</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 leading-tight">
          Crea tu CV profesional{" "}
          <span className="text-primary">fácilmente</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Completa tus datos, elige una plantilla y descarga tu currículum en minutos.
          Sin experiencia en diseño, sin complicaciones.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="px-8 py-6 text-lg" asChild>
            <Link href="/register">Comenzar gratis</Link>
          </Button>
          <Button size="lg" variant="outline" className="px-8 py-6 text-lg" asChild>
            <Link href="/templates">Ver plantillas</Link>
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Sin tarjeta de crédito · Descarga inmediata
        </p>

        {/* Mock resume preview */}
        <div className="mt-16 relative max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="bg-primary h-24 flex items-end px-8 pb-4">
              <div>
                <div className="h-5 bg-white/90 rounded w-48 mb-2" />
                <div className="h-3 bg-white/60 rounded w-32" />
              </div>
            </div>
            <div className="p-8 grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-3 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-2 bg-muted rounded w-full mb-1" />
                    <div className="h-2 bg-muted rounded w-4/5" />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-2 bg-muted rounded w-full" />
                ))}
              </div>
            </div>
          </div>
          {/* Floating badge */}
          <div className="absolute -right-4 top-8 bg-white shadow-lg border border-border rounded-xl px-4 py-3 text-sm font-medium text-primary">
            ✓ PDF descargado
          </div>
        </div>
      </div>
    </section>
  )
}
