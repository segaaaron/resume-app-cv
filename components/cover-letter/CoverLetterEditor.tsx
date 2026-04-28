"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, Save, Printer, Loader2, Check, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("cover_letter_editor")
  const [title, setTitle] = useState(initialTitle)
  const [editingTitle, setEditingTitle] = useState(false)
  const [content, setContent] = useState<Content>(initialContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  // AI generation state
  const [generating, setGenerating] = useState(false)
  const [resumes, setResumes] = useState<{ id: string; title: string }[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState("")
  const [aiTone, setAiTone] = useState<"formal" | "balanced" | "creative">("balanced")

  // AI improve state
  const [improving, setImproving] = useState(false)
  const [improveVersions, setImproveVersions] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setResumes(data.map((r: { id: string; title: string }) => ({ id: r.id, title: r.title })))
      })
      .catch(() => {})
  }, [])

  async function handleGenerateAI() {
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId || undefined,
          recipientName: content.recipientName,
          recipientTitle: content.recipientTitle,
          company: content.company,
          jobTitle: title,
          tone: aiTone,
        }),
      })
      if (res.status === 403) { toast.error(t("ai_pro_only")); return }
      if (res.status === 422) { toast.error(t("ai_off_topic")); return }
      if (res.status === 400) { toast.error(t("ai_missing_company")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      update("body", data.body)
      toast.success(t("ai_success"))
    } catch {
      toast.error(t("ai_error"))
    } finally {
      setGenerating(false)
    }
  }

  async function handleImproveAI() {
    if (content.body.trim().length < 20) {
      toast.error(t("improve_short"))
      return
    }
    setImproving(true)
    setImproveVersions([])
    try {
      const res = await fetch("/api/ai/improve-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: content.body,
          company: content.company,
          jobTitle: title,
          recipientTitle: content.recipientTitle,
        }),
      })
      if (res.status === 403) { toast.error(t("ai_pro_only")); return }
      if (res.status === 422) { toast.error(t("improve_off_topic")); return }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImproveVersions(data.versions)
    } catch {
      toast.error(t("improve_error"))
    } finally {
      setImproving(false)
    }
  }

  function applyImprovedVersion(v: string) {
    update("body", v)
    setImproveVersions([])
    toast.success(t("improve_success"))
  }

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

          {/* AI generation */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2.5">
            <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {t("ai_title")}
              <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{t("ai_pro_badge")}</span>
            </p>

            {resumes.length > 0 && (
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">{t("ai_resume_label")}</Label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">{t("ai_resume_none")}</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">{t("ai_tone_label")}</Label>
              <div className="flex gap-1.5">
                {([["formal", t("ai_tone_formal")], ["balanced", t("ai_tone_balanced")], ["creative", t("ai_tone_creative")]] as const).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAiTone(v)}
                    className={`flex-1 text-[10px] py-1 rounded border transition-colors ${
                      aiTone === v
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-muted-foreground border-input hover:border-indigo-400"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              className="w-full gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleGenerateAI}
              disabled={generating}
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generating ? t("ai_generating") : t("ai_generate")}
            </Button>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Cuerpo de la carta</Label>
              <button
                type="button"
                onClick={handleImproveAI}
                disabled={improving}
                className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
              >
                {improving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {improving ? t("improve_loading") : t("improve_button")}
              </button>
            </div>
            <Textarea
              placeholder="Escribe el contenido principal de tu carta de presentación..."
              value={content.body}
              onChange={(e) => { update("body", e.target.value); setImproveVersions([]) }}
              rows={12}
              className="text-sm resize-none"
            />

            {/* AI improve versions panel */}
            {improveVersions.length > 0 && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-3 space-y-2">
                <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {t("improve_choose")}
                </p>
                {improveVersions.map((v, i) => (
                  <div key={i} className="rounded-md bg-white border border-indigo-100 p-2.5 space-y-1.5">
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{v}</p>
                    <button
                      type="button"
                      onClick={() => applyImprovedVersion(v)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      {t("improve_use")}
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 leading-relaxed">
                  ⚠ {t("improve_metrics_disclaimer")}
                </p>
                <button
                  type="button"
                  onClick={() => setImproveVersions([])}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("improve_cancel")}
                </button>
              </div>
            )}
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
