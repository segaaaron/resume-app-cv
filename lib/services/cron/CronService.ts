// lib/services/cron/CronService.ts
import { db } from "@/lib/db"
import type { ILogger } from "@/lib/interfaces/ILogger"
import type { Resend } from "resend"
import {
  renewalReminderHtml,
  renewalReminderText,
} from "@/lib/emails/renewalReminder"
import {
  applicationReminderHtml,
  applicationReminderText,
} from "@/lib/emails/applicationReminder"

export interface ICronEmailClient {
  emails: {
    send(params: {
      from: string
      to: string
      subject: string
      html: string
      text: string
    }): Promise<unknown>
  }
}

export interface RenewalReminderResult {
  sent: number
  failed: number
  total: number
  message?: string
}

export interface ApplicationReminderResult {
  sent: number
  failed: number
}

export interface PurgeStripeEventsResult {
  deleted: number
}

/** Split an array into chunks of at most `size` elements. */
function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  )
}

export class CronService {
  constructor(
    private readonly emailClient: ICronEmailClient | null,
    private readonly isEmailEnabled: boolean,
    private readonly logger: ILogger,
  ) {}

  async sendRenewalReminders(): Promise<RenewalReminderResult> {
    if (!this.isEmailEnabled || !this.emailClient) {
      throw new Error("Email not configured")
    }

    const now = new Date()
    const windowStart = new Date(now.getTime() + 36 * 60 * 60 * 1000) // +36h
    const windowEnd = new Date(now.getTime() + 60 * 60 * 60 * 1000) // +60h
    const sentSince = new Date(now.getTime() - 20 * 60 * 60 * 1000) // last 20h

    // H5: cap to 200 rows — at most ~200 PRO users renew in any given 24-hour window
    const users = await db.user.findMany({
      where: {
        plan: "PRO",
        subscriptionStatus: "ACTIVE",
        emailOptOut: false,
        subscriptionEndsAt: {
          gte: windowStart,
          lte: windowEnd,
        },
        OR: [
          { renewalReminderSentAt: null },
          { renewalReminderSentAt: { lt: sentSince } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        planInterval: true,
        subscriptionEndsAt: true,
      },
      take: 200,
    })

    if (users.length === 0) {
      this.logger.info("[CronService] sendRenewalReminders: no renewals in 2 days")
      return { sent: 0, failed: 0, total: 0, message: "No renewals in 2 days" }
    }

    // H5: process in batches of 50 to avoid overwhelming the email provider
    const BATCH_SIZE = 50
    let sent = 0
    let failed = 0

    const sendOne = async (user: (typeof users)[number]) => {
      // Claim the reminder slot BEFORE sending email to prevent duplicate sends
      // if this cron fires concurrently (Dokploy retry, overlapping run).
      // If another instance already claimed it (count = 0), skip silently.
      const claimed = await db.user.updateMany({
        where: { id: user.id, OR: [{ renewalReminderSentAt: null }, { renewalReminderSentAt: { lt: sentSince } }] },
        data: { renewalReminderSentAt: new Date() },
      })
      if (claimed.count === 0) return

      await this.emailClient!.emails.send({
        from: process.env.EMAIL_FROM ?? "READY CV <no-reply@readycvv.com>",
        to: user.email,
        subject: "Tu plan se renueva en 2 días ⏰",
        html: renewalReminderHtml({
          userName: user.name ?? "Usuario",
          userId: user.id,
          planInterval: (user.planInterval ?? "monthly") as "monthly" | "annual",
          renewalDate: user.subscriptionEndsAt!,
        }),
        text: renewalReminderText({
          userName: user.name ?? "Usuario",
          userId: user.id,
          planInterval: (user.planInterval ?? "monthly") as "monthly" | "annual",
          renewalDate: user.subscriptionEndsAt!,
        }),
      })
    }

    for (const batch of chunk(users, BATCH_SIZE)) {
      const results = await Promise.allSettled(batch.map(sendOne))
      sent += results.filter((r) => r.status === "fulfilled").length
      failed += results.filter((r) => r.status === "rejected").length
    }

    this.logger.info(`[CronService] sendRenewalReminders: sent=${sent} failed=${failed}`)
    return { sent, failed, total: users.length }
  }

  async sendApplicationReminders(): Promise<ApplicationReminderResult> {
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const startOfWindow = new Date(Date.now() - 24 * 60 * 60 * 1000)
    // H4: cap to 500 rows to prevent unbounded table scans
    const applications = await db.application.findMany({
      where: {
        followUpAt: { gte: startOfWindow, lte: endOfDay },
        reminderSentAt: null,
        user: { emailOptOut: false },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      take: 500,
    })

    let sent = 0
    let failed = 0

    for (const app of applications) {
      if (!app.user.email) continue

      try {
        // Claim before email — prevents duplicate sends on concurrent cron runs.
        const claimed = await db.application.updateMany({
          where: { id: app.id, reminderSentAt: null },
          data: { reminderSentAt: now },
        })
        if (claimed.count === 0) continue

        if (this.isEmailEnabled && this.emailClient) {
          await this.emailClient.emails.send({
            from: process.env.EMAIL_FROM ?? "READY CV <no-reply@readycvv.com>",
            to: app.user.email,
            subject: `Recordatorio: seguimiento a ${app.jobTitle} en ${app.company}`,
            html: applicationReminderHtml({
              userName: app.user.name ?? "Usuario",
              userId: app.user.id,
              jobTitle: app.jobTitle,
              company: app.company,
              status: app.status,
              followUpAt: app.followUpAt!,
            }),
            text: applicationReminderText({
              userName: app.user.name ?? "Usuario",
              userId: app.user.id,
              jobTitle: app.jobTitle,
              company: app.company,
              status: app.status,
              followUpAt: app.followUpAt!,
            }),
          })
        }

        sent++
      } catch (err) {
        this.logger.error("[CronService] sendApplicationReminders: error for app", { appId: app.id }, err)
        failed++
      }
    }

    this.logger.info(`[CronService] sendApplicationReminders: sent=${sent} failed=${failed}`)
    return { sent, failed }
  }

  async purgeStripeEvents(): Promise<PurgeStripeEventsResult> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
    const BATCH_SIZE = 500
    let totalDeleted = 0

    // Batch deletes to avoid locking StripeEvent table during webhook processing
    while (true) {
      const rows = await db.stripeEvent.findMany({
        where: { processedAt: { lt: cutoff } },
        select: { id: true },
        take: BATCH_SIZE,
      })
      if (rows.length === 0) break
      const { count } = await db.stripeEvent.deleteMany({
        where: { id: { in: rows.map((r) => r.id) } },
      })
      totalDeleted += count
      if (rows.length < BATCH_SIZE) break
    }

    this.logger.info(`[CronService] purgeStripeEvents: deleted=${totalDeleted}`)
    return { deleted: totalDeleted }
  }
}
