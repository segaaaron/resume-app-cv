// Canonical list of Pro template IDs.
// Also imported by app/[locale]/templates/page.tsx — keep in sync.

export const PRO_IDS: string[] = [
  "aurora", "lumiere", "consul", "rose", "minimal", "wave", "banner", "vertex",
  "prestige", "kyoto", "geneva", "windsor", "vienna", "berlin", "seoul",
  "copenhagen", "genevanoir", "reykjavik", "apex", "nova", "cascade", "onyx",
  "mosaic", "larsson", "thompson", "classicmono", "editorialserif", "boldblock",
  "timelinevertical", "swissgrid", "charcoalclassic", "navyexecutive",
  "coralsidebar", "neobrutalist", "sagebotanical", "terminalcv", "iosappcv",
  "datadriven", "boardingpass", "magazinespread", "legalbrief", "engraved",
  "chalkboard", "academiccv", "psychologist", "chefmenu", "sommelier", "hotelcv",
  "bartendercv", "postcardcv", "frontpage", "vinylcv", "callsheet", "copywritermag",
  "animatorcv", "codeeditor", "civileng", "mechanical", "devopsterminal",
  "processflow", "pilotlog", "onboardingform", "athletecard", "translatorcv",
  "herbariumcv", "risodesigner", "uxtokens", "sketchbookillustrator", "blueprintcv",
  "contactsheet", "annualreport", "financeterminal", "campaignposter", "salespitch",
  "ledgercv", "neon", "medicalchart", "vitalsigns", "vetcv", "fieldjournal",
  "sharp", "bauhaus", "cobalt", "duality", "havana", "helix", "lisbon", "nautical",
  "obsidian", "prism", "tokyo", "vitae", "meridian",
]

export type TemplateLayout = "single-column" | "sidebar-left" | "sidebar-right"

export function isProTemplate(id: string): boolean {
  return PRO_IDS.includes(id)
}
