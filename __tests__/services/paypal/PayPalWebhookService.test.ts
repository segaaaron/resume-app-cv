import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ILogger } from "@/lib/interfaces/ILogger"

// --- Mocks --------------------------------------------------------------
vi.mock("@/lib/paypal", () => ({
  paypalConfig: () => ({ clientId: "c", secret: "s", webhookId: "WH-1", planIdMonthly: "P-M", planIdAnnual: "P-A" }),
  paypalApiBase: () => "https://api-m.sandbox.paypal.com",
}))
vi.mock("@/lib/auth", () => ({ purgeUserCache: vi.fn() }))

const verifyWebhookOffline = vi.fn()
const readWebhookHeaders = vi.fn()
vi.mock("@/lib/services/paypal/verify-webhook", () => ({
  verifyWebhookOffline: (...a: unknown[]) => verifyWebhookOffline(...a),
  readWebhookHeaders: (...a: unknown[]) => readWebhookHeaders(...a),
}))

// Mock db: $transaction invokes the callback with a controllable tx; the
// standalone paypalEvent.create is used by the ignore/skip paths.
const txState: {
  claimThrows: boolean
  user: { id: string; isManaged: boolean } | null
  updateSpy: ReturnType<typeof vi.fn>
} = { claimThrows: false, user: { id: "u1", isManaged: false }, updateSpy: vi.fn() }

vi.mock("@/lib/db", () => ({
  db: {
    paypalEvent: { create: vi.fn().mockResolvedValue({}) },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => {
      const tx = {
        paypalEvent: {
          create: vi.fn(async () => {
            if (txState.claimThrows) throw { code: "P2002" }
            return {}
          }),
        },
        user: {
          findUnique: vi.fn(async () => txState.user),
          findFirst: vi.fn(async () => txState.user),
          update: txState.updateSpy,
        },
      }
      return cb(tx)
    }),
  },
}))

import { PayPalWebhookService } from "@/lib/services/paypal/PayPalWebhookService"

const logger: ILogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
const makeClient = (getSubscription: unknown) => ({ getSubscription }) as never
const headers = new Headers()

beforeEach(() => {
  vi.clearAllMocks()
  txState.claimThrows = false
  txState.user = { id: "u1", isManaged: false }
  txState.updateSpy = vi.fn().mockResolvedValue({})
  readWebhookHeaders.mockReturnValue({ transmissionId: "t", transmissionTime: "x", transmissionSig: "s", certUrl: "https://api.paypal.com/c", authAlgo: "SHA256withRSA" })
  verifyWebhookOffline.mockResolvedValue(true)
})

const activatedBody = JSON.stringify({
  id: "WH-EVT-1",
  event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
  resource: { id: "I-SUB1", custom_id: "u1", plan_id: "P-A", billing_info: { next_billing_time: "2027-01-01T00:00:00Z" } },
})

describe("PayPalWebhookService — signature & payload (no silent errors)", () => {
  it("bad signature → throws invalid_signature 400, never provisions", async () => {
    verifyWebhookOffline.mockResolvedValue(false)
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await expect(svc.handleEvent(activatedBody, headers)).rejects.toMatchObject({ code: "invalid_signature", status: 400 })
    expect(txState.updateSpy).not.toHaveBeenCalled()
  })

  it("missing headers → throws invalid_signature 400", async () => {
    readWebhookHeaders.mockReturnValue(null)
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await expect(svc.handleEvent(activatedBody, headers)).rejects.toMatchObject({ code: "invalid_signature" })
  })

  it("malformed JSON body → throws invalid_payload (not a silent success)", async () => {
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await expect(svc.handleEvent("not-json", headers)).rejects.toMatchObject({ code: "invalid_payload" })
  })
})

describe("PayPalWebhookService — provisioning", () => {
  it("ACTIVATED + re-fetch ACTIVE → provisions PRO", async () => {
    const getSub = vi.fn().mockResolvedValue({ status: "ACTIVE", billing_info: { next_billing_time: "2027-01-01T00:00:00Z" } })
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await svc.handleEvent(activatedBody, headers)
    expect(getSub).toHaveBeenCalledWith("I-SUB1")
    expect(txState.updateSpy).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ plan: "PRO", subscriptionStatus: "ACTIVE", paymentProvider: "PAYPAL" }) }))
  })

  it("ACTIVATED + re-fetch NOT active → THROWS (never silently skips the grant)", async () => {
    const getSub = vi.fn().mockResolvedValue({ status: "APPROVAL_PENDING" })
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await expect(svc.handleEvent(activatedBody, headers)).rejects.toMatchObject({ code: "subscription_not_active" })
    expect(txState.updateSpy).not.toHaveBeenCalled()
  })

  it("re-fetch FAILS → throws refetch_failed 500 (retry, never grant on unverified)", async () => {
    const getSub = vi.fn().mockRejectedValue(new Error("network"))
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await expect(svc.handleEvent(activatedBody, headers)).rejects.toMatchObject({ code: "refetch_failed", status: 500 })
  })

  it("duplicate event (claim P2002) → idempotent, no provisioning", async () => {
    txState.claimThrows = true
    const getSub = vi.fn().mockResolvedValue({ status: "ACTIVE" })
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await svc.handleEvent(activatedBody, headers)
    expect(txState.updateSpy).not.toHaveBeenCalled()
  })

  it("managed (LIMITED) user → never overwritten", async () => {
    txState.user = { id: "u1", isManaged: true }
    const getSub = vi.fn().mockResolvedValue({ status: "ACTIVE" })
    const svc = new PayPalWebhookService(makeClient(getSub), logger)
    await svc.handleEvent(activatedBody, headers)
    expect(txState.updateSpy).not.toHaveBeenCalled()
  })

  it("EXPIRED → downgrades to UNSUBSCRIBED", async () => {
    const body = JSON.stringify({ id: "WH-2", event_type: "BILLING.SUBSCRIPTION.EXPIRED", resource: { id: "I-SUB1" } })
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(body, headers)
    expect(txState.updateSpy).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED" }) }))
  })

  it("one-time CAPTURE COMPLETED → provisions BASIC (no re-fetch needed)", async () => {
    const body = JSON.stringify({ id: "WH-3", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: { id: "CAP-1", custom_id: "u1|BASIC" } })
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(body, headers)
    expect(txState.updateSpy).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ plan: "BASIC", paymentProvider: "PAYPAL" }) }))
  })

  it("one-time CAPTURE REFUNDED → downgrades via custom_id, not the refund's own id", async () => {
    // resource.id here is the REFUND id (RE-1), never the stored paypalOrderId
    // (CAP-1). Only custom_id correctly identifies the user.
    const body = JSON.stringify({
      id: "WH-5",
      event_type: "PAYMENT.CAPTURE.REFUNDED",
      resource: { id: "RE-1", custom_id: "u1|BASIC", links: [{ href: "https://api.paypal.com/v2/payments/captures/CAP-1", rel: "up" }] },
    })
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await svc.handleEvent(body, headers)
    expect(txState.updateSpy).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ plan: "UNSUBSCRIBED", subscriptionStatus: "EXPIRED" }) }))
  })

  it("unknown event type → resolves, claims, no provisioning (no silent crash)", async () => {
    const body = JSON.stringify({ id: "WH-4", event_type: "PAYMENT.PAYOUTS.ITEM.SUCCEEDED", resource: { id: "PO-1" } })
    const svc = new PayPalWebhookService(makeClient(vi.fn()), logger)
    await expect(svc.handleEvent(body, headers)).resolves.toBeUndefined()
    expect(txState.updateSpy).not.toHaveBeenCalled()
  })
})
