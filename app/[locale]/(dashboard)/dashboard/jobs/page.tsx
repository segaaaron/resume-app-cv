import { Briefcase } from "lucide-react"

export default function JobsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Ofertas de Trabajo</h1>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-20 w-20 rounded-2xl bg-[#eaf3fc] flex items-center justify-center mb-4">
          <Briefcase className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Bolsa de trabajo</h2>
        <p className="text-muted-foreground mb-2 max-w-sm">
          Próximamente: encuentra ofertas de trabajo relevantes para tu perfil directamente en la plataforma.
        </p>
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Fase 3</span>
      </div>
    </div>
  )
}
