import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

const NAVY = "#1a2e4a"
const NAVY_DEEP = "#0f1a2e"
const CYAN = "#00D4FF"
const TEXT_LIGHT = "#ffffff"
const TEXT_MUTED = "#94a3b8"

type OgType = "landing" | "blog" | "template" | "tool"

const TYPE_LABELS: Record<OgType, { es: string; en: string }> = {
  landing:  { es: "Valhalla Resume",  en: "Valhalla Resume"  },
  blog:     { es: "Artículo",  en: "Article"   },
  template: { es: "Plantilla", en: "Template"  },
  tool:     { es: "Herramienta", en: "Tool"    },
}

function clamp(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 1).trimEnd() + "…"
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const rawTitle = searchParams.get("title")?.trim() ?? ""
    const rawDescription = searchParams.get("description")?.trim() ?? ""
    const locale = (searchParams.get("locale") === "en" ? "en" : "es") as "es" | "en"
    const typeParam = (searchParams.get("type") ?? "landing") as OgType
    const type: OgType = (["landing", "blog", "template", "tool"] as OgType[]).includes(typeParam)
      ? typeParam
      : "landing"

    const fallbackTitle =
      locale === "en"
        ? "Valhalla Resume — AI Resume Builder"
        : "Valhalla Resume — Constructor de CV con IA"
    const fallbackDescription =
      locale === "en"
        ? "ATS-optimized resumes. 132 premium templates."
        : "CVs optimizados para ATS. 132 plantillas premium."

    const title = clamp(rawTitle || fallbackTitle, 90)
    const description = clamp(rawDescription || fallbackDescription, 140)
    const badgeLabel = TYPE_LABELS[type][locale]

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
            backgroundImage: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
            position: "relative",
            fontFamily: "sans-serif",
          }}
        >
          {/* Cyan accent line - left edge */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 10,
              backgroundImage: `linear-gradient(180deg, ${CYAN} 0%, rgba(0,212,255,0.35) 100%)`,
            }}
          />

          {/* Subtle radial highlight */}
          <div
            style={{
              position: "absolute",
              top: -200,
              right: -200,
              width: 700,
              height: 700,
              borderRadius: "50%",
              backgroundImage: `radial-gradient(circle, rgba(0,212,255,0.15) 0%, rgba(0,212,255,0) 70%)`,
            }}
          />

          {/* Header: Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                backgroundImage: `linear-gradient(135deg, ${CYAN} 0%, #0096b8 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: NAVY,
                fontSize: 30,
                fontWeight: 900,
                boxShadow: "0 8px 24px rgba(0,212,255,0.35)",
              }}
            >
              R
            </div>
            <div
              style={{
                color: TEXT_LIGHT,
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                display: "flex",
              }}
            >
              Valhalla Resume
            </div>
          </div>

          {/* Body: Title + Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 980 }}>
            <div
              style={{
                color: TEXT_LIGHT,
                fontSize: 68,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                display: "flex",
              }}
            >
              {title}
            </div>
            {description && (
              <div
                style={{
                  color: TEXT_MUTED,
                  fontSize: 30,
                  fontWeight: 400,
                  lineHeight: 1.35,
                  display: "flex",
                }}
              >
                {description}
              </div>
            )}
          </div>

          {/* Footer: Badge + URL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div
              style={{
                color: TEXT_MUTED,
                fontSize: 22,
                fontWeight: 500,
                display: "flex",
              }}
            >
              valhallaresume.com
            </div>
            <div
              style={{
                backgroundColor: CYAN,
                color: NAVY,
                padding: "12px 24px",
                borderRadius: 999,
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                display: "flex",
                boxShadow: "0 8px 24px rgba(0,212,255,0.35)",
              }}
            >
              {badgeLabel}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, immutable, no-transform, max-age=31536000",
        },
      },
    )
  } catch (err) {
    console.error("[og] generation failed:", err)
    return new Response("Failed to generate image", { status: 500 })
  }
}
