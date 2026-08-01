// lib/resume/template-accent.ts
//
// Premium design templates each ship with their OWN signature colour (Cardinal
// burgundy, Meridian teal, Aurum gold, …). The resume store, however, seeds
// `config.colorScheme` with a single default blue for the app's generic
// user-coloured templates. That seed was silently overriding every premium
// template's signature — collapsing 60+ distinct palettes into one colour.
//
// `designAccent` fixes that: the template's signature shows by default, and the
// colour picker stays live — any colour the user actually chooses (anything ≠
// the seed) overrides the signature. Only the untouched seed is treated as
// "unset" so the design's intended colour renders out of the box.
//
// Keep SEED_COLOR in sync with `defaultConfig.colorScheme` in stores/resumeStore.

export const SEED_COLOR = "#2a72d7"

export function designAccent(userColor: string | undefined | null, signature: string): string {
  if (!userColor) return signature
  return userColor.toLowerCase() === SEED_COLOR ? signature : userColor
}
