/**
 * One-time migration: reassign CVs using removed templates → classic
 * Templates removed: simple, chrono, nordic, oslo, blueprint, meridian, lagos, chefmenu, sommelier, bartendercv, medicalchart, vitalsigns, vetcv, pilotlog, onboardingform, athletecard, vinylcv, callsheet, campaignposter, ledgercv, chalkboard, financeterminal, annualreport, processflow, frontpage, iosappcv, herbariumcv, copywritermag, animatorcv, magazinespread, civileng
 *
 * Run once on production:
 *   npx tsx scripts/migrate-templates-to-classic.ts
 */
import { db } from "../lib/db"

const REMOVED = ["simple", "chrono", "nordic", "oslo", "blueprint", "meridian", "lagos", "chefmenu", "sommelier", "bartendercv", "medicalchart", "vitalsigns", "vetcv", "pilotlog", "onboardingform", "athletecard", "vinylcv", "callsheet", "campaignposter", "ledgercv", "chalkboard", "financeterminal", "annualreport", "processflow", "frontpage", "iosappcv", "herbariumcv", "copywritermag", "animatorcv", "magazinespread", "civileng"] as const

async function main() {
  const result = await db.resume.updateMany({
    where: { templateId: { in: [...REMOVED] } },
    data:  { templateId: "classic" },
  })
  console.log(`Migrated ${result.count} resume(s) to template "classic"`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
