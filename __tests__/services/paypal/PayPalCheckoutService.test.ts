import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ILogger } from "@/lib/interfaces/ILogger"

vi.mock("@/lib/paypal", () => ({
  paypalConfig: () => ({
    clientId: "c",
    secret: "s",
    webhookId: "WH-1",
    planIdMonthly: "P-M",
    planIdAnnual: "P-A",
  }),
}))

const userState: { user: { id: string; subscriptionStatus: string; isManaged: boolean } | null } = {
  user: { id: "u1", subscriptionStatus: "NONE", isManaged: false },
}
vi.mock("@/lib/db", () => ({
  db: { user: { findUnique: vi.fn(async () => userState.user) } },
}))

process.env.NEXT_PUBLIC_APP_URL = "https://readycvv.com"

import { PayPalCheckoutService } from "@/lib/services/paypal/PayPalCheckoutService"

const logger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

beforeEach(() => {
  vi.clearAllMocks()
  userState.user = { id: "u1", subscriptionStatus: "NONE", isManaged: false }
})

describe("PayPalCheckoutService — anti double-charge guard", () => {
  it.each(["ACTIVE", "PAST_DUE"])("%s subscription blocks ANY new purchase (sub or one-time)", async (status) => {
    userState.user = { id: "u1", subscriptionStatus: status, isManaged: false }
    const client = { createOrder: vi.fn(), createSubscription: vi.fn() } as never
    const svc = new PayPalCheckoutService(client, logger)
    await expect(svc.createCheckout("u1", "basic", "en")).rejects.toMatchObject({ code: "already_subscribed", status: 400 })
    await expect(svc.createCheckout("u1", "monthly", "en")).rejects.toMatchObject({ code: "already_subscribed", status: 400 })
  })

  it("no active subscription → one-time BASIC proceeds and builds custom_id userId|PLAN", async () => {
    const createOrder = vi.fn().mockResolvedValue({ id: "ORD-1", links: [{ href: "https://paypal.com/approve", rel: "approve" }] })
    const client = { createOrder, createSubscription: vi.fn() } as never
    const svc = new PayPalCheckoutService(client, logger)
    const { url } = await svc.createCheckout("u1", "basic", "en")
    expect(url).toBe("https://paypal.com/approve")
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        purchase_units: [expect.objectContaining({ custom_id: "u1|BASIC", amount: { currency_code: "USD", value: "2.99" } })],
      }),
    )
  })

  it("PayPal order has no approve link → throws paypal_no_approval_url 502 (never silently proceeds)", async () => {
    const createOrder = vi.fn().mockResolvedValue({ id: "ORD-1", links: [] })
    const client = { createOrder, createSubscription: vi.fn() } as never
    const svc = new PayPalCheckoutService(client, logger)
    await expect(svc.createCheckout("u1", "sprint", "en")).rejects.toMatchObject({ code: "paypal_no_approval_url", status: 502 })
  })

  it("recurring PRO monthly uses configured plan id and customId = userId", async () => {
    const createSubscription = vi.fn().mockResolvedValue({ id: "SUB-1", links: [{ href: "https://paypal.com/approve-sub", rel: "approve" }] })
    const client = { createOrder: vi.fn(), createSubscription } as never
    const svc = new PayPalCheckoutService(client, logger)
    const { url } = await svc.createCheckout("u1", "monthly", "en")
    expect(url).toBe("https://paypal.com/approve-sub")
    expect(createSubscription).toHaveBeenCalledWith("P-M", expect.objectContaining({ customId: "u1" }))
  })

  it("unknown user → throws user_not_found 404", async () => {
    userState.user = null
    const client = { createOrder: vi.fn(), createSubscription: vi.fn() } as never
    const svc = new PayPalCheckoutService(client, logger)
    await expect(svc.createCheckout("ghost", "monthly", "en")).rejects.toMatchObject({ code: "user_not_found", status: 404 })
  })
})
