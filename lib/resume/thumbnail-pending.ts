// Templates whose design changed AFTER the last screenshot run.
//
// The static WebPs in `public/thumbnails/` are photographs taken on a date. When a
// template is redesigned, its photograph becomes a lie: these sixteen were re-grounded
// from a dark canvas to white, and their thumbnails still showed a black CV — the user
// picked the black one and got a white one.
//
// Listing an id here makes `hasStaticThumbnail` answer false, so `TemplateCard` skips
// straight to its live in-process render: the REAL component, with the REAL design,
// impossible to be stale. It costs a heavier card and buys a gallery that does not lie.
//
// HOW THIS LIST EMPTIES: run the generator against a URL the screenshot microservice can
// reach (it cannot reach a laptop, which is why this list exists at all):
//
//   PDF_SERVICE_URL=… PDF_SERVICE_SECRET=… NEXT_PUBLIC_APP_URL=https://www.valhallaresume.com \
//     npx tsx scripts/generate-template-thumbnails.ts
//
// The stale files were deleted, so a plain run regenerates exactly these — no --force
// needed. Once they are back on disk, delete the ids from this array.

export const THUMBNAIL_PENDING_REGENERATION: readonly string[] = [
  "exec-citadel",
  "exec-dynasty",
  "exec-platine",
  "exec-regency",
  "luxe-apex",
  "luxe-noir",
  "elite-cuvee",
  "elite-cadence",
  "elite-counsel",
  "filmmaker",
  "uxtokens",
  "onyx",
  "blueprintcv",
  "carbon",
  "luxurious",
  "show-soiree",
  // Estas dos no cambiaron de color: cambiaron de CONTENIDO. Legal Brief no dibujaba
  // habilidades y ahora sí; ATS Cerulean imprimía solo cuatro y ahora las imprime todas.
  // Su foto vieja muestra un CV al que le faltan las skills — la misma clase de mentira.
  "legalbrief",
  "atscerulean",
] as const

export function isThumbnailPending(id: string): boolean {
  return THUMBNAIL_PENDING_REGENERATION.includes(id)
}
