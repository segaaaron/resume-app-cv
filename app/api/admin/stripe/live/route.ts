// GET /api/admin/stripe/live
// Live read-only snapshot from the Stripe API: balance, recent charges, open disputes,
// active subscriptions. SUPER_ADMIN only. 503 if Stripe not configured.
// Each section is fetched independently and degrades on its own — one failing call
// must not blank the whole panel.
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripe, stripeEnabled } from "@/lib/stripe"
import { stripeClient } from "@/lib/controllers/stripe-deps"
import { createLogger } from "@/lib/logger"

export const dynamic = "force-dynamic"

const logger = createLogger("admin-stripe-live")

async function safe<T>(label: string, fn: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await fn(), error: null }
  } catch (err) {
    logger.error(`admin-stripe-live: ${label} failed`, {}, err instanceof Error ? err : undefined)
    return { data: null, error: label }
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  if (!stripeEnabled() || !stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const [balance, charges, disputes, subs] = await Promise.all([
    safe("balance", () => stripeClient.retrieveBalance()),
    safe("charges", () => stripeClient.listCharges({ limit: 10 })),
    safe("disputes", () => stripeClient.listDisputes({ limit: 20 })),
    safe("subscriptions", () => stripeClient.listSubscriptions({ status: "active", limit: 100 })),
  ])

  const errors = [balance, charges, disputes, subs].map((s) => s.error).filter((e): e is string => e !== null)

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    balance: balance.data
      ? {
          available: balance.data.available.map((b) => ({ amount: b.amount, currency: b.currency })),
          pending: balance.data.pending.map((b) => ({ amount: b.amount, currency: b.currency })),
        }
      : null,
    recentCharges:
      charges.data?.data.map((c) => ({
        id: c.id,
        amount: c.amount,
        currency: c.currency,
        status: c.status,
        paid: c.paid,
        refunded: c.refunded,
        description: c.description,
        email: c.billing_details?.email ?? null,
        created: c.created,
      })) ?? null,
    openDisputes:
      disputes.data?.data
        .filter((d) => d.status !== "won" && d.status !== "lost")
        .map((d) => ({
          id: d.id,
          amount: d.amount,
          currency: d.currency,
          reason: d.reason,
          status: d.status,
          chargeId: typeof d.charge === "string" ? d.charge : d.charge?.id ?? null,
          created: d.created,
        })) ?? null,
    subscriptions: subs.data
      ? { activeCount: subs.data.data.length, hasMore: subs.data.has_more }
      : null,
    errors,
  })
}
