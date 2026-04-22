import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import { Check } from "lucide-react"
import type { Metadata } from "next"
import PricingButtons from "@/components/marketing/PricingButtons"

export const metadata: Metadata = {
  title: "Precios — Plan Gratis y Pro desde $10/mes",
  description:
    "READY CV es gratis para siempre. Desbloquea todas las plantillas premium, CV ilimitados y funciones avanzadas con el plan Pro por solo $10 al mes.",
  alternates: {
    canonical: "https://readycv.app/pricing",
  },
  openGraph: {
    title: "Precios — READY CV | Plan Gratis y Pro desde $10/mes",
    description:
      "Crea CVs profesionales gratis. Desbloquea todo con el plan Pro por solo $10/mes.",
    url: "https://readycv.app/pricing",
    type: "website",
  },
}

const features = [
  "CVs ilimitados",
  "29 plantillas profesionales",
  "Descarga en PDF",
  "Cartas de presentación",
  "Seguimiento de candidaturas",
  "Cambio de plantilla sin perder datos",
  "Import PDF/Word",
  "Soporte prioritario",
]

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">Un precio, todo incluido</h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-12">
            Sin niveles confusos. Sin funciones ocultas. Todo disponible desde el primer día.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {/* Trial */}
            <div className="bg-primary text-white rounded-2xl p-8 text-left">
              <div className="mb-6">
                <p className="text-sm font-medium text-white/70 mb-1">Prueba</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$0.99</span>
                  <span className="text-white/70">/ 14 días</span>
                </div>
              </div>
              <ul className="space-y-2 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                    <Check className="h-4 w-4 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <PricingButtons plan="trial" />
              <p className="text-xs text-white/60 text-center mt-2">Cancela en cualquier momento</p>
            </div>

            {/* Monthly */}
            <div className="bg-white border-2 border-border rounded-2xl p-8 text-left">
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Mensual</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-muted-foreground">/ mes</span>
                </div>
              </div>
              <ul className="space-y-2 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <PricingButtons plan="pro" />
              <p className="text-xs text-muted-foreground text-center mt-2">Cancela en cualquier momento</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
