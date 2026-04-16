import { Star } from "lucide-react"

const testimonials = [
  {
    name: "María García",
    role: "Diseñadora UX",
    rating: 5,
    text: "Increíble herramienta. En menos de 30 minutos tenía mi CV listo y profesional. Conseguí entrevistas al día siguiente.",
  },
  {
    name: "Carlos López",
    role: "Desarrollador Backend",
    rating: 5,
    text: "Las plantillas son muy elegantes y el editor en tiempo real es fantástico. Totalmente recomendado.",
  },
  {
    name: "Ana Martínez",
    role: "Project Manager",
    rating: 4,
    text: "Muy fácil de usar. Me encanta que pueda cambiar de plantilla sin perder mis datos. ¡Excelente!",
  },
]

export default function SocialProof() {
  return (
    <section className="py-20 px-4 bg-[#eaf3fc]">
      <div className="max-w-5xl mx-auto text-center">
        <div className="flex items-center justify-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-4xl font-bold mb-1">4.5/5</p>
        <p className="text-muted-foreground mb-12">Basado en más de 48,000 reseñas</p>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, rating, text }) => (
            <div key={name} className="bg-white rounded-2xl p-6 text-left shadow-sm border border-border">
              <div className="flex mb-3">
                {[...Array(rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-foreground mb-4 leading-relaxed">"{text}"</p>
              <div>
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs text-muted-foreground">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
