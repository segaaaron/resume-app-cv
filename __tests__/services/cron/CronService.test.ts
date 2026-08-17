import { describe, it, expect, vi, beforeEach } from "vitest"
import { CronService } from "@/lib/services/cron/CronService"
import type { ILogger } from "@/lib/interfaces/ILogger"
import type { ICronEmailClient } from "@/lib/services/cron/CronService"

// Mock the DB
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    application: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    stripeEvent: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    aIRateLimit: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

// Mock email template functions to avoid actual template rendering
vi.mock("@/lib/emails/renewalReminder", () => ({
  renewalReminderHtml: vi.fn().mockReturnValue("<html>renewal</html>"),
  renewalReminderText: vi.fn().mockReturnValue("renewal text"),
  renewalReminderSubject: vi.fn().mockReturnValue("Tu plan se renueva en 2 días — Valhalla Resume"),
}))

// ---------- helpers ----------

const mockEmailClient: ICronEmailClient = {
  emails: {
    send: vi.fn().mockResolvedValue({ id: "email-1" }),
  },
}

const mockLogger: ILogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

const makeService = (emailClient: ICronEmailClient | null = mockEmailClient, emailEnabled = true) =>
  new CronService(emailClient, emailEnabled, mockLogger)

beforeEach(() => {
  vi.clearAllMocks()
})

// ============================================================
// sendRenewalReminders
// ============================================================

describe("CronService.sendRenewalReminders", () => {
  it("throws when email not configured (emailEnabled=false)", async () => {
    const svc = makeService(null, false)
    await expect(svc.sendRenewalReminders()).rejects.toThrow("Email not configured")
  })

  it("throws when email not configured (client=null)", async () => {
    const svc = makeService(null, true)
    await expect(svc.sendRenewalReminders()).rejects.toThrow("Email not configured")
  })

  it("returns sent=0 and message when no users found", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.user.findMany).mockResolvedValue([])

    const result = await makeService().sendRenewalReminders()

    expect(result).toEqual({ sent: 0, failed: 0, total: 0, message: "No renewals in 2 days" })
    expect(db.user.findMany).toHaveBeenCalledOnce()
    expect(mockEmailClient.emails.send).not.toHaveBeenCalled()
  })

  it("sends email and marks user when one user found", async () => {
    const { db } = await import("@/lib/db")
    const user = {
      id: "user-1",
      name: "Ana García",
      email: "ana@example.com",
      planInterval: "monthly",
      subscriptionEndsAt: new Date("2026-05-15"),
    }
    vi.mocked(db.user.findMany).mockResolvedValue([user] as never)
    vi.mocked(db.user.updateMany).mockResolvedValue({ count: 1 })

    const result = await makeService().sendRenewalReminders()

    expect(result.sent).toBe(1)
    expect(result.failed).toBe(0)
    expect(result.total).toBe(1)
    expect(mockEmailClient.emails.send).toHaveBeenCalledOnce()
    expect(mockEmailClient.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Valhalla Resume <no-reply@valhallaresume.com>",
        to: "ana@example.com",
        subject: "Tu plan se renueva en 2 días — Valhalla Resume",
      }),
    )
    expect(db.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "user-1" }),
        data: { renewalReminderSentAt: expect.any(Date) },
      }),
    )
  })

  it("counts failed when email send throws", async () => {
    const { db } = await import("@/lib/db")
    const user = {
      id: "user-2",
      name: "Pedro",
      email: "pedro@example.com",
      planInterval: "annual",
      subscriptionEndsAt: new Date("2026-05-15"),
    }
    vi.mocked(db.user.findMany).mockResolvedValue([user] as never)
    vi.mocked(mockEmailClient.emails.send).mockRejectedValueOnce(new Error("SMTP failure"))

    const result = await makeService().sendRenewalReminders()

    expect(result.sent).toBe(0)
    expect(result.failed).toBe(1)
    expect(result.total).toBe(1)
  })

  it("handles multiple users, partial failure", async () => {
    const { db } = await import("@/lib/db")
    const makeUser = (id: string, email: string) => ({
      id,
      name: "User",
      email,
      planInterval: "monthly",
      subscriptionEndsAt: new Date("2026-05-15"),
    })
    vi.mocked(db.user.findMany).mockResolvedValue([
      makeUser("u1", "a@example.com"),
      makeUser("u2", "b@example.com"),
      makeUser("u3", "c@example.com"),
    ] as never)
    vi.mocked(db.user.updateMany).mockResolvedValue({ count: 1 })
    vi.mocked(mockEmailClient.emails.send)
      .mockResolvedValueOnce({ id: "e1" })
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce({ id: "e3" })

    const result = await makeService().sendRenewalReminders()

    expect(result.sent).toBe(2)
    expect(result.failed).toBe(1)
    expect(result.total).toBe(3)
  })
})

// ============================================================
// purgeStripeEvents
// ============================================================

describe("CronService.purgeStripeEvents", () => {
  it("returns deleted count from batch delete", async () => {
    const { db } = await import("@/lib/db")
    // findMany returns a batch of 2 IDs, then empty (loop ends)
    vi.mocked(db.stripeEvent.findMany)
      .mockResolvedValueOnce([{ id: "evt_1" }, { id: "evt_2" }] as never)
      .mockResolvedValueOnce([] as never)
    vi.mocked(db.stripeEvent.deleteMany).mockResolvedValue({ count: 2 })

    const result = await makeService().purgeStripeEvents()

    expect(result).toEqual({ deleted: 2 })
    expect(db.stripeEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { processedAt: { lt: expect.any(Date) } },
      select: { id: true },
    }))
    expect(db.stripeEvent.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["evt_1", "evt_2"] } },
    })
  })

  it("returns deleted=0 when nothing to purge", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.stripeEvent.findMany).mockResolvedValue([] as never)

    const result = await makeService().purgeStripeEvents()

    expect(result).toEqual({ deleted: 0 })
    expect(db.stripeEvent.deleteMany).not.toHaveBeenCalled()
  })

  it("propagates DB errors from deleteMany", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.stripeEvent.findMany).mockResolvedValue([{ id: "evt_1" }] as never)
    vi.mocked(db.stripeEvent.deleteMany).mockRejectedValueOnce(new Error("DB down"))

    await expect(makeService().purgeStripeEvents()).rejects.toThrow("DB down")
  })
})

// ============================================================
// purgeExpiredRateLimits
// ============================================================
// Nothing purged this table until the anti-mail-bombing fix keyed registration and
// password reset by EMAIL: from then on, spraying invented addresses mints a permanent
// row per address, for free, in the database that has no backups.

describe("CronService.purgeExpiredRateLimits", () => {
  it("deletes only windows that already elapsed", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.aIRateLimit.findMany)
      .mockResolvedValueOnce([{ id: "rl_1" }, { id: "rl_2" }] as never)
      .mockResolvedValueOnce([] as never)
    vi.mocked(db.aIRateLimit.deleteMany).mockResolvedValue({ count: 2 } as never)

    const result = await makeService().purgeExpiredRateLimits()

    expect(result).toEqual({ deleted: 2 })
    expect(db.aIRateLimit.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { resetAt: { lt: expect.any(Date) } },
      select: { id: true },
    }))
    expect(db.aIRateLimit.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["rl_1", "rl_2"] } } })
  })

  it("never touches a live window — that would hand back attempts", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.aIRateLimit.findMany).mockResolvedValue([] as never)

    const result = await makeService().purgeExpiredRateLimits()

    expect(result).toEqual({ deleted: 0 })
    expect(db.aIRateLimit.deleteMany).not.toHaveBeenCalled()
    // The filter is strictly "already expired": lifetime freemium quotas carry a sentinel
    // resetAt in 2099 exactly so this can never reach them.
    const where = vi.mocked(db.aIRateLimit.findMany).mock.calls[0][0] as { where: { resetAt: { lt: Date } } }
    expect(where.where.resetAt.lt.getTime()).toBeLessThanOrEqual(Date.now())
  })
})
