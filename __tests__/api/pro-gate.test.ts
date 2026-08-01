import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mock auth and db ─────────────────────────────────────────────────────────
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    aIRateLimit: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    aIUsageLog: { create: vi.fn() },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    $queryRaw: vi.fn().mockResolvedValue([]),
  },
}))
vi.mock("@/lib/ai-safety", () => ({
  validateAIInput: vi.fn(() => ({ valid: true })),
}))
vi.mock("@/lib/ai-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-client")>()
  return {
    ...actual,
    getOpenAI: vi.fn(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            // These tests assert the plan gate's status codes, not the bullet
            // contract — "nothing to improve" is the shape least likely to be
            // filtered downstream and still yields a 200.
            choices: [{ message: { content: '{"status":"already_optimized","improvements":[]}' } }],
          }),
        },
      },
    })),
    checkRateLimit: vi.fn().mockResolvedValue(true),
    checkAndIncrementRateLimit: vi.fn().mockResolvedValue(true),
    checkAndIncrementAIQuota: vi.fn().mockResolvedValue({ allowed: true }),
    logAIUsage: vi.fn(),
  }
})

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit, checkAndIncrementAIQuota } from "@/lib/ai-client"

// Helper — build a minimal NextRequest-like object
function makeRequest(body: Record<string, unknown> = { text: "Sample bullet point here" }) {
  return new Request("http://localhost/api/ai/improve-bullet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": process.env.NEXT_PUBLIC_APP_URL ?? "https://valhallaresume.com",
    },
    body: JSON.stringify(body),
  })
}

// We import the route handler after mocks are set up
async function callHandler(req: Request) {
  const { POST } = await import("@/app/api/ai/improve-bullet/route")
  return POST(req)
}

const VERIFIED = new Date("2024-01-01")

describe("Freemium gate — improve-bullet route", () => {
  const mockAuth = auth as ReturnType<typeof vi.fn>
  const mockFindUnique = (db.user.findUnique as ReturnType<typeof vi.fn>)

  beforeEach(() => {
    vi.clearAllMocks()
    ;(checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(true)
    ;(checkAndIncrementAIQuota as ReturnType<typeof vi.fn>).mockResolvedValue({ allowed: true })
  })

  it("unauthenticated request → 401", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(401)
  })

  it("unverified email is NOT gated — email verification removed from AI endpoints → 200", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockFindUnique.mockResolvedValue({ id: "user-1", plan: "UNSUBSCRIBED", subscriptionStatus: null, subscriptionEndsAt: null, role: "USER", emailVerified: null })
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(200)
  })

  it("UNSUBSCRIBED + verified + quota available → 200", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockFindUnique.mockResolvedValue({ id: "user-1", plan: "UNSUBSCRIBED", subscriptionStatus: null, subscriptionEndsAt: null, role: "USER", emailVerified: VERIFIED })
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(200)
  })

  it("UNSUBSCRIBED + quota exhausted → 429 free_quota_exhausted", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockFindUnique.mockResolvedValue({ id: "user-1", plan: "UNSUBSCRIBED", subscriptionStatus: null, subscriptionEndsAt: null, role: "USER", emailVerified: VERIFIED })
    ;(checkAndIncrementAIQuota as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ allowed: false, reason: "exhausted", used: 2, limit: 2 })
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(429)
  })

  it("PRO + ACTIVE → 200", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-2" } })
    mockFindUnique.mockResolvedValue({ id: "user-2", plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: null, role: "USER", emailVerified: VERIFIED })
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(200)
  })

  it("PRO + ACTIVE + subscriptionEndsAt in future → 200", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-3" } })
    const future = new Date(Date.now() + 86400 * 1000)
    mockFindUnique.mockResolvedValue({ id: "user-3", plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: future, role: "USER", emailVerified: VERIFIED })
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(200)
  })

  it("PRO + CANCELED + no subscriptionEndsAt → 200 (grace)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-5" } })
    mockFindUnique.mockResolvedValue({ id: "user-5", plan: "PRO", subscriptionStatus: "CANCELED", subscriptionEndsAt: null, role: "USER", emailVerified: VERIFIED })
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(200)
  })
})
