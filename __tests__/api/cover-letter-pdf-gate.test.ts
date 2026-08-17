import { describe, it, expect, vi, beforeEach } from "vitest"

// The gate under test: downloading a PREMIUM cover-letter template requires a plan that
// includes premium templates. It used to check only `isActive`, so BASIC — a $2.99
// one-time plan that explicitly does NOT get premium templates — could download all 54.

vi.mock("@/lib/auth", () => ({ auth: vi.fn(), purgeUserCache: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    coverLetter: { findFirst: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}))
vi.mock("@/lib/pdf/pdf-service-client", () => ({ callPdfService: vi.fn(async () => Buffer.from("%PDF-1.4")) }))
vi.mock("@/lib/pdf/print-token", () => ({ createPrintToken: vi.fn(() => "tok") }))
vi.mock("@/lib/rate-limit", () => ({
  checkAndIncrementRateLimit: vi.fn(async () => true),
  refundRateLimit: vi.fn(async () => {}),
}))
vi.mock("@/lib/services/downloads/managed-quota", () => ({
  claimManagedDownload: vi.fn(async () => ({ ok: true, claimed: false })),
  refundManagedDownload: vi.fn(async () => {}),
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { callPdfService } from "@/lib/pdf/pdf-service-client"
import { checkAndIncrementRateLimit, refundRateLimit } from "@/lib/rate-limit"
import { GET } from "@/app/api/cover-letters/[id]/pdf/route"

const ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.valhallaresume.com"

function makeRequest() {
  return new Request(`${ORIGIN}/api/cover-letters/letter-1/pdf?locale=es`, {
    method: "GET",
    headers: { Origin: ORIGIN },
  })
}

const params = { params: Promise.resolve({ id: "letter-1" }) }

/** An active plan window one month out — enough for BASIC/SPRINT to be "active". */
const inAMonth = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

function signedInAs(plan: string, over: Record<string, unknown> = {}) {
  vi.mocked(auth).mockResolvedValue({ user: { id: "u1", email: "a@b.com" } } as never)
  vi.mocked(db.user.findUnique).mockResolvedValue({
    id: "u1",
    email: "a@b.com",
    plan,
    subscriptionStatus: plan === "PRO" ? "ACTIVE" : "NONE",
    subscriptionEndsAt: inAMonth(),
    role: "USER",
    emailVerified: new Date(),
    isManaged: false,
    managedBlocked: false,
    managedExpiresAt: null,
    managedDownloadLimit: null,
    managedDownloadsUsed: 0,
    managedResumeLimit: null,
    managedCoverLetterLimit: null,
    ...over,
  } as never)
}

function letterWithTemplate(templateId: string) {
  vi.mocked(db.coverLetter.findFirst).mockResolvedValue({
    id: "letter-1",
    title: "Carta",
    updatedAt: new Date("2026-01-01"),
    templateId,
  } as never)
}

beforeEach(() => vi.clearAllMocks())

describe("cover-letter PDF: premium template gate", () => {
  it("BASIC cannot download a premium template", async () => {
    signedInAs("BASIC")
    letterWithTemplate("ltrmeridian")

    const res = await GET(makeRequest(), params)

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toMatchObject({ error: "premium_template_requires_upgrade" })
    expect(callPdfService).not.toHaveBeenCalled()
  })

  it("BASIC CAN download the free template (the gate is about the template, not the plan)", async () => {
    signedInAs("BASIC")
    letterWithTemplate("elegant")

    const res = await GET(makeRequest(), params)

    expect(res.status).toBe(200)
    expect(callPdfService).toHaveBeenCalledOnce()
  })

  it("SPRINT can download a premium template — its plan includes them", async () => {
    signedInAs("SPRINT")
    letterWithTemplate("ltrmeridian")

    const res = await GET(makeRequest(), params)

    expect(res.status).toBe(200)
  })

  it("PRO can download a premium template", async () => {
    signedInAs("PRO")
    letterWithTemplate("executive")

    const res = await GET(makeRequest(), params)

    expect(res.status).toBe(200)
  })

  it("an admin whose plan column says UNSUBSCRIBED still downloads a premium template", async () => {
    signedInAs("UNSUBSCRIBED", { role: "SUPER_ADMIN", subscriptionEndsAt: null })
    letterWithTemplate("executive")

    const res = await GET(makeRequest(), params)

    expect(res.status).toBe(200)
  })

  it("the gate runs BEFORE the ETag, so a 304 cannot serve a gated template", async () => {
    signedInAs("BASIC")
    letterWithTemplate("ltrmeridian")
    const req = new Request(`${ORIGIN}/api/cover-letters/letter-1/pdf`, {
      method: "GET",
      headers: { Origin: ORIGIN, "if-none-match": `"letter-1-${new Date("2026-01-01").getTime()}"` },
    })

    const res = await GET(req, params)

    expect(res.status).toBe(403)
  })
})

// ── Free tier: the same rule as the résumé (CEO decision) ─────────────────────
// A free user got three CV downloads a day and zero letters. One document was a taste
// of the product, the other a locked door, and nothing in the UI explained the split.

describe("cover-letter PDF: the free tier downloads, bounded per day", () => {
  const freeUser = () => signedInAs("UNSUBSCRIBED", { subscriptionEndsAt: null })

  it("UNSUBSCRIBED downloads the free template and burns one daily slot", async () => {
    freeUser()
    letterWithTemplate("elegant")
    vi.mocked(checkAndIncrementRateLimit).mockResolvedValue(true)

    const res = await GET(makeRequest(), params)

    expect(res.status).toBe(200)
    expect(checkAndIncrementRateLimit).toHaveBeenCalledWith("u1", "cover-letter-pdf-daily", 3, expect.any(Number))
  })

  it("uses its OWN counter — three letters must not lock the CV", async () => {
    freeUser()
    letterWithTemplate("elegant")
    await GET(makeRequest(), params)
    const key = vi.mocked(checkAndIncrementRateLimit).mock.calls[0][1]
    expect(key).not.toBe("pdf-daily")
  })

  it("over the daily cap → 429, and no PDF is rendered", async () => {
    freeUser()
    letterWithTemplate("elegant")
    vi.mocked(checkAndIncrementRateLimit).mockResolvedValue(false)

    const res = await GET(makeRequest(), params)

    expect(res.status).toBe(429)
    await expect(res.json()).resolves.toMatchObject({ error: "free_daily_download_cap" })
    expect(callPdfService).not.toHaveBeenCalled()
  })

  it("a premium template still costs nothing — refused BEFORE the slot is spent", async () => {
    freeUser()
    letterWithTemplate("ltrmeridian")

    const res = await GET(makeRequest(), params)

    expect(res.status).toBe(403)
    expect(checkAndIncrementRateLimit).not.toHaveBeenCalled()
  })

  it("gives the slot back when the render fails", async () => {
    freeUser()
    letterWithTemplate("elegant")
    vi.mocked(checkAndIncrementRateLimit).mockResolvedValue(true)
    vi.mocked(callPdfService).mockRejectedValueOnce(new Error("render down"))

    await GET(makeRequest(), params)

    expect(refundRateLimit).toHaveBeenCalledWith("u1", "cover-letter-pdf-daily")
  })

  it("an EXPIRED paid plan is still hard-blocked — free tier is not a fallback for it", async () => {
    signedInAs("PRO", { subscriptionStatus: "EXPIRED", subscriptionEndsAt: new Date(Date.now() - 86_400_000) })
    letterWithTemplate("elegant")

    const res = await GET(makeRequest(), params)

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toMatchObject({ error: "subscription_required" })
  })
})
