"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ImportResumeButton() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    handleUpload(f)
  }

  async function handleUpload(f: File) {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", f)

    try {
      const res = await fetch("/api/resumes/import", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Error al importar el CV")
        setFile(null)
        return
      }

      toast.success("CV importado correctamente")
      router.push(`/editor/${data.id}`)
    } catch {
      toast.error("Error al importar el CV")
      setFile(null)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {file ? `Analizando ${file.name}…` : "Procesando…"}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Importar CV
          </>
        )}
      </Button>

      {/* Progress overlay while uploading */}
      {uploading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 mb-1">Analizando tu CV</p>
              <p className="text-sm text-muted-foreground">
                Estamos extrayendo tu información con IA…
              </p>
              {file && (
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px] mx-auto">
                  {file.name}
                </p>
              )}
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      )}
    </>
  )
}
