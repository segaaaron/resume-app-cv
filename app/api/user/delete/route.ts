import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkOrigin } from "@/lib/csrf"

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!checkOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const userId = session.user.id

  // Audit log before deletion (cascade will delete it too, but we log intent)
  await db.auditLog.create({
    data: { userId, action: "DELETE_ACCOUNT" },
  })

  // Soft-delete: mark deletedAt so the GDPR cleanup cron removes it after 90 days
  await db.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true }, { status: 200 })
}
