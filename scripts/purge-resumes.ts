/**
 * purge-resumes.ts
 *
 * Deletes ALL Resume and ResumeVersion rows from the database.
 * Run once in production to remove inconsistent data.
 *
 * Usage:
 *   DATABASE_URL="..." npx tsx scripts/purge-resumes.ts
 *
 * Add --dry-run to preview counts without deleting.
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const dryRun = process.argv.includes("--dry-run")

async function main() {
  const resumeCount = await prisma.resume.count()
  const versionCount = await prisma.resumeVersion.count()

  console.log(`Resumes found:        ${resumeCount}`)
  console.log(`ResumeVersions found: ${versionCount}`)

  if (dryRun) {
    console.log("\n[DRY RUN] No data deleted.")
    return
  }

  if (resumeCount === 0 && versionCount === 0) {
    console.log("\nNothing to delete.")
    return
  }

  // Versions first (FK), then resumes
  const deletedVersions = await prisma.resumeVersion.deleteMany({})
  const deletedResumes = await prisma.resume.deleteMany({})

  console.log(`\nDeleted ${deletedVersions.count} ResumeVersion rows.`)
  console.log(`Deleted ${deletedResumes.count} Resume rows.`)
  console.log("Done.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
