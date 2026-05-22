"use client"

import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { FONT_OPTIONS } from "@/types/resume"
import { useRef, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { compressImage } from "@/lib/compressImage"

const COLOR_PALETTES: { labelKey: string; icon: string; colors: { hex: string; nameKey: string }[] }[] = [
  {
    labelKey: "design.palette_professional",
    icon: "🏢",
    colors: [
      { hex: "#0B5394", nameKey: "design.color_navy" },
      { hex: "#1E3A5F", nameKey: "design.color_slate" },
      { hex: "#2D3E50", nameKey: "design.color_charcoal" },
    ],
  },
  {
    labelKey: "design.palette_vibrant",
    icon: "⚡",
    colors: [
      { hex: "#FF6B6B", nameKey: "design.color_red" },
      { hex: "#4ECDC4", nameKey: "design.color_teal" },
      { hex: "#FFD93D", nameKey: "design.color_gold" },
    ],
  },
  {
    labelKey: "design.palette_dark",
    icon: "🌙",
    colors: [
      { hex: "#0D0D0D", nameKey: "design.color_black" },
      { hex: "#1a1a2e", nameKey: "design.color_indigo_dark" },
      { hex: "#2C3E50", nameKey: "design.color_charcoal" },
    ],
  },
  {
    labelKey: "design.palette_soft",
    icon: "🌸",
    colors: [
      { hex: "#D4A5A5", nameKey: "design.color_pink" },
      { hex: "#A8D8EA", nameKey: "design.color_sky" },
      { hex: "#C4B5FD", nameKey: "design.color_lilac" },
    ],
  },
]

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#6B8BAE",
  display: "block",
  marginBottom: 10,
}

const SECTION_DIVIDER: React.CSSProperties = {
  borderBottom: "1px solid #E2E8F0",
  paddingBottom: 20,
  marginBottom: 20,
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
      } catch {
        // fallback to original if compression fails
      }
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
    if (!resumeId) return
    try {
      await apiFetch(`/api/resumes/${resumeId}/photo`, { method: "DELETE" })
      setPhoto(null)
      toast.success(t("photo_deleted"))
    } catch {
      toast.error(t("photo_delete_error"))
    }
  }

  const photoPos = config.photoPosition ?? 15

  return (
    <div style={{ padding: "6px 24px 20px" }}>

      {/* ── Foto de Perfil ─────────────────────────────────── */}
      <section style={SECTION_DIVIDER}>
        <span style={LABEL_STYLE}>{t("design.photo_section")}</span>

        <div
          onClick={() => photoInputRef.current?.click()}
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "#E2E8F0",
            border: "2px solid #E2E8F0",
            margin: "0 auto 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            cursor: "pointer",
            overflow: "hidden",
          }}
        >
          {config.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.photoUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `center ${photoPos}%` }}
            />
          ) : (
            <span aria-hidden>👤</span>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            style={{
              padding: "8px 14px",
              background: "#00E5FF",
              color: "#FFF",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: uploadingPhoto ? "not-allowed" : "pointer",
              opacity: uploadingPhoto ? 0.6 : 1,
            }}
          >
            {uploadingPhoto ? t("design.uploading") : config.photoUrl ? t("design.change_photo") : t("design.upload_photo")}
          </button>
          {config.photoUrl && (
            <button
              onClick={handlePhotoRemove}
              style={{
                padding: "8px 14px",
                background: "#EF4444",
                color: "#FFF",
                border: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("design.remove_photo")}
            </button>
          )}
        </div>

        {config.photoUrl && (
          <div>
            <span style={LABEL_STYLE}>{t("design.photo_position")}</span>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>
                {t("design.photo_top")} ← → {t("design.photo_bottom")}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#00E5FF" }}>{photoPos}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={photoPos}
              onChange={(e) => setPhotoPosition(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        )}

        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handlePhotoChange}
        />
      </section>

      {/* ── Color principal ────────────────────────────────── */}
      <section style={SECTION_DIVIDER}>
        <span style={LABEL_STYLE}>{t("design.color_section")}</span>

        {COLOR_PALETTES.map((palette) => (
          <div key={palette.labelKey} style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#6B8BAE",
                marginBottom: 8,
              }}
            >
              {palette.icon} {t(palette.labelKey)}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {palette.colors.map(({ hex, nameKey }) => {
                const active = config.colorScheme.toLowerCase() === hex.toLowerCase()
                return (
                  <button
                    key={hex}
                    title={t(nameKey)}
                    onClick={() => setColor(hex)}
                    style={{
                      padding: 10,
                      background: "#F3F4F6",
                      border: active ? "2px solid #00E5FF" : "1px solid #E2E8F0",
                      borderRadius: 10,
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        margin: "0 auto 6px",
                        background: hex,
                      }}
                    />
                    <div style={{ fontSize: 10, fontWeight: 600 }}>{t(nameKey)}</div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Custom color editor */}
        <div
          style={{
            padding: 14,
            background: "#F9FAFB",
            borderRadius: 10,
            border: "1px solid #E2E8F0",
          }}
        >
          <span style={LABEL_STYLE}>🎨 {t("design.custom_color")}</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              ref={colorInputRef}
              type="color"
              value={config.colorScheme}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: 50,
                height: 40,
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                cursor: "pointer",
                padding: 0,
                background: "transparent",
              }}
            />
            <input
              type="text"
              value={config.colorScheme.toUpperCase()}
              onChange={(e) => {
                const v = e.target.value.trim()
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) setColor(v)
              }}
              style={{
                flex: 1,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 12,
                padding: "8px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                color: "#0B1B3D",
                background: "#FFFFFF",
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Tipografía ─────────────────────────────────────── */}
      <section style={SECTION_DIVIDER}>
        <span style={LABEL_STYLE}>{t("design.typography_section")}</span>
        <select
          value={config.fontFamily}
          onChange={(e) => { if (e.target.value) setFont(e.target.value) }}
          style={{
            padding: "10px 14px",
            border: "none",
            borderBottom: "2px solid #C8DCF0",
            fontSize: 13.5,
            color: "#0B1B3D",
            background: "transparent",
            width: "100%",
            outline: "none",
            fontFamily: config.fontFamily,
          }}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </section>

      {/* ── Espaciado ──────────────────────────────────────── */}
      <section>
        <span style={LABEL_STYLE}>{t("design.spacing_section")}</span>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>
            {t("spacing_compact")} ← → {t("spacing_spacious")}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#00E5FF" }}>
            {config.spacing.toFixed(1)}x
          </span>
        </div>
        <input
          type="range"
          min={0.8}
          max={1.4}
          step={0.1}
          value={config.spacing}
          onChange={(e) => setSpacing(Number(e.target.value))}
          style={{ width: "100%" }}
        />

        {/* Font size (preserved existing logic) */}
        <div style={{ marginTop: 20 }}>
          <span style={LABEL_STYLE}>{t("design.font_size_section")}</span>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>10px ← → 18px</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#00E5FF" }}>{config.fontSize}px</span>
          </div>
          <input
            type="range"
            min={10}
            max={18}
            step={1}
            value={config.fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>
      </section>

    </div>
  )
}
