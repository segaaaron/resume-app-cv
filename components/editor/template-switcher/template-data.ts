// Canonical list of Pro template IDs.
// Also imported by app/[locale]/templates/page.tsx — keep in sync.

export const PRO_IDS: string[] = [
  "aurora", "lumiere", "consul", "rose", "minimal", "banner", "vertex", "kyoto",
  "geneva", "windsor", "vienna", "berlin", "seoul", "copenhagen", "genevanoir", "reykjavik",
  "apex", "nova", "cascade", "onyx", "mosaic", "larsson", "thompson", "classicmono",
  "editorialserif", "boldblock", "timelinevertical", "swissgrid", "charcoalclassic", "navyexecutive", "coralsidebar", "sagebotanical",
  "uxtokens", "blueprintcv", "salespitch", "neon", "sharp", "bauhaus", "cobalt", "duality",
  "havana", "helix", "lisbon", "nautical", "prism", "tokyo", "vitae", "elite-atlas",
  "exec-porcelain", "luxe-noir", "elite-counsel", "elite-aura", "elite-pulse", "elite-cuvee", "elite-cadence", "elite-meridian",
  "sahara", "pearl", "editorial2", "confetti", "frame", "show-cameo", "show-marquis", "show-soiree",
  "show-plume", "chef", "teacher", "journalist", "communicator", "filmmaker", "photographer", "architect",
  "doctor", "fashion", "writer",
  // ATS premium set — 15 ATS-safe layouts (single column, colour-adjustable). PRO.
  "atsmeridian", "atsverdant", "atscardinal", "atscobalt", "atsslate", "atsnordic",
  "atsharbor", "atsgraphite", "atssequoia",
]

export function isProTemplate(id: string): boolean {
  return PRO_IDS.includes(id)
}
