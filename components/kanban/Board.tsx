"use client"

import { useEffect, useState } from "react"
import { useApplicationStore, type AppStatus, type ApplicationCard } from "@/stores/applicationStore"
import KanbanColumn from "./Column"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { toast } from "sonner"

const COLUMNS: { id: AppStatus; label: string; color: string }[] = [
  { id: "WISHLIST", label: "Deseados", color: "bg-gray-100" },
  { id: "APPLIED", label: "Postulados", color: "bg-blue-50" },
  { id: "INTERVIEW", label: "Entrevista", color: "bg-yellow-50" },
  { id: "OFFER", label: "Oferta", color: "bg-green-50" },
  { id: "REJECTED", label: "Rechazado", color: "bg-red-50" },
]

export default function KanbanBoard({ initialApplications }: { initialApplications: ApplicationCard[] }) {
  const { applications, setApplications, addApplication } = useApplicationStore()
  const [open, setOpen] = useState(false)
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setApplications(initialApplications)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function createApplication() {
    if (!jobTitle || !company) return
    setSaving(true)
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company }),
      })
      const data: ApplicationCard = await res.json()
      addApplication(data)
      setOpen(false)
      setJobTitle("")
      setCompany("")
      toast.success("Candidatura añadida")
    } catch {
      toast.error("Error al crear candidatura")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Añadir candidatura
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Nueva candidatura</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs">Puesto</Label>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="ej: Frontend Developer" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Empresa</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="ej: Acme Corp" className="mt-1" />
              </div>
              <Button className="w-full" onClick={createApplication} disabled={saving || !jobTitle || !company}>
                Añadir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-5 gap-4 overflow-x-auto min-w-[800px]">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            columnId={col.id}
            label={col.label}
            color={col.color}
            applications={applications.filter((a) => a.status === col.id)}
          />
        ))}
      </div>
    </div>
  )
}
