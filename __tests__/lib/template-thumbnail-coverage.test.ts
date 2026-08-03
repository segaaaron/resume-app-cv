import { describe, it, expect } from "vitest"
import { TEMPLATES } from "@/types/resume"
import { hasStaticThumbnail, STATIC_THUMBNAIL_IDS } from "@/lib/resume/static-thumbnails"

// ROOT GUARD against the exact drift that shipped 15 ATS templates with no static
// thumbnail: the catalog grew, nobody re-ran the generator, and those cards fell to
// a slow live render in the gallery. The static-thumbnail manifest is hand-generated
// (scripts/generate-template-thumbnails.ts), so it can silently fall behind TEMPLATES.
// This test makes that impossible: EVERY template must have a pre-generated thumbnail.
//
// If this fails after adding a template, run:
//   PDF_SERVICE_URL=... PDF_SERVICE_SECRET=... NEXT_PUBLIC_APP_URL=https://www.valhallaresume.com \
//     npx tsx scripts/generate-template-thumbnails.ts
// then commit the new public/thumbnails/<id>.webp and the updated manifest.
describe("static thumbnail coverage — every template must have one", () => {
  it("no template is missing a pre-generated static thumbnail", () => {
    const missing = TEMPLATES.filter((t) => !hasStaticThumbnail(t.id)).map((t) => t.id)
    expect(missing, `Templates without a static thumbnail (run the generator): ${missing.join(", ")}`).toEqual([])
  })

  it("the manifest has no stale ids for templates that no longer exist", () => {
    const live = new Set<string>(TEMPLATES.map((t) => t.id))
    const stale = [...STATIC_THUMBNAIL_IDS].filter((id) => !live.has(id))
    expect(stale, `Manifest lists thumbnails for removed templates: ${stale.join(", ")}`).toEqual([])
  })
})
