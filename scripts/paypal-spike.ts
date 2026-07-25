/**
 * PayPal sandbox spike — validates credentials and bootstraps the PRO plans.
 *
 * Run:  npx tsx scripts/paypal-spike.ts
 *
 * What it does (against sandbox, using the .env creds):
 *   1. Loads env, checks paypalConfig() is present.
 *   2. OAuth (implicitly, on the first REST call) → validates CLIENT_ID/SECRET.
 *   3. Creates a Catalog product.
 *   4. Creates two billing plans: PRO monthly ($15) and annual ($99).
 *   5. Prints the plan ids to paste into PAYPAL_PLAN_ID_MONTHLY / _ANNUAL.
 *
 * Idempotency: PayPal does NOT dedupe products/plans by name — re-running makes
 * new ones. Run once; if you re-run, use the LAST printed ids.
 */
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

async function main() {
  const { paypalConfig, paypalApiBase } = await import("@/lib/paypal")
  const cfg = paypalConfig()
  if (!cfg) {
    console.error("❌ PayPal no configurado. Faltan en .env:")
    for (const k of ["PAYPAL_CLIENT_ID", "PAYPAL_SECRET", "PAYPAL_WEBHOOK_ID"]) {
      if (!process.env[k]) console.error(`   - ${k}`)
    }
    process.exit(1)
  }
  console.log(`▶ Entorno: ${process.env.PAYPAL_ENV ?? "sandbox"} (${paypalApiBase()})`)

  const { PayPalClientAdapter } = await import("@/lib/services/paypal/PayPalClientAdapter")
  const client = new PayPalClientAdapter()

  // 1. Product (OAuth validates here).
  console.log("▶ Creando Catalog product…")
  const product = await client.createProduct({
    name: "ReadyCVV PRO",
    description: "ReadyCVV PRO subscription",
    type: "SERVICE",
    category: "SOFTWARE",
  })
  console.log(`  ✓ product id: ${product.id}`)

  // 2. Plans.
  const plan = (name: string, interval: "MONTH" | "YEAR", value: string) => ({
    product_id: product.id,
    name,
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: interval, interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0, // infinite
        pricing_scheme: { fixed_price: { value, currency_code: "USD" } },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: "CANCEL",
      payment_failure_threshold: 1,
    },
  })

  console.log("▶ Creando plan mensual ($15)…")
  const monthly = await client.createPlan(plan("ReadyCVV PRO — Monthly", "MONTH", "15.00"))
  console.log(`  ✓ monthly plan id: ${monthly.id}`)

  console.log("▶ Creando plan anual ($99)…")
  const annual = await client.createPlan(plan("ReadyCVV PRO — Annual", "YEAR", "99.00"))
  console.log(`  ✓ annual plan id: ${annual.id}`)

  console.log("\n✅ Spike OK. Pega en tu .env:")
  console.log(`PAYPAL_PLAN_ID_MONTHLY=${monthly.id}`)
  console.log(`PAYPAL_PLAN_ID_ANNUAL=${annual.id}`)
}

main().catch((e) => {
  console.error("❌ Spike falló:", e instanceof Error ? e.message : e)
  process.exit(1)
})
