import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      plan: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      planInterval: true,
      resumes: {
        select: {
          id: true,
          title: true,
          personalDetails: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      coverLetters: {
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  await db.auditLog.create({ data: { userId, action: "DATA_EXPORT" } })

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt,
      planInterval: user.planInterval,
    },
    resumes: user.resumes,
    coverLetters: user.coverLetters,
  }

  const json = JSON.stringify(exportData, null, 2)

  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="readycv-data-export.json"',
    },
  })
}
