import { PencilLine, Palette, Download } from "lucide-react"

const steps = [
  {
    icon: PencilLine,
    step: "1",
    title: "Ingresa tus datos",
    description: "Completa las secciones relevantes: experiencia, educación, habilidades y más.",
  },
  {
    icon: Palette,
    step: "2",
    title: "Elige tu plantilla",
    description: "Personaliza con una de nuestras 12 plantillas profesionales según tu estilo.",
  },
  {
    icon: Download,
    step: "3",
    title: "Descarga tu CV",
    description: "Exporta en PDF de alta calidad y edítalo cuando quieras.",
  },
]

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">¿Cómo funciona?</h2>
        <p className="text-center text-muted-foreground mb-12">
          Tres pasos simples para tener tu CV listo
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ icon: Icon, step, title, description }) => (
            <div key={step} className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="h-16 w-16 rounded-2xl bg-[#eaf3fc] flex items-center justify-center">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {step}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
