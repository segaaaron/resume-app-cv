/**
 * Pre-generate static WebP thumbnails for every template.
 *
 * WHY: template cards used to hit /api/thumbnails/[id] at runtime, which shoots a
 * live screenshot through the PDF microservice. Opening the Pro tab fired ~27
 * concurrent screenshots against a service that renders 6 at a time → queue
 * timeouts → 503 → the card fell back to a heavy in-browser live render (slow).
 *
 * This script shoots each template ONCE (bounded concurrency) and writes the WebP
 * to public/thumbnails/<id>.webp, so the card can serve a static, CDN-cacheable
 * file with zero runtime screenshot dependency.
 *
 * RUN once, and again whenever a template's design changes:
 *   PDF_SERVICE_URL=... PDF_SERVICE_SECRET=... NEXT_PUBLIC_APP_URL=https://readycvv.com \
 *     npx tsx scripts/generate-template-thumbnails.ts [--force]
 *
 * The APP_URL must be reachable by the PDF microservice (it fetches the print
 * page). --force re-shoots templates whose WebP already exists.
 */
import { promises as fs } from "fs"
import path from "path"
import { TEMPLATES } from "../types/resume"
import { callScreenshotService } from "../lib/pdf/pdf-service-client"

const OUT_DIR = path.join(process.cwd(), "public", "thumbnails")
const CONCURRENCY = 3 // well under the microservice's 6-page limit; leaves room for real PDF traffic
const FORCE = process.argv.includes("--force")

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

type Result = { id: string; status: "written" | "skipped" | "failed"; detail?: string }

async function shootOne(id: string): Promise<Result> {
  const outFile = path.join(OUT_DIR, `${id}.webp`)

  if (!FORCE) {
    try {
      await fs.access(outFile)
      return { id, status: "skipped" }
    } catch {
      // not present — generate it
    }
  }

  const printUrl = `${APP_URL}/en/templates/design/${id}/thumb-print`
  try {
    const webp = await callScreenshotService(printUrl, "")
    if (!webp || webp.length === 0) throw new Error("empty buffer")
    await fs.writeFile(outFile, webp)
    return { id, status: "written", detail: `${(webp.length / 1024).toFixed(1)} KB` }
  } catch (err) {
    return { id, status: "failed", detail: err instanceof Error ? err.message : String(err) }
  }
}

/** Run `tasks` with at most `limit` in flight at once. */
async function pooled<T>(items: T[], limit: number, fn: (item: T) => Promise<Result>): Promise<Result[]> {
  const results: Result[] = []
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++
      results[idx] = await fn(items[idx])
    }
  })
  await Promise.all(workers)
  return results
}

async function main(): Promise<void> {
  if (!process.env.PDF_SERVICE_URL || !process.env.PDF_SERVICE_SECRET) {
    console.error("✖ PDF_SERVICE_URL and PDF_SERVICE_SECRET must be set (point at the running PDF microservice).")
    process.exit(1)
  }

  await fs.mkdir(OUT_DIR, { recursive: true })

  const ids = TEMPLATES.map((t) => t.id)
  console.log(`▶ Generating thumbnails for ${ids.length} templates → ${OUT_DIR}`)
  console.log(`  APP_URL=${APP_URL} · concurrency=${CONCURRENCY} · force=${FORCE}\n`)

  const results = await pooled(ids, CONCURRENCY, shootOne)

  const written = results.filter((r) => r.status === "written")
  const skipped = results.filter((r) => r.status === "skipped")
  const failed = results.filter((r) => r.status === "failed")

  for (const r of results) {
    const icon = r.status === "written" ? "✓" : r.status === "skipped" ? "·" : "✖"
    console.log(`  ${icon} ${r.id.padEnd(22)} ${r.status}${r.detail ? ` — ${r.detail}` : ""}`)
  }

  console.log(`\n▶ Done: ${written.length} written · ${skipped.length} skipped · ${failed.length} failed`)
  if (failed.length > 0) {
    console.error(`✖ ${failed.length} template(s) failed — cards fall back to a live render for those. Re-run to retry.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("✖ Fatal:", err instanceof Error ? err.message : err)
  process.exit(1)
})
