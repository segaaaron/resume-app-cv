// On-demand template thumbnail generator — the REAL template.
//
// The screenshot microservice captures /templates/design/[id]/thumb-print (the
// genuine template rendered with mock data); we return the WebP with a 1-year
// immutable cache header so the browser + any CDN cache it forever (the user's
// "cache once loaded"), plus an in-memory LRU so a warm server never re-shoots.
// This replaced a sharp rasterisation of hand-drawn *Thumb SVGs, which never
// matched the real design.
//
// If the screenshot service is unavailable we return 503 so the card falls back
// to a live in-process render (MockTemplatePreview) — still the real template.

import { NextRequest } from "next/server"
import { checkAndIncrementRateLimit } from "@/lib/rate-limit"
import { createLogger } from "@/lib/logger"
import { callScreenshotService } from "@/lib/pdf/pdf-service-client"
import { TEMPLATES } from "@/types/resume"

const logger = createLogger("thumbnails")

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// In-memory WebP cache — key: templateId. Templates are static (mock data), so
// no per-user/per-color variance to key on.
const thumbCache = new Map<string, Buffer>()
const CACHE_MAX = 500

// In-flight dedup — many cards hit the same cold id concurrently; they await the
// single screenshot instead of each firing their own.
const inFlight = new Map<string, Promise<Buffer>>()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // Rate limit: 120 thumbnail requests per minute per IP.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown"
  const ipHash = Buffer.from(ip).toString("base64").slice(0, 16)
  const allowed = await checkAndIncrementRateLimit(ipHash, "thumbnail", 120, 60_000)
  if (!allowed) return new Response("Rate limit exceeded", { status: 429 })

  if (!TEMPLATES.some((t) => t.id === id)) {
    return new Response("Not found", { status: 404 })
  }

  // LRU: on hit, bump to most-recently-used.
  let webpBuffer = thumbCache.get(id)
  if (webpBuffer) {
    thumbCache.delete(id)
    thumbCache.set(id, webpBuffer)
  } else {
    const existing = inFlight.get(id)
    if (existing) {
      try {
        webpBuffer = await existing
      } catch {
        return new Response("Screenshot unavailable", { status: 503 })
      }
    } else {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      const printUrl = `${appUrl}/en/templates/design/${id}/thumb-print`
      const p = callScreenshotService(printUrl, "")
      inFlight.set(id, p)
      try {
        webpBuffer = await p
        if (thumbCache.size >= CACHE_MAX) {
          const oldest = thumbCache.keys().next().value
          if (oldest !== undefined) thumbCache.delete(oldest)
        }
        thumbCache.set(id, webpBuffer)
      } catch (err) {
        logger.warn("thumbnails.screenshot_failed", { id, error: err instanceof Error ? err.message : String(err) })
        // Client falls back to a live real-template render.
        return new Response("Screenshot unavailable", { status: 503 })
      } finally {
        inFlight.delete(id)
      }
    }
  }

  return new Response(new Uint8Array(webpBuffer), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
