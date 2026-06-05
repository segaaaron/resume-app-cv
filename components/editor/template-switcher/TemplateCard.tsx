"use client"

import { memo, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Lock, Check } from "lucide-react"
import { TEMPLATES, TemplateId } from "@/types/resume"

const ResumeThumbnail = dynamic(
  () => import("./thumbnails").then((m) => ({ default: m.ResumeThumbnail })),
  { ssr: false, loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg" /> }
)

interface TemplateCardProps {
  template: (typeof TEMPLATES)[number]
  locked: boolean
  isSelected: boolean
  colorScheme: string
  onSelect: (templateId: TemplateId, locked: boolean) => void
}

export const TemplateCard = memo(function TemplateCard({
  template,
  locked,
  isSelected,
  colorScheme,
  onSelect,
}: TemplateCardProps) {
  const [hover, setHover] = useState(false)
  const [visible, setVisible] = useState(false)
  // On-demand WebP fallback: the <img> hits /api/thumbnails/[id] which renders
  // the SVG component server-side, rasterises with sharp, and returns a WebP
  // cached for a year (browser + CDN). If the route 5xx's for any reason, we
  // fall back to the live in-process SVG <ResumeThumbnail>.
  const [imgFailed, setImgFailed] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const active = isSelected && !locked
  const interactive = !locked

  // Lazy-mount the heavy ResumeThumbnail only once the card scrolls near the viewport.
  // Once visible, we disconnect the observer so the thumbnail stays mounted (no flicker on re-scroll).
  useEffect(() => {
    if (visible) return
    const node = cardRef.current
    if (!node) return
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [visible])

  // Premium multi-layer shadow — soft ambient + subtle navy tint + cyan glow when active
  const baseShadow =
    "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(26,46,74,0.08), 0 12px 24px -8px rgba(26,46,74,0.12)"
  const hoverShadow =
    "0 1px 2px rgba(15,23,42,0.05), 0 6px 18px rgba(26,46,74,0.12), 0 18px 36px -10px rgba(0,212,255,0.18)"
  const activeShadow =
    "0 0 0 3px rgba(0,212,255,0.22), 0 6px 20px rgba(0,212,255,0.18), 0 16px 32px -10px rgba(26,46,74,0.18)"

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id, locked)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className="flex flex-col items-center gap-2 w-full group pt-4"
      style={{ cursor: locked ? "not-allowed" : "pointer" }}
    >
      {/* Card frame */}
      <div
        ref={cardRef}
        style={{
          width: "100%",
          aspectRatio: "210/297",
          borderRadius: 14,
          overflow: "hidden",
          position: "relative",
          // Subtle frame gradient — softer than the old flat #b0c4de
          background: active
            ? "linear-gradient(145deg, rgba(0,212,255,0.10), rgba(0,212,255,0.04))"
            : "linear-gradient(145deg, #eef4fb, #dbe6f3)",
          border: active
            ? "1.5px solid #00D4FF"
            : hover && interactive
            ? "1.5px solid rgba(0,212,255,0.55)"
            : "1px solid #d8e3f0",
          boxShadow: active ? activeShadow : hover && interactive ? hoverShadow : baseShadow,
          // Minimal inner padding — let the document breathe inside the frame
          padding: 25,
          transition:
            "transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease, border-color 180ms ease, background 180ms ease",
          transform: hover && interactive && !active ? "translateY(-2px) scale(1.012)" : "translateY(0) scale(1)",
          opacity: locked ? 0.62 : 1,
          willChange: "transform, box-shadow",
        }}
      >
        {/* Selected check badge */}
        {active && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              zIndex: 10,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)",
              boxShadow: "0 2px 8px rgba(0,212,255,0.55), inset 0 1px 0 rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px solid #fff",
            }}
          >
            <Check style={{ width: 11, height: 11, color: "#fff", strokeWidth: 3 }} />
          </div>
        )}

        {/* Document surface — drop shadow to lift the SVG off the frame */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 8,
            overflow: "hidden",
            background: "#fff",
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.06), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 0.5px rgba(15,23,42,0.04) inset",
          }}
        >
          {visible ? (
            imgFailed ? (
              <ResumeThumbnail id={template.id} color={locked ? "#9ca3af" : colorScheme} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/thumbnails/${template.id}?color=${encodeURIComponent(locked ? "#9ca3af" : colorScheme)}`}
                alt=""
                className="w-full h-full object-cover object-top"
                onError={() => setImgFailed(true)}
                draggable={false}
              />
            )
          ) : (
            <div className="w-full h-full bg-slate-100 animate-pulse rounded-lg" />
          )}
        </div>

        {/* Locked overlay — premium frosted look */}
        {locked && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.55), rgba(219,230,243,0.6))",
              backdropFilter: "blur(1px)",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1a2e4a 0%, #2d4a6f 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(26,46,74,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                border: "1.5px solid rgba(0,212,255,0.4)",
              }}
            >
              <Lock style={{ width: 13, height: 13, color: "#00D4FF" }} />
            </div>
          </div>
        )}
      </div>

      {/* Label — refined typography */}
      <span
        style={{
          fontSize: 10.5,
          fontWeight: active ? 700 : 600,
          letterSpacing: active ? "0.02em" : "0.015em",
          color: active ? "#00A8CC" : locked ? "#9ca3af" : hover ? "#1a2e4a" : "#4A6A8A",
          transition: "color 160ms ease, font-weight 160ms ease, letter-spacing 160ms ease",
          maxWidth: "100%",
          textAlign: "center",
          lineHeight: 1.25,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textTransform: "none",
        }}
      >
        {template.name}
      </span>
    </button>
  )
})
