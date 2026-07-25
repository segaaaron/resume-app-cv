/**
 * Pricing mix + churn report — read-only, no writes. Answers the question the
 * CPO's annual-pricing proposal is blocked on: what's the real monthly vs
 * annual PRO split, and does monthly churn more than annual?
 *
 * Claude Code cannot read prod credentials (.env is access-restricted by
 * design) or query prod data directly — this script exists so the CEO/CPO can
 * run it themselves against whichever DATABASE_URL is configured (staging or
 * prod) and get real numbers instead of a guess.
 *
 * Run:  npx tsx scripts/pricing-mix-report.ts
 */
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

async function main() {
  const { db } = await import("@/lib/db")

  const activePro = await db.user.groupBy({
    by: ["planInterval"],
    where: { plan: "PRO", subscriptionStatus: { in: ["ACTIVE", "PAST_DUE"] } },
    _count: { _all: true },
  })
  const monthlyActive = activePro.find((r) => r.planInterval === "monthly")?._count._all ?? 0
  const annualActive = activePro.find((r) => r.planInterval === "annual")?._count._all ?? 0
  const totalActive = monthlyActive + annualActive

  const churned = await db.user.groupBy({
    by: ["planInterval"],
    where: { subscriptionStatus: { in: ["CANCELED", "EXPIRED"] }, planInterval: { not: null } },
    _count: { _all: true },
  })
  const monthlyChurned = churned.find((r) => r.planInterval === "monthly")?._count._all ?? 0
  const annualChurned = churned.find((r) => r.planInterval === "annual")?._count._all ?? 0

  const rate = (churn: number, active: number) => (active + churn === 0 ? null : churn / (active + churn))

  console.log("▶ Mix PRO activo (ACTIVE/PAST_DUE):")
  console.log(`  monthly: ${monthlyActive}  (${totalActive ? ((monthlyActive / totalActive) * 100).toFixed(1) : "—"}%)`)
  console.log(`  annual:  ${annualActive}  (${totalActive ? ((annualActive / totalActive) * 100).toFixed(1) : "—"}%)`)

  console.log("\n▶ Churn proxy (CANCELED/EXPIRED que alguna vez tuvieron ese interval):")
  console.log(`  monthly: ${monthlyChurned} churned — tasa ${((rate(monthlyChurned, monthlyActive) ?? 0) * 100).toFixed(1)}%`)
  console.log(`  annual:  ${annualChurned} churned — tasa ${((rate(annualChurned, annualActive) ?? 0) * 100).toFixed(1)}%`)

  if (totalActive + monthlyChurned + annualChurned < 20) {
    console.log("\n⚠️  Muestra chica (<20 usuarios PRO totales) — no tomar decisión de precio con este volumen todavía.")
  }
}

main()
  .catch((e) => {
    console.error("❌ Report falló:", e instanceof Error ? e.message : e)
    process.exit(1)
  })
  .finally(() => process.exit(0))
