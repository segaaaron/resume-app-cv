import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resend, emailEnabled } from "@/lib/resend"
import { applicationReminderHtml, applicationReminderText } from "@/lib/emails/applicationReminder"

// Dokploy: 0 8 * * * → GET https://readycvv.com/api/cron/application-reminders
// Header: Authorization: Bearer <CRON_SECRET>

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  // Find applications with followUpAt today that haven't been reminded yet
  const applications = await db.application.findMany({
    where: {
      followUpAt: { lte: endOfDay },
      reminderSentAt: null,
      user: { emailOptOut: false },
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  })

  let sent = 0
  let failed = 0

  for (const app of applications) {
    if (!app.user.email) continue

    try {
      if (emailEnabled() && resend) {
        await resend.emails.send({
          from: "READY CV <no-reply@readycvv.com>",
          to: app.user.email,
          subject: `Recordatorio: seguimiento a ${app.jobTitle} en ${app.company}`,
          html: applicationReminderHtml({
            userName: app.user.name ?? "Usuario",
            userEmail: app.user.email,
            jobTitle: app.jobTitle,
            company: app.company,
            status: app.status,
            followUpAt: app.followUpAt!,
          }),
          text: applicationReminderText({
            userName: app.user.name ?? "Usuario",
            userEmail: app.user.email,
            jobTitle: app.jobTitle,
            company: app.company,
            status: app.status,
            followUpAt: app.followUpAt!,
          }),
        })
      }

      await db.application.update({
        where: { id: app.id },
        data: { reminderSentAt: now },
      })

      sent++
    } catch (err) {
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
