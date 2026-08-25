"use client"

import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { FONT_OPTIONS } from "@/types/resume"
import { useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { compressImage } from "@/lib/compressImage"

const COLOR_PALETTES: { labelKey: string; svgPath: string; colors: { hex: string; nameKey: string }[] }[] = [
  {
    labelKey: "design.palette_professional",
    svgPath: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM4 5h16a4 4 0 014 4v10a4 4 0 01-4 4H4a4 4 0 01-4-4V9a4 4 0 014-4z",
    colors: [
      { hex: "#0B5394", nameKey: "design.color_navy" },
      { hex: "#1E3A5F", nameKey: "design.color_slate" },
      { hex: "#2D3E50", nameKey: "design.color_charcoal" },
    ],
  },
  {
    labelKey: "design.palette_vibrant",
    svgPath: "M13 10V3L4 14h7v7l9-11h-7z",
    colors: [
      { hex: "#FF6B6B", nameKey: "design.color_red" },
      { hex: "#4ECDC4", nameKey: "design.color_teal" },
      { hex: "#FFD93D", nameKey: "design.color_gold" },
    ],
  },
  {
    labelKey: "design.palette_dark",
    svgPath: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    colors: [
      { hex: "#0D0D0D", nameKey: "design.color_black" },
      { hex: "#1a1a2e", nameKey: "design.color_indigo_dark" },
      { hex: "#2C3E50", nameKey: "design.color_charcoal" },
    ],
  },
  {
    labelKey: "design.palette_soft",
    svgPath: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z",
    colors: [
      { hex: "#D4A5A5", nameKey: "design.color_pink" },
      { hex: "#A8D8EA", nameKey: "design.color_sky" },
      { hex: "#C4B5FD", nameKey: "design.color_lilac" },
    ],
  },
]

/* ── tiny SVG icons ─────────────────────────────────────────── */
function IconCamera({ size = 18, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
function IconTrash({ size = 14, color = "#F87171" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}
function IconUser({ color = "#4A6FA5" }: { color?: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function IconPalette({ size = 13, color = "#00D4FF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5" fill={color} />
      <circle cx="17.5" cy="10.5" r=".5" fill={color} />
      <circle cx="8.5" cy="7.5" r=".5" fill={color} />
      <circle cx="6.5" cy="12.5" r=".5" fill={color} />
      <path d="M12 2C6.5 2 2 6.5 2 12a10 10 0 0010 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  )
}
function IconType({ size = 13, color = "#00D4FF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  )
}
function IconSpacing({ size = 13, color = "#00D4FF" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="21" y1="18" x2="3" y2="18" />
    </svg>
  )
}

/* slider track gradient helper */
function sliderStyle(value: number, min: number, max: number): React.CSSProperties {
  const pct = ((value - min) / (max - min)) * 100
  return {
    "--val": `${pct}%`,
  } as React.CSSProperties
}

export default function DesignPanel() {
  const t = useTranslations("editor")
  const { config, resumeId, setColor, setFont, setFontSize, setSpacing, setPhoto, setPhotoPosition } = useResumeStore(
    useShallow((s) => ({
      config: s.config,
      resumeId: s.resumeId,
      setColor: s.setColor,
      setFont: s.setFont,
      setFontSize: s.setFontSize,
      setSpacing: s.setSpacing,
      setPhoto: s.setPhoto,
      setPhotoPosition: s.setPhotoPosition,
    }))
  )
  const colorInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [removingPhoto, setRemovingPhoto] = useState(false)
  const [hexInput, setHexInput] = useState("")
  const [hexInvalid, setHexInvalid] = useState(false)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !resumeId) return
    setUploadingPhoto(true)
    try {
      let uploadTarget: Blob = file
      try {
        const compressed = await compressImage(file)
        const r = await fetch(compressed)
        uploadTarget = await r.blob()
      } catch { /* fallback to original */ }
      const form = new FormData()
      form.append("photo", uploadTarget, "photo.jpg")
      const res = await apiFetch(`/api/resumes/${resumeId}/photo`, { method: "POST", body: form })
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
    if (!resumeId || removingPhoto) return
    setRemovingPhoto(true)
    try {
      await apiFetch(`/api/resumes/${resumeId}/photo`, { method: "DELETE" })
      setPhoto(null)
      toast.success(t("photo_deleted"))
    } catch {
      toast.error(t("photo_delete_error"))
    } finally {
      setRemovingPhoto(false)
    }
  }

  const photoPos = config.photoPosition ?? 15

  return (
    <div className="flex flex-col gap-6 px-5 pt-2 pb-7">

      {/* ── Foto de Perfil ──────────────────────────────────────── */}
      <section>
        <div className="dp-section-label">
          <IconCamera size={13} color="#00D4FF" />
          {t("design.photo_section")}
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3.5">
          <div className="relative mx-auto">
            {/* Circle photo */}
            <div
              onClick={() => !uploadingPhoto && photoInputRef.current?.click()}
              className="dp-avatar w-[116px] h-[116px] rounded-full overflow-hidden cursor-pointer flex items-center justify-center relative"
              style={{
                background: "linear-gradient(135deg, #e8f0fe 0%, #dbeafe 100%)",
                boxShadow: "0 0 0 3px #00D4FF, 0 0 0 5px #fff, 0 8px 24px rgba(0,212,255,0.25)",
              }}
            >
              {config.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.photoUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `center ${photoPos}%` }}
                />
              ) : (
                <IconUser color="#7AAAD4" />
              )}
              {/* Hover overlay */}
              <div className="dp-avatar-overlay">
                {uploadingPhoto ? (
                  <div className="w-[22px] h-[22px] rounded-full border-[2.5px] border-white/30 border-t-[#00D4FF] animate-spin" />
                ) : (
                  <IconCamera size={24} color="#fff" />
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 items-center flex-wrap justify-center">
            <button
              className="dp-btn-primary"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              <IconCamera size={14} color="#fff" />
              {uploadingPhoto ? t("design.uploading") : config.photoUrl ? t("design.change_photo") : t("design.upload_photo")}
            </button>
            {config.photoUrl && (
              <button className="dp-btn-danger" onClick={handlePhotoRemove} disabled={removingPhoto}>
                <IconTrash size={14} color="#F87171" />
                {t("design.remove_photo")}
              </button>
            )}
          </div>

          {/* Photo position slider */}
          {config.photoUrl && (
            <div className="w-full mt-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-medium text-[#7AAAD4]">
                  {t("design.photo_top")} ↕ {t("design.photo_bottom")}
                </span>
                <span className="text-[11px] font-extrabold text-dash-cyan bg-[rgba(0,212,255,0.1)] px-2 py-0.5 rounded-full border border-[rgba(0,212,255,0.25)]">
                  {photoPos}%
                </span>
              </div>
              <input
                type="range"
                className="dp-slider"
                style={sliderStyle(photoPos, 0, 100)}
                min={0} max={100} step={5}
                value={photoPos}
                onChange={(e) => setPhotoPosition(Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhotoChange} />
      </section>

      <div className="h-px bg-gradient-to-r from-[rgba(0,212,255,0.15)] to-transparent" />

      {/* ── Color Principal ─────────────────────────────────────── */}
      <section>
        <div className="dp-section-label">
          <IconPalette size={13} color="#00D4FF" />
          {t("design.color_section")}
        </div>

        <div className="flex flex-col gap-3.5">
          {COLOR_PALETTES.map((palette) => (
            <div key={palette.labelKey}>
              <p className="text-[10px] font-bold text-[#5A7FA8] mb-2 tracking-[0.06em] uppercase">
                {t(palette.labelKey)}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {palette.colors.map(({ hex, nameKey }) => {
                  const active = config.colorScheme.toLowerCase() === hex.toLowerCase()
                  return (
                    <button
                      key={hex}
                      title={t(nameKey)}
                      onClick={() => setColor(hex)}
                      className={`dp-color-card${active ? " active" : ""}`}
                    >
                      {/* Color swatch — background and shadow depend on runtime hex value, keep inline */}
                      <div
                        className="w-9 h-9 rounded-[10px] mx-auto mb-1.5 transition-shadow duration-200"
                        style={{
                          background: hex,
                          boxShadow: active
                            ? `0 4px 14px ${hex}66, inset 0 1px 0 rgba(255,255,255,0.2)`
                            : `0 2px 8px ${hex}44`,
                        }}
                      />
                      <div className={`text-[9.5px] font-bold tracking-[0.04em] ${active ? "text-dash-cyan" : "text-[#6B8BAE]"}`}>
                        {t(nameKey)}
                      </div>
                      {active && (
                        <div className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-dash-cyan shadow-[0_0_6px_#00D4FF]" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Custom color */}
          <div className="px-4 py-3.5 rounded-[14px] bg-white/[0.03] border-[1.5px] border-[rgba(0,212,255,0.15)] backdrop-blur-sm">
            <p className="text-[10px] font-bold text-[#5A7FA8] mb-2.5 tracking-[0.06em] uppercase">
              {t("design.custom_color")}
            </p>
            <div className="flex gap-2.5 items-center">
              {/* Swatch — background and shadow depend on runtime colorScheme, keep inline */}
              <div
                onClick={() => colorInputRef.current?.click()}
                className="w-11 h-11 rounded-xl cursor-pointer shrink-0 border-2 border-white/15 transition-shadow duration-200"
                style={{
                  background: config.colorScheme,
                  boxShadow: `0 4px 14px ${config.colorScheme}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
              />
              <input
                ref={colorInputRef}
                type="color"
                value={config.colorScheme}
                onChange={(e) => setColor(e.target.value)}
                className="sr-only"
              />
              <input
                type="text"
                value={hexInput || config.colorScheme.toUpperCase()}
                onFocus={() => setHexInput(config.colorScheme.toUpperCase())}
                onChange={(e) => {
                  const v = e.target.value.trim()
                  setHexInput(v)
                  if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
                    setColor(v)
                    setHexInvalid(false)
                  } else {
                    setHexInvalid(v.length >= 4)
                  }
                }}
                onBlur={() => {
                  setHexInput("")
                  setHexInvalid(false)
                }}
                className={`flex-1 font-mono text-[13px] px-3.5 py-2.5 rounded-[10px] text-dash-navy bg-white outline-none tracking-[0.05em] transition-[border-color] duration-200 ${
                  hexInvalid ? "border-[1.5px] border-red-500/60" : "border-[1.5px] border-[rgba(0,212,255,0.2)]"
                }`}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-[rgba(0,212,255,0.15)] to-transparent" />

      {/* ── Tipografía ──────────────────────────────────────────── */}
      <section>
        <div className="dp-section-label">
          <IconType size={13} color="#00D4FF" />
          {t("design.typography_section")}
        </div>
        <div className="rounded-xl overflow-hidden border-[1.5px] border-[rgba(0,212,255,0.15)] bg-white">
          {/* fontFamily is runtime user state — keep inline */}
          <select
            value={config.fontFamily}
            onChange={(e) => { if (e.target.value) setFont(e.target.value) }}
            className="w-full px-4 py-3 text-[13.5px] text-[#0B1B3D] bg-transparent outline-none border-none cursor-pointer"
            style={{ fontFamily: config.fontFamily }}
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
            ))}
          </select>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-[rgba(0,212,255,0.15)] to-transparent" />

      {/* ── Espaciado + Tamaño ──────────────────────────────────── */}
      <section>
        <div className="dp-section-label">
          <IconSpacing size={13} color="#00D4FF" />
          {t("design.spacing_section")}
        </div>

        <div className="flex flex-col gap-5">
          {/* Spacing */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[11px] font-medium text-[#7AAAD4]">
                {t("spacing_compact")} ↔ {t("spacing_spacious")}
              </span>
              <span className="text-[11px] font-extrabold text-dash-cyan bg-[rgba(0,212,255,0.1)] px-2 py-0.5 rounded-full border border-[rgba(0,212,255,0.25)]">
                {config.spacing.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              className="dp-slider"
              style={sliderStyle(config.spacing, 0.8, 1.4)}
              min={0.8} max={1.4} step={0.1}
              value={config.spacing}
              onChange={(e) => setSpacing(Number(e.target.value))}
            />
          </div>

          {/* Font size */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[11px] font-medium text-[#7AAAD4]">10px ↔ 18px</span>
              <span className="text-[11px] font-extrabold text-dash-cyan bg-[rgba(0,212,255,0.1)] px-2 py-0.5 rounded-full border border-[rgba(0,212,255,0.25)]">
                {config.fontSize}px
              </span>
            </div>
            <input
              type="range"
              className="dp-slider"
              style={sliderStyle(config.fontSize, 10, 18)}
              min={10} max={18} step={1}
              value={config.fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </div>
        </div>
      </section>

    </div>
  )
}
