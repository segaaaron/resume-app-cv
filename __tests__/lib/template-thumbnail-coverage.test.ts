import { describe, it, expect } from "vitest"
import { existsSync } from "fs"
import { join } from "path"
import { TEMPLATES } from "@/types/resume"
import { hasStaticThumbnail, STATIC_THUMBNAIL_IDS } from "@/lib/resume/static-thumbnails"
import { THUMBNAIL_PENDING_REGENERATION, isThumbnailPending } from "@/lib/resume/thumbnail-pending"

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
    // A redesigned template is EXEMPT while its photograph is stale: it renders live,
    // which is slower but always the real design. The exemption is explicit and listed,
    // never inferred — see the next two tests, which stop the list becoming a dumping
    // ground for "we never got round to it".
    const missing = TEMPLATES
      .filter((t) => !hasStaticThumbnail(t.id) && !isThumbnailPending(t.id))
      .map((t) => t.id)
    expect(missing, `Templates without a static thumbnail (run the generator): ${missing.join(", ")}`).toEqual([])
  })

  it("every pending id is a real template — the list cannot rot", () => {
    const live = new Set<string>(TEMPLATES.map((t) => t.id))
    const ghosts = THUMBNAIL_PENDING_REGENERATION.filter((id) => !live.has(id))
    expect(ghosts, `Pending regeneration lists templates that no longer exist: ${ghosts.join(", ")}`).toEqual([])
  })

  it("a pending id must NOT have a file on disk — otherwise it is just being ignored", () => {
    // If the WebP is back, the design was re-shot and the id has to leave the list.
    // Without this, a stale exemption would keep live-rendering a template that already
    // has a correct thumbnail, and nobody would notice.
    const dir = join(process.cwd(), "public", "thumbnails")
    const stillListed = THUMBNAIL_PENDING_REGENERATION.filter((id) => existsSync(join(dir, `${id}.webp`)))
    expect(stillListed, `These were regenerated — remove them from THUMBNAIL_PENDING_REGENERATION: ${stillListed.join(", ")}`).toEqual([])
  })

  it("the manifest has no stale ids for templates that no longer exist", () => {
    const live = new Set<string>(TEMPLATES.map((t) => t.id))
    const stale = [...STATIC_THUMBNAIL_IDS].filter((id) => !live.has(id))
    expect(stale, `Manifest lists thumbnails for removed templates: ${stale.join(", ")}`).toEqual([])
  })
})
