import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resend, emailEnabled } from "@/lib/resend"
import { renewalReminderHtml, renewalReminderText } from "@/lib/emails/renewalReminder"

export async function GET(req: Request) {
  // Protect with secret so only authorized callers can trigger this
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!emailEnabled() || !resend) {
    return NextResponse.json({ error: "Email not configured" }, { status: 503 })
  }

  // Find users whose subscription ends in exactly 2 days (window: 2d ± 12h)
  // renewalReminderSentAt guards against duplicate sends when cron fires multiple times per day
  const now = new Date()
  const windowStart = new Date(now.getTime() + 36 * 60 * 60 * 1000) // +36h
  const windowEnd   = new Date(now.getTime() + 60 * 60 * 60 * 1000) // +60h
  const sentSince   = new Date(now.getTime() - 20 * 60 * 60 * 1000) // last 20h

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
  })

  if (users.length === 0) {
    return NextResponse.json({ sent: 0, message: "No renewals in 2 days" })
  }

  const results = await Promise.allSettled(
    users.map(async (user) => {
      await resend!.emails.send({
        from: "READY CV <no-reply@readycvv.com>",
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
      // Mark sent so duplicate cron runs don't resend within 20h
      await db.user.update({
        where: { id: user.id },
        data: { renewalReminderSentAt: new Date() },
      })
    })
  )

  const sent = results.filter((r) => r.status === "fulfilled").length
  const failed = results.filter((r) => r.status === "rejected").length

  return NextResponse.json({ sent, failed, total: users.length })
}
