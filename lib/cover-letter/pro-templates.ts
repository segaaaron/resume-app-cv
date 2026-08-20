// Which cover-letter templates are premium — the SINGLE source for that question.
//
// WHY IT EXISTS: the answer used to live only inside `CoverLetterEditor.tsx`, as a
// `pro: true` flag the picker read to draw a padlock. Nothing on the server ever looked
// at it, and the picker asked `isPro` — which is `isActive`, "does this user have paid
// access" — instead of "does this user's plan include premium templates". BASIC has an
// active window and no premium templates (`canUsePremiumTemplates` says so), so every
// premium letter template was unlocked in the UI for a $2.99 one-time buyer and the PDF
// route handed it over without a word. The résumé side closed exactly this gap with
// `PRO_IDS` + `canUsePremiumTemplates`; letters never did.
//
// The parity test (`__tests__/lib/cover-letter-pro-parity.test.ts`) reads the editor's
// own list and fails if the two ever drift, so adding a template in one place and
// forgetting the other cannot silently make it free.

/** Every premium cover-letter template id. `elegant` is the only free one. */
export const LTR_PRO_IDS: readonly string[] = [
  "architect", "atlas", "aurum", "bloom", "consul", "diagonal",
  "echo", "ember", "executive", "folio", "fortis", "gazette", "gradient",
  "herald", "lumen", "material", "meridian", "minimal", "monogram", "mosaic",
  "newspaper", "nova", "obsidian", "onyx", "prism", "sidebar", "signal", "split",
  "sterling", "terra", "timeline", "twotone", "vantage", "velvet", "verso", "vertex",
  "ltrmeridian", "ltrverdant", "ltrcardinal", "ltrcobalt", "ltrslate", "ltrnordic",
  "ltronyx", "ltrsable", "ltrcerulean", "ltrivory", "ltrgarnet", "ltrcopper",
  "ltrharbor", "ltrgraphite", "ltrsequoia",
] as const

export function isProCoverLetterTemplate(templateId?: string | null): boolean {
  return !!templateId && LTR_PRO_IDS.includes(templateId)
}
