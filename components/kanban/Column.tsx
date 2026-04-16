"use client"

import type { AppStatus, ApplicationCard } from "@/stores/applicationStore"
import { useApplicationStore } from "@/stores/applicationStore"
import { Badge } from "@/components/ui/badge"
import { Trash2, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Props {
  columnId: AppStatus
  label: string
  color: string
  applications: ApplicationCard[]
}

export default function KanbanColumn({ columnId, label, color, applications }: Props) {
  const { moveApplication, deleteApplication } = useApplicationStore()

  async function handleMove(id: string, status: AppStatus) {
    moveApplication(id, status)
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
  }

  async function handleDelete(id: string) {
    deleteApplication(id)
    await fetch(`/api/applications/${id}`, { method: "DELETE" })
    toast.success("Candidatura eliminada")
  }

  const STATUSES: AppStatus[] = ["WISHLIST", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"]

  return (
    <div className={cn("rounded-xl p-3 min-h-[400px]", color)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">{label}</h3>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">{applications.length}</Badge>
      </div>

      <div className="space-y-2">
        {applications.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{app.jobTitle}</p>
                <p className="text-xs text-muted-foreground truncate">{app.company}</p>
              </div>
              <button
                onClick={() => handleDelete(app.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {app.url && (
              <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline">
                <ExternalLink className="h-3 w-3" /> Ver oferta
              </a>
            )}

            {/* Move buttons */}
            <div className="flex gap-1 mt-2 flex-wrap">
              {STATUSES.filter((s) => s !== columnId).map((status) => (
                <button
                  key={status}
                  onClick={() => handleMove(app.id, status)}
                  className="text-[10px] text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-0.5 transition-colors"
                >
                  → {status === "WISHLIST" ? "Deseado" : status === "APPLIED" ? "Postulado" : status === "INTERVIEW" ? "Entrevista" : status === "OFFER" ? "Oferta" : "Rechazado"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
