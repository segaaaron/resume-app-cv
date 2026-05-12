/**
 * purge-cover-letters.ts
 *
 * Deletes ALL CoverLetter rows from the database.
 * Run once in production to remove inconsistent data.
 *
 * Usage:
 *   DATABASE_URL="..." npx tsx scripts/purge-cover-letters.ts
 *
 * Add --dry-run to preview counts without deleting.
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const dryRun = process.argv.includes("--dry-run")

async function main() {
  const count = await prisma.coverLetter.count()

  console.log(`CoverLetters found: ${count}`)

  if (dryRun) {
    console.log("\n[DRY RUN] No data deleted.")
    return
  }

  if (count === 0) {
    console.log("\nNothing to delete.")
    return
  }

  const deleted = await prisma.coverLetter.deleteMany({})
  console.log(`\nDeleted ${deleted.count} CoverLetter rows.`)
  console.log("Done.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
