/**
 * USER JOURNEYS — what a real customer lives, end to end, across BOTH gateways.
 *
 * Every other billing test asks "does this handler write the right row?". This one
 * asks the only question that reaches the customer: after this whole chain of events,
 * WHAT CAN THEY ACTUALLY DO? Each step asserts the effective access — isActive(),
 * effectivePlan() and the real PLAN_LIMITS — not just the columns.
 *
 * Why this shape catches what the others miss:
 *   · One mutable user row is threaded through the chain, so every handler reads what
 *     the previous one wrote. The lost-paid-month bug was invisible to per-handler
 *     tests and only appeared in sequence.
 *   · Event ids are deduplicated for real (a Set, like StripeEvent/PaypalEvent), so a
 *     replayed webhook behaves here exactly as it does in production.
 *   · Stripe and PayPal run against the SAME row, which is the only way to catch a user
 *     who pays with one gateway and then the other — the case that left a subscriber
 *     unable to cancel a card subscription that kept charging.
 *
 * These journeys are written from the customer's side: "bought a week of Sprint",
 * "cancelled and came back", "charged back". If one fails, a real person is either
 * paying for access they do not have or holding access nobody paid for.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import type Stripe from "stripe"
import { isActive, effectivePlan, PLAN_LIMITS, type Plan } from "@/lib/plans"
import type { IStripeClient } from "@/lib/interfaces/IStripeClient"
import type { ILogger } from "@/lib/interfaces/ILogger"

// ─── One in-memory user row, shared by both gateways ─────────────────────────

type Row = {
  id: string
  email: string
  name: string | null
  isManaged: boolean
  plan: string
  planInterval: string | null
  paymentProvider: string | null
  subscriptionId: string | null
  paypalSubscriptionId: string | null
  paypalOrderId: string | null
  subscriptionStatus: string
  subscriptionEndsAt: Date | null
  stripeCustomerId: string | null
  sessionVersion: number
}

const state: { row: Row; seenEvents: Set<string>; audits: Array<Record<string, unknown>> } = {
  row: null as unknown as Row,
  seenEvents: new Set(),
  audits: [],
}

function freshUser(over: Partial<Row> = {}): Row {
  return {
    id: "u1", email: "user@example.com", name: "Ana", isManaged: false,
    plan: "UNSUBSCRIBED", planInterval: null, paymentProvider: null,
    subscriptionId: null, paypalSubscriptionId: null, paypalOrderId: null,
    subscriptionStatus: "NONE", subscriptionEndsAt: null,
    stripeCustomerId: "cus_1", sessionVersion: 1,
    ...over,
  }
}

/** Applies an update the way Prisma would, including `{ increment: 1 }`. */
function applyUpdate(data: Record<string, unknown>) {
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === "object" && "increment" in (v as Record<string, unknown>)) {
      ;(state.row as unknown as Record<string, number>)[k] += 1
      continue
    }
    ;(state.row as unknown as Record<string, unknown>)[k] = v
  }
}

/** A claim table with real uniqueness — a replayed event id throws P2002, as in prod. */
const claim = (id: string) => {
  if (state.seenEvents.has(id)) throw { code: "P2002" }
  state.seenEvents.add(id)
  return {}
}

const txLike = {
  stripeEvent: {
    create: vi.fn(async ({ data }: { data: { id: string } }) => claim(data.id)),
    update: vi.fn(async () => ({})),
  },
  paypalEvent: { create: vi.fn(async ({ data }: { data: { id: string } }) => claim(data.id)) },
  user: {
    findUnique: vi.fn(async () => ({ ...state.row })),
    findFirst: vi.fn(async () => ({ ...state.row })),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { applyUpdate(data); return { ...state.row } }),
  },
  auditLog: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { state.audits.push(data); return {} }),
    count: vi.fn(async () => 0),
  },
  consentLog: { findFirst: vi.fn(async () => null) },
}

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(txLike)),
    paypalEvent: { create: vi.fn(async () => ({})) },
    stripeWebhookLog: { upsert: vi.fn(async () => ({})) },
    user: { findUnique: vi.fn(async () => ({ ...state.row })) },
  },
}))
vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))
vi.mock("@/lib/referral-rewards", () => ({ checkAndApplyReferralReward: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/resend", () => ({ resend: null, emailEnabled: () => false }))
vi.mock("@/lib/stripe", () => ({ stripeEnabled: () => true }))
vi.mock("@/lib/paypal", () => ({
  paypalConfig: () => ({ clientId: "c", secret: "s", webhookId: "WH", planIdMonthly: "P-M", planIdAnnual: "P-A" }),
  paypalApiBase: () => "https://api-m.sandbox.paypal.com",
}))
vi.mock("@/lib/services/paypal/verify-webhook", () => ({
  verifyWebhookOffline: async () => true,
  readWebhookHeaders: () => ({ transmissionId: "t", transmissionTime: "x", transmissionSig: "s", certUrl: "https://api.paypal.com/c", authAlgo: "SHA256withRSA" }),
}))

import { StripeWebhookService } from "@/lib/services/stripe/StripeWebhookService"
import { PayPalWebhookService } from "@/lib/services/paypal/PayPalWebhookService"

// ─── Gateway drivers ─────────────────────────────────────────────────────────

const logger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

const stripeClient = {
  constructEvent: vi.fn(),
  retrieveSubscription: vi.fn(),
  retrieveCharge: vi.fn(),
  cancelSubscription: vi.fn().mockResolvedValue({}),
  updateSubscription: vi.fn(),
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  createRefund: vi.fn(),
  retrieveBalance: vi.fn(),
  listCharges: vi.fn(),
  listDisputes: vi.fn(),
  listSubscriptions: vi.fn(),
} as unknown as IStripeClient

const DAY = 86_400_000
const inDays = (n: number) => Math.floor((Date.now() + n * DAY) / 1000)

let eventSeq = 0
const nextId = () => `ev_${++eventSeq}`

/** Deliver one Stripe webhook. */
async function stripeEvent(type: string, object: Record<string, unknown>, id = nextId()) {
  vi.mocked(stripeClient.constructEvent).mockReturnValue({ type, id, data: { object } } as unknown as Stripe.Event)
  await new StripeWebhookService(stripeClient, logger).handleEvent("raw", "sig", "secret")
}

/** Deliver one PayPal webhook. `subStatus` drives the mandatory re-fetch. */
async function paypalEvent(
  event_type: string,
  resource: Record<string, unknown>,
  opts: { subStatus?: string; nextBilling?: string; id?: string } = {},
) {
  const client = {
    getSubscription: vi.fn().mockResolvedValue({
      status: opts.subStatus ?? "ACTIVE",
      billing_info: opts.nextBilling ? { next_billing_time: opts.nextBilling } : undefined,
    }),
  }
  const body = JSON.stringify({ id: opts.id ?? nextId(), event_type, resource })
  await new PayPalWebhookService(client as never, logger).handleEvent(body, new Headers())
}

// ─── What the customer can actually do right now ─────────────────────────────

function access() {
  const r = state.row
  const active = isActive(r.plan, r.subscriptionEndsAt, r.subscriptionStatus, "USER", r.isManaged, false, null)
  const plan = effectivePlan({ plan: r.plan, subscriptionEndsAt: r.subscriptionEndsAt })
  const limits = PLAN_LIMITS[plan as Plan]
  return {
    active,
    plan,
    /** Content AI (write bullets/summary) — the line between BASIC and SPRINT. */
    hasContentAI: (limits?.aiLimitsByEndpoint["improve-bullet"] ?? 0) !== 0,
    /** ATS score — PRO only. */
    hasAtsScore: (limits?.aiLimitsByEndpoint["ats-score"] ?? 0) !== 0,
    maxResumes: limits?.maxResumes,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  state.row = freshUser()
  state.seenEvents = new Set()
  state.audits = []
  eventSeq = 0
})

// ═════════════════════════════════════════════════════════════════════════════

describe("Journey · Stripe · the one-time buyer", () => {
  it("buys BASIC, gets a month with no AI, and lapses to freemium when it ends", async () => {
    expect(access()).toMatchObject({ active: false, plan: "UNSUBSCRIBED" })

    await stripeEvent("checkout.session.completed", {
      id: "cs_basic", payment_status: "paid", metadata: { userId: "u1", planType: "basic" }, subscription: null,
    })

    const a = access()
    expect(a).toMatchObject({ active: true, plan: "BASIC", hasContentAI: false, hasAtsScore: false })
    expect(a.maxResumes).toBe(5)
    // A one-time plan carries no subscription — that is what makes it survive
    // subscription lifecycle events later on.
    expect(state.row.subscriptionId).toBeNull()
    expect(state.row.subscriptionStatus).toBe("NONE")
    expect(state.row.paymentProvider).toBe("STRIPE")

    // Time passes: the window closes on its own, no event required.
    state.row.subscriptionEndsAt = new Date(Date.now() - DAY)
    expect(access()).toMatchObject({ active: false, plan: "UNSUBSCRIBED" })
  })

  it("upgrades from SPRINT to PRO mid-window and keeps the days already paid for", async () => {
    await stripeEvent("checkout.session.completed", {
      id: "cs_sprint", payment_status: "paid", metadata: { userId: "u1", planType: "sprint" }, subscription: null,
    })
    expect(access()).toMatchObject({ plan: "SPRINT", hasContentAI: true, hasAtsScore: false })
    const sprintWindow = state.row.subscriptionEndsAt!

    // Upgrading immediately is allowed (status is NONE — nothing is billing them).
    // The new subscription's first period must never cut the window already bought.
    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: inDays(3) }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("checkout.session.completed", {
      id: "cs_pro", payment_status: "paid", metadata: { userId: "u1", planInterval: "monthly" }, subscription: "sub_1",
    })

    expect(access()).toMatchObject({ plan: "PRO", hasAtsScore: true })
    expect(state.row.subscriptionEndsAt!.getTime()).toBeGreaterThanOrEqual(sprintWindow.getTime())
  })
})

describe("Journey · Stripe · the subscriber", () => {
  async function subscribe(interval: "monthly" | "annual", periodEnd = inDays(30)) {
    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: periodEnd, price: { recurring: { interval: interval === "annual" ? "year" : "month" } } }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("checkout.session.completed", {
      id: "cs_1", payment_status: "paid", metadata: { userId: "u1", planInterval: interval }, subscription: "sub_1",
    })
  }

  it("subscribes, renews, and keeps full access throughout", async () => {
    await subscribe("monthly")
    expect(access()).toMatchObject({ active: true, plan: "PRO", hasAtsScore: true })

    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: inDays(60), price: { recurring: { interval: "month" } } }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("invoice.paid", {
      id: "in_1", customer: "cus_1",
      parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } },
    })

    expect(access()).toMatchObject({ active: true, plan: "PRO" })
    expect(state.row.subscriptionEndsAt!.getTime()).toBe(inDays(60) * 1000)
  })

  it("survives a failed payment and recovers when the card is fixed", async () => {
    await subscribe("monthly")

    await stripeEvent("invoice.payment_failed", { id: "in_f", customer: "cus_1", hosted_invoice_url: "https://pay/1" })
    // PAST_DUE keeps access while Stripe retries — cutting them off on the first
    // failure would punish an expired card.
    expect(state.row.subscriptionStatus).toBe("PAST_DUE")
    expect(access()).toMatchObject({ active: true, plan: "PRO" })

    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: inDays(45), price: { recurring: { interval: "month" } } }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("invoice.paid", {
      id: "in_2", customer: "cus_1",
      parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } },
    })
    expect(state.row.subscriptionStatus).toBe("ACTIVE")
    expect(access()).toMatchObject({ active: true, plan: "PRO" })
  })

  it("is asked to authenticate (3DS) without being marked as failing", async () => {
    await subscribe("annual")
    await stripeEvent("invoice.payment_action_required", { id: "in_sca", customer: "cus_1", hosted_invoice_url: "https://pay/2" })

    // Stripe is waiting for the customer, not failing. Showing a payment problem here
    // would be false, and saying nothing at all was the old behaviour.
    expect(state.row.subscriptionStatus).toBe("ACTIVE")
    expect(state.audits.some((a) => (a.metadata as Record<string, unknown>)?.source === "payment_action_required")).toBe(true)
    expect(access()).toMatchObject({ active: true, plan: "PRO" })
  })

  it("cancels, keeps access until the paid period ends, then drops to freemium", async () => {
    const periodEnd = inDays(20)
    await subscribe("monthly", periodEnd)

    await stripeEvent("customer.subscription.updated", {
      id: "sub_1", customer: "cus_1", status: "active", cancel_at_period_end: true, cancel_at: periodEnd,
      items: { data: [{ current_period_end: periodEnd }] },
    })
    expect(state.row.subscriptionStatus).toBe("CANCELED")
    expect(access()).toMatchObject({ active: true, plan: "PRO" }) // paid for, still theirs

    await stripeEvent("customer.subscription.deleted", { id: "sub_1", customer: "cus_1" })
    expect(access()).toMatchObject({ active: false, plan: "UNSUBSCRIBED" })
  })

  it("stops paying: past due → subscription deleted → freemium", async () => {
    await subscribe("monthly")
    await stripeEvent("invoice.payment_failed", { id: "in_f", customer: "cus_1", hosted_invoice_url: null })
    await stripeEvent("customer.subscription.deleted", { id: "sub_1", customer: "cus_1" })

    expect(access()).toMatchObject({ active: false, plan: "UNSUBSCRIBED" })
    expect(state.row.subscriptionEndsAt).toBeNull()
    expect(state.row.subscriptionId).toBeNull()
  })

  it("charges back: access goes immediately and the subscription is cancelled", async () => {
    await subscribe("monthly")

    await stripeEvent("charge.dispute.created", {
      id: "dp_1", amount: 1500, reason: "fraudulent",
      charge: { id: "ch_1", customer: "cus_1", metadata: { planInterval: "monthly" } },
    })

    expect(access()).toMatchObject({ active: false, plan: "UNSUBSCRIBED" })
    expect(stripeClient.cancelSubscription).toHaveBeenCalledWith("sub_1")
    // The evidence bundle must be recorded while the dispute window is open.
    expect(state.audits.some((a) => a.action === "DISPUTE_CHARGEBACK")).toBe(true)
  })
})

describe("Journey · Stripe · the customer who cancelled and bought a month instead", () => {
  it("keeps the month they paid for through the whole cleanup chain", async () => {
    // The chain that lost real money: every step writes what the next one reads.
    const periodEnd = inDays(20)
    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: periodEnd }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("checkout.session.completed", {
      id: "cs_pro", payment_status: "paid", metadata: { userId: "u1", planInterval: "monthly" }, subscription: "sub_1",
    })
    await stripeEvent("customer.subscription.updated", {
      id: "sub_1", customer: "cus_1", status: "active", cancel_at_period_end: true, cancel_at: periodEnd,
      items: { data: [{ current_period_end: periodEnd }] },
    })
    await stripeEvent("checkout.session.completed", {
      id: "cs_basic", payment_status: "paid", metadata: { userId: "u1", planType: "basic" }, subscription: null,
    })

    const boughtWindow = state.row.subscriptionEndsAt!.getTime()
    expect(access()).toMatchObject({ plan: "BASIC", active: true })

    // Three different events, each of which used to erase that month.
    await stripeEvent("customer.subscription.deleted", { id: "sub_1", customer: "cus_1" })
    expect(access()).toMatchObject({ plan: "BASIC", active: true })

    await stripeEvent("charge.refunded", {
      id: "ch_sub", customer: "cus_1", amount: 1500, amount_refunded: 1500, metadata: { planInterval: "monthly" },
    })
    expect(access()).toMatchObject({ plan: "BASIC", active: true })

    vi.mocked(stripeClient.retrieveCharge).mockResolvedValue({
      id: "ch_sub2", customer: "cus_1", metadata: { planInterval: "monthly" },
    } as unknown as Stripe.Charge)
    await stripeEvent("radar.early_fraud_warning.created", {
      id: "efw_1", charge: "ch_sub2", fraud_type: "made_with_stolen_card", actionable: true,
    })

    expect(access()).toMatchObject({ plan: "BASIC", active: true })
    expect(state.row.subscriptionEndsAt!.getTime()).toBe(boughtWindow)
  })

  it("but refunding the MONTH ITSELF does take it away", async () => {
    await stripeEvent("checkout.session.completed", {
      id: "cs_basic", payment_status: "paid", metadata: { userId: "u1", planType: "basic" }, subscription: null,
    })
    expect(access()).toMatchObject({ plan: "BASIC", active: true })

    await stripeEvent("charge.refunded", {
      id: "ch_basic", customer: "cus_1", amount: 299, amount_refunded: 299, metadata: { userId: "u1", planType: "basic" },
    })
    expect(access()).toMatchObject({ plan: "UNSUBSCRIBED", active: false })
  })
})

describe("Journey · PayPal · the same plans, a different gateway", () => {
  it("subscribes annually, renews, and holds PRO access", async () => {
    await paypalEvent(
      "BILLING.SUBSCRIPTION.ACTIVATED",
      { id: "I-1", custom_id: "u1", plan_id: "P-A", billing_info: { next_billing_time: "2027-01-01T00:00:00Z" } },
      { nextBilling: "2027-01-01T00:00:00Z" },
    )
    expect(access()).toMatchObject({ active: true, plan: "PRO", hasAtsScore: true })
    expect(state.row.planInterval).toBe("annual")
    expect(state.row.paymentProvider).toBe("PAYPAL")
    // PayPal's own column — Stripe's stays empty, they are not interchangeable.
    expect(state.row.paypalSubscriptionId).toBe("I-1")
    expect(state.row.subscriptionId).toBeNull()

    await paypalEvent("PAYMENT.SALE.COMPLETED", { billing_agreement_id: "I-1" }, { nextBilling: "2028-01-01T00:00:00Z" })
    expect(state.row.subscriptionEndsAt!.toISOString()).toBe("2028-01-01T00:00:00.000Z")
  })

  it("buys BASIC then SPRINT and never loses the longer window", async () => {
    await paypalEvent("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-1", custom_id: "u1|BASIC" })
    const monthEnd = state.row.subscriptionEndsAt!.getTime()
    expect(access()).toMatchObject({ plan: "BASIC", hasContentAI: false })

    // Sprint is 7 days — far shorter than what is left of the month.
    await paypalEvent("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-2", custom_id: "u1|SPRINT" })
    expect(access()).toMatchObject({ plan: "SPRINT", hasContentAI: true })
    expect(state.row.subscriptionEndsAt!.getTime()).toBe(monthEnd)
  })

  it("suspends and comes back without losing the plan", async () => {
    await paypalEvent("BILLING.SUBSCRIPTION.ACTIVATED", { id: "I-1", custom_id: "u1", plan_id: "P-M" }, { nextBilling: "2027-01-01T00:00:00Z" })
    await paypalEvent("BILLING.SUBSCRIPTION.SUSPENDED", { id: "I-1" })
    expect(state.row.subscriptionStatus).toBe("PAST_DUE")
    expect(access()).toMatchObject({ active: true, plan: "PRO" })

    await paypalEvent("PAYMENT.SALE.COMPLETED", { billing_agreement_id: "I-1" }, { nextBilling: "2027-02-01T00:00:00Z" })
    expect(state.row.subscriptionStatus).toBe("ACTIVE")
  })

  it("charges back a one-time purchase and loses it", async () => {
    await paypalEvent("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-1", custom_id: "u1|SPRINT" })
    expect(access()).toMatchObject({ plan: "SPRINT", active: true })

    // REVERSED is a chargeback. It used to be ignored entirely: money gone, access kept.
    await paypalEvent("PAYMENT.CAPTURE.REVERSED", { id: "RE-1", custom_id: "u1|SPRINT" })
    expect(access()).toMatchObject({ plan: "UNSUBSCRIBED", active: false })
  })

  it("a subscription refund does not take a separately bought month", async () => {
    await paypalEvent("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-1", custom_id: "u1|BASIC" })
    const window = state.row.subscriptionEndsAt!.getTime()

    await paypalEvent("PAYMENT.SALE.REFUNDED", { billing_agreement_id: "I-OLD" })
    expect(access()).toMatchObject({ plan: "BASIC", active: true })
    expect(state.row.subscriptionEndsAt!.getTime()).toBe(window)
  })
})

describe("Journey · crossing gateways — the case neither gateway sees alone", () => {
  it("PayPal one-time then a card subscription leaves the row owned by Stripe", async () => {
    await paypalEvent("PAYMENT.CAPTURE.COMPLETED", { id: "CAP-1", custom_id: "u1|BASIC" })
    expect(state.row.paymentProvider).toBe("PAYPAL")

    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: inDays(30) }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("checkout.session.completed", {
      id: "cs_pro", payment_status: "paid", metadata: { userId: "u1", planInterval: "monthly" }, subscription: "sub_1",
    })

    // If this stays "PAYPAL", Settings hides the Stripe portal and sends the cancel to
    // /api/paypal/cancel, which 400s — the card subscription keeps charging with no way
    // for the customer to stop it.
    expect(state.row.paymentProvider).toBe("STRIPE")
    expect(state.row.subscriptionId).toBe("sub_1")
    expect(access()).toMatchObject({ plan: "PRO", active: true })
  })

  it("a PayPal subscriber who later pays by card can still be billed by the right gateway", async () => {
    await paypalEvent("BILLING.SUBSCRIPTION.ACTIVATED", { id: "I-1", custom_id: "u1", plan_id: "P-M" }, { nextBilling: "2027-01-01T00:00:00Z" })
    expect(state.row.paymentProvider).toBe("PAYPAL")

    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: inDays(30), price: { recurring: { interval: "month" } } }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("invoice.paid", {
      id: "in_1", customer: "cus_1",
      parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } },
    })

    expect(state.row.paymentProvider).toBe("STRIPE")
    // The PayPal id is left in place on purpose: it is the audit trail of the old
    // relationship, and the cancel route is chosen by paymentProvider, not by this.
    expect(state.row.paypalSubscriptionId).toBe("I-1")
  })
})

describe("Journey · replays and duplicates — webhooks arrive more than once", () => {
  it("a replayed one-time purchase does not extend the window twice", async () => {
    await stripeEvent("checkout.session.completed", {
      id: "cs_basic", payment_status: "paid", metadata: { userId: "u1", planType: "basic" }, subscription: null,
    }, "ev_dup")
    const firstWindow = state.row.subscriptionEndsAt!.getTime()
    const writes = txLike.user.update.mock.calls.length

    // Same event id — Stripe retries on any non-2xx.
    await stripeEvent("checkout.session.completed", {
      id: "cs_basic", payment_status: "paid", metadata: { userId: "u1", planType: "basic" }, subscription: null,
    }, "ev_dup")

    expect(state.row.subscriptionEndsAt!.getTime()).toBe(firstWindow)
    expect(txLike.user.update.mock.calls.length).toBe(writes)
  })

  it("a replayed PayPal activation provisions once", async () => {
    await paypalEvent("BILLING.SUBSCRIPTION.ACTIVATED", { id: "I-1", custom_id: "u1", plan_id: "P-M" }, { nextBilling: "2027-01-01T00:00:00Z", id: "pp_dup" })
    const writes = txLike.user.update.mock.calls.length

    await paypalEvent("BILLING.SUBSCRIPTION.ACTIVATED", { id: "I-1", custom_id: "u1", plan_id: "P-M" }, { nextBilling: "2027-01-01T00:00:00Z", id: "pp_dup" })
    expect(txLike.user.update.mock.calls.length).toBe(writes)
  })

  it("events arriving out of order never move a paid date backwards", async () => {
    // Stripe does not guarantee ordering. A late renewal for an older period must not
    // undo a newer one.
    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: inDays(60), price: { recurring: { interval: "month" } } }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("invoice.paid", {
      id: "in_new", customer: "cus_1",
      parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } },
    })
    expect(state.row.subscriptionEndsAt!.getTime()).toBe(inDays(60) * 1000)

    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: inDays(30), price: { recurring: { interval: "month" } } }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("invoice.paid", {
      id: "in_old", customer: "cus_1",
      parent: { type: "subscription_details", subscription_details: { subscription: "sub_1" } },
    })

    expect(state.row.subscriptionEndsAt!.getTime()).toBe(inDays(60) * 1000)
  })
})

describe("Journey · the managed (LIMITED) user — admin granted, gateway proof", () => {
  it("no payment event of either gateway can take their plan away", async () => {
    state.row = freshUser({
      id: "u1", plan: "LIMITED", isManaged: true,
      subscriptionEndsAt: new Date(Date.now() + 300 * DAY), stripeCustomerId: "cus_1",
    })
    const endsAt = state.row.subscriptionEndsAt!.getTime()

    await stripeEvent("charge.refunded", { id: "ch_1", customer: "cus_1", amount: 1500, amount_refunded: 1500, metadata: {} })
    await stripeEvent("charge.dispute.created", { id: "dp_1", amount: 1500, reason: "fraudulent", charge: { id: "ch_1", customer: "cus_1", metadata: {} } })
    await stripeEvent("customer.subscription.deleted", { id: "sub_1", customer: "cus_1" })
    vi.mocked(stripeClient.retrieveCharge).mockResolvedValue({ id: "ch_2", customer: "cus_1", metadata: {} } as unknown as Stripe.Charge)
    await stripeEvent("radar.early_fraud_warning.created", { id: "efw_1", charge: "ch_2", fraud_type: "misc", actionable: true })
    await paypalEvent("BILLING.SUBSCRIPTION.EXPIRED", { id: "I-1" })
    await paypalEvent("PAYMENT.CAPTURE.REVERSED", { id: "RE-1", custom_id: "u1|BASIC" })

    expect(state.row.plan).toBe("LIMITED")
    expect(state.row.subscriptionEndsAt!.getTime()).toBe(endsAt)
    expect(txLike.user.update).not.toHaveBeenCalled()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// PURCHASE FLOWS — every plan from the buy click to the access it grants, plus
// what happens when the money does NOT arrive.
//
// Behaviour verified against Stripe's documentation:
//  · A DECLINED CARD does not end the Checkout Session. The customer stays in
//    Checkout and can retry; no webhook provisions anything. cancel_url is only
//    the back button, not a decline path.
//  · Delayed methods (OXXO/SEPA) report payment_status "processing" on
//    checkout.session.completed and only turn "paid" on async_payment_succeeded.
//  · invoice.payment_failed is a RENEWAL failure (insufficient funds, expired
//    card); Stripe retries, so access is kept while the status is PAST_DUE.
// ═════════════════════════════════════════════════════════════════════════════

import { StripeCheckoutService } from "@/lib/services/stripe/StripeCheckoutService"

describe("Purchase · what each plan grants once the money arrives", () => {
  it.each([
    // plan            → effective plan, downloads, content AI, ATS, max resumes
    ["basic",  "BASIC",  false, false, 5],
    ["sprint", "SPRINT", true,  false, -1],
  ])("one-time %s grants exactly its advertised feature set", async (planType, plan, contentAI, ats, maxResumes) => {
    await stripeEvent("checkout.session.completed", {
      id: "cs_1", payment_status: "paid", metadata: { userId: "u1", planType }, subscription: null,
    })
    const a = access()
    expect(a.plan).toBe(plan)
    expect(a.active).toBe(true)
    expect(a.hasContentAI).toBe(contentAI)
    // ATS / tailor / review stay PRO-only on every one-time tier.
    expect(a.hasAtsScore).toBe(ats)
    expect(a.maxResumes).toBe(maxResumes)
  })

  it.each([["monthly"], ["annual"]])("PRO %s grants the full feature set", async (interval) => {
    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: inDays(interval === "annual" ? 365 : 30) }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("checkout.session.completed", {
      id: "cs_1", payment_status: "paid", metadata: { userId: "u1", planInterval: interval }, subscription: "sub_1",
    })
    const a = access()
    expect(a).toMatchObject({ plan: "PRO", active: true, hasContentAI: true, hasAtsScore: true })
    expect(state.row.planInterval).toBe(interval)
  })
})

describe("Purchase · the checkout session each plan opens", () => {
  const logger2: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  const checkoutClient = {
    ...stripeClient,
    createCheckoutSession: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/x" }),
    listCustomers: vi.fn().mockResolvedValue({ data: [] }),
    createCustomer: vi.fn().mockResolvedValue({ id: "cus_new" }),
  } as unknown as IStripeClient

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkoutClient.createCheckoutSession).mockResolvedValue({ url: "https://checkout.stripe.com/x" } as never)
    process.env.NEXT_PUBLIC_APP_URL = "https://www.valhallaresume.com"
    process.env.STRIPE_PRICE_ID_MONTHLY = "price_m"
    process.env.STRIPE_PRICE_ID_ANNUAL = "price_a"
    process.env.STRIPE_PRICE_ID_BASIC = "price_b"
    process.env.STRIPE_PRICE_ID_SPRINT = "price_s"
    state.row = freshUser({ stripeCustomerId: "cus_1" })
  })

  it.each([
    ["basic",   "payment",      "price_b"],
    ["sprint",  "payment",      "price_s"],
    ["monthly", "subscription", "price_m"],
    ["annual",  "subscription", "price_a"],
  ])("%s opens a %s session with the right price", async (plan, mode, priceId) => {
    await new StripeCheckoutService(checkoutClient, logger2)
      .createSession("u1", plan as "basic" | "sprint" | "monthly" | "annual", "en")

    const params = vi.mocked(checkoutClient.createCheckoutSession).mock.calls[0][0] as Record<string, unknown>
    expect(params.mode).toBe(mode)
    expect((params.line_items as Array<{ price: string }>)[0].price).toBe(priceId)
    // Wrong mode or wrong price means charging the wrong amount, or a one-time plan
    // silently becoming a recurring charge.
  })

  it("one-time sessions stamp planType on BOTH the session and the PaymentIntent", async () => {
    await new StripeCheckoutService(checkoutClient, logger2).createSession("u1", "basic", "en")
    const params = vi.mocked(checkoutClient.createCheckoutSession).mock.calls[0][0] as Record<string, unknown>

    // Session metadata → provisioning. PaymentIntent metadata → refund scope later,
    // because refunds arrive with a charge and no session.
    expect(params.metadata).toMatchObject({ userId: "u1", planType: "basic" })
    expect(params.payment_intent_data).toMatchObject({ metadata: { userId: "u1", planType: "basic" } })
    expect(params.subscription_data).toBeUndefined()
  })

  it("subscription sessions carry planInterval and no payment_intent_data", async () => {
    // Stripe rejects payment_intent_data in subscription mode.
    await new StripeCheckoutService(checkoutClient, logger2).createSession("u1", "annual", "en")
    const params = vi.mocked(checkoutClient.createCheckoutSession).mock.calls[0][0] as Record<string, unknown>
    expect(params.metadata).toMatchObject({ userId: "u1", planInterval: "annual" })
    expect(params.subscription_data).toMatchObject({ metadata: { planInterval: "annual" } })
    expect(params.payment_intent_data).toBeUndefined()
  })

  it("both return URLs keep the buyer's language and are valid routes", async () => {
    await new StripeCheckoutService(checkoutClient, logger2).createSession("u1", "monthly", "en")
    const params = vi.mocked(checkoutClient.createCheckoutSession).mock.calls[0][0] as Record<string, string>

    expect(params.success_url).toContain("/en/dashboard/resumes")
    // The back button used to land on /pricing with no locale — a 404, since there is
    // no next-intl middleware and the route only exists under [locale]. The
    // ?checkout=cancelled marker lets the pricing page emit the checkout_abandoned
    // analytics event on return.
    expect(params.cancel_url).toBe("https://www.valhallaresume.com/en/pricing?checkout=cancelled")
  })

  it("a trailing slash in APP_URL never produces a double slash", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://www.valhallaresume.com/"
    await new StripeCheckoutService(checkoutClient, logger2).createSession("u1", "basic", "es")
    const params = vi.mocked(checkoutClient.createCheckoutSession).mock.calls[0][0] as Record<string, string>
    expect(params.cancel_url).toBe("https://www.valhallaresume.com/es/pricing?checkout=cancelled")
    expect(params.success_url.startsWith("https://www.valhallaresume.com/es/")).toBe(true)
  })
})

describe("Purchase · when the money does not arrive", () => {
  it("a declined card provisions nothing (no webhook ever completes the session)", async () => {
    // Stripe keeps the session open for retry; nothing reaches us. The user must stay
    // exactly as they were.
    const before = { ...state.row }
    await stripeEvent("payment_intent.payment_failed", { id: "pi_1", customer: "cus_1", last_payment_error: { code: "card_declined" } })

    expect(state.row.plan).toBe(before.plan)
    expect(access()).toMatchObject({ active: false, plan: "UNSUBSCRIBED" })
    expect(txLike.user.update).not.toHaveBeenCalled()
  })

  it("an abandoned checkout leaves no trace", async () => {
    await stripeEvent("checkout.session.expired", { id: "cs_gone", metadata: { userId: "u1", planType: "basic" } })
    expect(access()).toMatchObject({ active: false, plan: "UNSUBSCRIBED" })
    expect(txLike.user.update).not.toHaveBeenCalled()
  })

  it("an OXXO voucher that is never paid provisions nothing", async () => {
    // The session completes immediately with payment_status "processing" — paying then
    // is the bug: the customer would get the plan for free if they never pay.
    await stripeEvent("checkout.session.completed", {
      id: "cs_oxxo", payment_status: "processing", metadata: { userId: "u1", planType: "basic" }, subscription: null,
    })
    expect(txLike.user.update).not.toHaveBeenCalled()

    await stripeEvent("checkout.session.async_payment_failed", { id: "cs_oxxo", metadata: { userId: "u1", planType: "basic" } })
    expect(access()).toMatchObject({ active: false, plan: "UNSUBSCRIBED" })
    expect(txLike.user.update).not.toHaveBeenCalled()
  })

  it("an OXXO voucher paid two days later provisions the plan then", async () => {
    await stripeEvent("checkout.session.completed", {
      id: "cs_oxxo2", payment_status: "processing", metadata: { userId: "u1", planType: "sprint" }, subscription: null,
    })
    expect(access()).toMatchObject({ active: false })

    await stripeEvent("checkout.session.async_payment_succeeded", {
      id: "cs_oxxo2", payment_status: "paid", metadata: { userId: "u1", planType: "sprint" }, subscription: null,
    })
    expect(access()).toMatchObject({ plan: "SPRINT", active: true })
  })

  it("insufficient funds on RENEWAL keeps access while Stripe retries", async () => {
    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: inDays(30) }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("checkout.session.completed", {
      id: "cs_1", payment_status: "paid", metadata: { userId: "u1", planInterval: "monthly" }, subscription: "sub_1",
    })

    await stripeEvent("invoice.payment_failed", { id: "in_f", customer: "cus_1", hosted_invoice_url: "https://pay/x" })
    // Cutting access on the first failure would punish an expired card mid-cycle.
    expect(state.row.subscriptionStatus).toBe("PAST_DUE")
    expect(access()).toMatchObject({ active: true, plan: "PRO" })

    // Retries exhausted → Stripe cancels → access ends.
    await stripeEvent("customer.subscription.deleted", { id: "sub_1", customer: "cus_1" })
    expect(access()).toMatchObject({ active: false, plan: "UNSUBSCRIBED" })
  })

  it("an invoice that cannot be finalized bills nothing and keeps access", async () => {
    vi.mocked(stripeClient.retrieveSubscription).mockResolvedValue({
      items: { data: [{ current_period_end: inDays(30) }] },
    } as unknown as Stripe.Subscription)
    await stripeEvent("checkout.session.completed", {
      id: "cs_1", payment_status: "paid", metadata: { userId: "u1", planInterval: "monthly" }, subscription: "sub_1",
    })

    await stripeEvent("invoice.finalization_failed", {
      id: "in_x", customer: "cus_1",
      last_finalization_error: { code: "customer_tax_location_invalid", message: "no tax location" },
    })

    // The customer is blameless: no charge was attempted, so access stays. The signal
    // is the audit entry — otherwise this account runs free forever.
    expect(access()).toMatchObject({ active: true, plan: "PRO" })
    expect(state.audits.some((a) => (a.metadata as Record<string, unknown>)?.source === "invoice_finalization_failed")).toBe(true)
  })
})
