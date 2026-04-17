"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, FileText, Pencil, Trash2, Download, Copy, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ImportResumeButton from "./ImportResumeButton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { TEMPLATES } from "@/types/resume"

interface ResumeCard {
  id: string
  title: string
  templateId: string
  colorScheme: string
  updatedAt: Date
  createdAt: Date
}

export default function ResumesDashboard({ initialResumes }: { initialResumes: ResumeCard[] }) {
  const router = useRouter()
  const [resumes, setResumes] = useState(initialResumes)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function createResume() {
    setCreating(true)
    try {
      const res = await fetch("/api/resumes", { method: "POST" })
      const data = await res.json()
      router.push(`/editor/${data.id}`)
    } catch {
      toast.error("Error al crear el CV")
      setCreating(false)
    }
  }

  async function deleteResume(id: string) {
    await fetch(`/api/resumes/${id}`, { method: "DELETE" })
    setResumes((prev) => prev.filter((r) => r.id !== id))
    setDeleteId(null)
    toast.success("CV eliminado")
  }

  async function duplicateResume(id: string) {
    const res = await fetch(`/api/resumes/${id}/duplicate`, { method: "POST" })
    if (res.ok) {
      const copy = await res.json()
      setResumes((prev) => [copy, ...prev])
      toast.success("CV duplicado")
    }
  }

  const templateName = (id: string) =>
    TEMPLATES.find((t) => t.id === id)?.name ?? "Clásico"

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Mis CVs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {resumes.length} {resumes.length === 1 ? "currículum" : "currículums"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportResumeButton />
          <Button onClick={createResume} disabled={creating} className="gap-2 flex-1 sm:flex-none">
            <Plus className="h-4 w-4" />
            Nuevo CV
          </Button>
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-20 w-20 rounded-2xl bg-[#eaf3fc] flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Crea tu primer CV</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Completa tus datos, elige una plantilla y descarga tu CV profesional en minutos.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button onClick={createResume} disabled={creating} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Crear desde cero
            </Button>
            <span className="text-xs text-muted-foreground">o</span>
            <ImportResumeButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {/* Create new card */}
          <button
            onClick={createResume}
            disabled={creating}
            className="aspect-[3/4] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors group"
          >
            <div className="h-12 w-12 rounded-xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">Nuevo CV</span>
          </button>

          {resumes.map((resume) => (
            <div key={resume.id} className="group relative">
              {/* Resume preview card */}
              <Link href={`/editor/${resume.id}`} className="block">
                <div className="aspect-[3/4] bg-white border-2 border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all">
                  {/* Template color bar */}
                  <div
                    className="h-10 w-full"
                    style={{ backgroundColor: resume.colorScheme }}
                  />
                  {/* Mock content lines */}
                  <div className="p-4 space-y-2">
                    <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2 mb-4" />
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-1.5 bg-gray-100 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
                    ))}
                  </div>
                </div>
              </Link>

              {/* Card footer */}
              <div className="mt-2 flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{resume.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {templateName(resume.templateId)} · {format(new Date(resume.updatedAt), "d MMM yyyy", { locale: es })}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 rounded hover:bg-muted transition-colors shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem className="gap-2" onClick={() => router.push(`/editor/${resume.id}`)}>
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => duplicateResume(resume.id)}>
                      <Copy className="h-3.5 w-3.5" /> Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => window.open(`/resume/${resume.id}/print`, "_blank")}>
                      <Download className="h-3.5 w-3.5" /> Descargar PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                      onClick={() => setDeleteId(resume.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este CV?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El CV y todos sus datos serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteResume(deleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
