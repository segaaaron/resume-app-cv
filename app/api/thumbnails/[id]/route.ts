// On-demand thumbnail generator.
// Renders the matching SVG thumbnail React component to a static string with
// react-dom/server, rasterises it with sharp to WebP, and returns the bytes
// with a 1-year immutable cache header. First request per (id, color) pair
// generates the image (~50-150ms server-side); the browser + any CDN in front
// cache it forever.
//
// Why direct imports instead of next/dynamic: this runs on Node at request
// time — we have no React lifecycle, no Suspense, no hydration. We just need
// the function component reference to call renderToStaticMarkup. Dynamic
// imports would force async wiring for no benefit and break tree-shaking.

import { NextRequest } from "next/server"
import { renderToStaticMarkup } from "react-dom/server"
import sharp from "sharp"
import React from "react"
import { checkAndIncrementRateLimit } from "@/lib/rate-limit"

import {
  ClassicThumb, ModernThumb, SidebarResumeThumb, ElegantResumeThumb,
  ProfessionalThumb, ExecutiveResumeThumb, MinimalResumeThumb,
  ChronoThumb, CarbonThumb, VerticalThumb, HorizontalThumb, GlassThumb,
  NeonThumb, BauhausThumb, OutlineThumb, StripeThumb, NordicThumb,
} from "@/components/editor/template-switcher/thumbnails-free"
import {
  AuroraThumb, LumiereThumb, ConsulThumb, RoseThumb,
  BannerThumb, VertexThumb,
} from "@/components/editor/template-switcher/thumbnails-pro-a"
import {
  OsloThumb, KyotoThumb, GenevaThumb, WindsorThumb, MilanThumb,
  ZurichThumb, PortoThumb, BarcelonaThumb, ViennaThumb, BerlinThumb,
  StockholmThumb, DublinThumb, HelsinkiThumb, LagosThumb, SeoulThumb,
  CopenhagenThumb, GenevanoirThumb, ReykjavikThumb,
} from "@/components/editor/template-switcher/thumbnails-pro-b"
import ProC1Thumb from "@/components/editor/template-switcher/thumbnails-pro-c1"
import ProC2Thumb from "@/components/editor/template-switcher/thumbnails-pro-c2"
import ProC3Thumb from "@/components/editor/template-switcher/thumbnails-pro-c3"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// In-memory WebP cache — key: `${id}:${normalizedColor}`, value: rendered buffer
// Max ~500 entries × ~12KB avg = ~6MB RAM ceiling
const thumbCache = new Map<string, Buffer>()
const CACHE_MAX = 500

// IDs handled by each split Pro-C dispatcher. Kept in sync with the switch in
// components/editor/template-switcher/thumbnails.tsx.
const PRO_C1_IDS = new Set<string>([
  "classicmono", "editorialserif", "boldblock", "timelinevertical", "swissgrid",
  "apex", "nova", "cascade", "onyx", "mosaic", "thompson", "larsson",
  "charcoalclassic", "navyexecutive", "coralsidebar", "sagebotanical",
  "iosappcv", "datadriven", "magazinespread", "civileng", "processflow",
  "frontpage", "vinylcv", "callsheet", "copywritermag", "animatorcv",
  "chefmenu", "sommelier", "hotelcv", "bartendercv", "legalbrief", "engraved",
  "chalkboard", "academiccv", "psychologist", "pilotlog", "onboardingform",
  "athletecard", "translatorcv", "herbariumcv", "risodesigner", "uxtokens",
  "blueprintcv", "annualreport", "financeterminal", "campaignposter",
  "salespitch", "ledgercv",
])

const PRO_C2_IDS = new Set<string>([
  "cobalt", "duality", "havana", "helix", "lisbon", "nautical", "prism",
  "tokyo", "vitae", "medicalchart", "vitalsigns", "vetcv", "ats", "casual",
  "circular", "coral", "fold", "luxurious", "metro", "riviera", "sharp",
  "spark", "vogue",
])

const PRO_C3_IDS = new Set<string>([
  "elite-atlas", "exec-porcelain", "luxe-noir", "elite-counsel", "elite-aura",
  "elite-pulse", "elite-cuvee", "elite-cadence", "elite-meridian", "luxe-aurum",
  "luxe-vellum", "luxe-regent", "luxe-apex", "exec-regency", "exec-sovereign",
  "exec-citadel", "exec-dynasty", "exec-oxblood", "exec-cobalt", "exec-terra",
  "exec-nocturne", "exec-platine", "atelier", "bloom", "velvet", "sahara",
  "pearl", "editorial2", "confetti", "frame", "show-cameo", "show-marquis",
  "show-soiree", "show-plume", "chef", "teacher", "journalist", "communicator",
  "filmmaker", "photographer", "architect", "doctor", "fashion", "writer",
])

function getThumbnailElement(id: string, color: string): React.ReactElement | null {
  switch (id) {
    // ── Free ────────────────────────────────────────────────────────────
    case "classic":      return React.createElement(ClassicThumb, { color })
    case "modern":       return React.createElement(ModernThumb, { color })
    case "sidebar":      return React.createElement(SidebarResumeThumb, { color })
    case "elegant":      return React.createElement(ElegantResumeThumb, { color })
    case "professional": return React.createElement(ProfessionalThumb, { color })
    case "executive":    return React.createElement(ExecutiveResumeThumb, { color })
    case "minimal":      return React.createElement(MinimalResumeThumb, { color })
    case "chrono":       return React.createElement(ChronoThumb, { color })
    case "carbon":       return React.createElement(CarbonThumb, { color })
    case "vertical":     return React.createElement(VerticalThumb, { color })
    case "horizontal":   return React.createElement(HorizontalThumb, { color })
    case "glass":        return React.createElement(GlassThumb, { color })
    case "neon":         return React.createElement(NeonThumb, { color })
    case "bauhaus":      return React.createElement(BauhausThumb, { color })
    case "outline":      return React.createElement(OutlineThumb, { color })
    case "stripe":       return React.createElement(StripeThumb, { color })
    case "nordic":       return React.createElement(NordicThumb, { color })

    // ── Pro-A ───────────────────────────────────────────────────────────
    case "aurora":       return React.createElement(AuroraThumb, { color })
    case "lumiere":      return React.createElement(LumiereThumb, { color })
    case "consul":       return React.createElement(ConsulThumb, { color })
    case "rose":         return React.createElement(RoseThumb, { color })
    case "banner":       return React.createElement(BannerThumb, { color })
    case "vertex":       return React.createElement(VertexThumb, { color })

    // ── Pro-B ───────────────────────────────────────────────────────────
    case "oslo":         return React.createElement(OsloThumb, { color })
    case "kyoto":        return React.createElement(KyotoThumb, { color })
    case "geneva":       return React.createElement(GenevaThumb, { color })
    case "windsor":      return React.createElement(WindsorThumb, { color })
    case "milan":        return React.createElement(MilanThumb, { color })
    case "zurich":       return React.createElement(ZurichThumb, { color })
    case "porto":        return React.createElement(PortoThumb, { color })
    case "barcelona":    return React.createElement(BarcelonaThumb, { color })
    case "vienna":       return React.createElement(ViennaThumb, { color })
    case "berlin":       return React.createElement(BerlinThumb, { color })
    case "stockholm":    return React.createElement(StockholmThumb, { color })
    case "dublin":       return React.createElement(DublinThumb, { color })
    case "helsinki":     return React.createElement(HelsinkiThumb, { color })
    case "lagos":        return React.createElement(LagosThumb, { color })
    case "seoul":        return React.createElement(SeoulThumb, { color })
    case "copenhagen":   return React.createElement(CopenhagenThumb, { color })
    case "genevanoir":   return React.createElement(GenevanoirThumb, { color })
    case "reykjavik":    return React.createElement(ReykjavikThumb, { color })
  }

  // ── Pro-C groups via default-export dispatcher ─────────────────────────
  if (PRO_C1_IDS.has(id)) return React.createElement(ProC1Thumb, { id, color })
  if (PRO_C2_IDS.has(id)) return React.createElement(ProC2Thumb, { id, color })
  if (PRO_C3_IDS.has(id)) return React.createElement(ProC3Thumb, { id, color })

  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Rate limit: 120 thumbnail requests per minute per IP (generous for normal use, blocks abuse)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown"
  const ipHash = Buffer.from(ip).toString("base64").slice(0, 16)
  const allowed = await checkAndIncrementRateLimit(ipHash, "thumbnail", 120, 60_000)
  if (!allowed) {
    return new Response("Rate limit exceeded", { status: 429 })
  }

  const url = new URL(request.url)
  // Default to brand navy; clients pass the user-selected scheme so locked
  // cards can render in grey (#9ca3af) without ever hitting the SVG fallback.
  const rawColor = url.searchParams.get("color") ?? "#1a2e4a"
  const color = rawColor.toLowerCase().trim()
  // Reject anything that isn't a valid 6-digit hex color
  if (!/^#[0-9a-f]{6}$/.test(color)) {
    return new Response("Invalid color", { status: 400 })
  }
  const cacheKey = `${id}:${color}`

  // Check cache first
  let webpBuffer = thumbCache.get(cacheKey)
  if (!webpBuffer) {
    const element = getThumbnailElement(id, color)
    if (!element) {
      return new Response("Not found", { status: 404 })
    }

    try {
      // Thumbs render into a viewBox of 80x110 so the markup is already sized.
      // We scale to 220x311 (≈ A4 aspect 210/297) for retina-quality card art.
      const svgString = renderToStaticMarkup(element)
      webpBuffer = await sharp(Buffer.from(svgString))
        .resize(220, 311, { fit: "fill" })
        .webp({ quality: 85 })
        .toBuffer()
      // Evict oldest entry if at capacity
      if (thumbCache.size >= CACHE_MAX) {
        thumbCache.delete(thumbCache.keys().next().value!)
      }
      thumbCache.set(cacheKey, webpBuffer)
    } catch (err) {
      console.error("[thumbnail] render failed", { id, error: err })
      return new Response("Render failed", { status: 500 })
    }
  }

  return new Response(new Uint8Array(webpBuffer), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
