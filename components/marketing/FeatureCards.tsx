import { FileText, Mail, Briefcase, Kanban } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "CV Profesional",
    description: "Crea CVs ilimitados y edítalos en cualquier momento con nuestro editor en tiempo real.",
  },
  {
    icon: Mail,
    title: "Cartas de Presentación",
    description: "Escribe cartas de presentación profesionales que complementen tu CV.",
  },
  {
    icon: Briefcase,
    title: "Ofertas de Trabajo",
    description: "Encuentra oportunidades laborales relevantes para tu perfil directamente en la plataforma.",
  },
  {
    icon: Kanban,
    title: "Gestión de Candidaturas",
    description: "Organiza y da seguimiento a tus postulaciones con un tablero Kanban intuitivo.",
  },
]

export default function FeatureCards() {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Todo lo que necesitas</h2>
        <p className="text-center text-muted-foreground mb-12">
          Una plataforma completa para tu búsqueda de empleo
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-border p-6 hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="h-12 w-12 rounded-xl bg-[#eaf3fc] flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
