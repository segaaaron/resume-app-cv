"use client"

/**
 * Diagonal watermark overlay for the live preview canvas.
 *
 * IMPORTANT — this component is rendered ONLY in the editor preview canvas
 * (see PreviewPanel.tsx). It is NOT included in `components/resume/ResumePreview`
 * because that subtree is consumed by:
 *  - the `resume-pages` print contract used by the PDF microservice
 *  - public CV pages
 * Free-plan users cannot reach the PDF endpoint (gated server-side), so the
 * exported PDF/Word artefacts never need this overlay.
 *
 * Pure overlay: `pointer-events-none` + `aria-hidden` so it never blocks form
 * interactions and never leaks to assistive tech.
 *
 * Dark templates: navy text `#1a2e4a @ 0.07` is invisible against dark
 * backgrounds (carbon, onyx, midnight…). When a known dark template is
 * active we flip the watermark to white @ 0.10 so it stays legible.
 */

import { useTranslations } from "next-intl"

/**
 * Known dark-background templates. Manual list (rather than reading
 * `colors.primary` from templates-seo.ts) because some "navy" templates
 * still have light canvases — dark === dark CANVAS, not dark accent.
 *
 * Keep alphabetical; add new dark templates here.
 */
const DARK_TEMPLATES = new Set<string>([
  "aurora",
  "blueprint",
  "carbon",
  "charcoalclassic",
  "cobalt",
  "cyber",
  "midnight",
  "navyexecutive",
  "noir",
  "onyx",
  "prism",
])

interface Props {
  isPro: boolean
  templateSlug?: string
}

export default function ResumePreviewWatermark({ isPro, templateSlug }: Props) {
  const t = useTranslations("freemium.editor")
  if (isPro) return null

  const isDark = templateSlug ? DARK_TEMPLATES.has(templateSlug) : false
  // White is more legible on dark surfaces; navy stays on light surfaces.
  const watermarkColor = isDark ? "#ffffff" : "#1a2e4a"
  const watermarkOpacity = isDark ? 0.1 : 0.07

  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden z-[5] flex items-center justify-center select-none print:hidden"
      title={t("watermarkAria")}
    >
      {/* Repeated diagonal band so a long CV stays watermarked while scrolling */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-around"
        style={{ transform: "rotate(-28deg) scale(1.3)" }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="whitespace-nowrap font-bold tracking-[0.35em] uppercase"
            style={{
              fontSize: "clamp(48px, 9vw, 110px)",
              color: watermarkColor,
              opacity: watermarkOpacity,
              lineHeight: 1,
              fontFamily:
                "var(--dash-serif, 'Playfair Display', Georgia, serif)",
            }}
          >
            Valhalla Resume · Preview
          </span>
        ))}
      </div>
    </div>
  )
}
