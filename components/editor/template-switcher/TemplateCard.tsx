"use client"

import { memo, useEffect, useRef, useState } from "react"
import { Lock, Check, ShieldCheck } from "lucide-react"
import { TEMPLATES, TemplateId } from "@/types/resume"
import { getTemplateAtsSafety } from "@/lib/ats/template-ats-safety"
import { hasStaticThumbnail } from "@/lib/resume/static-thumbnails"
// Real, scaled template render (same component the public gallery uses) so the
// card matches EXACTLY what the user gets on selection — not a hand-drawn *Thumb.
import MockTemplatePreview from "@/components/templates-detail/MockTemplatePreview"

interface TemplateCardProps {
  template: (typeof TEMPLATES)[number]
  locked: boolean
  isSelected: boolean
  colorScheme: string
  onSelect: (templateId: TemplateId, locked: boolean) => void
}

// The nearest scrollable ancestor, or null (= viewport) if there is none. The editor
// renders this grid inside an overflow-y-auto sidebar, so a viewport-rooted observer
// never fires for cards scrolled inside that panel — they stay blank. Rooting the
// observer on the real scroll parent makes lazy-mount work in the editor AND the
// public gallery (where the scroll parent IS the viewport).
function nearestScrollParent(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === "auto" || overflowY === "scroll") return node
    node = node.parentElement
  }
  return null
}

export const TemplateCard = memo(function TemplateCard({
  template,
  locked,
  isSelected,
  colorScheme: _colorScheme,
  onSelect,
}: TemplateCardProps) {
  const [hover, setHover] = useState(false)
  // A template with a pre-generated static WebP renders instantly: <img loading="lazy">
  // is already native-lazy and cheap, so there is nothing heavy to defer. Only the live
  // in-process render (MockTemplatePreview, the fallback used when no WebP exists) is
  // worth lazy-mounting behind the observer. Seeding `visible` from this also fixes the
  // editor blank-card bug — every card that already has a static thumb paints on mount
  // instead of waiting for an observer that (rooted on the viewport) never fired inside
  // the overflow-y-auto sidebar.
  const hasStatic = hasStaticThumbnail(template.id)
  const [visible, setVisible] = useState(hasStatic)
  // Thumbnail source ladder, fastest → most resilient:
  //   0 = pre-generated static WebP in /public (CDN, instant, zero runtime cost)
  //   1 = on-demand /api/thumbnails/[id] (only for templates not yet pre-generated)
  //   2 = live in-process render (MockTemplatePreview) — always the real template
  // Each <img> onError bumps the step, so a failed source degrades cleanly. We START
  // at the first step that CAN succeed. Probing a static file that was never generated
  // 404s once per template (~99 console errors + 99 wasted requests per visit), and
  // step 1 on a cold gallery is exactly the screenshot stampede the static files exist
  // to prevent (~27 concurrent shots → 503 → step 2 anyway). So with no manifest entry
  // we go straight to the live render: no network, no errors, always the real template.
  const [imgStep, setImgStep] = useState<0 | 1 | 2>(hasStatic ? 0 : 2)
  const cardRef = useRef<HTMLDivElement>(null)
  const active = isSelected && !locked
  const interactive = !locked
  // Single-column templates parse cleanly in every ATS → flag them so the user
  // knows at a glance which designs are ATS-safe.
  const atsSafe = getTemplateAtsSafety(template.id) === "safe"

  // Lazy-mount the heavy ResumeThumbnail only once the card scrolls near the viewport.
  // Once visible, we disconnect the observer so the thumbnail stays mounted (no flicker on re-scroll).
  useEffect(() => {
    if (visible) return
    const node = cardRef.current
    if (!node) return
    if (typeof IntersectionObserver === "undefined") {
      // Capability probe: without the observer there is no lazy path, so everything is
      // visible. Cannot be answered during render — the server has no window.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      { root: nearestScrollParent(node), rootMargin: "200px" }
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
          // Tight frame — the preview fills the card so the design is clearly
          // visible; a thin, even inset (not a big empty margin) keeps it elegant.
          padding: 6,
          transition:
            "transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 220ms ease, border-color 180ms ease, background 180ms ease",
          transform: hover && interactive && !active ? "translateY(-2px) scale(1.012)" : "translateY(0) scale(1)",
          opacity: locked ? 0.62 : 1,
          willChange: "transform, box-shadow",
        }}
      >
        {/* ATS-safe badge — top-left, so it never collides with the selected
            check (top-right). Only on single-column, clean-parse designs. */}
        {atsSafe && (
          <div
            title="Compatible con ATS"
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              gap: 3,
              padding: "2px 6px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #10B981 0%, #00A8CC 100%)",
              boxShadow: "0 2px 6px rgba(16,185,129,0.4)",
              color: "#fff",
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: "0.06em",
              lineHeight: 1,
            }}
          >
            <ShieldCheck style={{ width: 9, height: 9, strokeWidth: 2.5 }} />
            ATS
          </div>
        )}

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

        {/* Document surface — the REAL template, scaled, so the card matches the
            selection exactly (MockTemplatePreview self-lazies + self-scales). */}
        <div
          style={{
            position: "relative",
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
            imgStep === 2 ? (
              <MockTemplatePreview templateId={template.id} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={imgStep}
                src={imgStep === 0 ? `/thumbnails/${template.id}.webp` : `/api/thumbnails/${template.id}`}
                alt=""
                className="w-full h-full object-cover object-top"
                onError={() => setImgStep((s) => (s + 1) as 0 | 1 | 2)}
                draggable={false}
                loading="lazy"
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
