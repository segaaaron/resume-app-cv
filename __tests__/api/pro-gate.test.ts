import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mock auth and db ─────────────────────────────────────────────────────────
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
    aIRateLimit: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    aIUsageLog: { create: vi.fn() },
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
            choices: [{ message: { content: '{"versions":["v1","v2","v3"]}' } }],
          }),
        },
      },
    })),
    checkRateLimit: vi.fn().mockResolvedValue(true),
    logAIUsage: vi.fn(),
  }
})

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/ai-client"

// Helper — build a minimal NextRequest-like object
function makeRequest(body: Record<string, unknown> = { text: "Sample bullet point here" }) {
  return new Request("http://localhost/api/ai/improve-bullet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// We import the route handler after mocks are set up
async function callHandler(req: Request) {
  const { POST } = await import("@/app/api/ai/improve-bullet/route")
  return POST(req)
}

describe("Pro gate — improve-bullet route", () => {
  const mockAuth = auth as ReturnType<typeof vi.fn>
  const mockFindUnique = (db.user.findUnique as ReturnType<typeof vi.fn>)

  beforeEach(() => {
    vi.clearAllMocks()
    // After clearAllMocks, restore default: rate limit passes
    ;(checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(true)
  })

  it("unauthenticated request → 401", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(401)
  })

  it("FREE plan → 403", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    mockFindUnique.mockResolvedValue({ plan: "FREE", subscriptionStatus: null, subscriptionEndsAt: null })
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(403)
  })

  it("PRO + ACTIVE + no subscriptionEndsAt → passes gate (200)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-2" } })
    mockFindUnique.mockResolvedValue({ plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: null })
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(200)
  })

  it("PRO + ACTIVE + subscriptionEndsAt in future → passes gate (200)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-3" } })
    const future = new Date(Date.now() + 86400 * 1000) // +1 day
    mockFindUnique.mockResolvedValue({ plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: future })
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(200)
  })

  it("PRO + ACTIVE + subscriptionEndsAt in past → 403", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-4" } })
    const past = new Date(Date.now() - 86400 * 1000) // -1 day
    mockFindUnique.mockResolvedValue({ plan: "PRO", subscriptionStatus: "ACTIVE", subscriptionEndsAt: past })
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(403)
  })

  it("PRO + CANCELED → 403", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-5" } })
    mockFindUnique.mockResolvedValue({ plan: "PRO", subscriptionStatus: "CANCELED", subscriptionEndsAt: null })
    const res = await callHandler(makeRequest())
    expect(res.status).toBe(403)
  })
})
