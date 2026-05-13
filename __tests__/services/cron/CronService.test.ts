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
    },
    application: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    stripeEvent: {
      deleteMany: vi.fn(),
    },
  },
}))

// Mock email template functions to avoid actual template rendering
vi.mock("@/lib/emails/renewalReminder", () => ({
  renewalReminderHtml: vi.fn().mockReturnValue("<html>renewal</html>"),
  renewalReminderText: vi.fn().mockReturnValue("renewal text"),
}))

vi.mock("@/lib/emails/applicationReminder", () => ({
  applicationReminderHtml: vi.fn().mockReturnValue("<html>application</html>"),
  applicationReminderText: vi.fn().mockReturnValue("application text"),
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
    vi.mocked(db.user.update).mockResolvedValue({} as never)

    const result = await makeService().sendRenewalReminders()

    expect(result.sent).toBe(1)
    expect(result.failed).toBe(0)
    expect(result.total).toBe(1)
    expect(mockEmailClient.emails.send).toHaveBeenCalledOnce()
    expect(mockEmailClient.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "READY CV <no-reply@readycvv.com>",
        to: "ana@example.com",
        subject: "Tu plan se renueva en 2 días ⏰",
      }),
    )
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { renewalReminderSentAt: expect.any(Date) },
    })
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
    vi.mocked(db.user.update).mockResolvedValue({} as never)
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
// sendApplicationReminders
// ============================================================

describe("CronService.sendApplicationReminders", () => {
  it("returns sent=0 failed=0 when no applications found", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.application.findMany).mockResolvedValue([])

    const result = await makeService().sendApplicationReminders()

    expect(result).toEqual({ sent: 0, failed: 0 })
    expect(mockEmailClient.emails.send).not.toHaveBeenCalled()
  })

  it("skips application with no user email", async () => {
    const { db } = await import("@/lib/db")
    const app = {
      id: "app-1",
      jobTitle: "Engineer",
      company: "Acme",
      status: "APPLIED",
      followUpAt: new Date(),
      user: { id: "u1", name: "No Email", email: null },
    }
    vi.mocked(db.application.findMany).mockResolvedValue([app] as never)

    const result = await makeService().sendApplicationReminders()

    expect(result.sent).toBe(0)
    expect(result.failed).toBe(0)
    expect(mockEmailClient.emails.send).not.toHaveBeenCalled()
  })

  it("sends email and marks application when email configured", async () => {
    const { db } = await import("@/lib/db")
    const app = {
      id: "app-2",
      jobTitle: "Designer",
      company: "Corp",
      status: "INTERVIEW",
      followUpAt: new Date(),
      user: { id: "u2", name: "Laura", email: "laura@example.com" },
    }
    vi.mocked(db.application.findMany).mockResolvedValue([app] as never)
    vi.mocked(db.application.update).mockResolvedValue({} as never)

    const result = await makeService().sendApplicationReminders()

    expect(result.sent).toBe(1)
    expect(result.failed).toBe(0)
    expect(mockEmailClient.emails.send).toHaveBeenCalledOnce()
    expect(mockEmailClient.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "READY CV <no-reply@readycvv.com>",
        to: "laura@example.com",
        subject: "Recordatorio: seguimiento a Designer en Corp",
      }),
    )
    expect(db.application.update).toHaveBeenCalledWith({
      where: { id: "app-2" },
      data: { reminderSentAt: expect.any(Date) },
    })
  })

  it("marks application even when email disabled", async () => {
    const { db } = await import("@/lib/db")
    const app = {
      id: "app-3",
      jobTitle: "PM",
      company: "Startup",
      status: "APPLIED",
      followUpAt: new Date(),
      user: { id: "u3", name: "Carlos", email: "carlos@example.com" },
    }
    vi.mocked(db.application.findMany).mockResolvedValue([app] as never)
    vi.mocked(db.application.update).mockResolvedValue({} as never)

    const result = await makeService(null, false).sendApplicationReminders()

    expect(result.sent).toBe(1)
    expect(result.failed).toBe(0)
    expect(mockEmailClient.emails.send).not.toHaveBeenCalled()
    expect(db.application.update).toHaveBeenCalledOnce()
  })

  it("counts failed when DB update throws", async () => {
    const { db } = await import("@/lib/db")
    const app = {
      id: "app-4",
      jobTitle: "Dev",
      company: "Corp",
      status: "APPLIED",
      followUpAt: new Date(),
      user: { id: "u4", name: "Ali", email: "ali@example.com" },
    }
    vi.mocked(db.application.findMany).mockResolvedValue([app] as never)
    vi.mocked(db.application.update).mockRejectedValueOnce(new Error("DB error"))

    const result = await makeService().sendApplicationReminders()

    expect(result.sent).toBe(0)
    expect(result.failed).toBe(1)
    expect(mockLogger.error).toHaveBeenCalledOnce()
  })
})

// ============================================================
// purgeStripeEvents
// ============================================================

describe("CronService.purgeStripeEvents", () => {
  it("returns deleted count", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.stripeEvent.deleteMany).mockResolvedValue({ count: 42 })

    const result = await makeService().purgeStripeEvents()

    expect(result).toEqual({ deleted: 42 })
    expect(db.stripeEvent.deleteMany).toHaveBeenCalledOnce()
    expect(db.stripeEvent.deleteMany).toHaveBeenCalledWith({
      where: {
        processedAt: {
          lt: expect.any(Date),
        },
      },
    })
  })

  it("returns deleted=0 when nothing to purge", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.stripeEvent.deleteMany).mockResolvedValue({ count: 0 })

    const result = await makeService().purgeStripeEvents()

    expect(result).toEqual({ deleted: 0 })
  })

  it("propagates DB errors", async () => {
    const { db } = await import("@/lib/db")
    vi.mocked(db.stripeEvent.deleteMany).mockRejectedValueOnce(new Error("DB down"))

    await expect(makeService().purgeStripeEvents()).rejects.toThrow("DB down")
  })
})
