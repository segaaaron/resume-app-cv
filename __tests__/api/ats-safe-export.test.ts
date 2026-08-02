import { describe, it, expect, vi, beforeEach } from "vitest"

// ─── Mock auth, db and the PDF service (txt path never calls the service) ──────
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn(), updateMany: vi.fn() },
    resume: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/pdf/pdf-service-client", () => ({
  callPdfService: vi.fn().mockResolvedValue(Buffer.from("%PDF-1.4")),
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const VERIFIED = new Date("2024-01-01")
const FUTURE = new Date(Date.now() + 86400 * 1000)

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/ai/ats-safe-export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: process.env.NEXT_PUBLIC_APP_URL ?? "https://www.valhallaresume.com",
    },
    body: JSON.stringify(body),
  })
}

async function callHandler(req: Request) {
  const { POST } = await import("@/app/api/ai/ats-safe-export/route")
  return POST(req)
}

function baseUser(over: Record<string, unknown>) {
  return {
    id: "u1", subscriptionStatus: "ACTIVE", subscriptionEndsAt: FUTURE, role: "USER",
    emailVerified: VERIFIED, isManaged: false, managedBlocked: false, managedExpiresAt: null,
    managedDownloadLimit: null, managedDownloadsUsed: 0, ...over,
  }
}

// A resume whose personalDetails column holds real section data → non-empty ATS text.
const RESUME = {
  id: "r1",
  title: "My CV",
  personalDetails: {
    personalDetails: { firstName: "Ana", lastName: "Rivas", jobTitle: "Sales Lead", email: "ana@x.com" },
    summary: "Sales lead with analytics experience.",
    workExperience: [{ id: "1", jobTitle: "Lead", employer: "Acme", city: "", startDate: "2020", endDate: "2024", currentlyWorking: false, description: "Grew sales" }],
  },
}

describe("ats-safe-export — PRO gate + txt path", () => {
  const mockAuth = auth as ReturnType<typeof vi.fn>
  const mockUser = db.user.findUnique as ReturnType<typeof vi.fn>
  const mockResume = db.resume.findFirst as ReturnType<typeof vi.fn>

  beforeEach(() => vi.clearAllMocks())

  it("unauthenticated → 401", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await callHandler(makeRequest({ resumeId: "r1" }))
    expect(res.status).toBe(401)
  })

  it("BASIC (active one-time) is blocked from advanced ATS → 403", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } })
    mockUser.mockResolvedValue(baseUser({ plan: "BASIC", subscriptionStatus: "NONE" }))
    const res = await callHandler(makeRequest({ resumeId: "r1" }))
    expect(res.status).toBe(403)
  })

  it("PRO → 200 with ATS-safe text", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } })
    mockUser.mockResolvedValue(baseUser({ plan: "PRO" }))
    mockResume.mockResolvedValue(RESUME)
    const res = await callHandler(makeRequest({ resumeId: "r1", format: "txt", locale: "en" }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.text).toContain("Ana Rivas")
    expect(data.text).toContain("WORK EXPERIENCE")
  })

  it("PRO but resume not found → 404", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } })
    mockUser.mockResolvedValue(baseUser({ plan: "PRO" }))
    mockResume.mockResolvedValue(null)
    const res = await callHandler(makeRequest({ resumeId: "missing" }))
    expect(res.status).toBe(404)
  })
})
