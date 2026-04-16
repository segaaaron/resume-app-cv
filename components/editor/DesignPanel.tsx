"use client"

import { useResumeStore } from "@/stores/resumeStore"
import { FONT_OPTIONS } from "@/types/resume"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useRef, useState } from "react"
import { Camera, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

const COLOR_PALETTES: { label: string; colors: { hex: string; name: string }[] }[] = [
  {
    label: "Profesional",
    colors: [
      { hex: "#2a72d7", name: "Azul" },
      { hex: "#1e3a5f", name: "Navy" },
      { hex: "#0891b2", name: "Cyan" },
      { hex: "#0f766e", name: "Teal" },
      { hex: "#1d4ed8", name: "Índigo" },
      { hex: "#475569", name: "Pizarra" },
    ],
  },
  {
    label: "Vibrante",
    colors: [
      { hex: "#9333ea", name: "Morado" },
      { hex: "#ec4899", name: "Rosa" },
      { hex: "#dc2626", name: "Rojo" },
      { hex: "#ea580c", name: "Naranja" },
      { hex: "#ca8a04", name: "Ámbar" },
      { hex: "#16a34a", name: "Verde" },
    ],
  },
  {
    label: "Oscuro",
    colors: [
      { hex: "#111827", name: "Negro" },
      { hex: "#1d1d20", name: "Carbón" },
      { hex: "#1e293b", name: "Slate" },
      { hex: "#312e81", name: "Índigo O" },
      { hex: "#4a1942", name: "Ciruela" },
      { hex: "#292524", name: "Piedra" },
    ],
  },
  {
    label: "Suave",
    colors: [
      { hex: "#6366f1", name: "Violeta" },
      { hex: "#8b5cf6", name: "Lila" },
      { hex: "#06b6d4", name: "Celeste" },
      { hex: "#10b981", name: "Esmeralda" },
      { hex: "#f59e0b", name: "Dorado" },
      { hex: "#64748b", name: "Gris" },
    ],
  },
]

export default function DesignPanel() {
  const { config, resumeId, setColor, setFont, setFontSize, setSpacing, setPhoto } = useResumeStore()
  const colorInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !resumeId) return

    setUploadingPhoto(true)
    try {
      const form = new FormData()
      form.append("photo", file)
      const res = await fetch(`/api/resumes/${resumeId}/photo`, { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al subir la foto")
      setPhoto(data.photoUrl)
      toast.success("Foto actualizada")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir la foto")
    } finally {
      setUploadingPhoto(false)
      e.target.value = ""
    }
  }

  async function handlePhotoRemove() {
    if (!resumeId) return
    try {
      await fetch(`/api/resumes/${resumeId}/photo`, { method: "DELETE" })
      setPhoto(null)
      toast.success("Foto eliminada")
    } catch {
      toast.error("Error al eliminar la foto")
    }
  }

  return (
    <div className="divide-y divide-border">

      {/* ── Foto de perfil ─────────────────────────────────── */}
      <section className="px-5 py-5 space-y-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Foto de perfil
        </h3>
        <div className="flex items-center gap-4">
          <div
            className="shrink-0 rounded-full overflow-hidden border-2 border-border flex items-center justify-center bg-muted cursor-pointer hover:border-primary/50 transition-colors"
            style={{ width: 80, height: 80 }}
            onClick={() => photoInputRef.current?.click()}
          >
            {config.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.photoUrl} alt="" className="w-full h-full object-cover object-top" />
            ) : (
              <Camera className="h-8 w-8 text-muted-foreground/60" />
            )}
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2.5 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploadingPhoto ? "Subiendo..." : config.photoUrl ? "Cambiar foto" : "Subir foto"}
            </button>
            {config.photoUrl && (
              <button
                onClick={handlePhotoRemove}
                className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar foto
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/70">JPG, PNG o WebP · máx. 2 MB</p>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handlePhotoChange}
        />
      </section>

      {/* ── Color principal ────────────────────────────────── */}
      <section className="px-5 py-5 space-y-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Color principal
        </h3>

        <div className="space-y-4">
          {COLOR_PALETTES.map((palette) => (
            <div key={palette.label}>
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-2">
                {palette.label}
              </p>
              <div className="grid grid-cols-6 gap-2">
                {palette.colors.map(({ hex, name }) => (
                  <button
                    key={hex}
                    title={name}
                    onClick={() => setColor(hex)}
                    className={cn(
                      "h-8 w-full rounded-lg border-2 transition-all hover:scale-105 hover:shadow-md",
                      config.colorScheme === hex
                        ? "border-foreground ring-2 ring-foreground/30 ring-offset-1 scale-105"
                        : "border-transparent hover:border-foreground/20"
                    )}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Custom color picker */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 cursor-pointer transition-colors"
          onClick={() => colorInputRef.current?.click()}
        >
          <div
            className="h-9 w-9 rounded-lg border border-border shrink-0 shadow-sm"
            style={{ backgroundColor: config.colorScheme }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">Color personalizado</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{config.colorScheme.toUpperCase()}</p>
          </div>
          <input
            ref={colorInputRef}
            type="color"
            value={config.colorScheme}
            onChange={(e) => setColor(e.target.value)}
            className="sr-only"
          />
          <span className="text-[10px] font-medium text-primary">Editar</span>
        </div>
      </section>

      {/* ── Tipografía ─────────────────────────────────────── */}
      <section className="px-5 py-5 space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Tipografía
        </h3>
        <Select value={config.fontFamily} onValueChange={(v) => { if (v) setFont(v) }}>
          <SelectTrigger className="h-10 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((font) => (
              <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* ── Tamaño y espaciado ─────────────────────────────── */}
      <section className="px-5 py-5 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Tamaño de letra
            </h3>
            <span className="text-xs font-semibold tabular-nums bg-muted px-2 py-0.5 rounded-md">
              {config.fontSize}px
            </span>
          </div>
          <Slider
            min={10}
            max={18}
            step={1}
            value={config.fontSize}
            onValueChange={(v) => setFontSize(Array.isArray(v) ? v[0] : v)}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/60 px-0.5">
            <span>10px</span>
            <span>18px</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Espaciado
            </h3>
            <span className="text-xs font-semibold tabular-nums bg-muted px-2 py-0.5 rounded-md">
              {config.spacing.toFixed(1)}×
            </span>
          </div>
          <Slider
            min={0.8}
            max={1.5}
            step={0.1}
            value={config.spacing}
            onValueChange={(v) => setSpacing(Array.isArray(v) ? v[0] : v)}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/60 px-0.5">
            <span>Compacto</span>
            <span>Espacioso</span>
          </div>
        </div>
      </section>

    </div>
  )
}
