"use client"

import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { FONT_OPTIONS } from "@/types/resume"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useRef, useState } from "react"
import { Camera, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

const COLOR_PALETTES: { labelKey: string; colors: { hex: string; nameKey: string }[] }[] = [
  {
    labelKey: "design.palette_professional",
    colors: [
      { hex: "#2a72d7", nameKey: "design.color_blue" },
      { hex: "#1e3a5f", nameKey: "design.color_navy" },
      { hex: "#0891b2", nameKey: "design.color_cyan" },
      { hex: "#0f766e", nameKey: "design.color_teal" },
      { hex: "#1d4ed8", nameKey: "design.color_indigo" },
      { hex: "#475569", nameKey: "design.color_slate" },
    ],
  },
  {
    labelKey: "design.palette_vibrant",
    colors: [
      { hex: "#9333ea", nameKey: "design.color_purple" },
      { hex: "#ec4899", nameKey: "design.color_pink" },
      { hex: "#dc2626", nameKey: "design.color_red" },
      { hex: "#ea580c", nameKey: "design.color_orange" },
      { hex: "#ca8a04", nameKey: "design.color_amber" },
      { hex: "#16a34a", nameKey: "design.color_green" },
    ],
  },
  {
    labelKey: "design.palette_dark",
    colors: [
      { hex: "#111827", nameKey: "design.color_black" },
      { hex: "#1d1d20", nameKey: "design.color_charcoal" },
      { hex: "#1e293b", nameKey: "design.color_slate_dark" },
      { hex: "#312e81", nameKey: "design.color_indigo_dark" },
      { hex: "#4a1942", nameKey: "design.color_plum" },
      { hex: "#292524", nameKey: "design.color_stone" },
    ],
  },
  {
    labelKey: "design.palette_soft",
    colors: [
      { hex: "#6366f1", nameKey: "design.color_violet" },
      { hex: "#8b5cf6", nameKey: "design.color_lilac" },
      { hex: "#06b6d4", nameKey: "design.color_sky" },
      { hex: "#10b981", nameKey: "design.color_emerald" },
      { hex: "#f59e0b", nameKey: "design.color_gold" },
      { hex: "#64748b", nameKey: "design.color_gray" },
    ],
  },
]

export default function DesignPanel() {
  const t = useTranslations("editor")
  const { config, resumeId, setColor, setFont, setFontSize, setSpacing, setPhoto, setPhotoPosition } = useResumeStore()
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
      if (!res.ok) throw new Error(data.error ?? t("photo_upload_error"))
      setPhoto(data.photoUrl)
      toast.success(t("photo_updated"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("photo_upload_error"))
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
      toast.success(t("photo_deleted"))
    } catch {
      toast.error(t("photo_delete_error"))
    }
  }

  return (
    <div className="divide-y divide-border">

      {/* ── Foto de perfil ─────────────────────────────────── */}
      <section className="px-5 py-5 space-y-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t("design.photo_section")}
        </h3>
        <div className="flex items-center gap-4">
          <div
            className="shrink-0 rounded-full overflow-hidden border-2 border-border flex items-center justify-center bg-muted cursor-pointer hover:border-primary/50 transition-colors"
            style={{ width: 80, height: 80 }}
            onClick={() => photoInputRef.current?.click()}
          >
            {config.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.photoUrl} alt="" className="w-full h-full object-cover" style={{ objectPosition: `center ${config.photoPosition ?? 15}%` }} />
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
              {uploadingPhoto ? t("design.uploading") : config.photoUrl ? t("design.change_photo") : t("design.upload_photo")}
            </button>
            {config.photoUrl && (
              <button
                onClick={handlePhotoRemove}
                className="flex items-center justify-center gap-2 text-xs font-medium px-3 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("design.remove_photo")}
              </button>
            )}
          </div>
        </div>
        {config.photoUrl && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t("design.photo_position")}
              </Label>
              <span className="text-[10px] font-semibold tabular-nums bg-muted px-2 py-0.5 rounded-md">
                {config.photoPosition ?? 15}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={config.photoPosition ?? 15}
              onValueChange={(v) => setPhotoPosition(Array.isArray(v) ? v[0] : v)}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/60 px-0.5">
              <span>{t("design.photo_top")}</span>
              <span>{t("design.photo_bottom")}</span>
            </div>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground/70">{t("design.photo_hint")}</p>
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
          {t("design.color_section")}
        </h3>

        <div className="space-y-4">
          {COLOR_PALETTES.map((palette) => (
            <div key={palette.labelKey}>
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-2">
                {t(palette.labelKey)}
              </p>
              <div className="grid grid-cols-6 gap-2">
                {palette.colors.map(({ hex, nameKey }) => (
                  <button
                    key={hex}
                    title={t(nameKey)}
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
            <p className="text-xs font-semibold">{t("design.custom_color")}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{config.colorScheme.toUpperCase()}</p>
          </div>
          <input
            ref={colorInputRef}
            type="color"
            value={config.colorScheme}
            onChange={(e) => setColor(e.target.value)}
            className="sr-only"
          />
          <span className="text-[10px] font-medium text-primary">{t("design.edit_color")}</span>
        </div>
      </section>

      {/* ── Tipografía ─────────────────────────────────────── */}
      <section className="px-5 py-5 space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t("design.typography_section")}
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
              {t("design.font_size_section")}
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
              {t("design.spacing_section")}
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
            <span>{t("spacing_compact")}</span>
            <span>{t("spacing_spacious")}</span>
          </div>
        </div>
      </section>

    </div>
  )
}
