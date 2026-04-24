import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import { Check } from "lucide-react"
import type { Metadata } from "next"
import PricingButtons from "@/components/marketing/PricingButtons"

export const metadata: Metadata = {
  title: "Precios — Plan Pro desde $15/mes — READY CV",
  description:
    "Desbloquea todas las plantillas premium, CV ilimitados y funciones avanzadas. Plan mensual a $15/mes o anual a $144/año (ahorra 20%).",
  alternates: {
    canonical: "https://readycv.app/pricing",
  },
  openGraph: {
    title: "Precios — READY CV | Plan Pro desde $15/mes",
    description:
      "Crea CVs profesionales. Plan mensual $15/mes o anual $144/año. Ahorra 20% con el plan anual.",
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
            {/* Monthly */}
            <div className="bg-white border-2 border-border rounded-2xl p-8 text-left">
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-1">Mensual</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$15</span>
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
              <PricingButtons plan="monthly" />
              <p className="text-xs text-muted-foreground text-center mt-2">Cancela en cualquier momento</p>
            </div>

            {/* Annual */}
            <div className="bg-primary text-white rounded-2xl p-8 text-left">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-white/70">Anual</p>
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">Ahorra 20%</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$144</span>
                  <span className="text-white/70">/ año</span>
                </div>
                <p className="text-xs text-white/60 mt-1">$12 / mes · ahorras $36 al año</p>
              </div>
              <ul className="space-y-2 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                    <Check className="h-4 w-4 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <PricingButtons plan="annual" />
              <p className="text-xs text-white/60 text-center mt-2">Cancela en cualquier momento</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
