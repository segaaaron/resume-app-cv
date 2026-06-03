/**
 * One-time migration: reassign CVs using removed templates → classic
 * Templates removed: simple, chrono, nordic, oslo, blueprint
 *
 * Run once on production:
 *   npx tsx scripts/migrate-templates-to-classic.ts
 */
import { db } from "../lib/db"

const REMOVED = ["simple", "chrono", "nordic", "oslo", "blueprint"] as const

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
