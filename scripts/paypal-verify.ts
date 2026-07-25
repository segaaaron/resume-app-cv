/**
 * PayPal sandbox verification — proves the plans exist and validates that
 * `custom_id` round-trips on a subscription (the open QA question).
 *
 * Run:  npx tsx scripts/paypal-verify.ts
 */
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

async function main() {
  const { paypalConfig } = await import("@/lib/paypal")
  const cfg = paypalConfig()
  if (!cfg) {
    console.error("❌ PayPal no configurado (faltan creds en .env)")
    process.exit(1)
  }
  const { PayPalClientAdapter } = await import("@/lib/services/paypal/PayPalClientAdapter")
  const client = new PayPalClientAdapter()

  // 1. List plans — proof they exist (dashboard is unreliable for API-made plans).
  console.log("▶ Planes en tu cuenta:")
  const { plans } = await client.listPlans()
  for (const p of plans ?? []) console.log(`  ${p.id} — ${p.name} — ${p.status}`)

  // 2. custom_id round-trip. Create a subscription with a known custom_id, then
  //    GET it and check PayPal echoes it back. Confirms our user-mapping works.
  if (cfg.planIdMonthly) {
    const probe = `probe-user-123`
    console.log(`\n▶ Probando custom_id="${probe}" en una suscripción de prueba…`)
    const sub = await client.createSubscription(cfg.planIdMonthly, { customId: probe })
    const fetched = await client.getSubscription(sub.id)
    const echoed = (fetched as { custom_id?: string }).custom_id
    console.log(`  subscription id: ${sub.id} (status: ${fetched.status})`)
    console.log(`  custom_id devuelto: ${echoed ?? "(vacío)"}`)
    console.log(echoed === probe ? "  ✅ custom_id FUNCIONA — mapeo sub→usuario confirmado" : "  ⚠️ custom_id NO regresó — usar fallback por subscription.id")
    // Clean up the probe subscription.
    await client.cancelSubscription(sub.id, "verification probe cleanup").catch(() => undefined)
  } else {
    console.log("\n(omito prueba custom_id: falta PAYPAL_PLAN_ID_MONTHLY)")
  }
}

main().catch((e) => {
  console.error("❌ Verify falló:", e instanceof Error ? e.message : e)
  process.exit(1)
})
