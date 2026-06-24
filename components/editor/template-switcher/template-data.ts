// Canonical list of Pro template IDs.
// Also imported by app/[locale]/templates/page.tsx — keep in sync.

export const PRO_IDS: string[] = [
  "aurora", "lumiere", "consul", "rose", "minimal", "banner", "vertex", "kyoto",
  "geneva", "windsor", "vienna", "berlin", "seoul", "copenhagen", "genevanoir", "reykjavik",
  "apex", "nova", "cascade", "onyx", "mosaic", "larsson", "thompson", "classicmono",
  "editorialserif", "boldblock", "timelinevertical", "swissgrid", "charcoalclassic", "navyexecutive", "coralsidebar", "sagebotanical",
  "datadriven", "legalbrief", "engraved", "academiccv", "psychologist", "hotelcv", "translatorcv", "risodesigner",
  "uxtokens", "blueprintcv", "salespitch", "neon", "sharp", "bauhaus", "cobalt", "duality",
  "havana", "helix", "lisbon", "nautical", "prism", "tokyo", "vitae", "elite-atlas",
  "exec-porcelain", "luxe-noir", "elite-counsel", "elite-aura", "elite-pulse", "elite-cuvee", "elite-cadence", "elite-meridian",
  "luxe-aurum", "luxe-vellum", "luxe-regent", "luxe-apex", "exec-regency", "exec-sovereign", "exec-citadel", "exec-dynasty",
  "exec-oxblood", "exec-cobalt", "exec-terra", "exec-nocturne", "exec-platine", "atelier", "bloom", "velvet",
  "sahara", "pearl", "editorial2", "confetti", "frame", "show-cameo", "show-marquis", "show-soiree",
  "show-plume", "chef", "teacher", "journalist", "communicator", "filmmaker", "photographer", "architect",
  "doctor", "fashion", "writer",
]

export type TemplateLayout = "single-column" | "sidebar-left" | "sidebar-right"

export function isProTemplate(id: string): boolean {
  return PRO_IDS.includes(id)
}
