"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, Save, Printer, Loader2, Check } from "lucide-react"

interface Content {
  recipientName: string
  recipientTitle: string
  company: string
  body: string
  closing: string
}

interface Props {
  id: string
  title: string
  colorScheme: string
  fontFamily: string
  content: Content
}

export default function CoverLetterEditor({ id, title: initialTitle, colorScheme, content: initialContent }: Props) {
  const [title, setTitle] = useState(initialTitle)
  const [editingTitle, setEditingTitle] = useState(false)
  const [content, setContent] = useState<Content>(initialContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  function update(field: keyof Content, value: string) {
    setContent((prev) => ({ ...prev, [field]: value }))
    setDirty(true)
    setSaved(false)
  }

  const save = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/cover-letters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      })
      if (res.ok) {
        setSaved(true)
        setDirty(false)
        toast.success("Carta guardada")
      } else {
        toast.error("Error al guardar")
      }
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }, [id, title, content])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-12 bg-white border-b border-border flex items-center justify-between px-4 gap-4 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href="/dashboard/cover-letters">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          {editingTitle ? (
            <Input
              autoFocus
              value={title}
              onChange={(e) => { setTitle(e.target.value); setDirty(true) }}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              className="h-7 text-sm font-medium max-w-[200px]"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="text-sm font-medium truncate hover:text-primary transition-colors max-w-[200px]"
            >
              {title}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {saving ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</span>
            ) : saved ? (
              <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-500" /> Guardado</span>
            ) : dirty ? "Sin guardar" : null}
          </span>
          <Button variant="outline" size="sm" onClick={save} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Guardar
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </Button>
        </div>
      </header>

      {/* Two panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: form */}
        <div className="w-80 shrink-0 border-r border-border overflow-y-auto p-5 space-y-4">
          <h2 className="font-semibold text-sm">Contenido</h2>

          <div className="space-y-1.5">
            <Label className="text-xs">Destinatario</Label>
            <Input
              placeholder="Nombre del responsable"
              value={content.recipientName}
              onChange={(e) => update("recipientName", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Cargo del destinatario</Label>
            <Input
              placeholder="Ej: Director de RRHH"
              value={content.recipientTitle}
              onChange={(e) => update("recipientTitle", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Empresa</Label>
            <Input
              placeholder="Nombre de la empresa"
              value={content.company}
              onChange={(e) => update("company", e.target.value)}
            />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs">Cuerpo de la carta</Label>
            <Textarea
              placeholder="Escribe el contenido principal de tu carta de presentación..."
              value={content.body}
              onChange={(e) => update("body", e.target.value)}
              rows={12}
              className="text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Despedida</Label>
            <Input
              placeholder="Ej: Atentamente"
              value={content.closing}
              onChange={(e) => update("closing", e.target.value)}
            />
          </div>
        </div>

        {/* Right: preview */}
        <div className="flex-1 overflow-auto bg-gray-100 flex justify-center py-8 print:py-0 print:bg-white">
          <div
            className="bg-white shadow-2xl print:shadow-none"
            style={{ width: "210mm", minHeight: "297mm", fontFamily: "Georgia, serif" }}
          >
            <CoverLetterPreview content={content} colorScheme={colorScheme} />
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          header, .w-80 { display: none !important; }
          @page { size: A4; margin: 0; }
          body { margin: 0; }
        }
      `}</style>
    </div>
  )
}

function CoverLetterPreview({ content, colorScheme }: { content: Content; colorScheme: string }) {
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="p-14" style={{ minHeight: "297mm" }}>
      {/* Header bar */}
      <div className="h-1.5 w-full rounded mb-10" style={{ backgroundColor: colorScheme }} />

      {/* Date */}
      <p className="text-sm text-gray-500 mb-6">{today}</p>

      {/* Recipient */}
      {(content.recipientName || content.recipientTitle || content.company) && (
        <div className="mb-7">
          {content.recipientName && <p className="font-semibold text-sm">{content.recipientName}</p>}
          {content.recipientTitle && <p className="text-sm text-gray-600">{content.recipientTitle}</p>}
          {content.company && <p className="text-sm text-gray-600">{content.company}</p>}
        </div>
      )}

      {/* Salutation */}
      <p className="text-sm mb-5">
        {content.recipientName ? `Estimado/a ${content.recipientName}:` : "Estimado/a responsable de selección:"}
      </p>

      {/* Body */}
      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-8">
        {content.body || (
          <span className="text-gray-300 italic">El cuerpo de la carta aparecerá aquí...</span>
        )}
      </div>

      {/* Closing */}
      {content.closing && <p className="text-sm mb-8">{content.closing},</p>}

      {/* Signature line */}
      <div className="mt-10 pt-4 border-t" style={{ borderColor: colorScheme + "40" }}>
        <div className="h-px w-32" style={{ backgroundColor: colorScheme }} />
      </div>
    </div>
  )
}
